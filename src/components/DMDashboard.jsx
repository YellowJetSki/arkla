import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PenTool, X, Sparkles, DownloadCloud, PowerOff, UploadCloud, Star, Book, Package, Image as ImageIcon, ShieldAlert, Trash2, Map, Users, Swords, Skull, Flame } from 'lucide-react';

import InitiativeTracker from './InitiativeTracker';
import DMItemManager from './DMItemManager'; 
import DMSpellVault from './DMSpellVault';
import DMFeatVault from './DMFeatVault';
import DMHandoutManager from './DMHandoutManager';
import DMXPManager from './DMXPManager';
import DMReferenceModal from './DMReferenceModal';
import DialogModal from './shared/DialogModal';
import DebouncedTextarea from './shared/DebouncedTextarea';
import EnemyForge from './EnemyForge';
import DMCharacterBuilder from './DMCharacterBuilder';

import DMPartyPanel from './DMPartyPanel';
import DMThreatsPanel from './DMThreatsPanel';

export default function DMDashboard({ onLogout }) {
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  
  const [activeManager, setActiveManager] = useState(null); 
  const [isBattleMode, setIsBattleMode] = useState(false); 
  
  const [mobileTab, setMobileTab] = useState('initiative');

  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isForgingEnemy, setIsForgingEnemy] = useState(false);
  const [isBuildingCharacter, setIsBuildingCharacter] = useState(false);
  const [scratchpad, setScratchpad] = useState(() => localStorage.getItem('dm_scratchpad') || '');

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const [massMathAmount, setMassMathAmount] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { window.unlockedCharactersCache = unlockedCharacters; }, [unlockedCharacters]);

  const saveScratchpad = (val) => {
    setScratchpad(val);
    localStorage.setItem('dm_scratchpad', val);
  };

  useEffect(() => {
    const sessionRef = doc(db, 'campaign', 'main_session');
    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setUnlockedCharacters(docSnap.data().unlockedCharacters || []);
      }
    });

    const enemiesRef = collection(db, 'active_enemies');
    const unsubscribeEnemies = onSnapshot(enemiesRef, (snapshot) => {
      const enemies = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setActiveEnemies(enemies);
    });

    return () => {
      unsubscribeSession();
      unsubscribeEnemies();
    };
  }, []);

  const toggleEnemySelection = (id) => {
    setSelectedEnemies(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const selectAllEnemies = () => {
    if (selectedEnemies.length === activeEnemies.length) setSelectedEnemies([]); 
    else setSelectedEnemies(activeEnemies.map(e => e.id)); 
  };

  const confirmResetSession = () => {
    setDialog({
      isOpen: true, title: 'Wipe Board?',
      message: 'This will wipe all enemies and destroy the active battle map. Players will remain in the session. Are you sure?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          const enemyDocs = await getDocs(collection(db, 'active_enemies'));
          enemyDocs.forEach((docSnap) => batch.delete(docSnap.ref));
          batch.set(doc(db, 'campaign', 'battlemap'), {
            imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null
          });
          await batch.commit();
          setSelectedEnemies([]);
          setIsBattleMode(false);
          closeDialog();
          showToast('Board & Enemies Wiped');
        } catch (error) { console.error(error); }
      }
    });
  };

  const confirmClearConditions = () => {
    setDialog({
      isOpen: true, title: 'Sweep Conditions?',
      message: 'This will remove ALL active conditions and Concentration from every player and enemy on the board.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          for (const charId of unlockedCharacters) {
            batch.update(doc(db, 'characters', charId), { conditions: [], isConcentrating: false });
          }
          
          const enemyDocs = await getDocs(collection(db, 'active_enemies'));
          enemyDocs.forEach((docSnap) => batch.update(docSnap.ref, { conditions: [] }));

          const mapRef = doc(db, 'campaign', 'battlemap');
          const mapSnap = await getDoc(mapRef);
          if (mapSnap.exists() && mapSnap.data().tokens) {
            const mapTokens = mapSnap.data().tokens;
            Object.keys(mapTokens).forEach(tokenId => {
               mapTokens[tokenId].conditions = [];
               mapTokens[tokenId].isConcentrating = false;
            });
            batch.update(mapRef, { tokens: mapTokens });
          }

          await batch.commit();
          closeDialog();
          showToast('All Conditions Swept');
        } catch (error) { console.error(error); }
      }
    });
  };

  const handleMassMath = async (isDamage) => {
    const amt = parseInt(massMathAmount, 10);
    if (isNaN(amt) || amt <= 0 || activeEnemies.length === 0) return;

    try {
      const batch = writeBatch(db);
      const targets = selectedEnemies.length > 0 ? activeEnemies.filter(e => selectedEnemies.includes(e.id)) : activeEnemies;
      
      const mapRef = doc(db, 'campaign', 'battlemap');
      const mapSnap = await getDoc(mapRef);
      let mapTokens = mapSnap.exists() ? mapSnap.data().tokens || {} : {};
      let tokensChanged = false;

      targets.forEach(enemy => {
        const ref = doc(db, 'active_enemies', enemy.id);
        const current = enemy.currentHp ?? enemy.hp;
        const newHp = isDamage ? Math.max(0, current - amt) : Math.min(enemy.hp, current + amt);
        batch.update(ref, { currentHp: newHp });

        if (mapTokens[enemy.id]) {
           mapTokens[enemy.id].hp = newHp;
           tokensChanged = true;
        }
      });
      
      if (tokensChanged) batch.update(mapRef, { tokens: mapTokens });
      await batch.commit();
      
      setMassMathAmount('');
      setSelectedEnemies([]); 
      showToast(isDamage ? `Applied ${amt} Mass Damage` : `Applied ${amt} Mass Healing`);
    } catch (error) { console.error(error); }
  };

  const handleExportCampaign = async () => {
    try {
      const exportData = { characters: {}, campaign: {}, timestamp: new Date().toISOString() };
      const charsSnap = await getDocs(collection(db, 'characters'));
      charsSnap.forEach(doc => { exportData.characters[doc.id] = doc.data(); });
      const campSnap = await getDocs(collection(db, 'campaign'));
      campSnap.forEach(doc => { exportData.campaign[doc.id] = doc.data(); });

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arkla_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Campaign Exported Successfully');
    } catch (error) { console.error("Export failed:", error); }
  };

  const handleImportCampaign = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.characters || !importedData.campaign) return;

        setDialog({
          isOpen: true, title: 'DANGEROUS OVERWRITE',
          message: 'This will completely wipe and replace ALL characters, encounters, and stashes. Are you absolutely sure?',
          type: 'confirm',
          onConfirm: async () => {
            const batch = writeBatch(db);
            Object.entries(importedData.characters).forEach(([id, data]) => batch.set(doc(db, 'characters', id), data));
            Object.entries(importedData.campaign).forEach(([id, data]) => batch.set(doc(db, 'campaign', id), data));
            await batch.commit();
            closeDialog();
            showToast('Campaign Restored Successfully!');
          }
        });
      } catch (err) { console.error(err); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const launchDMBattleMap = () => { 
    window.open(window.location.pathname + '?dmmap=true', '_blank'); 
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden text-slate-300 font-sans relative">
      
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {toast && (
        <div className="fixed top-16 right-6 bg-slate-900 border-[3px] border-slate-950 text-indigo-400 px-4 py-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-[99999] animate-in slide-in-from-top-5 fade-in duration-300 font-black uppercase tracking-widest text-xs flex items-center gap-2 cursor-pointer">
          <Sparkles className="w-4 h-4" /> {toast}
        </div>
      )}

      {isForgingEnemy && <EnemyForge onClose={() => setIsForgingEnemy(false)} />}
      {isBuildingCharacter && <DMCharacterBuilder onClose={() => setIsBuildingCharacter(false)} />}
      
      {activeManager === 'items' && <DMItemManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}
      {activeManager === 'spells' && <DMSpellVault activePlayers={unlockedCharacters} activeEnemies={activeEnemies} onClose={() => setActiveManager(null)} />}
      {activeManager === 'feats' && <DMFeatVault activePlayers={unlockedCharacters} activeEnemies={activeEnemies} onClose={() => setActiveManager(null)} />}
      {activeManager === 'handouts' && <DMHandoutManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'rules' && <DMReferenceModal onClose={() => setActiveManager(null)} />}
      {activeManager === 'xp' && <DMXPManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}

      {showScratchpad && (
        <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 w-80 h-80 bg-amber-50 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-[9999] border-[3px] border-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          <div className="bg-amber-400 px-4 py-3 flex justify-between items-center border-b-[3px] border-slate-950 shrink-0">
            <span className="text-slate-950 font-black text-xs flex items-center gap-2 tracking-widest uppercase"><PenTool className="w-4 h-4"/> DM Scratchpad</span>
            <button onClick={() => setShowScratchpad(false)} className="text-slate-950 hover:bg-amber-300 p-1 rounded transition-colors"><X className="w-4 h-4 font-black"/></button>
          </div>
          <div className="flex-1 relative">
            <DebouncedTextarea initialValue={scratchpad} onSave={saveScratchpad} placeholder="Jot down quick notes, hidden HP..." className="w-full h-full p-4 bg-transparent text-amber-950 text-sm focus:outline-none resize-none font-bold custom-scrollbar leading-relaxed" />
          </div>
        </div>
      )}

      <header className="h-14 bg-slate-900 border-b-[3px] border-slate-950 flex items-center justify-between px-4 shrink-0 z-40 relative shadow-[0_4px_0px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-4 shrink-0 pr-4">
          <h1 className="font-black text-indigo-400 tracking-widest uppercase flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            <ShieldAlert className="w-5 h-5"/> Arkla DM
          </h1>
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-700 pl-4">
            <button onClick={() => setActiveManager('rules')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Book className="w-4 h-4"/> Rules Ref</button>
            <button onClick={() => setActiveManager('items')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Package className="w-4 h-4"/> Items</button>
            <button onClick={() => setActiveManager('spells')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Flame className="w-4 h-4"/> Spells</button>
            <button onClick={() => setActiveManager('feats')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Sparkles className="w-4 h-4"/> Feats</button>
            <button onClick={() => setActiveManager('handouts')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><ImageIcon className="w-4 h-4"/> Handouts</button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button onClick={() => setActiveManager('xp')} className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Star className="w-4 h-4"/> XP</button>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setShowScratchpad(!showScratchpad)} className="text-amber-500 hover:text-amber-400 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Scratchpad"><PenTool className="w-4 h-4"/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportCampaign} />
          <button onClick={() => fileInputRef.current.click()} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Import Campaign"><UploadCloud className="w-4 h-4"/></button>
          <button onClick={handleExportCampaign} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Export Campaign"><DownloadCloud className="w-4 h-4"/></button>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <button onClick={confirmClearConditions} className="text-fuchsia-500 hover:text-fuchsia-400 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Clear All Conditions"><Sparkles className="w-4 h-4"/></button>
          <button onClick={confirmResetSession} className="text-red-500 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Wipe Board & Enemies"><Trash2 className="w-4 h-4"/></button>
          <button onClick={onLogout} className="text-slate-500 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Logout"><PowerOff className="w-4 h-4"/></button>
        </div>
      </header>

      {/* 3-COLUMN LAYOUT: Party | Initiative/Commands | Threats */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-3 min-h-0 z-10 bg-slate-950 pb-[76px] lg:pb-0">
        
        {/* COLUMN 1: The Party */}
        <div className={`${mobileTab === 'party' ? 'flex' : 'hidden'} lg:flex border-r-2 border-slate-900 bg-slate-950 overflow-hidden flex-col h-full`}>
          <DMPartyPanel 
            unlockedCharacters={unlockedCharacters} 
            setIsBuildingCharacter={setIsBuildingCharacter} 
          />
        </div>

        {/* COLUMN 2: Command Center & Initiative */}
        <div className={`${mobileTab === 'initiative' ? 'flex' : 'hidden'} lg:flex bg-slate-950 flex-col p-3 md:p-4 overflow-hidden lg:border-r-2 border-slate-900 h-full w-full`}>
          
          <div className="bg-slate-900 border-[3px] border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-row items-center justify-between relative overflow-hidden mb-3 shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10 pl-2">
                <Map className="w-6 h-6 text-emerald-500" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] hidden sm:block">War Table</h2>
            </div>
            <button 
              onClick={launchDMBattleMap} 
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2 relative z-10"
            >
              <Map className="w-3 h-3 md:w-4 md:h-4 font-black" /> Open Map Tab
            </button>
          </div>

          <div className="flex-1 min-h-0 w-full">
            <InitiativeTracker 
              unlockedCharacters={unlockedCharacters} 
              activeEnemies={activeEnemies} 
              isBattleMode={isBattleMode}
              onLaunchBattle={() => setIsBattleMode(true)}
              onExitBattle={() => setIsBattleMode(false)}
              expandedOverride={true}
            />
          </div>
        </div>

        {/* COLUMN 3: Threats */}
        <div className={`${mobileTab === 'threats' ? 'flex' : 'hidden'} lg:flex bg-slate-950 overflow-hidden flex-col h-full`}>
          <DMThreatsPanel 
            activeEnemies={activeEnemies}
            selectedEnemies={selectedEnemies}
            setIsForgingEnemy={setIsForgingEnemy}
            selectAllEnemies={selectAllEnemies}
            massMathAmount={massMathAmount}
            setMassMathAmount={setMassMathAmount}
            handleMassMath={handleMassMath}
            toggleEnemySelection={toggleEnemySelection}
          />
        </div>

      </main>

      {/* MOBILE NAV BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-slate-950 border-t-[3px] border-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] pb-safe">
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-2 gap-2 bg-slate-900/90 backdrop-blur-md snap-x">
          
          <button 
            onClick={() => setMobileTab('party')} 
            className={`snap-center shrink-0 min-w-[80px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 ${mobileTab === 'party' ? 'bg-indigo-600 text-white border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-white'}`}
          >
            <Users className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Party</span>
          </button>
          
          <button 
            onClick={() => setMobileTab('initiative')} 
            className={`snap-center shrink-0 min-w-[80px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 ${mobileTab === 'initiative' ? 'bg-amber-500 text-slate-950 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-white'}`}
          >
            <Swords className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Command</span>
          </button>
          
          <button 
            onClick={() => setMobileTab('threats')} 
            className={`snap-center shrink-0 min-w-[80px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 ${mobileTab === 'threats' ? 'bg-red-600 text-white border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-slate-950 text-slate-400 border-slate-900 hover:text-white'}`}
          >
            <Skull className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Threats</span>
          </button>
          
          <div className="w-0.5 h-8 bg-slate-800 mx-1 shrink-0 self-center"></div>
          
          <button onClick={() => setActiveManager('rules')} className="snap-center shrink-0 min-w-[70px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 bg-slate-950 text-slate-400 border-slate-900 hover:text-white shadow-inner">
            <Book className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Rules</span>
          </button>
          <button onClick={() => setActiveManager('items')} className="snap-center shrink-0 min-w-[70px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 bg-slate-950 text-slate-400 border-slate-900 hover:text-white shadow-inner">
            <Package className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Items</span>
          </button>
          <button onClick={() => setActiveManager('spells')} className="snap-center shrink-0 min-w-[70px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 bg-slate-950 text-slate-400 border-slate-900 hover:text-white shadow-inner">
            <Flame className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Spells</span>
          </button>
          <button onClick={() => setActiveManager('feats')} className="snap-center shrink-0 min-w-[70px] flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border-2 bg-slate-950 text-slate-400 border-slate-900 hover:text-white shadow-inner">
            <Sparkles className="w-4 h-4"/> <span className="text-[9px] font-black uppercase tracking-widest">Feats</span>
          </button>
        </div>
      </div>
    </div>
  );
}