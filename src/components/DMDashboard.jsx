import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, getDocs, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, Users, Flame, CheckSquare, Square, PenTool, X, Sparkles, DownloadCloud, Hammer, UserPlus, Wand2, Book, Package, Image as ImageIcon, Map as MapIcon, ShieldAlert, Trash2, PowerOff, UploadCloud } from 'lucide-react';

import DMPlayerCard from './DMPlayerCard';
import DMEnemyCard from './DMEnemyCard';
import InitiativeTracker from './InitiativeTracker';
import DMEncounterManager from './DMEncounterManager';
import DMItemManager from './DMItemManager'; 
import DMHandoutManager from './DMHandoutManager';
import DMBattleMap from './battlemap/DMBattleMap'; 
import DMReferenceModal from './DMReferenceModal';
import DialogModal from './shared/DialogModal';
import DebouncedTextarea from './shared/DebouncedTextarea';
import EnemyForge from './EnemyForge';
import DMCharacterBuilder from './DMCharacterBuilder';
import DMSpellForge from './DMSpellForge';

export default function DMDashboard({ onLogout }) {
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  
  const [activeManager, setActiveManager] = useState(null); 
  const [isBattleMode, setIsBattleMode] = useState(false); 
  
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

  let touchStartX = 0;
  const handleTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchEndX - touchStartX > 50) setToast(''); 
  };

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
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden text-slate-300 font-sans">
      
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {toast && (
        <div 
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={() => setToast('')}
          className="fixed bottom-6 right-6 bg-slate-800 text-indigo-400 px-4 py-3 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-indigo-500/50 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
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

      {showScratchpad && (
        <div className="fixed bottom-6 right-6 w-80 h-80 bg-[#fdf6e3] rounded-xl shadow-2xl z-[9999] border border-amber-300/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          <div className="bg-amber-200/80 backdrop-blur-sm px-4 py-3 flex justify-between items-center border-b border-amber-300/50 shadow-sm shrink-0">
            <span className="text-amber-900 font-black text-xs flex items-center gap-2 tracking-widest uppercase"><PenTool className="w-4 h-4"/> DM Scratchpad</span>
            <button onClick={() => setShowScratchpad(false)} className="text-amber-700 hover:text-red-600 hover:bg-amber-300/50 p-1 rounded transition-colors"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 relative">
            <DebouncedTextarea initialValue={scratchpad} onSave={saveScratchpad} placeholder="Jot down quick notes, hidden HP..." className="w-full h-full p-4 bg-transparent text-amber-950 text-sm focus:outline-none resize-none font-medium custom-scrollbar leading-relaxed" />
          </div>
        </div>
      )}

      {/* HEADER COMMAND NAV */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <h1 className="font-black text-indigo-400 tracking-widest uppercase flex items-center gap-2">
            <ShieldAlert className="w-5 h-5"/> Arkla DM
          </h1>
          <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-4">
            <button onClick={() => setActiveManager('rules')} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"><Book className="w-4 h-4"/> Rules Ref</button>
            <button onClick={() => setActiveManager('items')} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"><Package className="w-4 h-4"/> Item Vault</button>
            <button onClick={() => setActiveManager('handouts')} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"><ImageIcon className="w-4 h-4"/> Handouts</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowScratchpad(!showScratchpad)} className="text-amber-400 hover:text-amber-300 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Scratchpad"><PenTool className="w-4 h-4"/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportCampaign} />
          <button onClick={() => fileInputRef.current.click()} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Import Campaign"><UploadCloud className="w-4 h-4"/></button>
          <button onClick={handleExportCampaign} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Export Campaign"><DownloadCloud className="w-4 h-4"/></button>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <button onClick={confirmClearConditions} className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Clear All Conditions"><Sparkles className="w-4 h-4"/></button>
          <button onClick={confirmResetSession} className="text-red-400 hover:text-red-300 hover:bg-slate-800 p-1.5 rounded transition-colors" title="Wipe Board & Enemies"><Trash2 className="w-4 h-4"/></button>
          <button onClick={onLogout} className="text-slate-500 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors" title="Logout"><PowerOff className="w-4 h-4"/></button>
        </div>
      </header>

      {/* THREE-PANE VTT LAYOUT */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        
        {/* LEFT PANEL: THE PARTY */}
        <aside className="w-full lg:w-[320px] xl:w-[350px] border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0 h-[40vh] lg:h-full">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-indigo-950/20 shrink-0">
             <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4"/> The Party</h2>
             <button onClick={() => setIsBuildingCharacter(true)} className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm"><UserPlus className="w-3 h-3"/> New</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
             {unlockedCharacters.length === 0 ? (
               <div className="text-center p-4 text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl">Waiting for players...</div>
             ) : (
               unlockedCharacters.map(id => <DMPlayerCard key={id} charId={id} />)
             )}
          </div>
        </aside>

        {/* CENTER PANEL: THE BOARD */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-950 relative border-b lg:border-b-0 lg:border-r border-slate-800 h-[60vh] lg:h-full">
          <div className="shrink-0 bg-slate-900/80 border-b border-slate-800 max-h-[35vh] overflow-y-auto custom-scrollbar relative z-10">
            <InitiativeTracker 
              unlockedCharacters={unlockedCharacters} 
              activeEnemies={activeEnemies} 
              isBattleMode={isBattleMode}
              onLaunchBattle={() => setIsBattleMode(true)}
              onExitBattle={() => setIsBattleMode(false)}
            />
          </div>
          <div className="flex-1 relative overflow-hidden">
            {isBattleMode && <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>}
            <DMBattleMap />
          </div>
        </section>

        {/* RIGHT PANEL: THREATS */}
        <aside className="w-full lg:w-[350px] xl:w-[400px] bg-slate-900/40 flex flex-col shrink-0 h-[50vh] lg:h-full">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-red-950/20 shrink-0">
             <h2 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><Skull className="w-4 h-4"/> Threats</h2>
             <div className="flex gap-1.5">
                <button onClick={() => setActiveManager('encounters')} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 border border-slate-600" title="Stage Encounters"><MapIcon className="w-3 h-3"/> Stag</button>
                <button onClick={() => setIsForgingSpell(true)} className="text-[10px] font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm" title="Forge Spell"><Wand2 className="w-3 h-3"/> Spl</button>
                <button onClick={() => setIsForgingEnemy(true)} className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm" title="Forge Monster"><Hammer className="w-3 h-3"/> Mon</button>
             </div>
          </div>

          {activeEnemies.length > 0 && (
             <div className="p-3 border-b border-slate-800 bg-slate-900/80 flex flex-col gap-2 shrink-0">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mass Apply</span>
                 <button onClick={selectAllEnemies} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1 border border-slate-600">
                   {selectedEnemies.length > 0 ? <CheckSquare className="w-3 h-3"/> : <Square className="w-3 h-3"/>}
                   {selectedEnemies.length > 0 ? `${selectedEnemies.length} Sel` : 'All'}
                 </button>
               </div>
               <div className="flex gap-2">
                 <input type="number" value={massMathAmount} onChange={e => setMassMathAmount(e.target.value)} placeholder="Amt..." className="w-16 bg-slate-950 border border-slate-700 rounded text-white text-xs px-2 py-1 focus:outline-none focus:border-red-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                 <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="flex-1 bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded border border-red-900/50 transition-colors flex items-center justify-center gap-1"><Flame className="w-3 h-3"/> Dmg</button>
                 <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="flex-1 bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded border border-emerald-900/50 transition-colors">Heal</button>
               </div>
             </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
             {activeEnemies.length === 0 ? (
               <div className="text-center p-4 text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl">No active threats on the board.</div>
             ) : (
               activeEnemies.map(enemy => (
                 <DMEnemyCard 
                   key={enemy.id} 
                   enemy={enemy} 
                   isSelected={selectedEnemies.includes(enemy.id)}
                   onToggleSelect={() => toggleEnemySelection(enemy.id)}
                 />
               ))
             )}
          </div>
        </aside>
      </main>
    </div>
  );
}