import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ShieldAlert, X, Plus, Play, Trash2, Map, Users } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function DMEncounterManager({ onClose }) {
  const [encounters, setEncounters] = useState({});
  const [homebrewEnemies, setHomebrewEnemies] = useState([]);
  const [newEncounterName, setNewEncounterName] = useState('');
  const [draftEnemies, setDraftEnemies] = useState([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState('');

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const allAvailableEnemies = [...homebrewEnemies];

  useEffect(() => {
    const encountersRef = doc(db, 'campaign', 'encounters');
    const unsub = onSnapshot(encountersRef, (docSnap) => {
      if (docSnap.exists()) {
        setEncounters(docSnap.data().presets || {});
      }
    });

    const fetchHomebrew = async () => {
      const snap = await getDocs(collection(db, 'active_enemies'));
      const activeDocs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      const homebrewSnap = await getDocs(collection(db, 'homebrew_enemies'));
      const savedDocs = homebrewSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      const combined = [...activeDocs, ...savedDocs];
      const uniqueEnemies = Array.from(new Map(combined.map(item => [item.name, item])).values());
      
      setHomebrewEnemies(uniqueEnemies);
    };
    fetchHomebrew();

    return () => unsub();
  }, []);

  const handleAddDraftEnemy = () => {
    if (!selectedEnemyId) return;
    const enemyData = allAvailableEnemies.find(e => e.id === selectedEnemyId);
    if (!enemyData) return;

    setDraftEnemies(prev => {
      const existing = prev.find(e => e.id === selectedEnemyId);
      if (existing) {
        return prev.map(e => e.id === selectedEnemyId ? { ...e, count: e.count + 1 } : e);
      }
      return [...prev, { id: enemyData.id, name: enemyData.name, count: 1, fullData: enemyData }];
    });
  };

  const handleSaveEncounter = async () => {
    if (!newEncounterName || draftEnemies.length === 0) {
      setDialog({ isOpen: true, title: 'Missing Info', message: 'Give your encounter a name and add at least one enemy.', type: 'alert', onConfirm: closeDialog });
      return;
    }
    
    // Convert to object structure strictly
    let currentPresets = Array.isArray(encounters) ? { ...encounters } : encounters;
    const updatedEncounters = {
      ...currentPresets,
      [Date.now().toString()]: {
        name: newEncounterName,
        enemies: draftEnemies
      }
    };

    await setDoc(doc(db, 'campaign', 'encounters'), { presets: updatedEncounters });
    setNewEncounterName('');
    setDraftEnemies([]);
  };

  const confirmDeleteEncounter = (encounterKey) => {
    setDialog({
      isOpen: true,
      title: 'Delete Encounter',
      message: 'Are you sure you want to permanently delete this saved encounter?',
      type: 'confirm',
      onConfirm: async () => {
        let newPresets;
        // Handle gracefully if the old data was accidentally saved as an Array
        if (Array.isArray(encounters)) {
          newPresets = encounters.filter((_, idx) => idx.toString() !== encounterKey.toString());
        } else {
          newPresets = { ...encounters };
          delete newPresets[encounterKey];
        }
        await updateDoc(doc(db, 'campaign', 'encounters'), { presets: newPresets });
        closeDialog();
      }
    });
  };

  const confirmDeploy = (encounter) => {
    setDialog({
      isOpen: true,
      title: 'Deploy to Board',
      message: `Are you ready to deploy "${encounter.name}"? This will instantly place all enemies onto the active threat board and roll their initiative.`,
      type: 'confirm',
      onConfirm: async () => {
        for (const draftEnemy of encounter.enemies) {
          for (let i = 0; i < draftEnemy.count; i++) {
            const uniqueId = `${draftEnemy.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const enemyRef = doc(db, 'active_enemies', uniqueId);
            
            // Safeguard for broken old data
            const enemyData = draftEnemy.fullData || {};
            const enemyDex = enemyData.stats?.DEX || 10;
            const dexMod = Math.floor((enemyDex - 10) / 2);
            const rolledInitiative = Math.floor(Math.random() * 20) + 1 + dexMod;

            await setDoc(enemyRef, {
              ...enemyData,
              name: draftEnemy.name || 'Unknown Entity',
              id: uniqueId, 
              currentHp: enemyData.hp || enemyData.maxHp || 10,
              maxHp: enemyData.maxHp || enemyData.hp || 10,
              img: enemyData.tokenUrl || enemyData.imageUrl || '/icon.png', // Strict fallback to prevent map crashes
              conditions: [],
              encounterName: encounter.name,
              initiative: rolledInitiative 
            });
          }
        }
        closeDialog();
        onClose();
      }
    });
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-5xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          {/* Solid Color Header */}
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-indigo-500 rounded-t-xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
              <ShieldAlert className="w-6 h-6" /> Encounter Staging
            </h2>
            <button onClick={onClose} className="text-slate-950 bg-indigo-400 hover:bg-indigo-300 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-5 h-5 font-black" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-slate-950 relative z-10">
            
            {/* Left Column: Draft Encounter */}
            <div className="space-y-6">
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="flex justify-between items-center border-b-2 border-slate-950 pb-3 mb-4">
                  <h3 className="font-black text-indigo-400 uppercase tracking-widest text-sm flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Users className="w-5 h-5"/> Draft New Encounter</h3>
                </div>

                <div className="space-y-4">
                  <input type="text" value={newEncounterName} onChange={e => setNewEncounterName(e.target.value)} placeholder="Encounter Name (e.g. Goblin Ambush)" className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white text-sm font-black focus:outline-none focus:border-indigo-500 shadow-inner" />
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select value={selectedEnemyId} onChange={e => setSelectedEnemyId(e.target.value)} className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 shadow-inner">
                      <option value="">Select Enemy from Bestiary...</option>
                      {homebrewEnemies.length > 0 && <optgroup label="Your Forged Monsters">{homebrewEnemies.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>}
                    </select>
                    <button onClick={handleAddDraftEnemy} disabled={!selectedEnemyId} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-950 px-5 py-3 rounded-xl font-black transition-all border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none"><Plus className="w-5 h-5" /></button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 pl-1">Need a new monster? Use the "Forge Monster" tool first.</p>
                </div>

                {draftEnemies.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner space-y-3 mt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b-2 border-slate-900 pb-2">Draft Roster</h4>
                    {draftEnemies.map((e, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <span className="font-black drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{e.name}</span>
                        <span className="font-black bg-indigo-500 text-slate-950 px-2.5 py-1 rounded-md text-xs border-2 border-slate-950">x{e.count}</span>
                      </div>
                    ))}
                    <button onClick={handleSaveEncounter} className="w-full mt-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">Save Preset to Stash</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Saved Encounters */}
            <div className="space-y-4">
              <h3 className="font-black text-white border-b-[3px] border-slate-900 pb-3 flex items-center gap-2 uppercase tracking-widest text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]"><Map className="w-6 h-6 text-indigo-500" /> Saved Encounters</h3>
              {Object.keys(encounters).length === 0 ? (
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 bg-slate-900 p-8 rounded-2xl border-2 border-slate-950 border-dashed text-center shadow-inner mt-4">No encounters staged yet.</p>
              ) : (
                <div className="space-y-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                  {Object.entries(encounters).map(([key, encounter]) => (
                    <div key={key} className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative group">
                      <div className="flex justify-between items-start mb-4 border-b-2 border-slate-950 pb-3">
                        <h4 className="font-black text-white text-xl uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{encounter.name}</h4>
                        <button onClick={() => confirmDeleteEncounter(key)} className="text-slate-950 hover:text-white bg-slate-500 hover:bg-red-500 p-2 rounded-lg border-2 border-slate-950 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {encounter.enemies.map((e, idx) => (
                          <span key={idx} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-indigo-400 px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-inner">
                            {e.count}x {e.name}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => confirmDeploy(encounter)} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all">
                        <Play className="w-4 h-4 font-black" /> Deploy to Active Board
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}