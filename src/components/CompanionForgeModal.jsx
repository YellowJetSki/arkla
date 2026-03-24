import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, PawPrint, Shield, Heart } from 'lucide-react';

export default function CompanionForgeModal({ char, charId, onClose }) {
  const [companion, setCompanion] = useState(char.companion || {
    name: '', type: 'Beast', ac: 10, hp: 10, maxHp: 10, speed: '30 ft', stats: 'STR: 10 (+0)', actions: ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'characters', charId), { 
      companion: { ...companion, hp: companion.maxHp } // Reset HP on creation
    });
    onClose();
  };

  const handleRemove = async () => {
    if (window.confirm('Remove this companion?')) {
      await updateDoc(doc(db, 'characters', charId), { companion: null });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><PawPrint className="w-5 h-5" /> Forge Companion</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">Name</label>
              <input type="text" required value={companion.name} onChange={e => setCompanion({...companion, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" placeholder="e.g. Barnaby the Bear" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Armor Class</label>
              <input type="number" required value={companion.ac} onChange={e => setCompanion({...companion, ac: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Max HP</label>
              <input type="number" required value={companion.maxHp} onChange={e => setCompanion({...companion, maxHp: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">Speed & Core Stats</label>
              <input type="text" value={companion.stats} onChange={e => setCompanion({...companion, stats: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" placeholder="Speed 30ft, STR 15 (+2)..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">Actions & Abilities</label>
              <textarea value={companion.actions} onChange={e => setCompanion({...companion, actions: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm h-24 resize-y" placeholder="Bite: +4 to hit, 1d6+2 piercing." />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            {char.companion && (
              <button type="button" onClick={handleRemove} className="bg-red-900/30 text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-900/50 transition-colors">Remove</button>
            )}
            <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-500 transition-colors">Save Companion</button>
          </div>
        </form>
      </div>
    </div>
  );
}