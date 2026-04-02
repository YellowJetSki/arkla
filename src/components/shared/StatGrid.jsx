import React from 'react';
import { BookOpen, Wrench, MessageSquare, Target, Sword } from 'lucide-react';
import { getProficiencyBonus, getModifier, getConditionMechanics } from '../../services/arklaEngine';

export default function StatGrid({ char, activeTheme, isEditMode, updateField }) {
  const stats = char?.stats || {};
  const totalLevel = char?.classes ? char.classes.reduce((sum, c) => sum + c.level, 0) : (char?.level || 1);
  const profBonus = getProficiencyBonus(totalLevel);

  const activeConditions = char?.conditions || [];
  const conditionMechanics = getConditionMechanics(activeConditions);
  
  const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  return (
    <div className="space-y-4">

      {/* Core Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
        {STAT_ORDER.map((stat) => {
          const score = stats[stat] || 10;
          return (
            <div key={stat} className={`relative group bg-slate-900 border ${isEditMode ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-700 hover:border-indigo-500/50'} rounded-xl flex flex-col items-center justify-center p-3 shadow-[0_4px_15px_rgba(0,0,0,0.2)] transition-all`}>
              <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{stat}</span>
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-xl border-t border-slate-600 shadow-inner flex items-center justify-center mb-1.5 group-hover:bg-slate-700 transition-colors">
                <span className={`text-xl md:text-2xl font-black drop-shadow-md ${conditionMechanics.autoFailStrDex && (stat === 'STR' || stat === 'DEX') ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {getModifier(score) >= 0 ? `+${getModifier(score)}` : getModifier(score)}
                </span>
              </div>
              <div className={`bg-slate-950 px-3 py-0.5 rounded-full border ${isEditMode ? 'border-amber-500/50 bg-amber-900/20' : 'border-slate-800'}`}>
                {isEditMode ? (
                  <input 
                    type="number" 
                    defaultValue={score}
                    onBlur={(e) => updateField('stats', { ...stats, [stat]: Number(e.target.value) })}
                    className="w-8 bg-transparent text-center text-[10px] md:text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                  />
                ) : (
                  <span className="text-[10px] md:text-xs font-bold text-slate-500">{score}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills & Proficiencies */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
          <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Proficiencies
          </h3>
          <span className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/50 px-2 py-1 rounded">
            Prof Bonus: +{profBonus}
          </span>
        </div>
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