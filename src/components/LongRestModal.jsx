import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Moon, Bed, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function LongRestModal({ char, charId, onClose }) {
  const [isResting, setIsResting] = useState(false);

  const handleConfirmRest = async () => {
    setIsResting(true);

    try {
      // 1. Reset HP & Hit Dice
      const updates = {
        hp: char.maxHp || 10,
        'hitDice.current': char.hitDice?.max || char.level,
        'deathSaves.successes': 0,
        'deathSaves.failures': 0,
      };

      // 2. Reset all Spell Slots to their max
      if (char.spellSlots) {
        const resetSlots = { ...char.spellSlots };
        Object.keys(resetSlots).forEach(level => {
          resetSlots[level].current = resetSlots[level].max;
        });
        updates.spellSlots = resetSlots;
      }

      // 3. Reset all Custom Resources to their max
      if (char.resources && char.resources.length > 0) {
        const resetResources = char.resources.map(res => ({
          ...res,
          current: res.max
        }));
        updates.resources = resetResources;
      }

      await updateDoc(doc(db, 'characters', charId), updates);
      
      setTimeout(() => {
        onClose();
      }, 1500); // Give them a second to see the success state
      
    } catch (error) {
      console.error("Long Rest Failed:", error);
      setIsResting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh]">
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col relative overflow-hidden">
        
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/90 relative z-10">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <Moon className="w-5 h-5" /> Make Camp
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 text-center relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-2xl font-black text-white mb-2">Restored!</h3>
              <p className="text-sm text-slate-400">HP, Hit Dice, and spell slots have been fully reset.</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <Bed className="w-12 h-12 text-indigo-400 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-black text-white mb-2">Take a Long Rest?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                This will simulate 8 hours of rest. You will fully recover your <strong className="text-emerald-400">HP</strong>, regain all spent <strong className="text-emerald-400">Hit Dice</strong>, and restore all <strong className="text-fuchsia-400">Spell Slots</strong> and <strong className="text-amber-400">Resources</strong> to their maximums.
              </p>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmRest} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                  Rest Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}