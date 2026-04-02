import { useState } from 'react';
import { Skull, Maximize, Star, Heart, Shield, Tent, Moon, Wind, Zap } from 'lucide-react';
import useCharacterVitals from '../../hooks/useCharacterVitals';
import XPBar from '../shared/XPBar';
import { getModifier, getConditionMechanics } from '../../services/arklaEngine';

export default function CharacterHeader({ char, charId, isDM, isEditMode, activeTheme, onOpenImage, onOpenShortRest, onOpenLongRest, onOpenLevelUp }) {
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [displayMaxHp, setDisplayMaxHp] = useState("");
  const [isEditingMaxHp, setIsEditingMaxHp] = useState(false);
  const [displayTempHp, setDisplayTempHp] = useState("");
  const [isEditingTempHp, setIsEditingTempHp] = useState(false);
  const [displayXp, setDisplayXp] = useState(""); 
  const [isEditingXp, setIsEditingXp] = useState(false);

  const {
    updateField,
    updateDeathSaves,
    toggleInspiration,
    adjustXp,
    submitHpUpdate,
    adjustHp,
    handleSpendHitDie,
    isUnconscious,
    isPoisoned,
    isFrightened,
    hpPercent,
    tempHpPercent,
    hpColor,
    currentXp,
    nextLevelXp,
    xpPercent,
    canLevelUp
  } = useCharacterVitals(char, charId, isDM);

  const activeConditions = char.conditions || [];
  const mechanics = getConditionMechanics(activeConditions);
  
  const tempBuffs = char.tempBuffs || [];
  const acBuffTotal = tempBuffs.filter(b => b.target === 'AC').reduce((sum, b) => sum + b.value, 0);
  const displayAc = (char.ac || 10) + acBuffTotal;

  let displaySpeed = mechanics.speedOverride !== null ? mechanics.speedOverride : Math.floor((char.speed || 30) * mechanics.speedMultiplier);
  const isEncumbered = (char.inventory || '').length > 500 && char.stats?.STR < 15;
  if (isEncumbered && displaySpeed > 20 && mechanics.speedOverride === null) displaySpeed -= 10;
  
  const initScore = char.initiative !== '--' ? char.initiative : (getModifier(char.stats?.DEX || 10) >= 0 ? `+${getModifier(char.stats?.DEX || 10)}` : getModifier(char.stats?.DEX || 10));

  return (
    <div className={`bg-slate-900 border ${isUnconscious ? 'border-red-900 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-slate-700 shadow-xl'} rounded-2xl mb-6 relative flex flex-col overflow-hidden`}>
      
      <div className="w-full h-32 md:h-48 relative group shrink-0 overflow-hidden block">
        <div className={`w-full h-full relative ${char.isConcentrating ? `ring-[4px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[4px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
          <img 
            src={`/${charId}.png`} 
            alt={char.name} 
            className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} 
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x400?text=No+Image'; }} 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none z-10"></div>
        
        <button onClick={(e) => { e.stopPropagation(); onOpenImage(); }} className="absolute bottom-3 right-4 p-1.5 bg-slate-900/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer pointer-events-auto"><Maximize className="w-4 h-4 text-white" /></button>
        
        {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-12 h-12 text-white drop-shadow-md animate-pulse" /></div>}
        
        {/* Core Stat Portrait Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-30 pointer-events-auto">
          {/* AC Badge */}
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-colors ${acBuffTotal > 0 ? 'bg-emerald-500' : acBuffTotal < 0 ? 'bg-red-500' : 'bg-slate-800'}`}>
            <Shield className="w-3 h-3 md:w-4 md:h-4 text-white/70 absolute top-1.5" />
            {isEditMode ? (
              <input 
                type="number" 
                defaultValue={char.ac || 10} 
                onBlur={(e) => updateField('ac', Number(e.target.value))}
                className="w-8 mt-2 bg-transparent text-center text-sm md:text-base font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none z-10 relative"
              />
            ) : (
              <span className="text-sm md:text-base font-black text-white mt-2 leading-none">{displayAc}</span>
            )}
          </div>
          {/* Speed Badge */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
            <Wind className="w-3 h-3 md:w-4 md:h-4 text-sky-400 absolute top-1.5" />
            {isEditMode ? (
              <input 
                type="number" 
                defaultValue={char.speed || 30} 
                onBlur={(e) => updateField('speed', Number(e.target.value))}
                className="w-8 mt-2 bg-transparent text-center text-sm md:text-base font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none z-10 relative"
              />
            ) : (
              <span className="text-sm md:text-base font-black text-white mt-2 leading-none">{displaySpeed}</span>
            )}
          </div>
          {/* Initiative Badge */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
            <Zap className="w-3 h-3 md:w-4 md:h-4 text-fuchsia-400 absolute top-1.5" />
            {isEditMode ? (
              <input 
                type="text" 
                defaultValue={char.initiative !== '--' ? char.initiative : ''} 
                placeholder="Auto"
                onBlur={(e) => updateField('initiative', e.target.value || '--')}
                className="w-8 mt-2 bg-transparent text-center text-[10px] md:text-xs font-black text-white focus:outline-none z-10 relative"
              />
            ) : (
              <span className="text-sm md:text-base font-black text-white mt-2 leading-none">{initScore}</span>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-4 md:left-6 text-left pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-0.5">
            {isEditMode ? (
              <input 
                type="text" 
                defaultValue={char.name} 
                onBlur={(e) => updateField('name', e.target.value)}
                className={`text-2xl md:text-3xl font-black leading-tight bg-slate-900/80 border border-amber-500 rounded px-2 py-0.5 focus:outline-none w-48 pointer-events-auto shadow-xl ${isUnconscious ? 'text-red-400' : 'text-white'}`}
              />
            ) : (
              <h2 className={`text-2xl md:text-3xl font-black leading-tight drop-shadow-lg text-balance ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h2>
            )}
            <div className="flex items-center pointer-events-auto">
              <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-110' : 'pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-5 h-5 md:w-6 md:h-6 fill-current pointer-events-none" /></button>
            </div>
          </div>
          {isEditMode ? (
            <div className="flex gap-2 mt-1.5 pointer-events-auto">
                <input type="number" defaultValue={char.level} onBlur={e => updateField('level', Number(e.target.value))} className={`w-12 bg-slate-900/80 border border-amber-500 shadow-xl rounded px-1.5 py-0.5 text-xs font-bold ${activeTheme.text} focus:outline-none`} />
                <input type="text" defaultValue={char.species || char.race} onBlur={e => updateField('species', e.target.value)} className={`w-24 bg-slate-900/80 border border-amber-500 shadow-xl rounded px-1.5 py-0.5 text-xs font-bold ${activeTheme.text} focus:outline-none`} />
                <input type="text" defaultValue={char.class} onBlur={e => updateField('class', e.target.value)} className={`w-28 bg-slate-900/80 border border-amber-500 shadow-xl rounded px-1.5 py-0.5 text-xs font-bold ${activeTheme.text} focus:outline-none`} />
            </div>
          ) : (
            <p className={`${activeTheme.text} font-bold text-xs md:text-sm drop-shadow-md`}>Lvl {char.level} {char.species || char.race} {char.class.split(' ')[0]}</p>
          )}
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

        <XPBar 
          currentXp={currentXp}
          nextLevelXp={nextLevelXp}
          xpPercent={xpPercent}
          canLevelUp={canLevelUp}
          isDM={isDM}
          isEditingXp={isEditingXp}
          displayXp={displayXp}
          setDisplayXp={setDisplayXp}
          setIsEditingXp={setIsEditingXp}
          adjustXp={adjustXp}
          updateField={updateField}
          onOpenLevelUp={onOpenLevelUp}
        />

      </div>
    </div>
  );
}