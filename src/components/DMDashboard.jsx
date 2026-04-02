import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, getDocs, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PenTool, X, Sparkles, DownloadCloud, PowerOff, UploadCloud, Star, Book, Package, Image as ImageIcon, ShieldAlert, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import InitiativeTracker from './InitiativeTracker';
import DMEncounterManager from './DMEncounterManager';
import DMItemManager from './DMItemManager'; 
import DMHandoutManager from './DMHandoutManager';
import DMXPManager from './DMXPManager';
import DMBattleMap from './battlemap/DMBattleMap'; 
import DMReferenceModal from './DMReferenceModal';
import DialogModal from './shared/DialogModal';
import DebouncedTextarea from './shared/DebouncedTextarea';
import EnemyForge from './EnemyForge';
import DMCharacterBuilder from './DMCharacterBuilder';
import DMSpellForge from './DMSpellForge';

import DMPartyPanel from './DMPartyPanel';
import DMThreatsPanel from './DMThreatsPanel';

export default function DMDashboard({ onLogout }) {
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  
  const [activeManager, setActiveManager] = useState(null); 
  const [isBattleMode, setIsBattleMode] = useState(false); 
  
  const [showPartyPanel, setShowPartyPanel] = useState(true);
  const [showThreatsPanel, setShowThreatsPanel] = useState(true);

  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isForgingEnemy, setIsForgingEnemy] = useState(false);
  const [isForgingSpell, setIsForgingSpell] = useState(false);
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
    if (window.innerWidth < 1024) {
      setShowPartyPanel(false);
      setShowThreatsPanel(false);
    }

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
        if (mapTokens[enemy.id]) { mapTokens[enemy.id].hp = newHp; tokensChanged = true; }
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

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden text-slate-300 font-sans relative">
      
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {toast && (
        <div className="fixed top-16 right-6 bg-slate-900 border-[3px] border-slate-950 text-indigo-400 px-4 py-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-[99999] animate-in slide-in-from-top-5 fade-in duration-300 font-black uppercase tracking-widest text-xs flex items-center gap-2 cursor-pointer">
          <Sparkles className="w-4 h-4" /> {toast}
        </div>
      )}

      {isForgingEnemy && <EnemyForge onClose={() => setIsForgingEnemy(false)} />}
      {isForgingSpell && <DMSpellForge onClose={() => setIsForgingSpell(false)} />}
      {isBuildingCharacter && <DMCharacterBuilder onClose={() => setIsBuildingCharacter(false)} />}
      
      {activeManager === 'encounters' && <DMEncounterManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'items' && <DMItemManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}
      {activeManager === 'handouts' && <DMHandoutManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'rules' && <DMReferenceModal onClose={() => setActiveManager(null)} />}
      {activeManager === 'xp' && <DMXPManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}

      {showScratchpad && (
        <div className="fixed bottom-6 right-6 w-80 h-80 bg-amber-50 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-[9999] border-[3px] border-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          <div className="bg-amber-400 px-4 py-3 flex justify-between items-center border-b-[3px] border-slate-950 shrink-0">
            <span className="text-slate-950 font-black text-xs flex items-center gap-2 tracking-widest uppercase"><PenTool className="w-4 h-4"/> DM Scratchpad</span>
            <button onClick={() => setShowScratchpad(false)} className="text-slate-950 hover:bg-amber-300 p-1 rounded transition-colors"><X className="w-4 h-4 font-black"/></button>
          </div>
          <div className="flex-1 relative">
            <DebouncedTextarea initialValue={scratchpad} onSave={saveScratchpad} placeholder="Jot down quick notes, hidden HP..." className="w-full h-full p-4 bg-transparent text-amber-950 text-sm focus:outline-none resize-none font-bold custom-scrollbar leading-relaxed" />
          </div>
        </div>
      )}

      <header className="h-14 bg-slate-900 border-b-2 border-slate-950 flex items-center justify-between px-4 shrink-0 z-40 relative shadow-[0_4px_0px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <h1 className="font-black text-indigo-400 tracking-widest uppercase flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            <ShieldAlert className="w-5 h-5"/> Arkla DM
          </h1>
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-700 pl-4">
            <button onClick={() => setActiveManager('rules')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Book className="w-4 h-4"/> Rules Ref</button>
            <button onClick={() => setActiveManager('items')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Package className="w-4 h-4"/> Item Vault</button>
            <button onClick={() => setActiveManager('handouts')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><ImageIcon className="w-4 h-4"/> Handouts</button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button onClick={() => setActiveManager('xp')} className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors shadow-inner"><Star className="w-4 h-4"/> XP</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

      <main className="flex-1 flex overflow-hidden relative z-10 bg-slate-950">
        
        {/* LEFT FLOATING PANEL: THE PARTY - Slimmed for Laptop Optimization */}
        <div className={`relative h-full transition-[width] duration-300 shrink-0 z-30 ${showPartyPanel ? 'w-72 lg:w-80' : 'w-0'}`}>
          <div className={`absolute top-0 right-0 w-72 lg:w-80 h-full bg-slate-950 border-r-2 border-slate-900 transition-transform duration-300 ${showPartyPanel ? 'translate-x-0 shadow-[4px_0_15px_rgba(0,0,0,0.5)]' : '-translate-x-full shadow-none'}`}>
            <DMPartyPanel 
              unlockedCharacters={unlockedCharacters} 
              setIsBuildingCharacter={setIsBuildingCharacter} 
            />
          </div>
          <button 
            onClick={() => setShowPartyPanel(!showPartyPanel)} 
            className={`absolute top-1/2 -translate-y-1/2 w-8 h-24 bg-slate-900 hover:bg-slate-800 border-2 border-l-0 border-slate-950 rounded-r-xl flex items-center justify-center text-slate-400 hover:text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300 z-40 ${showPartyPanel ? 'right-0 translate-x-full' : 'left-0'}`}
          >
             {showPartyPanel ? <ChevronLeft className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
          </button>
        </div>

        {/* CENTER PANEL: THE BOARD & COLLAPSIBLE INITIATIVE */}
        <section className="flex-1 flex flex-col min-w-0 h-full relative z-10 bg-slate-950 overflow-hidden">
          
          <div className="flex-1 relative overflow-hidden flex flex-col z-0 pt-2 px-2 pb-0 md:pt-4 md:px-4">
            {isBattleMode && <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>}
            <DMBattleMap />
          </div>

          <div className="shrink-0 relative z-20 w-full p-2 md:p-4">
            <InitiativeTracker 
              unlockedCharacters={unlockedCharacters} 
              activeEnemies={activeEnemies} 
              isBattleMode={isBattleMode}
              onLaunchBattle={() => setIsBattleMode(true)}
              onExitBattle={() => setIsBattleMode(false)}
            />
          </div>

        </section>

        {/* RIGHT FLOATING PANEL: THREATS - Slimmed for Laptop Optimization */}
        <div className={`relative h-full transition-[width] duration-300 shrink-0 z-30 ${showThreatsPanel ? 'w-80 lg:w-[340px]' : 'w-0'}`}>
          <div className={`absolute top-0 left-0 w-80 lg:w-[340px] h-full bg-slate-950 border-l-2 border-slate-900 transition-transform duration-300 ${showThreatsPanel ? 'translate-x-0 shadow-[-4px_0_15px_rgba(0,0,0,0.5)]' : 'translate-x-full shadow-none'}`}>
            <DMThreatsPanel 
              activeEnemies={activeEnemies}
              selectedEnemies={selectedEnemies}
              setActiveManager={setActiveManager}
              setIsForgingSpell={setIsForgingSpell}
              setIsForgingEnemy={setIsForgingEnemy}
              selectAllEnemies={selectAllEnemies}
              massMathAmount={massMathAmount}
              setMassMathAmount={setMassMathAmount}
              handleMassMath={handleMassMath}
              toggleEnemySelection={toggleEnemySelection}
            />
          </div>
          <button 
            onClick={() => setShowThreatsPanel(!showThreatsPanel)} 
            className={`absolute top-1/2 -translate-y-1/2 w-8 h-24 bg-slate-900 hover:bg-slate-800 border-2 border-r-0 border-slate-950 rounded-l-xl flex items-center justify-center text-slate-400 hover:text-white shadow-[-4px_4px_0px_rgba(0,0,0,1)] transition-all duration-300 z-40 ${showThreatsPanel ? 'left-0 -translate-x-full' : 'right-0'}`}
          >
             {showThreatsPanel ? <ChevronRight className="w-5 h-5"/> : <ChevronLeft className="w-5 h-5"/>}
          </button>
        </div>

      </main>
    </div>
  );
}