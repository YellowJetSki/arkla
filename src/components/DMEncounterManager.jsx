import { useState, useEffect } from 'react';
import { collection, doc, setDoc, addDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, X, Plus, Play, ShieldAlert, Trash2, Map, Hammer } from 'lucide-react';
import { PREMADE_ENEMIES } from '../data/campaignData';
import DialogModal from './shared/DialogModal';
import ApiBestiaryImport from './ApiBestiaryImport';

export default function DMEncounterManager({ onClose }) {
  const [encounters, setEncounters] = useState({});
  const [homebrewEnemies, setHomebrewEnemies] = useState([]);
  const [newEncounterName, setNewEncounterName] = useState('');
  const [draftEnemies, setDraftEnemies] = useState([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState('');
  
  const [isForgingEnemy, setIsForgingEnemy] = useState(false);
  const [customEnemy, setCustomEnemy] = useState({ name: '', hp: 10, ac: 10, passivePerception: 10, flavor: 'Homebrew Creature', actionsDesc: '' });

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const allAvailableEnemies = [...PREMADE_ENEMIES, ...homebrewEnemies];

  useEffect(() => {
    const encountersRef = doc(db, 'campaign', 'encounters');
    const unsub = onSnapshot(encountersRef, (docSnap) => {
      if (docSnap.exists()) {
        setEncounters(docSnap.data().presets || {});
      }
    });

    const fetchHomebrew = async () => {
      const snap = await getDocs(collection(db, 'homebrew_enemies'));
      const homebrew = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setHomebrewEnemies(homebrew);
    };
    fetchHomebrew();

    return () => unsub();
  }, []);

  const handleImportMonster = async (newMonster) => {
    try {
      await addDoc(collection(db, 'homebrew_enemies'), {
        ...newMonster,
        id: `api_${Date.now()}`
      });
      
      setHomebrewEnemies(prev => [...prev, { ...newMonster, id: `api_${Date.now()}` }]);
      setDialog({ isOpen: true, title: 'Import Successful', message: `${newMonster.name} has been added to your Forge Bestiary!`, type: 'alert', onConfirm: closeDialog });
    } catch (error) {
      console.error("Error importing monster:", error);
    }
  };

  const handleForgeCustomEnemy = async (e) => {
    e.preventDefault();
    if (!customEnemy.name) return;

    const newMonster = {
      name: customEnemy.name,
      flavor: customEnemy.flavor,
      ac: Number(customEnemy.ac),
      hp: Number(customEnemy.hp),
      passivePerception: Number(customEnemy.passivePerception),
      actions: [{ name: "Attacks / Actions", desc: customEnemy.actionsDesc || 'Standard attack.' }]
    };

    try {
      const uniqueId = `custom_${Date.now()}`;
      await addDoc(collection(db, 'homebrew_enemies'), { ...newMonster, id: uniqueId });
      
      setHomebrewEnemies(prev => [...prev, { ...newMonster, id: uniqueId }]);
      setCustomEnemy({ name: '', hp: 10, ac: 10, passivePerception: 10, flavor: 'Homebrew Creature', actionsDesc: '' });
      setIsForgingEnemy(false);
      setDialog({ isOpen: true, title: 'Forge Successful', message: `${newMonster.name} is ready for combat.`, type: 'alert', onConfirm: closeDialog });
    } catch (error) {
      console.error("Error forging monster:", error);
    }
  };

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
      message: `Are you ready to deploy "${encounter.name}"? This will instantly place all enemies onto the active threat board.`,
      type: 'confirm',
      onConfirm: async () => {
        for (const draftEnemy of encounter.enemies) {
          for (let i = 0; i < draftEnemy.count; i++) {
            const uniqueId = `${draftEnemy.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const enemyRef = doc(db, 'active_enemies', uniqueId);
            
            await setDoc(enemyRef, {
              ...draftEnemy.fullData,
              id: uniqueId, 
              currentHp: draftEnemy.fullData.hp,
              conditions: [],
              encounterName: encounter.name 
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

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" /> Encounter Manager
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30">
            
            <div className="space-y-8">
              
              <ApiBestiaryImport onImportMonster={handleImportMonster} />

              {/* HOMEBREW MONSTER FORGE */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 mb-3">
                  <h3 className="font-bold text-indigo-400">Create New Preset</h3>
                  <button 
                    onClick={() => setIsForgingEnemy(!isForgingEnemy)}
                    className="text-xs font-bold text-indigo-400 hover:text-white bg-slate-900 px-2 py-1 rounded border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Hammer className="w-3 h-3" /> {isForgingEnemy ? 'Close Forge' : 'Forge Custom Enemy'}
                  </button>
                </div>

                {isForgingEnemy && (
                  <form onSubmit={handleForgeCustomEnemy} className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monster Name</label>
                        <input type="text" required value={customEnemy.name} onChange={e => setCustomEnemy({...customEnemy, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max HP</label>
                        <input type="number" required value={customEnemy.hp} onChange={e => setCustomEnemy({...customEnemy, hp: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Armor Class</label>
                        <input type="number" required value={customEnemy.ac} onChange={e => setCustomEnemy({...customEnemy, ac: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attacks & Abilities</label>
                        <textarea required value={customEnemy.actionsDesc} onChange={e => setCustomEnemy({...customEnemy, actionsDesc: e.target.value})} className="w-full min-h-[60px] bg-slate-950 border border-slate-600 rounded px-2 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 resize-y" placeholder="e.g. Multiattack: Claw (+4 to hit, 1d6 damage)..." />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">Forge Creature</button>
                  </form>
                )}

                <input type="text" value={newEncounterName} onChange={e => setNewEncounterName(e.target.value)} placeholder="Encounter Name (e.g. Cave Ambush)" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 mb-3" />
                <div className="flex gap-2">
                  <select value={selectedEnemyId} onChange={e => setSelectedEnemyId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none">
                    <option value="">Select Enemy to Add...</option>
                    <optgroup label="Bestiary (Premade)">{PREMADE_ENEMIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>
                    {homebrewEnemies.length > 0 && <optgroup label="The Forge & API">{homebrewEnemies.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>}
                  </select>
                  <button onClick={handleAddDraftEnemy} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
                </div>
                {draftEnemies.length > 0 && (
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2 mt-4">
                    {draftEnemies.map((e, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-300 bg-slate-800 p-2 rounded">
                        <span>{e.name}</span><span className="font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">x{e.count}</span>
                      </div>
                    ))}
                    <button onClick={handleSaveEncounter} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">Save Preset</button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
              <h3 className="font-bold text-white border-b border-slate-700 pb-2 flex items-center gap-2"><Map className="w-5 h-5 text-indigo-400" /> Saved Encounters</h3>
              {Object.keys(encounters).length === 0 ? (
                <p className="text-sm text-slate-500 italic bg-slate-800 p-4 rounded-xl border border-slate-700">No encounters saved yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(encounters).map(([key, encounter]) => (
                    <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-black text-white text-lg">{encounter.name}</h4>
                        <button onClick={() => confirmDeleteEncounter(key)} className="text-slate-500 hover:text-red-400 p-1 bg-slate-900 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {encounter.enemies.map((e, idx) => (
                          <span key={idx} className="text-xs font-bold bg-indigo-900/30 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-500/30">
                            {e.count}x {e.name}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => confirmDeploy(encounter)} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors">
                        <Play className="w-4 h-4" /> Deploy to Board
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