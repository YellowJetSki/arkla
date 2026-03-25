import React from 'react';
import { Zap, Sword, RotateCcw, AlertTriangle, Crosshair, Sparkles, Battery, Heart } from 'lucide-react';

export default function CombatTab({ 
  char, 
  isDM, 
  activeTheme,
  combatWarnings,
  activeConditions,
  handleAddCondition,
  handleRemoveCondition,
  handleResourceToggle
}) {
  
  const bonusActions = (char.features || []).filter(f => f.desc.toLowerCase().includes('bonus action'));
  const reactions = (char.features || []).filter(f => f.desc.toLowerCase().includes('reaction'));
  const hasSpells = char.spells && char.spells.length > 0;
  
  const resources = char.resources || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* STATUS WARNINGS */}
      {(combatWarnings.length > 0 || isDM) && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-fuchsia-500" /> Active Status
            </h3>
            {isDM && (
              <select onChange={handleAddCondition} value="" className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-fuchsia-500">
                <option value="" disabled>+ Add Condition</option>
                {['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Exhaustion'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
          
          {combatWarnings.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No active conditions.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {combatWarnings.map((warning, i) => (
                <div key={i} className="flex justify-between items-start bg-fuchsia-950/30 border border-fuchsia-900/50 p-3 rounded-lg">
                  <span className="text-sm font-bold text-fuchsia-300 leading-snug">{warning}</span>
                  {isDM && (
                    <button onClick={() => handleRemoveCondition(warning.split(':')[0])} className="text-fuchsia-500 hover:text-fuchsia-300 transition-colors ml-4 shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLASS RESOURCES (Auto-populated by Arkla Engine) */}
      {resources.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 shadow-xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bg} blur-[50px] opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none`}></div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 relative z-10 border-b border-slate-700 pb-2">
            <Battery className={`w-5 h-5 ${activeTheme.text}`} /> Class Resources
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {resources.map((res, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-slate-300">{res.name}</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {res.recharge} Rest
                  </span>
                </div>
                
                {res.isPool || res.max > 15 ? (
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                     <Heart className="w-4 h-4 text-emerald-500" />
                     <input 
                       type="number" 
                       disabled={isDM}
                       value={res.current}
                       onChange={(e) => handleResourceToggle(idx, Math.min(res.max, Math.max(0, parseInt(e.target.value) || 0)))}
                       className="w-16 bg-transparent text-white font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                     />
                     <span className="text-slate-500 font-bold text-sm">/ {res.max}</span>
                  </div>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: res.max }).map((_, bubbleIdx) => (
                      <button 
                        key={bubbleIdx} 
                        onClick={() => handleResourceToggle(idx, bubbleIdx < res.current ? res.current - 1 : res.current + 1)} 
                        disabled={isDM} 
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-300 shrink-0 ${bubbleIdx < res.current ? `${activeTheme.bg} ${activeTheme.border} shadow-[0_0_10px_rgba(255,255,255,0.2)] cursor-pointer` : 'bg-slate-800 border-slate-600 opacity-50 cursor-pointer'}`} 
                        title={bubbleIdx < res.current ? "Click to expend" : "Click to regain"} 
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION ECONOMY DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN ACTIONS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-900/50 pb-2 flex items-center gap-2">
            <Sword className="w-4 h-4" /> Action
          </h3>
          <div className="space-y-3">
            
            {hasSpells && (
              <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3 shadow-sm hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-indigo-300 text-sm flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Cast a Spell</span>
                  <span className="bg-indigo-900/50 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-700">Magic</span>
                </div>
                <p className="text-xs text-indigo-200/80">
                  Refer to your <strong className="text-indigo-400">Spells Tab</strong> to view your spellbook and expend spell slots.
                </p>
              </div>
            )}

            {(char.attacks || []).map((attack, i) => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white text-sm">{attack.name}</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-600">{attack.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2 py-1 rounded-md">
                    <Crosshair className="w-3 h-3" />
                    <span className="text-sm font-black tracking-wider">{attack.hit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 text-slate-300 border border-slate-800 px-2 py-1 rounded-md">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">DMG</span>
                    <span className="text-sm font-black">{attack.damage}</span>
                  </div>
                </div>
                {attack.notes && <p className="text-xs text-slate-500 mt-2 italic">{attack.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* BONUS ACTIONS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-amber-900/50 pb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Bonus Action
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-amber-500/30 transition-colors">
              <span className="font-bold text-white text-sm block mb-1">Off-Hand Attack</span>
              <p className="text-xs text-slate-400">Make an attack with a light weapon in your other hand. Don't add your modifier to the damage.</p>
            </div>
            {bonusActions.map((feat, i) => (
              <div key={`ba-${i}`} className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-amber-500/30 transition-colors">
                <span className="font-bold text-white text-sm block mb-1">{feat.name}</span>
                <p className="text-xs text-slate-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* REACTIONS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest border-b border-purple-900/50 pb-2 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reaction
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-purple-500/30 transition-colors">
              <span className="font-bold text-white text-sm block mb-1">Opportunity Attack</span>
              <p className="text-xs text-slate-400">Make one melee attack against a hostile creature that moves out of your reach.</p>
            </div>
            {reactions.map((feat, i) => (
              <div key={`re-${i}`} className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-sm hover:border-purple-500/30 transition-colors">
                <span className="font-bold text-white text-sm block mb-1">{feat.name}</span>
                <p className="text-xs text-slate-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}