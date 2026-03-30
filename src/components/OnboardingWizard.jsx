import { useState, useEffect } from 'react';
import { Sparkles, Heart, Backpack, Tent, ChevronRight, CheckCircle2, ArrowUpCircle, Compass, Target, Flame, X } from 'lucide-react';
import SpellDiscovery from './SpellDiscovery';
import { CLASS_SKILLS_MAP, ALL_SKILLS } from '../services/arklaEngine';

const THEMES = {
  indigo: { name: 'Tenari Void', desc: 'The lingering, arcane resonance of the magic-wielding giants of old.', bg: 'bg-indigo-600', ring: 'ring-indigo-500', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  emerald: { name: "Smuggler's Emerald", desc: 'The color of the untamed Arkla seas and the secret coves of the pirate crews.', bg: 'bg-emerald-600', ring: 'ring-emerald-500', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  rose: { name: 'Dragonfire Rose', desc: 'A harsh, primal reminder of the nefarious dragons that once tormented the realm.', bg: 'bg-rose-600', ring: 'ring-rose-500', border: 'border-rose-500/50', text: 'text-rose-400' },
  amber: { name: "Crown's Radiance", desc: 'The authoritative, golden banner of Emperor Hearn and the Republic.', bg: 'bg-amber-600', ring: 'ring-amber-500', border: 'border-amber-500/50', text: 'text-amber-400' },
  sky: { name: "Privateer's Sky", desc: 'The boundless horizon sought by port-town rebels raising the black flag.', bg: 'bg-sky-600', ring: 'ring-sky-500', border: 'border-sky-500/50', text: 'text-sky-400' },
};

const getClassLimits = (char) => {
  const className = char.classes?.[0]?.name?.toLowerCase().split(' ')[0] || '';
  const wisMod = Math.max(1, Math.floor(((char.stats?.WIS || 10) - 10) / 2));
  
  const limits = { skills: 2, cantrips: 0, spells: 0 };
  
  if (className === 'rogue') limits.skills = 4;
  if (className === 'bard') { limits.skills = 3; limits.cantrips = 2; limits.spells = 4; }
  if (className === 'cleric') { limits.cantrips = 3; limits.spells = wisMod + 1; }
  if (className === 'druid') { limits.cantrips = 2; limits.spells = wisMod + 1; }
  if (className === 'sorcerer') { limits.cantrips = 4; limits.spells = 2; }
  if (className === 'warlock') { limits.cantrips = 2; limits.spells = 2; }
  if (className === 'wizard') { limits.cantrips = 3; limits.spells = 6; }
  if (className === 'ranger' || className === 'paladin') { limits.skills = 3; limits.cantrips = 0; limits.spells = 2; }
  
  return limits;
};

export default function OnboardingWizard({ char, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(char.theme && THEMES[char.theme] ? char.theme : 'indigo');
  const [typedWelcome, setTypedWelcome] = useState('');
  
  const [pickedSkills, setPickedSkills] = useState([]);
  const [pickedCantrips, setPickedCantrips] = useState([]);
  const [pickedSpells, setPickedSpells] = useState([]);

  const firstName = (char.name || 'Traveler').split(' ')[0];
  const welcomeText = `Welcome, ${firstName}. Your legacy begins now.`;

  const limits = getClassLimits(char);
  const charClassSafe = char.classes?.[0]?.name?.toLowerCase().split(' ')[0];
  const allowedSkills = CLASS_SKILLS_MAP[charClassSafe] || ALL_SKILLS; 

  const needsSkills = (!char.proficiencies?.skills || char.proficiencies.skills.trim() === '');
  const needsSpells = (limits.cantrips > 0 || limits.spells > 0) && (!char.spells || char.spells.length === 0);

  const steps = ['theme'];
  if (needsSkills) steps.push('skills');
  if (needsSpells) steps.push('spells');
  steps.push('interface');
  steps.push('navigation');

  const currentStep = steps[stepIndex];
  const activeTheme = THEMES[selectedTheme];

  useEffect(() => {
    if (currentStep === 'theme') {
      let i = 0;
      setTypedWelcome('');
      const typingId = setInterval(() => {
        setTypedWelcome(welcomeText.substring(0, i));
        i++;
        if (i > welcomeText.length) clearInterval(typingId);
      }, 50);
      return () => clearInterval(typingId);
    }
  }, [currentStep, welcomeText]);

  const toggleSkill = (skill) => {
    if (pickedSkills.includes(skill)) {
      setPickedSkills(prev => prev.filter(s => s !== skill));
    } else if (pickedSkills.length < limits.skills) {
      setPickedSkills(prev => [...prev, skill]);
    }
  };

  const handleAddSpell = (spell) => {
    if (spell.level === 0 && pickedCantrips.length < limits.cantrips) {
      setPickedCantrips(prev => [...prev, spell]);
    } else if (spell.level > 0 && pickedSpells.length < limits.spells) {
      setPickedSpells(prev => [...prev, spell]);
    }
  };

  const handleNext = () => {
    if (currentStep === 'skills' && pickedSkills.length < limits.skills) {
      alert(`You must select exactly ${limits.skills} skills from your class list.`);
      return;
    }
    if (currentStep === 'spells' && (pickedCantrips.length < limits.cantrips || pickedSpells.length < limits.spells)) {
      alert(`You must select ${limits.cantrips} cantrips and ${limits.spells} spells before continuing.`);
      return;
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete({
        theme: selectedTheme,
        skills: pickedSkills,
        spells: [...pickedCantrips, ...pickedSpells]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${activeTheme.bg} opacity-5 blur-[150px] rounded-full pointer-events-none transition-colors duration-1000`}></div>

      <div className={`bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl w-full ${currentStep === 'spells' ? 'max-w-2xl' : 'max-w-md'} shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500 max-h-[90dvh]`}>
        
        <div className="absolute top-0 left-0 right-0 flex h-1 bg-slate-800 z-20">
          <div className={`h-full ${activeTheme.bg} transition-all duration-500`} style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="p-6 relative z-10 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          
          {currentStep === 'theme' && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8 flex flex-col items-center justify-center">
                <Compass className={`w-12 h-12 ${activeTheme.text} mx-auto mb-4 animate-[spin_10s_linear_infinite] opacity-50`} />
                <div className="min-h-[72px] flex items-end justify-center w-full mb-3">
                  <h2 className="text-2xl font-black text-white leading-tight">{typedWelcome}<span className="animate-pulse">|</span></h2>
                </div>
                <p className="text-slate-400 text-sm opacity-80">Before you enter the realm, claim your signature aura.</p>
              </div>

              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-4 mb-6 mt-auto">
                 <div className="text-center mb-4 min-h-[60px]">
                   <h3 className={`font-black text-lg ${activeTheme.text} uppercase tracking-widest transition-colors`}>{activeTheme.name}</h3>
                   <p className="text-xs text-slate-400 mt-1 italic transition-colors">{activeTheme.desc}</p>
                 </div>
                 
                 <div className="flex justify-center gap-3">
                   {Object.keys(THEMES).map(t => (
                     <button 
                       key={t} 
                       onClick={() => setSelectedTheme(t)} 
                       className={`w-10 h-10 rounded-full ${THEMES[t].bg} relative transition-all duration-300 group outline-none focus:ring-2 focus:ring-white`}
                       title={THEMES[t].name}
                     >
                       {selectedTheme === t && (
                         <div className="absolute inset-[-4px] rounded-full border-2 border-white/50 animate-in zoom-in duration-300"></div>
                       )}
                       <div className={`absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          )}

          {currentStep === 'skills' && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col min-h-[400px]">
              <div className="text-center mb-6">
                <Target className={`w-10 h-10 ${activeTheme.text} mx-auto mb-3 opacity-80`} />
                <h2 className="text-2xl font-black text-white mb-2">Hone Your Skills</h2>
                <p className="text-slate-400 text-xs">As a <strong className="text-white">{char.classes[0].name}</strong>, you may select exactly <strong className="text-white">{limits.skills}</strong> skills from your class list.</p>
                <div className="mt-3 inline-block bg-slate-950 px-3 py-1 rounded-full border border-slate-800 shadow-inner">
                   <span className={`text-xs font-black tracking-widest uppercase ${pickedSkills.length === limits.skills ? 'text-emerald-400' : activeTheme.text}`}>
                     {pickedSkills.length} / {limits.skills} Selected
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {allowedSkills.map(skill => {
                  const isSelected = pickedSkills.includes(skill);
                  const isMaxedOut = !isSelected && pickedSkills.length >= limits.skills;
                  return (
                    <button 
                      key={skill} 
                      onClick={() => toggleSkill(skill)}
                      disabled={isMaxedOut} 
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm flex justify-between items-center ${isSelected ? `${activeTheme.bg} border-transparent text-white` : isMaxedOut ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      <span>{skill.split(' ')[0]}</span>
                      <span className="opacity-50 text-[9px]">{skill.split(' ')[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'spells' && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-white mb-1">Scribe Starting Spells</h2>
                <p className="text-slate-400 text-xs">As a <strong className="text-white">{char.classes[0].name}</strong>, select your arcane texts.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner min-h-[70px]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cantrips Scribed</h4>
                    <span className={`text-[10px] font-black ${pickedCantrips.length === limits.cantrips ? 'text-emerald-400' : 'text-slate-400'}`}>{pickedCantrips.length}/{limits.cantrips}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pickedCantrips.map((spell, i) => (
                       <span key={i} className="bg-indigo-900/40 text-indigo-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-700/50 shadow-sm">
                         {spell.name} <button onClick={() => setPickedCantrips(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors"><X className="w-3 h-3"/></button>
                       </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner min-h-[70px]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Spells Scribed</h4>
                    <span className={`text-[10px] font-black ${pickedSpells.length === limits.spells ? 'text-emerald-400' : 'text-slate-400'}`}>{pickedSpells.length}/{limits.spells}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pickedSpells.map((spell, i) => (
                       <span key={i} className="bg-fuchsia-900/40 text-fuchsia-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-fuchsia-700/50 shadow-sm">
                         {spell.name} <button onClick={() => setPickedSpells(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors"><X className="w-3 h-3"/></button>
                       </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="-mx-2 px-2">
                 <SpellDiscovery 
                   className={char.classes?.[0]?.name}
                   onAddSpell={handleAddSpell} 
                   allowAdd={true} 
                   maxSpellLevel={1} 
                 />
              </div>
            </div>
          )}

          {currentStep === 'interface' && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">The Interface</h2>
                <p className="text-slate-400 text-sm">Your sheet tracks all the complex math for you.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start shadow-inner transition-colors group hover:border-slate-500">
                  <div className={`p-2.5 rounded-xl ${activeTheme.bg} bg-opacity-20 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                    <Heart className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wider">Health & Stats</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Tap the numbers in your HP bar to manually edit them. Modifiers are automatically calculated from your base stats.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start shadow-inner transition-colors group hover:border-slate-500">
                  <div className={`p-2.5 rounded-xl ${activeTheme.bg} bg-opacity-20 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                    <ArrowUpCircle className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wider">Ascension</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Enter XP directly into the tracker. When you hit 100%, a massive button will appear to guide you through Leveling Up.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'navigation' && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white mb-2">Navigation</h2>
                <p className="text-slate-400 text-sm">Everything you need is a swipe away.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start shadow-inner transition-colors group hover:border-slate-500">
                  <div className={`p-2.5 rounded-xl ${activeTheme.bg} bg-opacity-20 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                    <Backpack className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wider">The Bottom Menu</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Use the scrolling menu to switch between Combat, Spells, Inventory, Party Loot, and your Private Journal.</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-start shadow-inner transition-colors group hover:border-slate-500">
                  <div className={`p-2.5 rounded-xl ${activeTheme.bg} bg-opacity-20 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                    <Tent className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 uppercase tracking-wider">Resting</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">The Short Rest and Long Rest buttons will automatically heal you and recover spent spell slots and class resources.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex gap-2 pl-2">
            {steps.map((s, i) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${stepIndex >= i ? activeTheme.bg : 'bg-slate-700'}`} />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`px-6 py-3 rounded-xl ${activeTheme.bg} hover:opacity-90 text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg group focus:outline-none focus:ring-2 focus:ring-white`}
          >
            {stepIndex < steps.length - 1 ? (
              <>Next <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            ) : (
              <>Manifest <CheckCircle2 className="w-4 h-4" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}