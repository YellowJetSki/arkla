import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
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

  // All available enemies are now strictly what the DM has created/imported
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
      
      // Combine and deduplicate by name so the dropdown is clean
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
    
    const updatedEncounters = {
      ...encounters,
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
        const updatedEncounters = { ...encounters };
        delete updatedEncounters[encounterKey];
        await setDoc(doc(db, 'campaign', 'encounters'), { presets: updatedEncounters });
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
            
            // Auto-Roll Initiative calculation based on DEX
            const enemyDex = draftEnemy.fullData.stats?.DEX || 10;
            const dexMod = Math.floor((enemyDex - 10) / 2);
            const rolledInitiative = Math.floor(Math.random() * 20) + 1 + dexMod;

            await setDoc(enemyRef, {
              ...draftEnemy.fullData,
              id: uniqueId, 
              currentHp: draftEnemy.fullData.hp || draftEnemy.fullData.maxHp || 10,
              conditions: [],
              encounterName: encounter.name,
              initiative: rolledInitiative // Instantly rolled and assigned
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
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0 relative z-10">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
              <ShieldAlert className="w-6 h-6" /> Encounter Staging
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-sm">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30 relative z-10">
            
            <div className="space-y-6">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm backdrop-blur-sm">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
                  <h3 className="font-black text-indigo-400 uppercase tracking-widest text-sm flex items-center gap-2"><Users className="w-4 h-4"/> Draft New Encounter</h3>
                </div>

                <div className="space-y-3">
                  <input type="text" value={newEncounterName} onChange={e => setNewEncounterName(e.target.value)} placeholder="Encounter Name (e.g. Goblin Ambush)" className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner" />
                  
                  <div className="flex gap-2">
                    <select value={selectedEnemyId} onChange={e => setSelectedEnemyId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner">
                      <option value="">Select Enemy from Bestiary...</option>
                      {homebrewEnemies.length > 0 && <optgroup label="Your Forged Monsters">{homebrewEnemies.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>}
                    </select>
                    <button onClick={handleAddDraftEnemy} disabled={!selectedEnemyId} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors shadow-md"><Plus className="w-5 h-5" /></button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1 pl-1">Need a new monster? Use the "Summon Monster" Forge on the dashboard.</p>
                </div>

                {draftEnemies.length > 0 && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-inner space-y-2 mt-5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Draft Roster</h4>
                    {draftEnemies.map((e, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <span className="font-bold">{e.name}</span>
                        <span className="font-black bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-md text-xs border border-indigo-500/30">x{e.count}</span>
                      </div>
                    ))}
                    <button onClick={handleSaveEncounter} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">Save Preset to Stash</button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
              <h3 className="font-black text-white border-b border-slate-700/50 pb-2 flex items-center gap-2 uppercase tracking-widest text-sm"><Map className="w-5 h-5 text-indigo-400" /> Saved Encounters</h3>
              {Object.keys(encounters).length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-900/50 p-6 rounded-xl border border-slate-700 border-dashed text-center">No encounters staged yet.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.entries(encounters).map(([key, encounter]) => (
                    <div key={key} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 shadow-sm hover:border-indigo-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-white text-lg drop-shadow-sm">{encounter.name}</h4>
                        <button onClick={() => confirmDeleteEncounter(key)} className="text-slate-500 hover:text-red-400 p-1.5 bg-slate-900 rounded-lg border border-slate-800 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {encounter.enemies.map((e, idx) => (
                          <span key={idx} className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-indigo-300 px-2 py-1.5 rounded-lg border border-slate-700 shadow-inner">
                            {e.count}x {e.name}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => confirmDeploy(encounter)} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">
                        <Play className="w-4 h-4" /> Deploy to Active Board
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