import { useState } from 'react';
import { doc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Skull, Maximize, Star, Heart, Shield, Tent, Moon, ArrowUpCircle } from 'lucide-react';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export default function CharacterHeader({ char, charId, isDM, activeTheme, onOpenImage, onOpenShortRest, onOpenLongRest, onOpenLevelUp }) {
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [displayMaxHp, setDisplayMaxHp] = useState("");
  const [isEditingMaxHp, setIsEditingMaxHp] = useState(false);
  const [displayTempHp, setDisplayTempHp] = useState("");
  const [isEditingTempHp, setIsEditingTempHp] = useState(false);
  const [displayXp, setDisplayXp] = useState(""); 
  const [isEditingXp, setIsEditingXp] = useState(false);

  const updateField = async (field, value) => {
    await updateDoc(doc(db, 'characters', charId), { [field]: value });
  };

  const updateDeathSaves = async (type, value) => { 
    await updateField(`deathSaves.${type}`, value); 
  };

  const toggleInspiration = async (e) => { 
    if (e) e.stopPropagation();
    if (!isDM) return; 
    await updateField('inspiration', !char.inspiration); 
  };

  const adjustXp = async (amount) => {
    const charRef = doc(db, 'characters', charId);
    try {
      const currentXp = char.exp || 0;
      await updateDoc(charRef, { exp: Math.max(0, currentXp + amount) });
    } catch (err) {
      console.error("XP Update Failed:", err);
    }
  };

  const submitHpUpdate = async (newHpVal, newTempVal = null) => {
    const boundedHp = Math.max(0, Math.min(parseInt(newHpVal, 10) || 0, char.maxHp || 10));
    let updates = { hp: boundedHp };
    if (newTempVal !== null) updates.tempHp = Math.max(0, parseInt(newTempVal, 10) || 0);

    if (boundedHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    
    try {
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');
      
      updateDoc(charRef, updates).catch(console.error);

      getDoc(mapRef).then(mapDoc => {
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
           let mapUpdates = { [`tokens.${charId}.hp`]: boundedHp };
           if (newTempVal !== null) mapUpdates[`tokens.${charId}.tempHp`] = updates.tempHp;
           updateDoc(mapRef, mapUpdates).catch(console.error);
        }
      });
    } catch (err) {
       console.log("Could not sync HP.", err);
    }
  };

  const adjustHp = async (amount) => {
    if (amount < 0 && char.isConcentrating) {
      const damageTaken = Math.abs(amount);
      const dc = Math.max(10, Math.floor(damageTaken / 2));
      alert(`⚠️ CONCENTRATION CHECK!\nYou took ${damageTaken} damage. Roll a Constitution Saving Throw (DC ${dc}) to maintain your spell!`);
    }

    let currentHp = char.hp || 0;
    let currentTemp = char.tempHp || 0;
    const maxHp = char.maxHp || 10;

    if (amount < 0) {
      const damage = Math.abs(amount);
      if (currentTemp >= damage) {
        currentTemp -= damage; 
      } else {
        const rolloverDamage = damage - currentTemp;
        currentTemp = 0;
        currentHp = Math.max(0, currentHp - rolloverDamage);
      }
    } else { 
      currentHp = Math.min(maxHp, currentHp + amount);
    }

    let updates = { hp: currentHp, tempHp: currentTemp };
    if (currentHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    
    try {
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');
      
      updateDoc(charRef, updates).catch(console.error);

      getDoc(mapRef).then(mapDoc => {
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
           updateDoc(mapRef, { 
             [`tokens.${charId}.hp`]: currentHp,
             [`tokens.${charId}.tempHp`]: currentTemp
           }).catch(console.error);
        }
      });
    } catch (err) {
      console.error("HP Update Failed:", err);
    }
  };

  const handleSpendHitDie = async () => {
    const currentHD = char.hitDice?.current ?? char.level;
    const maxHD = char.hitDice?.max ?? char.level;
    
    if (currentHD > 0) {
      const amount = window.prompt(`Spending 1 Hit Die (${currentHD}/${maxHD} remaining).\nHow much HP did you heal?`);
      const healAmt = parseInt(amount, 10);
      if (!isNaN(healAmt) && healAmt > 0) {
        await adjustHp(healAmt);
        await updateField('hitDice', { current: currentHD - 1, max: maxHD });
      }
    } else {
      alert("You have no Hit Dice remaining! Take a Long Rest to recover them.");
    }
  };

  const activeConditions = char.conditions || [];
  const isUnconscious = (char.hp || 0) <= 0;
  const isPoisoned = activeConditions.includes('Poisoned');
  const isFrightened = activeConditions.includes('Frightened');

  const hpPercent = Math.max(0, Math.min(100, ((char.hp || 0) / (char.maxHp || 1)) * 100));
  const tempHpPercent = Math.max(0, Math.min(100, ((char.tempHp || 0) / (char.maxHp || 1)) * 100));
  const hpColor = isPoisoned ? 'bg-lime-500/40' : hpPercent > 50 ? 'bg-emerald-500/20' : hpPercent > 20 ? 'bg-yellow-500/20' : 'bg-red-500/30';

  const currentXp = char.exp || 0;
  const nextLevelXp = XP_THRESHOLDS[char.level] || 355000;
  const prevLevelXp = XP_THRESHOLDS[char.level - 1] || 0;
  const xpPercent = Math.max(0, Math.min(100, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
  const canLevelUp = currentXp >= nextLevelXp;

  return (
    <div className={`bg-slate-900 border ${isUnconscious ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-slate-700 shadow-xl'} rounded-2xl mb-6 relative flex flex-col overflow-hidden`}>
      
      <div className="w-full h-32 md:h-48 relative group shrink-0 overflow-hidden block">
        <div className={`w-full h-full relative ${char.isConcentrating ? `ring-[4px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[4px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
          <img 
            src={`/${charId}.png`} 
            alt={char.name} 
            className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} 
            onError={(e) => { 
              e.currentTarget.onerror = null; 
              e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image'; 
            }} 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none z-10"></div>
        
        <button onClick={(e) => { e.stopPropagation(); onOpenImage(); }} className="absolute top-3 right-3 p-1.5 bg-slate-900/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"><Maximize className="w-4 h-4 text-white" /></button>
        
        {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-12 h-12 text-white drop-shadow-md animate-pulse" /></div>}
        
        <div className="absolute bottom-3 left-4 md:left-6 text-left pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className={`text-2xl md:text-3xl font-black leading-tight drop-shadow-lg text-balance ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h2>
            <div className="flex items-center pointer-events-auto">
              <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-110' : 'pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-5 h-5 md:w-6 md:h-6 fill-current pointer-events-none" /></button>
            </div>
          </div>
          <p className={`${activeTheme.text} font-bold text-xs md:text-sm drop-shadow-md`}>Lvl {char.level} {char.species} {char.class.split(' ')[0]}</p>
        </div>
      </div>

      <div className="p-3 md:p-4 bg-slate-800 space-y-3">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-2">
            <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500 z-0`} style={{ width: `${hpPercent}%` }}></div>
            
            {(char.tempHp > 0) && (
              <div 
                className="absolute left-0 bottom-0 h-1.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-500 z-10" 
                style={{ width: `${Math.min(100, tempHpPercent)}%` }}
              ></div>
            )}

            {isUnconscious ? (
              <div className="relative z-20 flex items-center justify-center gap-4 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">PASS</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-4 h-4 rounded-full border-2 transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-slate-600'}`} />)}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 mb-0.5">FAIL</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-4 h-4 rounded-full border-2 transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-400' : 'bg-slate-800 border-slate-600'}`} />)}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative z-20 flex items-center gap-2 pl-2">
                  <Heart className={`w-4 h-4 ${isPoisoned ? 'text-lime-400' : 'text-emerald-400'}`} />
                  <div className="flex items-center gap-1 bg-blue-900/40 border border-blue-500/40 px-1.5 py-0.5 rounded ml-1 shadow-sm">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <input type="number" value={isEditingTempHp ? displayTempHp : (char.tempHp || 0)} onFocus={(e) => { setDisplayTempHp(char.tempHp || 0); setIsEditingTempHp(true); e.target.select(); }} onChange={(e) => setDisplayTempHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingTempHp(false); submitHpUpdate(char.hp, e.target.value); }} className="w-6 bg-transparent focus:outline-none text-center font-black text-blue-100 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                </div>

                <div className="relative z-20 flex items-center gap-1 pr-1">
                  <button onClick={() => adjustHp(-1)} className="w-8 h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-lg flex items-center justify-center border border-slate-600 cursor-pointer">-</button>
                  <div className="flex items-center gap-1 text-white bg-slate-800/50 border border-slate-600 rounded px-2 py-1">
                    <input type="number" value={isEditingHp ? displayHp : (char.hp ?? 0)} onFocus={(e) => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); e.target.select(); }} onChange={(e) => setDisplayHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingHp(false); submitHpUpdate(e.target.value, char.tempHp); }} className={`w-8 bg-transparent focus:outline-none text-center font-black text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingHp ? activeTheme.text : ''}`} />
                    <span className="text-slate-500 font-black text-sm">/</span>
                    <input type="number" value={isEditingMaxHp ? displayMaxHp : (char.maxHp || 10)} onFocus={(e) => { setDisplayMaxHp(char.maxHp || 10); setIsEditingMaxHp(true); e.target.select(); }} onChange={(e) => setDisplayMaxHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingMaxHp(false); const parsedMax = parseInt(e.target.value, 10); updateField('maxHp', isNaN(parsedMax) ? (char.maxHp || 10) : parsedMax); }} className={`w-8 bg-transparent focus:outline-none text-center text-slate-400 text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingMaxHp ? activeTheme.text : ''}`} />
                  </div>
                  <button onClick={() => adjustHp(1)} className="w-8 h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-lg flex items-center justify-center border border-slate-600 cursor-pointer">+</button>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 h-full">
            <button onClick={handleSpendHitDie} className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center flex-col shadow-inner px-2 py-1 transition-colors cursor-pointer group">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-slate-300 transition-colors">Hit Dice</span>
              <span className="text-sm font-black text-emerald-400">{char.hitDice?.current ?? char.level}/{char.hitDice?.max ?? char.level}</span>
            </button>

            <button onClick={onOpenShortRest} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex flex-col items-center justify-center transition-colors shadow-sm py-1">
              <Tent className="w-4 h-4 text-emerald-400 mb-0.5" />
              <span className="text-[10px] font-bold uppercase">Short Rest</span>
            </button>
            <button onClick={onOpenLongRest} className={`flex-1 bg-slate-900 hover:bg-slate-800 ${activeTheme.text} rounded-xl border ${activeTheme.border} flex flex-col items-center justify-center transition-colors shadow-sm py-1`}>
              <Moon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold uppercase">Long Rest</span>
            </button>
          </div>

        </div>

        <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-2">
          <div className={`absolute left-0 top-0 bottom-0 ${canLevelUp ? 'bg-amber-500/30' : 'bg-blue-500/20'} transition-all duration-500`} style={{ width: `${xpPercent}%` }}></div>
          <div className="relative z-10 flex items-center gap-2 pl-2">
            {canLevelUp && !isDM ? (
               <button 
                 onClick={onOpenLevelUp} 
                 className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"
               >
                 <ArrowUpCircle className="w-3.5 h-3.5" /> Level Up
               </button>
            ) : (
               <>
                 <ArrowUpCircle className={`w-4 h-4 ${canLevelUp ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
                 <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Experience</span>
               </>
            )}
          </div>
          <div className="relative z-10 flex items-center gap-1 pr-1">
            <button onClick={() => adjustXp(-50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
            <div className="flex items-center gap-1 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-0.5 md:py-1">
              
              <input 
                type="number" 
                value={isEditingXp ? displayXp : currentXp} 
                onFocus={(e) => { setDisplayXp(currentXp); setIsEditingXp(true); e.target.select(); }}
                onChange={(e) => setDisplayXp(e.target.value)} 
                onBlur={() => { setIsEditingXp(false); updateField('exp', Number(displayXp)); }}
                onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                className="w-12 md:w-16 bg-transparent focus:outline-none text-right font-black text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-100" 
              />
              
              <span className="text-slate-500 font-black text-sm md:text-base">/</span>
              <span className="w-12 md:w-16 text-left text-slate-400 text-sm md:text-base font-bold">{nextLevelXp}</span>
            </div>
            <button onClick={() => adjustXp(50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
          </div>
        </div>

      </div>
    </div>
  );
}