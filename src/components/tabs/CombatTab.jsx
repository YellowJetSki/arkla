import { useState } from 'react';
import { Target, Sword, Activity, Wind, AlertTriangle, Plus, Minus, X, Droplets, Droplet, Backpack, ShieldPlus, Zap } from 'lucide-react';
import { getModifier, parseAndScaleAttack, getConditionMechanics } from '../../services/arklaEngine';
import { CONDITIONS_LIST, CONDITION_EFFECTS } from '../../data/campaignData';
import TempBuffsModal from '../TempBuffsModal';

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
  const [showBuffsModal, setShowBuffsModal] = useState(false);

  const mechanics = getConditionMechanics(activeConditions);

  let displaySpeed = mechanics.speedOverride !== null ? mechanics.speedOverride : Math.floor((char.speed || 30) * mechanics.speedMultiplier);
  const isEncumbered = (char.inventory || '').length > 500 && char.stats?.STR < 15;
  if (isEncumbered && displaySpeed > 20 && mechanics.speedOverride === null) displaySpeed -= 10;

  const tempBuffs = char.tempBuffs || [];
  const acBuffTotal = tempBuffs.filter(b => b.target === 'AC').reduce((sum, b) => sum + b.value, 0);
  const displayAc = (char.ac || 10) + acBuffTotal;

  const inventoryWeapons = (char.inventory || []).filter(item => item.category === 'Weapon').map(w => {
    let propsStr = '';
    if (Array.isArray(w.properties)) {
      propsStr = w.properties.map(p => p.name).join(', ');
    } else if (typeof w.properties === 'string') {
      propsStr = w.properties;
    }

    return {
      name: w.name,
      hit: '--',
      damage: w.damageDice || w.damage?.damage_dice || '1d4',
      type: w.damageType || w.damage?.damage_type?.name || 'Slashing',
      notes: propsStr || (typeof w.desc === 'string' ? w.desc : '')
    };
  });

  const allAttacks = [...(char.attacks || []), ...inventoryWeapons];
  const resources = char.resources || [];

  // Parse Class/Species Features for Combat Keywords
  const combatKeywords = ['attack', 'damage', 'action', 'bonus', 'reaction', 'martial', 'rage', 'smite', 'sneak', 'strike', 'initiative', 'unarmed', 'ki', 'spell', 'save', 'dc'];
  const combatFeatures = (char.features || []).filter(f => {
      const text = `${f.name} ${f.desc}`.toLowerCase();
      return combatKeywords.some(kw => text.includes(kw));
  });

  // Action Categorization Logic (The D&D Beyond approach)
  const categorizedActions = {
    action: [],
    bonus: [],
    reaction: [],
    special: []
  };

  allAttacks.forEach(atk => {
    const scaled = parseAndScaleAttack(atk, char.stats, char.level, char.class);
    // Weapons generally default to 1 Action unless specified in notes
    if ((scaled.notes || '').toLowerCase().includes('bonus action')) {
      categorizedActions.bonus.push({ ...scaled, isWeapon: true });
    } else if ((scaled.notes || '').toLowerCase().includes('reaction')) {
      categorizedActions.reaction.push({ ...scaled, isWeapon: true });
    } else {
      categorizedActions.action.push({ ...scaled, isWeapon: true });
    }
  });

  combatFeatures.forEach(f => {
    const text = `${f.name} ${f.desc}`.toLowerCase();
    if (text.includes('bonus action')) {
      categorizedActions.bonus.push({ ...f, isWeapon: false });
    } else if (text.includes('reaction')) {
      categorizedActions.reaction.push({ ...f, isWeapon: false });
    } else if (text.includes('action')) {
      categorizedActions.action.push({ ...f, isWeapon: false });
    } else {
      categorizedActions.special.push({ ...f, isWeapon: false });
    }
  });

  // Render helper for Weapons vs Traits inside the Action economy blocks
  const renderActionItem = (item, idx) => {
    if (item.isWeapon) {
      return (
        <div key={idx} className={`bg-slate-900/80 backdrop-blur-sm border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${activeTheme.hoverBorder || ''} transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] border-slate-950`}>
          <div className="flex-1">
            <h4 className="font-black text-white text-base md:text-lg mb-1 drop-shadow-sm flex items-center gap-2">
               <Sword className={`w-4 h-4 ${activeTheme.text}`} /> {item.name}
            </h4>
            {item.notes && <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black bg-slate-950 border border-slate-800 inline-block px-2 py-1 rounded shadow-inner truncate max-w-full">{item.notes}</p>}
          </div>
          
          <div className="flex gap-2 shrink-0">
            <div className="bg-slate-950 border-2 border-slate-900 rounded-lg p-2.5 flex flex-col items-center min-w-[70px] shadow-inner">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">To Hit</span>
              <span className={`font-black text-xl leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${mechanics.attackDisadvantage ? 'text-red-500' : mechanics.attackAdvantage ? 'text-emerald-400' : activeTheme.text}`}>{item.hit}</span>
            </div>
            <div className="bg-slate-950 border-2 border-slate-900 rounded-lg p-2.5 flex flex-col items-center min-w-[90px] shadow-inner">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Damage</span>
              <span className="font-black text-white text-xl leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{item.damage}</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black mt-1">{item.type}</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={idx} className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
           <span className={`font-black text-white text-xs uppercase tracking-wider block mb-1`}>{item.name}</span>
           <p className="text-[10px] font-bold text-slate-300 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{item.desc}</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {showBuffsModal && (
        <TempBuffsModal 
          charId={charId} 
          tempBuffs={tempBuffs} 
          isDM={isDM} 
          activeTheme={activeTheme} 
          onClose={() => setShowBuffsModal(false)} 
        />
      )}

      {/* COMBAT STATUS BANNER */}
      <div className="flex gap-3">
        <div className={`flex-1 bg-slate-900 border-2 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-center relative overflow-hidden transition-colors ${mechanics.attackDisadvantage ? 'border-red-600' : mechanics.attackAdvantage ? 'border-emerald-500' : 'border-slate-950'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Target className={`w-4 h-4 ${mechanics.attackDisadvantage ? 'text-red-500' : mechanics.attackAdvantage ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Attack Status</span>
          </div>
          <span className={`text-lg font-black uppercase tracking-wider leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${mechanics.attackDisadvantage ? 'text-red-500' : mechanics.attackAdvantage ? 'text-emerald-400' : 'text-white'}`}>
             {mechanics.attackDisadvantage ? 'Disadvantage' : mechanics.attackAdvantage ? 'Advantage' : 'Normal'}
          </span>
        </div>

        <button onClick={() => setShowBuffsModal(true)} className={`bg-slate-900 border-2 border-slate-950 rounded-xl p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center transition-all active:shadow-none active:translate-y-[4px] hover:bg-slate-800 ${tempBuffs.length > 0 ? 'bg-indigo-900/50 border-indigo-500' : ''}`}>
          <ShieldPlus className={`w-6 h-6 mb-1 ${tempBuffs.length > 0 ? 'text-indigo-400 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 'text-slate-400'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${tempBuffs.length > 0 ? 'text-indigo-300' : 'text-slate-500'}`}>
            {tempBuffs.length > 0 ? `${tempBuffs.length} Buffs` : 'Add Buff'}
          </span>
        </button>
      </div>

      {combatWarnings.length > 0 && (
        <div className="bg-red-500 border-2 border-red-950 rounded-xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <h4 className="text-red-950 font-black flex items-center gap-2 mb-2 text-sm uppercase tracking-wider"><AlertTriangle className="w-5 h-5" /> Active Detriments</h4>
          <ul className="space-y-2">
            {combatWarnings.map((warning, i) => (
              <li key={i} className="text-red-100 font-bold text-xs flex items-start gap-2 bg-red-950/40 p-2 rounded shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-300 mt-0.5 shrink-0"></span> {warning}
              </li>
            ))}
            {mechanics.autoFailStrDex && (
              <li className="text-red-100 font-bold text-xs flex items-start gap-2 bg-red-950/40 p-2 rounded shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-300 mt-0.5 shrink-0"></span> Automatically fails Strength and Dexterity Saving Throws.
              </li>
            )}
            {mechanics.speedOverride === 0 && (
              <li className="text-red-100 font-bold text-xs flex items-start gap-2 bg-red-950/40 p-2 rounded shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-300 mt-0.5 shrink-0"></span> Speed is reduced to 0.
              </li>
            )}
          </ul>
        </div>
      )}

      {isEncumbered && (
        <div className="bg-amber-500 border-2 border-amber-950 rounded-xl p-3 flex items-start gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <Backpack className="w-6 h-6 text-amber-950 shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-950 font-black text-sm uppercase tracking-wider block mb-1">Encumbered</span>
            <p className="text-amber-900 font-bold text-xs leading-relaxed">Your inventory is heavily burdened relative to your Strength. Your movement speed has been reduced by 10ft.</p>
          </div>
        </div>
      )}

      {/* TRACKERS */}
      {resources.length > 0 && (
        <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b-2 border-slate-900 pb-2">
            <Droplets className={`w-5 h-5 ${activeTheme.text}`} /> Resources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resources.map((res, idx) => (
              <div key={idx} className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 relative overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className={`absolute top-0 left-0 w-2 h-full ${activeTheme.bg} border-r-2 border-slate-950`}></div>
                <div className="pl-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-black text-white uppercase tracking-wider truncate pr-2 leading-tight">{res.name}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-black bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded shadow-inner shrink-0">{res.recharge} rest</span>
                  </div>
                  
                  {res.isPool ? (
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border-2 border-slate-900 shadow-inner">
                      <button onClick={() => handleResourceToggle(idx, Math.max(0, res.current - 1))} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center border border-slate-700 shadow-sm">-</button>
                      <span className={`flex-1 text-center font-black text-xl drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] ${res.current > 0 ? activeTheme.text : 'text-slate-600'}`}>{res.current} <span className="text-sm text-slate-600">/ {res.max}</span></span>
                      <button onClick={() => handleResourceToggle(idx, Math.min(res.max, res.current + 1))} className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center border border-slate-700 shadow-sm">+</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: res.max }).map((_, slotIdx) => (
                        <button 
                          key={slotIdx}
                          onClick={() => handleResourceToggle(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)}
                          className={`w-6 h-6 rounded flex items-center justify-center border-[3px] transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${slotIdx < res.current ? `${activeTheme.bg} border-slate-950 text-white` : 'bg-slate-900 border-slate-800 text-transparent hover:bg-slate-800'}`}
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

      {/* ACTION ECONOMY PANELS */}
      <div className="space-y-6">
        
        {/* ACTIONS */}
        <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bg} opacity-20 blur-[50px] rounded-full pointer-events-none`}></div>
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4 border-b-2 border-slate-900 pb-2 relative z-10">
            <span className={`w-3 h-3 rounded-full ${activeTheme.bg} border border-slate-950 shadow-sm inline-block`} /> Actions
          </h3>
          <div className="space-y-3 relative z-10">
             {categorizedActions.action.length === 0 ? (
                <p className="text-center p-6 bg-slate-900/50 rounded-xl border-2 border-slate-900 border-dashed shadow-inner text-xs font-black uppercase tracking-widest text-slate-500">No standard actions available.</p>
             ) : (
                categorizedActions.action.map((item, idx) => renderActionItem(item, idx))
             )}
          </div>
        </div>

        {/* BONUS ACTIONS */}
        {categorizedActions.bonus.length > 0 && (
          <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4 border-b-2 border-slate-900 pb-2 relative z-10">
              <span className={`w-3 h-3 ${activeTheme.bg} rotate-45 border border-slate-950 shadow-sm inline-block`} /> Bonus Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
               {categorizedActions.bonus.map((item, idx) => renderActionItem(item, idx))}
            </div>
          </div>
        )}

        {/* REACTIONS */}
        {categorizedActions.reaction.length > 0 && (
          <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4 border-b-2 border-slate-900 pb-2 relative z-10">
              <Zap className={`w-5 h-5 ${activeTheme.text} drop-shadow-sm`} /> Reactions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
               {categorizedActions.reaction.map((item, idx) => renderActionItem(item, idx))}
            </div>
          </div>
        )}

        {/* PASSIVE / SPECIAL TRAITS */}
        {categorizedActions.special.length > 0 && (
          <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4 border-b-2 border-slate-900 pb-2 relative z-10">
              <Activity className={`w-5 h-5 text-slate-400 drop-shadow-sm`} /> Other Combat Traits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
               {categorizedActions.special.map((item, idx) => renderActionItem(item, idx))}
            </div>
          </div>
        )}

      </div>

      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"><AlertTriangle className="w-5 h-5 text-amber-500" /> Conditions</h3>
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
            className="flex-1 bg-slate-900 border-2 border-slate-950 rounded-xl px-3 py-2.5 text-white font-black text-sm focus:outline-none focus:border-amber-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] appearance-none"
            defaultValue=""
          >
            <option value="" disabled>Add Condition...</option>
            {CONDITIONS_LIST.filter(c => !activeConditions.includes(c)).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {activeConditions.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeConditions.map(cond => (
              <div key={cond} className="bg-slate-900 border-2 border-amber-900 rounded-xl p-3 flex justify-between items-start group shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="pr-2">
                  <span className="text-amber-400 font-black uppercase tracking-widest text-sm block mb-1 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{cond}</span>
                  <p className="text-[10px] font-bold text-slate-300 leading-relaxed">{CONDITION_EFFECTS[cond]}</p>
                </div>
                {!isDM && (
                  <button onClick={() => handleRemoveCondition(cond)} className="text-slate-500 hover:text-red-500 hover:bg-red-950 border-2 border-slate-950 p-2 bg-slate-950 rounded-lg transition-all shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]">
                    <X className="w-4 h-4" />
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