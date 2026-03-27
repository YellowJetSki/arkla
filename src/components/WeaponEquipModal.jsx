import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, X, Crosshair, Sparkles, CheckCircle2 } from 'lucide-react';
import { getModifier, getProficiencyBonus } from '../services/arklaEngine';

export default function WeaponEquipModal({ char, charId, weaponData, onComplete, onCancel }) {
  const [isEquipping, setIsEquipping] = useState(false);
  const [isProficient, setIsProficient] = useState(true);

  // Parse weapon properties from the 5e API
  const isFinesse = weaponData.properties?.some(p => p.name === 'Finesse') || false;
  const isRanged = weaponData.weapon_range === 'Ranged';
  
  const strMod = getModifier(char.stats?.STR || 10);
  const dexMod = getModifier(char.stats?.DEX || 10);
  
  // Auto-determine the optimal stat
  const useDex = isRanged || (isFinesse && dexMod > strMod);
  const activeMod = useDex ? dexMod : strMod;
  const statName = useDex ? 'DEX' : 'STR';

  const pb = getProficiencyBonus(char.level || 1);
  const totalToHit = activeMod + (isProficient ? pb : 0);
  const formattedToHit = totalToHit >= 0 ? `+${totalToHit}` : `${totalToHit}`;

  const baseDice = weaponData.damage?.damage_dice || '1d4';
  const dmgType = weaponData.damage?.damage_type?.name || 'Bludgeoning';
  const formattedDamage = `${baseDice} ${activeMod >= 0 ? '+' : '-'} ${Math.abs(activeMod)}`;

  const handleEquip = async () => {
    setIsEquipping(true);
    
    const newAttack = {
      name: weaponData.name,
      hit: formattedToHit,
      damage: formattedDamage,
      type: dmgType,
      notes: weaponData.properties?.map(p => p.name).join(', ') || ''
    };

    try {
      await updateDoc(doc(db, 'characters', charId), {
        attacks: arrayUnion(newAttack)
      });
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      console.error("Failed to equip weapon:", err);
      setIsEquipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <h2 className="text-lg font-black text-emerald-400 flex items-center gap-2">
            <Swords className="w-5 h-5" /> Equip Weapon
          </h2>
          {!isEquipping && (
            <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {isEquipping ? (
            <div className="flex flex-col items-center justify-center py-6 animate-in fade-in">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-xl font-black text-white">Weapon Equipped!</h3>
              <p className="text-sm text-slate-400 mt-2">Added to your Combat Tab.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white mb-1">{weaponData.name}</h3>
                <p className="text-sm text-slate-400">{weaponData.weapon_category} Weapon</p>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proficient?</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isProficient} 
                      onChange={(e) => setIsProficient(e.target.checked)} 
                      className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                    />
                    <span className="text-sm text-white font-bold">Yes (+{pb})</span>
                  </label>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Crosshair className="w-3 h-3"/> To Hit</span>
                  <span className="text-xl font-black text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-900/50">{formattedToHit}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Damage</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-white block">{formattedDamage}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{dmgType}</span>
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-500 text-center pt-2">
                  *Calculated using your <strong className="text-slate-300">{statName}</strong> modifier.
                </div>
              </div>

              <button 
                onClick={handleEquip}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" /> Pin to Combat Tab
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}