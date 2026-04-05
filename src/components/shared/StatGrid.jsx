import React from 'react';
import { BookOpen, Wrench, MessageSquare, Target, Sword, Activity } from 'lucide-react';
import { getProficiencyBonus, getModifier, getConditionMechanics, ALL_SKILLS } from '../../services/arklaEngine';

export default function StatGrid({ char, activeTheme, isEditMode, updateField, isDM }) {
  const stats = char?.stats || {};
  const totalLevel = char?.classes ? char.classes.reduce((sum, c) => sum + c.level, 0) : (char?.level || 1);
  const profBonus = getProficiencyBonus(totalLevel);

  const activeConditions = char?.conditions || [];
  const conditionMechanics = getConditionMechanics(activeConditions);
  
  const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  
  // Safe parsing of saving throw proficiencies
  const savingThrowsRaw = char?.proficiencies?.savingThrows;
  const savingThrowProfs = (Array.isArray(savingThrowsRaw) ? savingThrowsRaw.join(', ') : (savingThrowsRaw || '')).toLowerCase();

  const renderSkills = () => {
    const skillsRaw = char?.proficiencies?.skills;
    if (!skillsRaw || skillsRaw.length === 0) return 'None';
    
    const skillsStr = Array.isArray(skillsRaw) ? skillsRaw.join(', ') : skillsRaw;
    const skillArray = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    return skillArray.map(skill => {
      const cleanSkill = skill.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
      const foundSkill = ALL_SKILLS.find(s => s.toLowerCase().startsWith(cleanSkill));
      
      if (foundSkill) {
        const statMatch = foundSkill.match(/\(([A-Z]{3})\)/);
        if (statMatch) {
          const statName = statMatch[1];
          const statScore = stats[statName] || 10;
          const statMod = getModifier(statScore);
          
          const isExpertise = skill.toLowerCase().includes('expertise');
          const totalBonus = statMod + (isExpertise ? (profBonus * 2) : profBonus);
          const formattedBonus = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;
          
          const displayName = foundSkill.split(' (')[0]; 
          return `${displayName} (${formattedBonus})`;
        }
      }
      return skill; 
    }).join(', ');
  };

  return (
    <div className="space-y-6">

      {/* Core Stats & Saving Throws Grid - DYNAMICALLY ADJUSTS FOR DM VIEWS */}
      <div className={`grid ${isDM ? 'grid-cols-3 gap-2 md:gap-3' : 'grid-cols-2 md:grid-cols-6 gap-3 md:gap-4'}`}>
        {STAT_ORDER.map((stat) => {
          const score = stats[stat] || 10;
          const statMod = getModifier(score);
          const isProficient = savingThrowProfs.includes(stat.toLowerCase());
          const saveMod = isProficient ? statMod + profBonus : statMod;
          
          return (
            <div key={stat} className={`relative bg-slate-900 border-2 rounded-xl flex flex-col items-center justify-center p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all ${isEditMode ? 'border-amber-500' : 'border-slate-950'}`}>
              <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{stat}</span>
              
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-950 rounded-xl border-2 border-slate-800 shadow-inner flex items-center justify-center mb-2">
                <span className={`text-2xl md:text-3xl font-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] ${conditionMechanics.autoFailStrDex && (stat === 'STR' || stat === 'DEX') ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {statMod >= 0 ? `+${statMod}` : statMod}
                </span>
              </div>

              {/* SAVING THROW DISPLAY */}
              <div className={`w-full flex items-center justify-between bg-slate-950 px-1.5 md:px-2 py-1.5 rounded-lg shadow-inner border border-slate-800 mt-1`}>
                 <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">Save</span>
                 <div className="flex items-center gap-1 md:gap-1.5 min-w-0">
                   {isProficient && <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${activeTheme?.bg || 'bg-indigo-500'} shadow-[0_0_5px_currentColor]`}></div>}
                   <span className={`text-[10px] md:text-xs font-black truncate ${isProficient ? (activeTheme?.text || 'text-indigo-400') : 'text-slate-300'}`}>
                     {saveMod >= 0 ? `+${saveMod}` : saveMod}
                   </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills & Proficiencies */}
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <BookOpen className={`w-5 h-5 ${activeTheme?.text || 'text-indigo-400'}`} /> Proficiencies
          </h3>
          <span className="text-[10px] md:text-xs font-black text-slate-950 uppercase tracking-widest bg-emerald-500 border-2 border-slate-950 px-2 py-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-1">
            <Activity className="w-3 h-3" /> Prof +{profBonus}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Skills</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">{renderSkills()}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-950 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Sword className="w-3 h-3"/> Weapons & Armor</h4>
            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              Weapons: {char?.proficiencies?.weapons || 'None'}<br/>
              Armor: {char?.proficiencies?.armor || 'None'}
            </p>
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