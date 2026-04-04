import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Sparkles, ShieldAlert, Trash2 } from 'lucide-react';

export default function TempBuffsModal({ charId, tempBuffs, isDM, activeTheme, onClose }) {
  const [newBuff, setNewBuff] = useState({ name: '', target: 'AC', value: 1 });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddBuff = async (e) => {
    e.preventDefault();
    if (!newBuff.name || isDM) return;
    setIsSaving(true);
    try {
      const buffData = { id: `buff_${Date.now()}`, name: newBuff.name, target: newBuff.target, value: Number(newBuff.value) };
      await updateDoc(doc(db, 'characters', charId), { tempBuffs: arrayUnion(buffData) });
      setNewBuff({ name: '', target: 'AC', value: 1 });
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleRemoveBuff = async (buffToRemove) => {
    if (isDM) return;
    try {
      const updatedBuffs = tempBuffs.filter(b => b.id !== buffToRemove.id);
      await updateDoc(doc(db, 'characters', charId), { tempBuffs: updatedBuffs });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative max-h-[95dvh] overflow-hidden animate-in zoom-in-95">
        
        {/* Header - Shrink 0 keeps it from collapsing */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
          <h2 className={`text-base sm:text-lg font-black ${activeTheme.text} flex items-center gap-2 uppercase tracking-widest`}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Temporary Buffs
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {!isDM && (
            <form onSubmit={handleAddBuff} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-inner flex flex-col gap-3 shrink-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inject New Modifier</label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  required
                  value={newBuff.name}
                  onChange={(e) => setNewBuff({...newBuff, name: e.target.value})}
                  placeholder="e.g. Shield of Faith" 
                  className="flex-1 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <div className="flex gap-2">
                    <select 
                    value={newBuff.target}
                    onChange={(e) => setNewBuff({...newBuff, target: e.target.value})}
                    className="flex-1 sm:w-32 bg-slate-950 border border-slate-600 rounded-lg px-2 py-2.5 text-white text-sm focus:outline-none"
                    >
                    <optgroup label="Combat">
                        <option value="AC">AC</option>
                        <option value="Initiative">Initiative</option>
                        <option value="Speed">Speed</option>
                        <option value="Attack">Attack Rolls</option>
                        <option value="Damage">Damage Rolls</option>
                    </optgroup>
                    <optgroup label="Saving Throws">
                        <option value="All Saves">All Saves</option>
                        <option value="STR Save">STR Save</option>
                        <option value="DEX Save">DEX Save</option>
                        <option value="CON Save">CON Save</option>
                        <option value="INT Save">INT Save</option>
                        <option value="WIS Save">WIS Save</option>
                        <option value="CHA Save">CHA Save</option>
                    </optgroup>
                    <optgroup label="Checks & Skills">
                        <option value="All Checks">All Checks</option>
                        <option value="Perception">Perception</option>
                        <option value="Stealth">Stealth</option>
                    </optgroup>
                    </select>
                    <input 
                    type="number" 
                    required
                    value={newBuff.value}
                    onChange={(e) => setNewBuff({...newBuff, value: e.target.value})}
                    className="w-16 bg-slate-950 border border-slate-600 rounded-lg px-2 py-2.5 text-white text-sm text-center focus:outline-none shadow-inner"
                    />
                </div>
              </div>
              <button disabled={isSaving} type="submit" className={`w-full py-3 rounded-lg font-black text-white text-xs uppercase tracking-widest ${activeTheme.bg} hover:opacity-90 transition-all border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] mt-1`}>
                {isSaving ? 'Applying...' : 'Apply Buff'}
              </button>
            </form>
          )}

          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <ShieldAlert className="w-3 h-3" /> Active Overrides
            </h4>
            
            {tempBuffs.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">No temporary buffs active.</p>
            ) : (
              <div className="space-y-2">
                {tempBuffs.map((buff, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center justify-between group shadow-sm hover:border-slate-500 transition-colors">
                    <div>
                      <span className="text-sm font-black text-white block">{buff.name}</span>
                      <span className={`text-[10px] uppercase font-black tracking-widest ${buff.value > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {buff.value > 0 ? '+' : ''}{buff.value} {buff.target}
                      </span>
                    </div>
                    {!isDM && (
                      <button onClick={() => handleRemoveBuff(buff)} className="text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 p-2 rounded-lg transition-colors shadow-inner">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}