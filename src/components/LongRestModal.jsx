import { useState } from 'react';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Moon, Bed, CheckCircle2, X, Activity, Flame, ShieldPlus, Stars, Sparkles } from 'lucide-react';

export default function LongRestModal({ char, charId, onClose }) {
  const [isResting, setIsResting] = useState(false);

  const maxHD = char.hitDice?.max || char.level || 1;
  const currentHD = char.hitDice?.current || 0;
  // 5e Rule: Regain up to half total hit dice (minimum 1)
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
      
      // WIPE TEMPORARY BUFFS: 8 hours clears all standard combat buffs
      updates.tempBuffs = [];

      if (char.spellSlots) {
        const resetSlots = { ...char.spellSlots };
        Object.keys(resetSlots).forEach(level => {
          resetSlots[level].current = resetSlots[level].max;
        });
        updates.spellSlots = resetSlots;
      }

      if (char.resources && char.resources.length > 0) {
        const resetResources = char.resources.map(res => {
          if (res.recharge === 'long' || res.recharge === 'short' || !res.recharge) {
            return { ...res, current: res.max };
          }
          return res;
        });
        updates.resources = resetResources;
      }

      if (char.conditions && char.conditions.length > 0) {
        // 5e Rule: Sleeping does NOT cure Poison, Blindness, Deafness, or Charms.
        // We only clear short-term tactical/combat conditions.
        const tacticalConditions = [
          'Frightened', 'Incapacitated', 'Invisible', 'Paralyzed', 
          'Prone', 'Restrained', 'Stunned', 'Unconscious'
        ];
        updates.conditions = char.conditions.filter(c => !tacticalConditions.includes(c));
      } else {
        updates.conditions = [];
      }

      batch.update(charRef, updates);

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>

      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-sm shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Solid Color Header */}
        <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-blue-600 relative z-10">
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest">
            <Moon className="w-5 h-5" /> Make Camp
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-950 bg-blue-500 hover:bg-blue-400 transition-colors p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-4 h-4 font-black" />
            </button>
          )}
        </div>

        <div className="p-6 relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Restored!</h3>
              
              <div className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl p-5 text-left space-y-4 shadow-inner">
                <div className="flex items-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-wider"><ShieldPlus className="w-5 h-5"/> Full HP Recovered</div>
                <div className="flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-wider"><Activity className="w-5 h-5"/> {recoverAmount} Hit Dice Recovered</div>
                <div className="flex items-center gap-3 text-fuchsia-400 text-xs font-black uppercase tracking-wider"><Flame className="w-5 h-5"/> Spell Slots Replenished</div>
                <div className="flex items-center gap-3 text-sky-400 text-xs font-black uppercase tracking-wider"><Sparkles className="w-5 h-5"/> Temp Buffs Cleared</div>
                {(char.resources || []).length > 0 && <div className="flex items-center gap-3 text-amber-500 text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-5 h-5"/> Resources Reset</div>}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 text-center">
              <Stars className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Sleep or Trance?</h3>
              <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900 shadow-inner mb-6">
                <p className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-wider leading-relaxed">
                  This simulates 8 hours of rest. You will recover your <strong className="text-emerald-500">HP</strong>, regain half your <strong className="text-indigo-400">Hit Dice</strong>, and restore all <strong className="text-fuchsia-500">Spells</strong> and <strong className="text-amber-500">Resources</strong>. Temporary buffs and combat conditions will fade.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onClose} className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[10px] md:text-xs py-4 rounded-xl border-2 border-slate-950 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]">
                  Keep Watch
                </button>
                <button onClick={handleConfirmRest} className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black uppercase tracking-widest text-[10px] md:text-xs py-4 rounded-xl border-2 border-slate-950 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]">
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