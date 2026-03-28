import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swords, X, Crosshair, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { getModifier, getProficiencyBonus } from '../services/arklaEngine';

export default function WeaponEquipModal({ char, charId, weaponData, onComplete, onCancel }) {
  const [isEquipping, setIsEquipping] = useState(false);
  const [isProficient, setIsProficient] = useState(true);

  const classesArray = char.classes || [{ name: char.class || 'Adventurer', level: char.level || 1 }];

  // Parse weapon properties from the 5e API for the Preview Math
  const properties = weaponData.properties?.map(p => p.name.toLowerCase()) || [];
  const weaponName = (weaponData.name || '').toLowerCase();
  
  const isFinesse = properties.includes('finesse');
  const isRanged = weaponData.weapon_range === 'Ranged' || properties.includes('thrown');
  const isHeavy = properties.includes('heavy');
  const isTwoHanded = properties.includes('two-handed');
  
  const strMod = getModifier(char.stats?.STR || 10);
  const dexMod = getModifier(char.stats?.DEX || 10);
  
  // Smart Monk Detection for the Preview Math
  const isMonk = classesArray.some(c => c.name.toLowerCase().includes('monk') && c.level >= 1);
  const isMonkWeapon = isMonk && !isHeavy && !isTwoHanded && (weaponData.weapon_category === 'Simple' || weaponName.includes('shortsword') || weaponName.includes('unarmed') || weaponName.includes('quarterstaff'));

  // Auto-determine the optimal stat
  const useDex = isRanged || ((isFinesse || isMonkWeapon) && dexMod > strMod);
  const activeMod = useDex ? dexMod : strMod;
  const statName = useDex ? 'DEX' : 'STR';

  const totalLevel = classesArray.reduce((sum, c) => sum + c.level, 0);
  const pb = getProficiencyBonus(totalLevel);
  const totalToHit = activeMod + (isProficient ? pb : 0);
  const formattedToHit = totalToHit >= 0 ? `+${totalToHit}` : `${totalToHit}`;

  const baseDice = weaponData.damage?.damage_dice || '1d4';
  const dmgType = weaponData.damage?.damage_type?.name || 'Bludgeoning';
  const formattedDamage = `${baseDice} ${activeMod >= 0 ? '+' : '-'} ${Math.abs(activeMod)}`;

  const handleEquip = async () => {
    setIsEquipping(true);
    
    // Arkla Engine Logic: Save the RAW values. The engine will dynamically scale this on render.
    const newAttack = {
      name: weaponData.name,
      hit: '--', 
      damage: baseDice, 
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
                {isMonkWeapon && <span className="inline-block mt-2 bg-emerald-900/40 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/50">Monk Martial Arts Applicable</span>}
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
                
                <div className="text-[10px] text-slate-500 text-center pt-2 leading-relaxed">
                  *Preview calculated using your <strong className="text-slate-300">{statName}</strong> modifier. The engine will scale this dynamically as you level up.
                </div>
                
                <div className="bg-indigo-950/30 border border-indigo-900/50 p-2.5 rounded-lg flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                    <strong className="text-indigo-300">Homebrew / Hexblade Tip:</strong> Need this to scale off INT or CHA? Once equipped, edit the attack in your Combat Tab and add <code>Use: CHA</code> to the weapon's notes!
                  </p>
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