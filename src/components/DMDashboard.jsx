import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, getDocs, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, Users, Calculator, Flame, CheckSquare, Square, PenTool, X, Sparkles, DownloadCloud, Hammer } from 'lucide-react';

import DMControlNav from './DMControlNav';
import DMPlayerCard from './DMPlayerCard';
import DMEnemyCard from './DMEnemyCard';
import InitiativeTracker from './InitiativeTracker';
import DMEncounterManager from './DMEncounterManager';
import DMItemManager from './DMItemManager'; 
import DMHandoutManager from './DMHandoutManager';
import DMBattleMap from './battlemap/DMBattleMap'; 
import DMReferenceModal from './DMReferenceModal';
import DialogModal from './shared/DialogModal';
import ApiBestiaryImport from './ApiBestiaryImport';
import DebouncedTextarea from './shared/DebouncedTextarea';
import EnemyForge from './EnemyForge';

export default function DMDashboard({ onLogout }) {
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [selectedEnemies, setSelectedEnemies] = useState([]);
  
  const [activeManager, setActiveManager] = useState(null); 
  const [isBattleMode, setIsBattleMode] = useState(false); 
  
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false); 
  const [isForgingEnemy, setIsForgingEnemy] = useState(false);
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
    if (selectedEnemies.length === activeEnemies.length) {
      setSelectedEnemies([]); 
    } else {
      setSelectedEnemies(activeEnemies.map(e => e.id)); 
    }
  };

  const handleSaveCustomEnemy = async (newEnemyObj) => {
    try {
      await setDoc(doc(db, 'active_enemies', newEnemyObj.id), newEnemyObj);
      setIsForgingEnemy(false);
      showToast('Custom Monster Forged!');
    } catch (error) {
      console.error("Failed to add enemy to bestiary:", error);
    }
  };

  const confirmResetSession = () => {
    setDialog({
      isOpen: true,
      title: 'Wipe Board?',
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
        } catch (error) {
          console.error("Error wiping board:", error);
        }
      }
    });
  };

  const confirmClearConditions = () => {
    setDialog({
      isOpen: true,
      title: 'Sweep Conditions?',
      message: 'This will remove ALL active conditions (Poisoned, Stunned, etc.) and Concentration from every player and enemy on the board.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          for (const charId of unlockedCharacters) {
            const charRef = doc(db, 'characters', charId);
            batch.update(charRef, { conditions: [], isConcentrating: false });
          }
          
          const enemyDocs = await getDocs(collection(db, 'active_enemies'));
          enemyDocs.forEach((docSnap) => {
            batch.update(docSnap.ref, { conditions: [] });
          });

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
        } catch (error) {
          console.error("Error sweeping conditions:", error);
        }
      }
    });
  };

  const handleMassMath = async (isDamage) => {
    const amt = parseInt(massMathAmount, 10);
    if (isNaN(amt) || amt <= 0 || activeEnemies.length === 0) return;

    try {
      const batch = writeBatch(db);
      const targets = selectedEnemies.length > 0 
        ? activeEnemies.filter(e => selectedEnemies.includes(e.id))
        : activeEnemies;

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
      
      if (tokensChanged) {
         batch.update(mapRef, { tokens: mapTokens });
      }

      await batch.commit();
      setMassMathAmount('');
      setSelectedEnemies([]); 
      showToast(isDamage ? `Applied ${amt} Mass Damage` : `Applied ${amt} Mass Healing`);
    } catch (error) {
      console.error("Mass Math Error:", error);
    }
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
      link.download = `arkla_full_campaign_backup_${new Date().toISOString().split('T')[0]}.json`;
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
          isOpen: true,
          title: 'WARNING: DANGEROUS OVERWRITE',
          message: 'This will completely wipe and replace ALL characters, encounters, and stashes with the backup file data. Are you absolutely sure?',
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
    <div className="relative min-h-[100dvh] overflow-hidden">
      
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none -z-10"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/10 via-fuchsia-600/5 to-transparent blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>

      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {toast && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setToast('')}
          className="fixed bottom-6 right-6 bg-slate-800 text-indigo-400 px-4 py-3 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-indigo-500/50 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-2 cursor-pointer touch-pan-x"
        >
          <Sparkles className="w-4 h-4" /> {toast}
        </div>
      )}

      {isForgingEnemy && (
        <EnemyForge 
          onSave={handleSaveCustomEnemy}
          onClose={() => setIsForgingEnemy(false)}
        />
      )}

      {showScratchpad && (
        <div className="fixed bottom-6 right-6 w-80 h-80 bg-[#fdf6e3] rounded-xl shadow-2xl z-[9999] border border-amber-300/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
          <div className="bg-amber-200/80 backdrop-blur-sm px-4 py-3 flex justify-between items-center border-b border-amber-300/50 shadow-sm cursor-default shrink-0">
            <span className="text-amber-900 font-black text-xs flex items-center gap-2 tracking-widest uppercase"><PenTool className="w-4 h-4"/> DM Scratchpad</span>
            <button onClick={() => setShowScratchpad(false)} className="text-amber-700 hover:text-red-600 hover:bg-amber-300/50 p-1 rounded transition-colors"><X className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 relative">
            <DebouncedTextarea 
              initialValue={scratchpad}
              onSave={saveScratchpad}
              placeholder="Jot down quick notes, hidden HP, DC checks..."
              className="w-full h-full p-4 bg-transparent text-amber-950 text-sm focus:outline-none resize-none font-medium custom-scrollbar leading-relaxed"
            />
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-24 flex flex-col gap-8 relative z-10">
        
        <DMControlNav 
          showScratchpad={showScratchpad}
          setShowScratchpad={setShowScratchpad}
          handleExportCampaign={handleExportCampaign}
          fileInputRef={fileInputRef}
          handleImportCampaign={handleImportCampaign}
          activeManager={activeManager}
          setActiveManager={setActiveManager}
          confirmClearConditions={confirmClearConditions}
          confirmResetSession={confirmResetSession}
          onLogout={onLogout}
        />

        <div className="relative">
          {isBattleMode && <div className="absolute inset-0 bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>}
          
          {isBattleMode ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="xl:col-span-1 h-[70vh]">
                <InitiativeTracker 
                  unlockedCharacters={unlockedCharacters} 
                  activeEnemies={activeEnemies} 
                  isBattleMode={isBattleMode}
                  onLaunchBattle={() => setIsBattleMode(true)}
                  onExitBattle={() => setIsBattleMode(false)}
                />
              </div>
              <div className="xl:col-span-3">
                <DMBattleMap />
              </div>
            </div>
          ) : (
            <InitiativeTracker 
              unlockedCharacters={unlockedCharacters} 
              activeEnemies={activeEnemies} 
              isBattleMode={isBattleMode}
              onLaunchBattle={() => setIsBattleMode(true)}
              onExitBattle={() => setIsBattleMode(false)}
            />
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-2 mt-4 uppercase tracking-widest drop-shadow-sm">
            <Users className="w-5 h-5 text-indigo-400" /> Active Party
          </h2>
          {unlockedCharacters.length === 0 ? (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 border-dashed rounded-2xl p-8 text-center text-slate-500 shadow-inner">Waiting for players to connect...</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {unlockedCharacters.map(charId => <DMPlayerCard key={charId} charId={charId} />)}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-red-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-700/50 pb-3 mt-8">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
                <Skull className="w-5 h-5 text-red-500" /> Active Threats
              </h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowBestiary(!showBestiary)}
                  className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${showBestiary ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900 border-slate-700 text-indigo-400 hover:text-white hover:border-indigo-500/50'}`}
                >
                  <DownloadCloud className="w-3.5 h-3.5" /> API Search
                </button>
                <button 
                  onClick={() => setIsForgingEnemy(!isForgingEnemy)}
                  className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${isForgingEnemy ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-slate-900 border-slate-700 text-red-400 hover:text-white hover:border-red-500/50'}`}
                >
                  <Hammer className="w-3.5 h-3.5" /> Forge Monster
                </button>
              </div>
            </div>

            {activeEnemies.length > 0 && (
              <div className="flex gap-2 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-inner">
                <button 
                  onClick={selectAllEnemies}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${selectedEnemies.length > 0 ? 'bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
                >
                  {selectedEnemies.length > 0 ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {selectedEnemies.length > 0 ? `${selectedEnemies.length} Sel` : 'All'}
                </button>
                <div className="w-px h-5 bg-slate-700 mx-1"></div>

                <Calculator className="w-4 h-4 text-slate-500 mx-1 shrink-0" />
                <input 
                  type="number" 
                  value={massMathAmount} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMassMathAmount(e.target.value)} 
                  placeholder="Amt..." 
                  className="w-20 bg-slate-950 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-red-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" 
                />
                <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors flex items-center gap-1.5 border border-red-900/50 shadow-sm"><Flame className="w-3.5 h-3.5"/> Dmg</button>
                <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors border border-emerald-900/50 shadow-sm">Heal</button>
              </div>
            )}
          </div>

          {showBestiary && (
             <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
               <ApiBestiaryImport onImportComplete={() => setShowBestiary(false)} />
             </div>
          )}

          {activeEnemies.length === 0 ? (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 border-dashed rounded-2xl p-8 text-center text-slate-500 shadow-inner">The board is clear. Summon enemies to begin.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeEnemies.map(enemy => (
                <DMEnemyCard 
                  key={enemy.id} 
                  enemy={enemy} 
                  isSelected={selectedEnemies.includes(enemy.id)}
                  onToggleSelect={() => toggleEnemySelection(enemy.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {activeManager === 'encounters' && <DMEncounterManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'items' && <DMItemManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}
      {activeManager === 'handouts' && <DMHandoutManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'rules' && <DMReferenceModal onClose={() => setActiveManager(null)} />}
    </div>
  );
}