import { useState } from 'react';
import { Skull, Maximize, Star, Heart, Shield, Tent, Moon, Wind, Zap, Check, Brain, Dices } from 'lucide-react';
import useCharacterVitals from '../../hooks/useCharacterVitals';
import XPBar from '../shared/XPBar';
import { getModifier, getConditionMechanics, calculateAC } from '../../services/arklaEngine';
import DialogModal from '../shared/DialogModal';

export default function CharacterHeader({ char, charId, isDM, isEditMode, activeTheme, onOpenImage, onOpenShortRest, onOpenLongRest, onOpenLevelUp }) {
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [displayMaxHp, setDisplayMaxHp] = useState("");
  const [isEditingMaxHp, setIsEditingMaxHp] = useState(false);
  const [displayTempHp, setDisplayTempHp] = useState("");
  const [isEditingTempHp, setIsEditingTempHp] = useState(false);
  const [displayXp, setDisplayXp] = useState(""); 
  const [isEditingXp, setIsEditingXp] = useState(false);

  const [quickInput, setQuickInput] = useState(null); 
  const [quickVal, setQuickVal] = useState('');
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert' });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const triggerAlert = (message, title) => {
    setDialog({ isOpen: true, title: title || 'System Alert', message, type: 'alert' });
  };

  const {
    updateField,
    updateDeathSaves,
    toggleInspiration,
    toggleConcentration,
    adjustXp,
    submitHpUpdate,
    adjustHp,
    spendHitDie,
    rollDeathSave,
    isUnconscious,
    isDead,
    isStable,
    isPoisoned,
    isFrightened,
    hpPercent,
    tempHpPercent,
    hpColor,
    currentXp,
    nextLevelXp,
    xpPercent,
    canLevelUp
  } = useCharacterVitals(char, charId, isDM, triggerAlert);

  const activeConditions = char.conditions || [];
  const mechanics = getConditionMechanics(activeConditions);
  const tempBuffs = char.tempBuffs || [];
  
  // Fully automated Smart AC calculation
  const autoAc = calculateAC(char);
  const acBuffTotal = tempBuffs.filter(b => b.target === 'AC').reduce((sum, b) => sum + b.value, 0);
  const displayAc = autoAc + acBuffTotal;

  const initBuffTotal = tempBuffs.filter(b => b.target === 'Initiative').reduce((sum, b) => sum + b.value, 0);
  let baseInit = char.initiative !== '--' ? parseInt(char.initiative, 10) : getModifier(char.stats?.DEX || 10);
  if (isNaN(baseInit)) baseInit = getModifier(char.stats?.DEX || 10);
  const displayInit = baseInit + initBuffTotal;
  const initScore = displayInit >= 0 ? `+${displayInit}` : `${displayInit}`;

  const speedBuffTotal = tempBuffs.filter(b => b.target === 'Speed').reduce((sum, b) => sum + b.value, 0);
  let baseSpeed = mechanics.speedOverride !== null ? mechanics.speedOverride : Math.floor((char.speed || 30) * mechanics.speedMultiplier);
  const isEncumbered = (char.inventory || '').length > 500 && char.stats?.STR < 15;
  if (isEncumbered && baseSpeed > 20 && mechanics.speedOverride === null) baseSpeed -= 10;
  const displaySpeed = baseSpeed + speedBuffTotal;

  const handleQuickSubmit = () => {
    const amt = parseInt(quickVal, 10);
    if (!isNaN(amt) && amt > 0) {
      if (quickInput === 'hitdie') spendHitDie(amt);
      else adjustHp(amt);
    }
    setQuickInput(null);
    setQuickVal('');
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />
      
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl mb-4 relative flex flex-col shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        
        {/* Cinematic Portrait Area */}
        <div className="w-full h-32 md:h-40 relative group shrink-0 block bg-slate-950 rounded-t-xl z-10">
          
          <div className={`absolute inset-0 overflow-hidden rounded-t-xl ${char.isConcentrating ? `ring-[4px] ring-inset ${activeTheme.ring} animate-pulse z-20` : ''} ${isFrightened ? 'ring-[4px] ring-inset ring-fuchsia-600 animate-pulse z-20' : ''}`}>
            <img 
              src={char.imageUrl || `/${charId}.png`} 
              alt={char.name || 'Unknown'} 
              className={`w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105 ${isUnconscious || isDead ? 'grayscale' : ''}`} 
              onError={(e) => { 
                 e.currentTarget.onerror = null; 
                 e.currentTarget.src = '/icon.png'; 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none z-10"></div>
            {(isUnconscious || isDead) && <div className={`absolute inset-0 flex items-center justify-center ${isDead ? 'bg-red-950/80' : 'bg-red-950/60'} backdrop-blur-[1px] pointer-events-none z-10`}><Skull className={`w-12 h-12 ${isDead ? 'text-red-500 scale-125' : 'text-white'} drop-shadow-md ${!isDead ? 'animate-pulse' : ''}`} /></div>}
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); onOpenImage(); }} className="absolute top-2 right-2 p-1.5 bg-slate-950/80 border-2 border-slate-700 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer pointer-events-auto shadow-[2px_2px_0px_rgba(0,0,0,1)]"><Maximize className="w-4 h-4 text-white" /></button>
          
          {/* Name & Class Lockup */}
          <div className="absolute bottom-2 left-3 right-3 text-left pointer-events-none z-20 flex justify-between items-end">
            <div className="w-2/3">
              <div className="flex items-center gap-2 mb-0.5">
                {isEditMode ? (
                  <input 
                    type="text" 
                    defaultValue={char.name || ''} 
                    onBlur={(e) => updateField('name', e.target.value)}
                    className={`text-2xl font-black leading-none bg-slate-900/80 border-2 border-amber-500 rounded px-2 py-0.5 focus:outline-none w-full max-w-xs pointer-events-auto shadow-[2px_2px_0px_rgba(0,0,0,1)] ${(isUnconscious || isDead) ? 'text-red-400' : 'text-white'}`}
                  />
                ) : (
                  <h2 className={`text-2xl font-black leading-none uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-balance ${(isUnconscious || isDead) ? 'text-red-400' : 'text-white'}`}>{char.name || 'Unknown'}</h2>
                )}
                <div className="flex items-center pointer-events-auto">
                  <button onClick={isDM ? toggleInspiration : undefined} className={`shrink-0 transition-all z-10 flex items-center justify-center ${isDM ? 'cursor-pointer hover:scale-110' : 'pointer-events-none'} ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)] scale-110' : (isDM ? 'text-slate-400 hover:text-yellow-400/50' : 'text-slate-600')}`}><Star className="w-5 h-5 fill-current pointer-events-none" /></button>
                </div>
              </div>
              {isEditMode ? (
                <div className="flex flex-wrap gap-1.5 mt-1.5 pointer-events-auto">
                    <input type="number" defaultValue={char.level || 1} onBlur={e => updateField('level', Number(e.target.value))} className={`w-10 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
                    <input type="text" defaultValue={char.species || char.race || ''} onBlur={e => updateField('species', e.target.value)} className={`w-20 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
                    <input type="text" defaultValue={char.class || ''} onBlur={e => updateField('class', e.target.value)} className={`w-24 bg-slate-900/80 border-2 border-amber-500 shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded px-1.5 py-0.5 text-xs font-black ${activeTheme.text} focus:outline-none`} />
                </div>
              ) : (
                <p className={`${activeTheme.text} font-black text-[10px] uppercase tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] truncate`}>LVL {char.level || 1} {char.species || char.race || ''} {(char.class || '').split(' ')[0]}</p>
              )}
            </div>
          </div>

          {/* Graphic Novel Badges */}
          <div className="absolute -bottom-6 right-3 flex gap-2 pointer-events-auto z-30">
            
            {/* The automated AC badge */}
            <div className={`w-12 h-14 rounded-lg border-[3px] border-slate-950 flex flex-col items-center justify-start shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden pt-1 ${acBuffTotal > 0 ? 'bg-emerald-500' : acBuffTotal < 0 ? 'bg-red-500' : 'bg-slate-800'}`}>
              <Shield className="w-3 h-3 text-white/30 absolute top-1" />
              <div className="flex flex-col items-center mt-1 relative z-10">
                <span className={`font-black text-white leading-none ${acBuffTotal !== 0 ? 'text-xs' : 'text-sm mt-0.5'}`}>{displayAc}</span>
                {acBuffTotal !== 0 && (
                   <span className="text-[7px] font-black text-slate-900 bg-white/70 px-1 rounded-sm mt-0.5 shadow-sm leading-none">
                     {autoAc}{acBuffTotal > 0 ? `+${acBuffTotal}` : acBuffTotal}
                   </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-slate-950 text-center py-0.5">
                 <span className="text-[8px] font-black uppercase text-white tracking-widest block">AC</span>
              </div>
            </div>
            
            <div className={`w-12 h-14 rounded-lg border-[3px] border-slate-950 flex flex-col items-center justify-start shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden pt-1 ${speedBuffTotal > 0 ? 'bg-sky-500' : speedBuffTotal < 0 ? 'bg-red-500' : 'bg-slate-800'}`}>
              <Wind className="w-3 h-3 text-white/30 absolute top-1" />
              {isEditMode ? (
                <input type="number" defaultValue={char.speed || 30} onBlur={(e) => updateField('speed', Number(e.target.value))} className="w-8 mt-1.5 bg-transparent text-center text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none z-10 relative" />
              ) : (
                <div className="flex flex-col items-center mt-1 relative z-10">
                  <span className={`font-black text-white leading-none ${speedBuffTotal !== 0 ? 'text-xs' : 'text-sm mt-0.5'}`}>{displaySpeed}</span>
                  {speedBuffTotal !== 0 && (
                     <span className="text-[7px] font-black text-slate-900 bg-white/70 px-1 rounded-sm mt-0.5 shadow-sm leading-none">
                       {baseSpeed}{speedBuffTotal > 0 ? `+${speedBuffTotal}` : speedBuffTotal}
                     </span>
                  )}
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-slate-950 text-center py-0.5">
                 <span className="text-[8px] font-black uppercase text-white tracking-widest block">SPD</span>
              </div>
            </div>

            <div className={`w-12 h-14 rounded-lg border-[3px] border-slate-950 flex flex-col items-center justify-start shadow-[2px_2px_0px_rgba(0,0,0,1)] relative overflow-hidden pt-1 ${initBuffTotal !== 0 ? 'bg-amber-600' : 'bg-slate-800'}`}>
              <Zap className="w-3 h-3 text-white/30 absolute top-1" />
              {isEditMode ? (
                <input type="text" defaultValue={char.initiative !== '--' ? char.initiative : ''} placeholder="Auto" onBlur={(e) => updateField('initiative', e.target.value || '--')} className="w-8 mt-1.5 bg-transparent text-center text-xs font-black text-white focus:outline-none z-10 relative" />
              ) : (
                <div className="flex flex-col items-center mt-1 relative z-10">
                  <span className={`font-black text-white leading-none ${initBuffTotal !== 0 ? 'text-xs' : 'text-sm mt-0.5'}`}>{initScore}</span>
                  {initBuffTotal !== 0 && (
                     <span className="text-[7px] font-black text-slate-900 bg-white/70 px-1 rounded-sm mt-0.5 shadow-sm leading-none">
                       {baseInit >= 0 ? `+${baseInit}` : baseInit}{initBuffTotal > 0 ? `+${initBuffTotal}` : initBuffTotal}
                     </span>
                  )}
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-slate-950 text-center py-0.5">
                 <span className="text-[8px] font-black uppercase text-white tracking-widest block">INIT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Control Panel */}
        <div className="p-3 bg-slate-800 space-y-3 pt-8 rounded-b-2xl relative z-0">
          
          {/* Giant Graphic HP Bar */}
          <div className="relative bg-slate-950 border-[3px] border-slate-900 rounded-xl overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-between p-2 min-h-[3.5rem]">
            <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500 z-0`} style={{ width: `${hpPercent}%` }}></div>
            
            {(char.tempHp > 0) && (
              <div 
                className="absolute left-0 bottom-0 h-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-500 z-10" 
                style={{ width: `${Math.min(100, tempHpPercent)}%` }}
              ></div>
            )}

            {isUnconscious ? (
              <div className="relative z-20 flex items-center justify-between px-2 sm:px-4 w-full">
                
                {isDead ? (
                  <div className="w-full flex items-center justify-between">
                     <span className="text-xl font-black text-red-500 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Deceased</span>
                     {quickInput === 'revive' ? (
                       <div className="flex items-center gap-1">
                         <input autoFocus type="number" value={quickVal} onChange={e=>setQuickVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickSubmit()} className="w-10 sm:w-14 bg-slate-900 border-2 border-emerald-500 rounded text-white font-black text-xs text-center px-1 py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" placeholder="HP" />
                         <button onClick={handleQuickSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none"><Check className="w-4 h-4"/></button>
                         <button onClick={() => setQuickInput(null)} className="text-slate-400 hover:text-red-400 px-1"><X className="w-4 h-4"/></button>
                       </div>
                     ) : (
                       <button onClick={() => setQuickInput('revive')} className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none font-black text-[10px] uppercase border-[3px] border-slate-950 hover:bg-emerald-400">Revive</button>
                     )}
                  </div>
                ) : isStable ? (
                  <div className="w-full flex items-center justify-between">
                     <span className="text-xl font-black text-emerald-500 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pl-2 sm:pl-4">Stable</span>
                     <div className="flex items-center gap-2 sm:gap-3">
                      {quickInput === 'heal' ? (
                         <div className="flex items-center gap-1 shrink-0">
                           <input autoFocus type="number" value={quickVal} onChange={e=>setQuickVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickSubmit()} className="w-10 sm:w-14 bg-slate-900 border-2 border-emerald-500 rounded text-white font-black text-xs text-center px-1 py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" placeholder="HP" />
                           <button onClick={handleQuickSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none"><Check className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                           <button onClick={() => setQuickInput(null)} className="text-slate-400 hover:text-red-400 px-1"><X className="w-3 h-3 sm:w-4 sm:h-4"/></button>
                         </div>
                      ) : (
                        <button onClick={() => setQuickInput('heal')} className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none font-black text-[10px] uppercase border-[3px] border-slate-950 hover:bg-emerald-400 shrink-0">Heal</button>
                      )}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-950 bg-red-500 px-2 py-0.5 rounded-sm uppercase tracking-widest mb-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">FAIL (Damage)</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[3px] transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-950 shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 border-slate-900'}`} />)}
                        </div>
                      </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[10px] font-black text-slate-950 bg-emerald-500 px-2 py-0.5 rounded-sm uppercase tracking-widest mb-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">PASS</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[3px] transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-950 shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 border-slate-900'}`} />)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center mx-2 shrink-0">
                      <button onClick={rollDeathSave} className="bg-slate-950 border-2 border-slate-800 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none flex items-center gap-1">
                        <Dices className="w-3 h-3 sm:w-4 sm:h-4" /> Roll
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[10px] font-black text-slate-950 bg-red-500 px-2 py-0.5 rounded-sm uppercase tracking-widest mb-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">FAIL</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[3px] transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-950 shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 border-slate-900'}`} />)}
                      </div>
                    </div>
                  </div>
                )}
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
                  <button onClick={() => adjustHp(-1)} className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-slate-900 hover:bg-slate-900 text-white font-black text-xl flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">-</button>
                  <div className="flex items-center gap-1 text-white bg-slate-950/80 border-2 border-slate-900 rounded-lg px-2 h-10 shadow-[2px_2px_0px_rgba(0,0,0,1)] backdrop-blur-sm">
                    <Heart className={`w-4 h-4 hidden sm:block ${isPoisoned ? 'text-lime-400' : 'text-emerald-400'}`} />
                    <input type="number" value={isEditingHp ? displayHp : (char.hp ?? 0)} onFocus={(e) => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); e.target.select(); }} onChange={(e) => setDisplayHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingHp(false); submitHpUpdate(e.target.value, char.tempHp); }} className={`w-10 bg-transparent focus:outline-none text-right font-black text-xl md:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingHp ? activeTheme.text : ''}`} />
                    <span className="text-slate-500 font-black text-lg">/</span>
                    <input type="number" value={isEditingMaxHp ? displayMaxHp : (char.maxHp || 10)} onFocus={(e) => { setDisplayMaxHp(char.maxHp || 10); setIsEditingMaxHp(true); e.target.select(); }} onChange={(e) => setDisplayMaxHp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} onBlur={(e) => { setIsEditingMaxHp(false); const parsedMax = parseInt(e.target.value, 10); updateField('maxHp', isNaN(parsedMax) ? (char.maxHp || 10) : parsedMax); }} className={`w-8 bg-transparent focus:outline-none text-left text-slate-400 text-sm font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isEditingMaxHp ? activeTheme.text : ''}`} />
                  </div>
                  <button onClick={() => adjustHp(1)} className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-slate-900 hover:bg-slate-900 text-white font-black text-xl flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">+</button>
                </div>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="flex gap-1.5 sm:gap-2">
            
            <button onClick={toggleConcentration} className={`flex-1 rounded-lg border-2 flex flex-col items-center justify-center py-1.5 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${char.isConcentrating ? 'bg-fuchsia-600 border-fuchsia-950 text-white' : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900 hover:text-fuchsia-400'}`}>
              <Brain className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Focus</span>
            </button>

            <div className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-lg transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] relative overflow-hidden h-[42px] sm:h-12">
               {quickInput === 'hitdie' ? (
                  <div className="flex items-center gap-0.5 sm:gap-1 w-full px-1 sm:px-2 h-full bg-slate-900 absolute inset-0 z-10">
                     <input autoFocus type="number" placeholder="HP" value={quickVal} onChange={e=>setQuickVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickSubmit()} className="w-full bg-slate-950 border-2 border-emerald-500 rounded text-white font-black text-[10px] sm:text-xs text-center p-1 sm:p-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none shadow-inner" />
                     <button onClick={handleQuickSubmit} className="text-emerald-400 hover:text-emerald-300 p-0.5 sm:p-1 shrink-0"><Check className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                     <button onClick={() => setQuickInput(null)} className="text-slate-400 hover:text-red-400 p-0.5 sm:p-1 shrink-0"><X className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                  </div>
               ) : (
                 <button 
                   onClick={() => {
                     if((char.hitDice?.current ?? (char.level || 1)) > 0) setQuickInput('hitdie');
                     else triggerAlert('You have no Hit Dice remaining! Take a Long Rest to recover them.', 'Out of Resources');
                   }} 
                   disabled={isDead} 
                   className="w-full h-full flex flex-col items-center justify-center px-1 sm:px-2 py-1.5 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                 >
                   <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-slate-300">Hit Dice</span>
                   <span className="text-xs sm:text-sm font-black text-emerald-400 leading-none">{char.hitDice?.current ?? (char.level || 1)}/{char.hitDice?.max ?? (char.level || 1)}</span>
                 </button>
               )}
            </div>

            <button onClick={onOpenShortRest} disabled={isDead} className="flex-1 bg-slate-950 text-slate-300 rounded-lg border-2 border-slate-900 flex flex-col items-center justify-center transition-colors py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed h-[42px] sm:h-12">
              <Tent className="w-4 h-4 text-emerald-400 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Short</span>
            </button>
            
            <button onClick={onOpenLongRest} disabled={isDead} className={`flex-1 bg-slate-950 ${activeTheme.text} rounded-lg border-2 border-slate-900 flex flex-col items-center justify-center transition-colors py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed h-[42px] sm:h-12`}>
              <Moon className="w-4 h-4 mb-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Long</span>
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
    </>
  );
}