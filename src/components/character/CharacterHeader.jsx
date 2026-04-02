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
    <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl mb-4 relative flex flex-col overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
      
      {/* Cinematic Portrait Area */}
      <div className="w-full h-32 md:h-40 relative group shrink-0 overflow-hidden block bg-slate-950">
        <div className={`w-full h-full relative ${char.isConcentrating ? `ring-[4px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[4px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
          <img 
            src={char.imageUrl || `/${charId}.png`} 
            alt={char.name || 'Unknown'} 
            className={`w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} 
            onError={(e) => { 
               e.currentTarget.onerror = null; 
               e.currentTarget.src = '/icon.png'; 
            }} 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10"></div>
        
        <button onClick={(e) => { e.stopPropagation(); onOpenImage(); }} className="absolute top-2 right-2 p-1.5 bg-slate-950/80 border-2 border-slate-700 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer pointer-events-auto shadow-[2px_2px_0px_rgba(0,0,0,1)]"><Maximize className="w-4 h-4 text-white" /></button>
        
        {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-12 h-12 text-white drop-shadow-md animate-pulse" /></div>}
        
        {/* Name & Class Lockup */}
        <div className="absolute bottom-2 left-3 right-3 text-left pointer-events-none z-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isEditMode ? (
                <input 
                  type="text" 
                  defaultValue={char.name || ''} 
                  onBlur={(e) => updateField('name', e.target.value)}
                  className={`text-2xl font-black leading-none bg-slate-900/80 border-2 border-amber-500 rounded px-2 py-0.5 focus:outline-none w-48 pointer-events-auto shadow-[2px_2px_0px_rgba(0,0,0,1)] ${isUnconscious ? 'text-red-400' : 'text-white'}`}
                />
              ) : (
                <h2 className={`text-2xl font-black leading-none uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-balance ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name || 'Unknown'}</h2>
              )}
              <div className="flex items-center pointer-events-auto">
                <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-110' : 'pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-5 h-5 fill-current pointer-events-none" /></button>
              </div>
            </div>
            {isEditMode ? (
              <div className="flex gap-1.5 mt-1.5 pointer-events-auto">
                  <input type="number" defaultValue={char.level || 1} onBlur={e => updateField('level', Number(e.target.value))} className={`w-10 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
                  <input type="text" defaultValue={char.species || char.race || ''} onBlur={e => updateField('species', e.target.value)} className={`w-20 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
                  <input type="text" defaultValue={char.class || ''} onBlur={e => updateField('class', e.target.value)} className={`w-24 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
              </div>
            ) : (
              <p className={`${activeTheme.text} font-black text-[10px] uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>LVL {char.level || 1} {char.species || char.race || ''} {(char.class || '').split(' ')[0]}</p>
            )}
          </div>

          {/* Graphic Novel Badges (Moved to bottom right of portrait) */}
          <div className="flex gap-2 pointer-events-auto translate-y-6">
            <div className={`w-10 h-11 rounded-t-xl rounded-b-md border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden ${acBuffTotal > 0 ? 'bg-emerald-500' : acBuffTotal < 0 ? 'bg-red-500' : 'bg-slate-800'}`}>
              <Shield className="w-3 h-3 text-white/30 absolute top-1" />
              {isEditMode ? (
                <input type="number" defaultValue={char.ac || 10} onBlur={(e) => updateField('ac', Number(e.target.value))} className="w-8 mt-2 bg-transparent text-center text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none z-10" />
              ) : (
                <span className="text-sm font-black text-white mt-1.5">{displayAc}</span>
              )}
              <span className="text-[7px] font-black uppercase text-slate-950 absolute bottom-0.5">AC</span>
            </div>
            
            <div className="w-10 h-11 rounded-t-xl rounded-b-md bg-slate-800 border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <Wind className="w-3 h-3 text-white/30 absolute top-1" />
              {isEditMode ? (
                <input type="number" defaultValue={char.speed || 30} onBlur={(e) => updateField('speed', Number(e.target.value))} className="w-8 mt-2 bg-transparent text-center text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none z-10" />
              ) : (
                <span className="text-sm font-black text-white mt-1.5">{displaySpeed}</span>
              )}
              <span className="text-[7px] font-black uppercase text-slate-950 absolute bottom-0.5">SPD</span>
            </div>

            <div className="w-10 h-11 rounded-t-xl rounded-b-md bg-slate-800 border-[3px] border-slate-950 flex flex-col items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <Zap className="w-3 h-3 text-white/30 absolute top-1" />
              {isEditMode ? (
                <input type="text" defaultValue={char.initiative !== '--' ? char.initiative : ''} placeholder="Auto" onBlur={(e) => updateField('initiative', e.target.value || '--')} className="w-8 mt-2 bg-transparent text-center text-xs font-black text-white focus:outline-none z-10" />
              ) : (
                <span className="text-sm font-black text-white mt-1.5">{initScore}</span>
              )}
              <span className="text-[7px] font-black uppercase text-slate-950 absolute bottom-0.5">INIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Control Panel */}
      <div className="p-3 bg-slate-800 space-y-3 pt-6">
        
        {/* Giant Graphic HP Bar */}
        <div className="relative bg-slate-950 border-[3px] border-slate-900 rounded-xl overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-between p-2 h-14">
          <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500 z-0`} style={{ width: `${hpPercent}%` }}></div>
          
          {(char.tempHp > 0) && (
            <div 
              className="absolute left-0 bottom-0 h-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-500 z-10" 
              style={{ width: `${Math.min(100, tempHpPercent)}%` }}
            ></div>
          )}

          {isUnconscious ? (
            <div className="relative z-20 flex items-center justify-between px-4 w-full">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-950 bg-emerald-500 px-2 py-0.5 rounded-sm uppercase tracking-widest mb-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">PASS</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-5 h-5 rounded-full border-[3px] transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-950 shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 border-slate-900'}`} />)}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-950 bg-red-500 px-2 py-0.5 rounded-sm uppercase tracking-widest mb-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">FAIL</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-5 h-5 rounded-full border-[3px] transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-950 shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 border-slate-900'}`} />)}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative z-20 flex flex-col justify-center pl-1">
                <div className="flex items-center gap-1.5 bg-blue-950/80 border-2 border-blue-900 px-2 py-0.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <input type="number" value={isEditingTempHp ? displayTempHp : (char.tempHp || 0)} onFocus={(e) => { setDisplayTempHp(char.tempHp || 0); setIsEditingTempHp(true); e.target.select(); }} onChange={(e) => setDisplayTempHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingTempHp(false); submitHpUpdate(char.hp, e.target.value); }} className="w-6 bg-transparent focus:outline-none text-center font-black text-blue-100 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <div className="relative z-20 flex items-center gap-2 pr-1">
                <button onClick={() => adjustHp(-1)} className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-slate-900 hover:bg-slate-900 text-white font-black text-xl flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]">-</button>
                <div className="flex items-center gap-1 text-white bg-slate-950/80 border-2 border-slate-900 rounded-lg px-2 h-10 shadow-[2px_2px_0px_rgba(0,0,0,1)] backdrop-blur-sm">
                  <Heart className={`w-4 h-4 hidden sm:block ${isPoisoned ? 'text-lime-400' : 'text-emerald-400'}`} />
                  <input type="number" value={isEditingHp ? displayHp : (char.hp ?? 0)} onFocus={(e) => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); e.target.select(); }} onChange={(e) => setDisplayHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingHp(false); submitHpUpdate(e.target.value, char.tempHp); }} className={`w-10 bg-transparent focus:outline-none text-right font-black text-xl md:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingHp ? activeTheme.text : ''}`} />
                  <span className="text-slate-500 font-black text-lg">/</span>
                  <input type="number" value={isEditingMaxHp ? displayMaxHp : (char.maxHp || 10)} onFocus={(e) => { setDisplayMaxHp(char.maxHp || 10); setIsEditingMaxHp(true); e.target.select(); }} onChange={(e) => setDisplayMaxHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingMaxHp(false); const parsedMax = parseInt(e.target.value, 10); updateField('maxHp', isNaN(parsedMax) ? (char.maxHp || 10) : parsedMax); }} className={`w-8 bg-transparent focus:outline-none text-left text-slate-400 text-sm font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingMaxHp ? activeTheme.text : ''}`} />
                </div>
                <button onClick={() => adjustHp(1)} className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-slate-900 hover:bg-slate-900 text-white font-black text-xl flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]">+</button>
              </div>
            </>
          )}
        </div>

        {/* Action Row */}
        <div className="flex gap-2">
          <button onClick={handleSpendHitDie} className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-lg flex items-center justify-center flex-col px-2 py-1.5 transition-colors cursor-pointer group shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-slate-300">Hit Dice</span>
            <span className="text-sm font-black text-emerald-400">{char.hitDice?.current ?? (char.level || 1)}/{char.hitDice?.max ?? (char.level || 1)}</span>
          </button>

          <button onClick={onOpenShortRest} className="flex-1 bg-slate-950 text-slate-300 rounded-lg border-2 border-slate-900 flex flex-col items-center justify-center transition-colors py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] hover:bg-slate-900">
            <Tent className="w-4 h-4 text-emerald-400 mb-0.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Short</span>
          </button>
          
          <button onClick={onOpenLongRest} className={`flex-1 bg-slate-950 ${activeTheme.text} rounded-lg border-2 border-slate-900 flex flex-col items-center justify-center transition-colors py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] hover:bg-slate-900`}>
            <Moon className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Long</span>
          </button>
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