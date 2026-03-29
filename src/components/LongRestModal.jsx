import { useState } from 'react';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Moon, Bed, CheckCircle2, X, Activity, Flame, ShieldPlus, Stars } from 'lucide-react';

export default function LongRestModal({ char, charId, onClose }) {
  const [isResting, setIsResting] = useState(false);

  const maxHD = char.hitDice?.max || char.level || 1;
  const currentHD = char.hitDice?.current || 0;
  const recoverAmount = Math.max(1, Math.floor(maxHD / 2));
  const newHD = Math.min(maxHD, currentHD + recoverAmount);

  const handleConfirmRest = async () => {
    setIsResting(true);

    try {
      const batch = writeBatch(db);
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');
      
      let updates = {};

      updates.hp = char.maxHp || 10;
      updates.tempHp = 0;
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
      updates.isConcentrating = false;
      updates['hitDice.current'] = newHD;

      if (char.spellSlots) {
        const resetSlots = { ...char.spellSlots };
        Object.keys(resetSlots).forEach(level => {
          resetSlots[level].current = resetSlots[level].max;
        });
        updates.spellSlots = resetSlots;
      }

      if (char.resources && char.resources.length > 0) {
        const resetResources = char.resources.map(res => ({
          ...res,
          current: res.max
        }));
        updates.resources = resetResources;
      }

      if (char.conditions && char.conditions.length > 0) {
        const clearedConditions = ['Unconscious', 'Prone'];
        updates.conditions = char.conditions.filter(c => !clearedConditions.includes(c));
      } else {
        updates.conditions = [];
      }

      // Update Character Document Optimistically
      batch.update(charRef, updates);

      // Safely sync to map token via dot notation
      const mapDoc = await getDoc(mapRef);
      if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
        let mapUpdates = {
           [`tokens.${charId}.hp`]: updates.hp,
           [`tokens.${charId}.tempHp`]: 0,
           [`tokens.${charId}.isConcentrating`]: false,
           [`tokens.${charId}.conditions`]: updates.conditions
        };
        batch.update(mapRef, mapUpdates);
      }
      
      await batch.commit();

      setTimeout(() => {
        onClose();
      }, 2500); 
      
    } catch (error) {
      console.error("Long Rest Failed:", error);
      setIsResting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      {/* Immersive Moonlight Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_60px_rgba(59,130,246,0.15)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 relative z-10">
          <h2 className="text-xl font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
            <Moon className="w-5 h-5" /> Make Camp
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-blue-500/50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-2xl font-black text-white mb-6">Restored!</h3>
              
              <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-5 text-left space-y-4 shadow-inner">
                <div className="flex items-center gap-3 text-emerald-400 text-sm font-bold"><ShieldPlus className="w-5 h-5"/> Full HP Recovered</div>
                <div className="flex items-center gap-3 text-indigo-400 text-sm font-bold"><Activity className="w-5 h-5"/> {recoverAmount} Hit Dice Recovered</div>
                <div className="flex items-center gap-3 text-fuchsia-400 text-sm font-bold"><Flame className="w-5 h-5"/> Spell Slots Replenished</div>
                {(char.resources || []).length > 0 && <div className="flex items-center gap-3 text-amber-400 text-sm font-bold"><CheckCircle2 className="w-5 h-5"/> Custom Resources Reset</div>}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 text-center">
              <Stars className="w-16 h-16 text-blue-400/50 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-black text-white mb-2">Sleep or Trance?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                This will simulate 8 hours of rest. You will fully recover your <strong className="text-emerald-400">HP</strong>, regain half your <strong className="text-emerald-400">Hit Dice</strong>, and restore all <strong className="text-fuchsia-400">Spell Slots</strong> and <strong className="text-amber-400">Resources</strong>.
              </p>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-600 transition-colors">
                  Keep Watch
                </button>
                <button onClick={handleConfirmRest} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all">
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