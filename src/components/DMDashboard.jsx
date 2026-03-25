import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, updateDoc, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LogOut, Swords, Skull, RefreshCw, Book, PackagePlus, Users, 
  ShieldAlert, Eraser, Calculator, Flame, HardDriveDownload, 
  HardDriveUpload, Image as ImageIcon 
} from 'lucide-react';

import DMPlayerCard from './DMPlayerCard';
import DMEnemyCard from './DMEnemyCard';
import InitiativeTracker from './InitiativeTracker';
import DMEncounterManager from './DMEncounterManager';
import DMItemManager from './DMItemManager'; 
import DMHandoutManager from './DMHandoutManager';
import DMBattleMap from './battlemap/DMBattleMap'; 
import DMReferenceModal from './DMReferenceModal';
import DialogModal from './shared/DialogModal';

export default function DMDashboard({ onLogout }) {
  const [unlockedCharacters, setUnlockedCharacters] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [activeManager, setActiveManager] = useState(null); 
  const [isBattleMode, setIsBattleMode] = useState(false); 
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [massMathAmount, setMassMathAmount] = useState('');
  const fileInputRef = useRef(null);

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

  const confirmResetSession = () => {
    setDialog({
      isOpen: true,
      title: 'Wipe Board?',
      message: 'This will wipe all enemies and destroy the active battle map. Players will remain in the session. Are you sure?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          
          // Clear enemies
          const enemyDocs = await getDocs(collection(db, 'active_enemies'));
          enemyDocs.forEach((docSnap) => batch.delete(docSnap.ref));
          
          // Nuke the map
          batch.set(doc(db, 'campaign', 'battlemap'), {
            imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null
          });
          
          await batch.commit();
          setIsBattleMode(false);
          closeDialog();
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
          await batch.commit();
          closeDialog();
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
      activeEnemies.forEach(enemy => {
        const ref = doc(db, 'active_enemies', enemy.id);
        const current = enemy.currentHp ?? enemy.hp;
        const newHp = isDamage ? Math.max(0, current - amt) : Math.min(enemy.hp, current + amt);
        batch.update(ref, { currentHp: newHp });
      });
      await batch.commit();
      setMassMathAmount('');
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
          }
        });
      } catch (err) { console.error(err); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-24 min-h-[100dvh] flex flex-col gap-8">
        
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 md:p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-4 z-40">
          <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-start">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-indigo-400/50 shrink-0">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-widest uppercase">The Forge</h1>
              <p className="text-indigo-400 font-bold text-sm">Command Center</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700 shadow-inner mr-2">
              <button onClick={handleExportCampaign} className="hover:bg-slate-800 text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5"><HardDriveDownload className="w-4 h-4" /> Backup</button>
              <button onClick={() => fileInputRef.current?.click()} className="hover:bg-slate-800 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5"><HardDriveUpload className="w-4 h-4" /> Restore</button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportCampaign} className="hidden" />
            </div>

            <button onClick={() => setActiveManager(activeManager === 'rules' ? null : 'rules')} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'rules' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-sky-900/50'}`}>
              <Book className="w-4 h-4" /> Rules
            </button>
            <button onClick={() => setActiveManager(activeManager === 'encounters' ? null : 'encounters')} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'encounters' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-900/50'}`}>
              <ShieldAlert className="w-4 h-4" /> Encounters
            </button>
            <button onClick={() => setActiveManager(activeManager === 'items' ? null : 'items')} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'items' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-900/50'}`}>
              <PackagePlus className="w-4 h-4" /> Vault
            </button>
            <button onClick={() => setActiveManager(activeManager === 'handouts' ? null : 'handouts')} className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'handouts' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-800 hover:bg-slate-700 text-purple-400 border-purple-900/50'}`}>
              <ImageIcon className="w-4 h-4" /> Handouts
            </button>
            
            <div className="w-px h-8 bg-slate-700 hidden md:block mx-1"></div>

            <button onClick={confirmClearConditions} className="bg-fuchsia-900/30 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white border border-fuchsia-900/50 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"><Eraser className="w-4 h-4" /> Sweep</button>
            <button onClick={confirmResetSession} className="bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Wipe</button>
            <button onClick={onLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"><LogOut className="w-4 h-4" /> Exit</button>
          </div>
        </div>

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

        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2 mt-4">
            <Users className="w-5 h-5 text-indigo-400" /> Active Party
          </h2>
          {unlockedCharacters.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-8 text-center text-slate-500">Waiting for players...</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {unlockedCharacters.map(charId => <DMPlayerCard key={charId} charId={charId} />)}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-700 pb-2 mt-8">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-500" /> Active Threats
            </h2>
            {activeEnemies.length > 0 && (
              <div className="flex gap-2 items-center bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                <Calculator className="w-4 h-4 text-slate-500 ml-1 shrink-0" />
                <input type="number" value={massMathAmount} onChange={(e) => setMassMathAmount(e.target.value)} placeholder="Amt..." className="w-20 bg-slate-950 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none" />
                <button onClick={() => handleMassMath(true)} disabled={!massMathAmount} className="bg-red-900/40 hover:bg-red-600 disabled:opacity-50 text-red-400 hover:text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"><Flame className="w-3 h-3"/> Dmg All</button>
                <button onClick={() => handleMassMath(false)} disabled={!massMathAmount} className="bg-emerald-900/40 hover:bg-emerald-600 disabled:opacity-50 text-emerald-400 hover:text-white px-3 py-1 rounded text-xs font-bold transition-colors">Heal All</button>
              </div>
            )}
          </div>
          {activeEnemies.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-8 text-center text-slate-500">The board is clear.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeEnemies.map(enemy => <DMEnemyCard key={enemy.id} enemy={enemy} />)}
            </div>
          )}
        </div>

      </div>

      {activeManager === 'encounters' && <DMEncounterManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'items' && <DMItemManager activePlayers={unlockedCharacters} onClose={() => setActiveManager(null)} />}
      {activeManager === 'handouts' && <DMHandoutManager onClose={() => setActiveManager(null)} />}
      {activeManager === 'rules' && <DMReferenceModal onClose={() => setActiveManager(null)} />}
    </>
  );
}