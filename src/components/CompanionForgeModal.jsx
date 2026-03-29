import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, PawPrint, Shield, Heart, Trash2 } from 'lucide-react';
import DialogModal from './shared/DialogModal';

export default function CompanionForgeModal({ char, charId, onClose }) {
  const [companion, setCompanion] = useState(char.companion || {
    name: '', type: 'Beast', ac: 10, hp: 10, maxHp: 10, speed: '30 ft', stats: 'STR: 10 (+0)', actions: ''
  });

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const handleSave = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'characters', charId), { 
      companion: { ...companion, hp: companion.maxHp } // Reset HP on creation
    });
    onClose();
  };

  const handleRemove = async () => {
    setDialog({
      isOpen: true,
      title: 'Release Companion?',
      message: `Are you sure you want to release ${companion.name || 'this companion'}? They will be permanently removed from your character sheet.`,
      type: 'confirm',
      onConfirm: async () => {
        await updateDoc(doc(db, 'characters', charId), { companion: null });
        closeDialog();
        onClose();
      }
    });
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

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
        <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <PawPrint className="w-5 h-5" /> Forge Companion
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                <input 
                  type="text" 
                  required 
                  onFocus={(e) => e.target.select()}
                  value={companion.name} 
                  onChange={e => setCompanion({...companion, name: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner transition-colors" 
                  placeholder="e.g. Barnaby the Bear" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Armor Class</label>
                <input 
                  type="number" 
                  required 
                  onFocus={(e) => e.target.select()}
                  value={companion.ac} 
                  onChange={e => setCompanion({...companion, ac: Number(e.target.value)})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Heart className="w-3 h-3 text-red-400"/> Max HP</label>
                <input 
                  type="number" 
                  required 
                  onFocus={(e) => e.target.select()}
                  value={companion.maxHp} 
                  onChange={e => setCompanion({...companion, maxHp: Number(e.target.value)})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Speed & Core Stats</label>
                <input 
                  type="text" 
                  value={companion.stats} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setCompanion({...companion, stats: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 shadow-inner transition-colors" 
                  placeholder="Speed 30ft, STR 15 (+2)..." 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actions & Abilities</label>
                <textarea 
                  value={companion.actions} 
                  onChange={e => setCompanion({...companion, actions: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm h-24 resize-y focus:outline-none focus:border-emerald-500 shadow-inner transition-colors leading-relaxed" 
                  placeholder="Bite: +4 to hit, 1d6+2 piercing." 
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              {char.companion && (
                <button type="button" onClick={handleRemove} className="bg-red-900/30 border border-red-900/50 text-red-400 font-bold py-2.5 px-4 rounded-lg hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2 shadow-sm">
                  <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Release</span>
                </button>
              )}
              <button type="submit" className="flex-1 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs py-2.5 rounded-lg hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                Save Companion
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}