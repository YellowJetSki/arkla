import { Shield, Target, Sword, Activity, Wind, AlertTriangle, Plus, Minus, Info, X, Droplets, Droplet, Backpack } from 'lucide-react';
import { getModifier, parseAndScaleAttack, getConditionMechanics } from '../../services/arklaEngine';
import VitalStats from '../shared/VitalStats';
import { CONDITIONS_LIST, CONDITION_EFFECTS } from '../../data/campaignData';

export default function CombatTab({ 
  char, 
  charId, 
  isDM, 
  activeTheme, 
  combatWarnings, 
  activeConditions, 
  handleAddCondition, 
  handleRemoveCondition, 
  handleResourceToggle,
  showDialog
}) {

  const mechanics = getConditionMechanics(activeConditions);

  let displaySpeed = mechanics.speedOverride !== null ? mechanics.speedOverride : Math.floor((char.speed || 30) * mechanics.speedMultiplier);
  const isEncumbered = (char.inventory || '').length > 500 && char.stats?.STR < 15;
  if (isEncumbered && displaySpeed > 20 && mechanics.speedOverride === null) displaySpeed -= 10;

  const attacks = char.attacks || [];
  const resources = char.resources || [];

  return (
    <div className="space-y-6">
      <VitalStats char={char} charId={charId} isDM={isDM} activeTheme={activeTheme} />

      {combatWarnings.length > 0 && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 animate-in fade-in shadow-inner">
          <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wider"><AlertTriangle className="w-4 h-4" /> Active Detriments</h4>
          <ul className="space-y-1.5">
            {combatWarnings.map((warning, i) => (
              <li key={i} className="text-red-200/80 text-xs flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span> {warning}
              </li>
            ))}
            {mechanics.autoFailStrDex && (
              <li className="text-red-200/80 text-xs flex items-start gap-2 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span> Automatically fails Strength and Dexterity Saving Throws.
              </li>
            )}
            {mechanics.speedOverride === 0 && (
              <li className="text-red-200/80 text-xs flex items-start gap-2 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span> Speed is reduced to 0.
              </li>
            )}
          </ul>
        </div>
      )}

      {isEncumbered && (
        <div className="bg-amber-950/30 border border-amber-900/30 rounded-xl p-3 flex items-start gap-3 shadow-inner">
          <Backpack className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">Encumbered</span>
            <p className="text-amber-200/60 text-[10px] leading-relaxed">Your inventory is heavily burdened relative to your Strength. Your movement speed has been reduced by 10ft.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden transition-colors ${mechanics.attackDisadvantage ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : mechanics.attackAdvantage ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-700/80'}`}>
          <div className={`absolute top-0 w-full h-1 ${mechanics.attackDisadvantage ? 'bg-red-500' : mechanics.attackAdvantage ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
          <Target className={`w-5 h-5 mb-2 ${mechanics.attackDisadvantage ? 'text-red-400' : mechanics.attackAdvantage ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Hit Modifier</span>
          <span className="text-lg font-black text-white mt-1">
             {mechanics.attackDisadvantage ? 'DISADV' : mechanics.attackAdvantage ? 'ADVANTAGE' : 'Normal'}
          </span>
        </div>
        
        <div className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 flex flex-col items-center justify-center relative transition-colors ${displaySpeed < (char.speed || 30) ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700/80'}`}>
          <div className="absolute top-0 w-full h-1 bg-sky-500"></div>
          <Wind className="w-5 h-5 text-sky-400 mb-2" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Movement</span>
          <div className="flex items-baseline gap-1 mt-1">
             <span className={`text-2xl font-black ${displaySpeed < (char.speed || 30) ? 'text-amber-400' : 'text-white'}`}>{displaySpeed}</span>
             <span className="text-xs text-slate-400 font-bold">ft</span>
          </div>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center relative">
          <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
          <Shield className="w-5 h-5 text-amber-400 mb-2" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Armor Class</span>
          <span className="text-2xl font-black text-white mt-1">{char.ac}</span>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center relative">
          <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
          <Activity className="w-5 h-5 text-emerald-400 mb-2" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initiative</span>
          <span className="text-2xl font-black text-white mt-1">{char.initiative !== '--' ? char.initiative : (getModifier(char.stats?.DEX || 10) >= 0 ? `+${getModifier(char.stats?.DEX || 10)}` : getModifier(char.stats?.DEX || 10))}</span>
        </div>
      </div>

      {resources.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 shadow-inner">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-2">
            <Droplets className={`w-4 h-4 ${activeTheme.text}`} /> Resource Trackers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {resources.map((res, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-700/50 rounded-xl p-3 relative overflow-hidden shadow-sm">
                <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`}></div>
                <div className="pl-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider truncate pr-2">{res.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black bg-slate-950 px-1.5 py-0.5 rounded">{res.recharge} rest</span>
                  </div>
                  
                  {res.isPool ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleResourceToggle(idx, Math.max(0, res.current - 1))} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center">-</button>
                      <span className={`flex-1 text-center font-black ${res.current > 0 ? activeTheme.text : 'text-slate-500'}`}>{res.current} / {res.max}</span>
                      <button onClick={() => handleResourceToggle(idx, Math.min(res.max, res.current + 1))} className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center">+</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Array.from({ length: res.max }).map((_, slotIdx) => (
                        <button 
                          key={slotIdx}
                          onClick={() => handleResourceToggle(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${slotIdx < res.current ? `${activeTheme.bg} ${activeTheme.border} text-white shadow-[0_0_10px_currentColor]` : 'bg-slate-950 border-slate-700 text-transparent hover:bg-slate-800'}`}
                        >
                          <Droplet className="w-3 h-3 fill-current" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-48 h-48 ${activeTheme.bg} opacity-10 blur-[80px] rounded-full pointer-events-none`}></div>
        
        <h3 className={`text-lg font-black ${activeTheme.text} flex items-center gap-2 uppercase tracking-widest drop-shadow-sm mb-4 border-b border-slate-700 pb-2 relative z-10`}>
          <Sword className="w-5 h-5" /> Weapons & Actions
        </h3>
        
        <div className="space-y-3 relative z-10">
          {attacks.length === 0 ? (
            <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 border-dashed">
              <p className="text-sm text-slate-400 italic">No weapons equipped. Equip them from your Inventory Tab.</p>
            </div>
          ) : (
            attacks.map((atk, idx) => {
              const scaledAtk = parseAndScaleAttack(atk, char.stats, char.level, char.class);
              return (
                <div key={idx} className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${activeTheme.hoverBorder} transition-colors shadow-sm`}>
                  <div className="flex-1">
                    <h4 className="font-black text-white text-base md:text-lg mb-1 drop-shadow-sm">{scaledAtk.name}</h4>
                    {scaledAtk.notes && <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold bg-slate-950 inline-block px-2 py-1 rounded shadow-inner">{scaledAtk.notes}</p>}
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center min-w-[70px] shadow-inner">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To Hit</span>
                      <span className={`font-black text-lg ${mechanics.attackDisadvantage ? 'text-red-400' : mechanics.attackAdvantage ? 'text-emerald-400' : activeTheme.text}`}>{scaledAtk.hit}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center min-w-[100px] shadow-inner">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Damage</span>
                      <span className="font-black text-white text-lg">{scaledAtk.damage}</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{scaledAtk.type}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest"><AlertTriangle className="w-4 h-4 text-amber-500" /> Status Conditions</h3>
        </div>
        
        <div className="flex gap-2">
          <select 
            onChange={(e) => {
              if (e.target.value) {
                handleAddCondition(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={isDM}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            defaultValue=""
          >
            <option value="" disabled>Add Condition...</option>
            {CONDITIONS_LIST.filter(c => !activeConditions.includes(c)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {activeConditions.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeConditions.map(cond => (
              <div key={cond} className="bg-slate-900 border border-amber-900/50 rounded-xl p-3 flex justify-between items-start group shadow-inner">
                <div className="pr-2">
                  <span className="text-amber-400 font-bold text-sm block mb-1">{cond}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{CONDITION_EFFECTS[cond]}</p>
                </div>
                {!isDM && (
                  <button onClick={() => handleRemoveCondition(cond)} className="text-slate-500 hover:text-red-400 p-1 bg-slate-950 rounded transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}