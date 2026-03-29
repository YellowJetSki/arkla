import React from 'react';
import { Shield, Zap, Wind, Activity, BookOpen, Wrench, MessageSquare, Target, Sword, Lock } from 'lucide-react';
import { getProficiencyBonus, getModifier, getConditionMechanics } from '../../services/arklaEngine';

export default function StatGrid({ char, activeTheme }) {
  const stats = char?.stats || {};
  const totalLevel = char?.classes ? char.classes.reduce((sum, c) => sum + c.level, 0) : (char?.level || 1);
  const profBonus = getProficiencyBonus(totalLevel);

  const activeConditions = char?.conditions || [];
  const conditionMechanics = getConditionMechanics(activeConditions);
  
  const baseSpeed = char?.speed || 30;
  let displaySpeed = baseSpeed;
  if (conditionMechanics.speedOverride !== null) {
     displaySpeed = conditionMechanics.speedOverride;
  } else {
     displaySpeed = Math.floor(baseSpeed * conditionMechanics.speedMultiplier);
  }

  const isImmobilized = displaySpeed === 0;

  // The Fix: Hardcoded strict stat array order to prevent layout shifts
  const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  return (
    <div className="space-y-4">
      {/* Vitals Grid */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 md:p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <Shield className={`w-8 h-8 ${activeTheme?.text || 'text-indigo-400'} mb-1 opacity-20 absolute -right-2 -bottom-2`} />
          <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 z-10">Armor</span>
          <span className="text-xl md:text-3xl font-black text-white z-10">{char?.ac || 10}</span>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 md:p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <Zap className={`w-8 h-8 ${activeTheme?.text || 'text-indigo-400'} mb-1 opacity-20 absolute -right-2 -bottom-2`} />
          <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 z-10">Initiative</span>
          <span className="text-xl md:text-3xl font-black text-white z-10">{char?.initiative !== '--' ? char?.initiative : (getModifier(stats.DEX || 10) >= 0 ? `+${getModifier(stats.DEX || 10)}` : getModifier(stats.DEX || 10))}</span>
        </div>
        
        <div className={`border rounded-xl p-2 md:p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden transition-all ${isImmobilized ? 'bg-red-950/40 border-red-900 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-slate-900 border-slate-700'}`}>
          {isImmobilized ? (
            <Lock className="w-8 h-8 text-red-500 mb-1 opacity-20 absolute -right-2 -bottom-2 animate-pulse" />
          ) : (
            <Wind className={`w-8 h-8 ${activeTheme?.text || 'text-indigo-400'} mb-1 opacity-20 absolute -right-2 -bottom-2`} />
          )}
          <span className={`text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1 z-10 ${isImmobilized ? 'text-red-400' : 'text-slate-400'}`}>Speed</span>
          <span className={`text-xl md:text-3xl font-black z-10 ${isImmobilized ? 'text-red-400' : 'text-white'}`}>{displaySpeed}<span className={`text-xs md:text-sm ml-0.5 ${isImmobilized ? 'text-red-500/50' : 'text-slate-500'}`}>ft</span></span>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 md:p-3 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          <Activity className={`w-8 h-8 ${activeTheme?.text || 'text-indigo-400'} mb-1 opacity-20 absolute -right-2 -bottom-2`} />
          <span className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 z-10">Prof Bonus</span>
          <span className="text-xl md:text-3xl font-black text-white z-10">+{profBonus}</span>
        </div>
      </div>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
        {STAT_ORDER.map((stat) => {
          const score = stats[stat] || 10;
          return (
            <div key={stat} className="relative group bg-slate-900 border border-slate-700 rounded-xl flex flex-col items-center justify-center p-3 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:border-indigo-500/50 transition-all">
              <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{stat}</span>
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-xl border-t border-slate-600 shadow-inner flex items-center justify-center mb-1.5 group-hover:bg-slate-700 transition-colors">
                <span className={`text-xl md:text-2xl font-black drop-shadow-md ${conditionMechanics.autoFailStrDex && (stat === 'STR' || stat === 'DEX') ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {getModifier(score) >= 0 ? `+${getModifier(score)}` : getModifier(score)}
                </span>
              </div>
              <div className="bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800">
                <span className="text-[10px] md:text-xs font-bold text-slate-500">{score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills & Proficiencies */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest border-b border-slate-700 pb-2 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Proficiencies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Skills</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{char?.proficiencies?.skills || 'None'}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Sword className="w-3 h-3"/> Weapons & Armor</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{char?.proficiencies?.weapons || 'None'}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Wrench className="w-3 h-3"/> Tools</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{char?.proficiencies?.tools || 'None'}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Languages</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{char?.proficiencies?.languages || 'Common'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}