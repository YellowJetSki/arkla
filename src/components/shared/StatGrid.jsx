import React from 'react';
import { BookOpen, Wrench, MessageSquare, Target, Sword, Activity } from 'lucide-react';
import { getProficiencyBonus, getModifier, getConditionMechanics } from '../../services/arklaEngine';

export default function StatGrid({ char, activeTheme, isEditMode, updateField }) {
  const stats = char?.stats || {};
  const totalLevel = char?.classes ? char.classes.reduce((sum, c) => sum + c.level, 0) : (char?.level || 1);
  const profBonus = getProficiencyBonus(totalLevel);

  const activeConditions = char?.conditions || [];
  const conditionMechanics = getConditionMechanics(activeConditions);
  
  const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  return (
    <div className="space-y-6">

      {/* Core Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {STAT_ORDER.map((stat) => {
          const score = stats[stat] || 10;
          return (
            <div key={stat} className={`relative bg-slate-900 border-2 rounded-xl flex flex-col items-center justify-center p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all ${isEditMode ? 'border-amber-500' : 'border-slate-950'}`}>
              <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{stat}</span>
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-950 rounded-xl border-2 border-slate-800 shadow-inner flex items-center justify-center mb-2">
                <span className={`text-2xl md:text-3xl font-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] ${conditionMechanics.autoFailStrDex && (stat === 'STR' || stat === 'DEX') ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {getModifier(score) >= 0 ? `+${getModifier(score)}` : getModifier(score)}
                </span>
              </div>
              <div className={`bg-slate-950 px-3 py-1 rounded shadow-inner border-2 ${isEditMode ? 'border-amber-500/50 bg-amber-900/20' : 'border-slate-900'}`}>
                {isEditMode ? (
                  <input 
                    type="number" 
                    defaultValue={score}
                    onBlur={(e) => updateField('stats', { ...stats, [stat]: Number(e.target.value) })}
                    className="w-8 bg-transparent text-center text-xs font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                  />
                ) : (
                  <span className="text-[10px] md:text-xs font-black text-slate-400">{score}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills & Proficiencies */}
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Proficiencies
          </h3>
          <span className="text-[10px] md:text-xs font-black text-slate-950 uppercase tracking-widest bg-emerald-500 border-2 border-slate-950 px-2 py-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1">
            <Activity className="w-3 h-3" /> Prof +{profBonus}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Skills</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{char?.proficiencies?.skills || 'None'}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Sword className="w-3 h-3"/> Weapons & Armor</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{char?.proficiencies?.weapons || 'None'}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Wrench className="w-3 h-3"/> Tools</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{char?.proficiencies?.tools || 'None'}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Languages</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{char?.proficiencies?.languages || 'Common'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}