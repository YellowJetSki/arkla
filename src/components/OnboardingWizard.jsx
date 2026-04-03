import { useState, useEffect } from 'react';
import { Compass, Heart, Backpack, Tent, ChevronRight, CheckCircle2, ArrowUpCircle } from 'lucide-react';

const THEMES = {
  indigo: { name: 'Tenari Void', desc: 'The lingering, arcane resonance of the magic-wielding giants of old.', bg: 'bg-indigo-500', ring: 'ring-indigo-500', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  emerald: { name: "Smuggler's Emerald", desc: 'The color of the untamed Arkla seas and the secret coves of the pirate crews.', bg: 'bg-emerald-500', ring: 'ring-emerald-500', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  rose: { name: 'Dragonfire Rose', desc: 'A harsh, primal reminder of the nefarious dragons that once tormented the realm.', bg: 'bg-rose-500', ring: 'ring-rose-500', border: 'border-rose-500/50', text: 'text-rose-400' },
  amber: { name: "Crown's Radiance", desc: 'The authoritative, golden banner of Emperor Hearn and the Republic.', bg: 'bg-amber-500', ring: 'ring-amber-500', border: 'border-amber-500/50', text: 'text-amber-400' },
  sky: { name: "Privateer's Sky", desc: 'The boundless horizon sought by port-town rebels raising the black flag.', bg: 'bg-sky-500', ring: 'ring-sky-500', border: 'border-sky-500/50', text: 'text-sky-400' },
};

export default function OnboardingWizard({ char, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(char.theme && THEMES[char.theme] ? char.theme : 'indigo');
  const [typedWelcome, setTypedWelcome] = useState('');

  const firstName = (char.name || 'Traveler').split(' ')[0];
  const welcomeText = `Welcome, ${firstName}. Your legacy begins now.`;

  const steps = ['theme', 'interface', 'navigation'];
  const currentStep = steps[stepIndex];
  const activeTheme = THEMES[selectedTheme];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete({ theme: selectedTheme });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${activeTheme.bg} opacity-10 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000`}></div>

      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-3xl w-full max-w-md shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden transition-all duration-500 max-h-[90dvh]">
        
        <div className="absolute top-0 left-0 right-0 flex h-2 bg-slate-950 z-20 shadow-inner">
          <div className={`h-full ${activeTheme.bg} transition-all duration-500`} style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="p-6 relative z-10 flex flex-col flex-1 overflow-y-auto custom-scrollbar pt-10">
          
          {currentStep === 'theme' && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8 flex flex-col items-center justify-center">
                <Compass className={`w-12 h-12 ${activeTheme.text} mx-auto mb-6 animate-[spin_10s_linear_infinite] opacity-50 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`} />
                <div className="min-h-[72px] flex items-end justify-center w-full mb-3">
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{typedWelcome}<span className="animate-pulse text-slate-500">_</span></h2>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Before you enter the realm, claim your signature aura.</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border-2 border-slate-900 p-5 mb-6 mt-auto shadow-inner">
                 <div className="text-center mb-6 min-h-[60px]">
                   <h3 className={`font-black text-lg ${activeTheme.text} uppercase tracking-widest transition-colors drop-shadow-sm`}>{activeTheme.name}</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2 transition-colors leading-relaxed">{activeTheme.desc}</p>
                 </div>
                 
                 <div className="flex justify-center gap-3 flex-wrap">
                   {Object.keys(THEMES).map(t => (
                     <button 
                       key={t} 
                       onClick={() => setSelectedTheme(t)} 
                       className={`w-12 h-12 rounded-xl ${THEMES[t].bg} relative transition-all duration-300 group outline-none focus:ring-0 shrink-0 border-[3px] shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${selectedTheme === t ? 'border-white scale-110' : 'border-slate-950 opacity-50 hover:opacity-100'}`}
                       title={THEMES[t].name}
                     >
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          )}

          {currentStep === 'interface' && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">The Interface</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Your sheet tracks all the complex math for you.</p>
              </div>

              <div className="space-y-4">
                <div className={`bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors hover:border-slate-700`}>
                  <div className={`p-3 rounded-xl bg-slate-950 border-2 border-slate-900 shrink-0 shadow-inner`}>
                    <Heart className={`w-6 h-6 ${activeTheme.text} drop-shadow-sm`} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm mb-1.5 uppercase tracking-widest">Health & Stats</h4>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">Tap the numbers in your HP bar to manually edit them. Modifiers are automatically calculated from your base stats.</p>
                  </div>
                </div>

                <div className={`bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors hover:border-slate-700`}>
                  <div className={`p-3 rounded-xl bg-slate-950 border-2 border-slate-900 shrink-0 shadow-inner`}>
                    <ArrowUpCircle className={`w-6 h-6 ${activeTheme.text} drop-shadow-sm`} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm mb-1.5 uppercase tracking-widest">Ascension</h4>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">Enter XP directly into the tracker. When you hit 100%, a massive button will appear to guide you through Leveling Up.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'navigation' && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col justify-center min-h-[400px]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Navigation</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Everything you need is a swipe away.</p>
              </div>

              <div className="space-y-4">
                <div className={`bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors hover:border-slate-700`}>
                  <div className={`p-3 rounded-xl bg-slate-950 border-2 border-slate-900 shrink-0 shadow-inner`}>
                    <Backpack className={`w-6 h-6 ${activeTheme.text} drop-shadow-sm`} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm mb-1.5 uppercase tracking-widest">The Bottom Menu</h4>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">Use the scrolling menu to switch between Combat, Spells, Inventory, Party Loot, and your Private Journal.</p>
                  </div>
                </div>

                <div className={`bg-slate-900 p-5 rounded-2xl border-[3px] border-slate-950 flex gap-4 items-start shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors hover:border-slate-700`}>
                  <div className={`p-3 rounded-xl bg-slate-950 border-2 border-slate-900 shrink-0 shadow-inner`}>
                    <Tent className={`w-6 h-6 ${activeTheme.text} drop-shadow-sm`} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm mb-1.5 uppercase tracking-widest">Resting</h4>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">The Short Rest and Long Rest buttons will automatically heal you and recover spent spell slots and class resources.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-5 bg-slate-900 border-t-[3px] border-slate-950 flex items-center justify-between shrink-0">
          <div className="flex gap-2 pl-2">
            {steps.map((s, i) => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 border border-slate-950 shadow-inner ${stepIndex >= i ? activeTheme.bg : 'bg-slate-800'}`} />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`px-8 py-3.5 rounded-xl ${activeTheme.bg} text-slate-950 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none outline-none group`}
          >
            {stepIndex < steps.length - 1 ? (
              <>Next Step <ChevronRight className="w-4 h-4 font-black group-hover:translate-x-1 transition-transform" /></>
            ) : (
              <>Manifest Destiny <CheckCircle2 className="w-4 h-4 font-black" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}