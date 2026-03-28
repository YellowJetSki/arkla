import { useState, useEffect } from 'react';
import { Sparkles, Heart, Zap, Backpack, Tent, ChevronRight, CheckCircle2, ArrowUpCircle, Compass } from 'lucide-react';

const THEMES = {
  indigo: { name: 'Arcane Indigo', desc: 'The mark of scholars, wizards, and astral wanderers.', bg: 'bg-indigo-600', ring: 'ring-indigo-500', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  emerald: { name: 'Druidic Emerald', desc: 'Bound to nature, beasts, and the deep forest.', bg: 'bg-emerald-600', ring: 'ring-emerald-500', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  rose: { name: 'Blood Rose', desc: 'Fueled by passion, combat, and primal rage.', bg: 'bg-rose-600', ring: 'ring-rose-500', border: 'border-rose-500/50', text: 'text-rose-400' },
  amber: { name: 'Radiant Amber', desc: 'Blessed by divine light and holy restoration.', bg: 'bg-amber-600', ring: 'ring-amber-500', border: 'border-amber-500/50', text: 'text-amber-400' },
  sky: { name: 'Astral Sky', desc: 'Swift as the wind, masters of agility and focus.', bg: 'bg-sky-600', ring: 'ring-sky-500', border: 'border-sky-500/50', text: 'text-sky-400' },
};

export default function OnboardingWizard({ charName, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('indigo');
  const [typedWelcome, setTypedWelcome] = useState('');
  
  const activeTheme = THEMES[selectedTheme];
  const firstName = charName.split(' ')[0];
  const welcomeText = `Welcome, ${firstName}. Your legacy begins now.`;

  // Typewriter effect for the welcome message
  useEffect(() => {
    if (step === 1) {
      let i = 0;
      setTypedWelcome('');
      const typingId = setInterval(() => {
        setTypedWelcome(welcomeText.substring(0, i));
        i++;
        if (i > welcomeText.length) clearInterval(typingId);
      }, 50);
      return () => clearInterval(typingId);
    }
  }, [step, welcomeText]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(selectedTheme);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      {/* Immersive Portal Background */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${activeTheme.bg} opacity-5 blur-[150px] rounded-full pointer-events-none transition-colors duration-1000`}></div>

      <div className={`bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500`}>
        
        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 flex h-1 bg-slate-800 z-20">
          <div className={`h-full ${activeTheme.bg} transition-all duration-500`} style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="p-6 relative z-10 flex flex-col min-h-[450px]">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col justify-center">
              <div className="text-center mb-8 flex flex-col items-center justify-center">
                <Compass className={`w-12 h-12 ${activeTheme.text} mx-auto mb-4 animate-[spin_10s_linear_infinite] opacity-50`} />
                <div className="min-h-[72px] flex items-end justify-center w-full mb-3">
                  <h2 className="text-2xl font-black text-white leading-tight">{typedWelcome}<span className="animate-pulse">|</span></h2>
                </div>
                <p className="text-slate-400 text-sm opacity-80">Before you enter the realm, claim your signature aura.</p>
              </div>

              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-4 mb-6">
                 <div className="text-center mb-4 min-h-[60px]">
                   <h3 className={`font-black text-lg ${activeTheme.text} uppercase tracking-widest transition-colors`}>{activeTheme.name}</h3>
                   <p className="text-xs text-slate-400 mt-1 italic transition-colors">{activeTheme.desc}</p>
                 </div>
                 
                 <div className="flex justify-center gap-3">
                   {Object.keys(THEMES).map(t => (
                     <button 
                       key={t} 
                       onClick={() => setSelectedTheme(t)} 
                       className={`w-10 h-10 rounded-full ${THEMES[t].bg} relative transition-all duration-300 group`}
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

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col justify-center">
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

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-500 flex-1 flex flex-col justify-center">
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
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= i ? activeTheme.bg : 'bg-slate-700'}`} />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`px-6 py-3 rounded-xl ${activeTheme.bg} hover:opacity-90 text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg group`}
          >
            {step < 3 ? (
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