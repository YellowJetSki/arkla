import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Hammer, X, Plus, Trash2, Save } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function DMHomebrewForge({ onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const [enemy, setEnemy] = useState({
    name: '',
    flavor: '',
    ac: 10,
    hp: 10,
    speed: '30 ft.',
    stats: { STR: '+0', DEX: '+0', CON: '+0', INT: '+0', WIS: '+0', CHA: '+0' },
    passivePerception: 10,
    features: [],
    actions: []
  });

  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const handleStatChange = (stat, val) => {
    setEnemy(prev => ({ ...prev, stats: { ...prev.stats, [stat]: val } }));
  };

  const addArrayItem = (field) => {
    setEnemy(prev => ({ ...prev, [field]: [...prev[field], { name: '', desc: '' }] }));
  };

  const updateArrayItem = (field, index, key, value) => {
    setEnemy(prev => {
      const newArray = [...prev[field]];
      newArray[index][key] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const removeArrayItem = (field, index) => {
    setEnemy(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!enemy.name) {
      setDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Your homebrew enemy requires a name before it can be forged!',
        type: 'alert',
        onConfirm: closeDialog
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'homebrew_enemies'), {
        ...enemy,
        id: `homebrew_${Date.now()}`
      });
      onClose();
    } catch (error) {
      console.error("Error saving homebrew enemy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogModal 
        isOpen={dialog.isOpen} 
        title={dialog.title} 
        message={dialog.message} 
        type={dialog.type} 
        onConfirm={dialog.onConfirm} 
        onCancel={closeDialog} 
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-800 border border-amber-500/50 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl shrink-0">
            <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <Hammer className="w-5 h-5" /> The Homebrew Forge
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monster Name</label>
                <input type="text" value={enemy.name} onChange={e => setEnemy({...enemy, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Void Stalker" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Flavor Text / Lore</label>
                <input type="text" value={enemy.flavor} onChange={e => setEnemy({...enemy, flavor: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="A terrifying beast from the astral plane..." />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Armor Class</label>
                <input type="number" onFocus={(e) => e.target.select()} value={enemy.ac} onChange={e => setEnemy({...enemy, ac: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max HP</label>
                <input type="number" onFocus={(e) => e.target.select()} value={enemy.hp} onChange={e => setEnemy({...enemy, hp: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Speed</label>
                <input type="text" onFocus={(e) => e.target.select()} value={enemy.speed} onChange={e => setEnemy({...enemy, speed: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Passive Perc.</label>
                <input type="number" onFocus={(e) => e.target.select()} value={enemy.passivePerception} onChange={e => setEnemy({...enemy, passivePerception: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ability Modifiers (e.g. +2 or -1)</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {Object.keys(enemy.stats).map(stat => (
                  <div key={stat} className="text-center focus-within:border-amber-500 transition-colors rounded">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">{stat}</span>
                    <input type="text" onFocus={(e) => e.target.select()} value={enemy.stats[stat]} onChange={e => handleStatChange(stat, e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded text-center text-white font-bold py-1 focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-300">Special Features</label>
                <button type="button" onClick={() => addArrayItem('features')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add Feature</button>
              </div>
              <div className="space-y-3">
                {enemy.features.map((feat, i) => (
                  <div key={i} className="flex gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Feature Name (e.g. Pack Tactics)" value={feat.name} onChange={e => updateArrayItem('features', i, 'name', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                      <textarea placeholder="Description..." value={feat.desc} onChange={e => updateArrayItem('features', i, 'desc', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm resize-y focus:outline-none focus:border-amber-500" />
                    </div>
                    <button type="button" onClick={() => removeArrayItem('features', i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-300">Combat Actions</label>
                <button type="button" onClick={() => addArrayItem('actions')} className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add Action</button>
              </div>
              <div className="space-y-3">
                {enemy.actions.map((act, i) => (
                  <div key={i} className="flex gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Action Name (e.g. Multiattack or Claws)" value={act.name} onChange={e => updateArrayItem('actions', i, 'name', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
                      <textarea placeholder="Melee Weapon Attack: +5 to hit..." value={act.desc} onChange={e => updateArrayItem('actions', i, 'desc', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white text-sm resize-y focus:outline-none focus:border-amber-500" />
                    </div>
                    <button type="button" onClick={() => removeArrayItem('actions', i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

          </form>

          <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-2xl shrink-0">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
              {isSaving ? 'Forging...' : <><Save className="w-5 h-5" /> Save to Bestiary</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}