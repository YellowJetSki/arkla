import { useState } from 'react';
import { Sparkles, Heart, Zap, Backpack, Tent, ChevronRight, CheckCircle2, ArrowUpCircle } from 'lucide-react';

const THEMES = {
  indigo: { bg: 'bg-indigo-600', ring: 'ring-indigo-500', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  emerald: { bg: 'bg-emerald-600', ring: 'ring-emerald-500', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  rose: { bg: 'bg-rose-600', ring: 'ring-rose-500', border: 'border-rose-500/50', text: 'text-rose-400' },
  amber: { bg: 'bg-amber-600', ring: 'ring-amber-500', border: 'border-amber-500/50', text: 'text-amber-400' },
  sky: { bg: 'bg-sky-600', ring: 'ring-sky-500', border: 'border-sky-500/50', text: 'text-sky-400' },
};

export default function OnboardingWizard({ charName, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('indigo');

  const activeTheme = THEMES[selectedTheme];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(selectedTheme);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl h-[100dvh] overflow-hidden animate-in fade-in duration-500">
      <div className={`bg-slate-900 border ${activeTheme.border} rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden transition-colors duration-500`}>
        
        {/* Ambient Glow based on selected theme */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 ${activeTheme.bg} opacity-10 blur-[80px] rounded-full pointer-events-none transition-colors duration-500`}></div>

        <div className="p-6 relative z-10 flex flex-col min-h-[400px]">
          
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col justify-center">
              <div className="text-center mb-8">
                <Sparkles className={`w-12 h-12 ${activeTheme.text} mx-auto mb-4 animate-pulse`} />
                <h2 className="text-2xl font-black text-white mb-2">Welcome, {charName.split(' ')[0]}!</h2>
                <p className="text-slate-400 text-sm">Let's get your character sheet set up. First, choose your signature energy color.</p>
              </div>

              <div className="flex justify-center gap-4 mb-4">
                {Object.keys(THEMES).map(t => (
                  <button 
                    key={t} 
                    onClick={() => setSelectedTheme(t)} 
                    className={`w-10 h-10 rounded-full ${THEMES[t].bg} ${selectedTheme === t ? 'ring-2 ring-offset-4 ring-offset-slate-900 ring-white scale-125 shadow-lg' : 'opacity-50 hover:opacity-100 hover:scale-110'} transition-all`}
                    title={`Select ${t} theme`}
                  ></button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white mb-2">The Basics</h2>
                <p className="text-slate-400 text-sm">Your sheet tracks all the math for you.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${activeTheme.bg} bg-opacity-20 shrink-0`}>
                    <Heart className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Health & Stats</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Tap the numbers in your HP bar to manually edit them. All of your Ability Score modifiers are automatically calculated for you.</p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${activeTheme.bg} bg-opacity-20 shrink-0`}>
                    <ArrowUpCircle className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Experience & Leveling</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Enter your XP directly into the tracker. When you hit 100%, a massive Level Up button will appear to guide you through Ascension!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 duration-300 flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white mb-2">Navigation</h2>
                <p className="text-slate-400 text-sm">Everything you need is a swipe away.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${activeTheme.bg} bg-opacity-20 shrink-0`}>
                    <Backpack className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">The Bottom Bar</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Use the scrolling menu at the bottom of the screen to switch between your Combat, Spells, Inventory, Party Loot, and Private Journal.</p>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex gap-4 items-start">
                  <div className={`p-2 rounded-lg ${activeTheme.bg} bg-opacity-20 shrink-0`}>
                    <Tent className={`w-6 h-6 ${activeTheme.text}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Resting & Recovery</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Use the Short Rest and Long Rest buttons to automatically heal and recover your spent spell slots and class resources.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? activeTheme.bg : 'bg-slate-700'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? activeTheme.bg : 'bg-slate-700'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${step === 3 ? activeTheme.bg : 'bg-slate-700'}`} />
            </div>
          </div>

        </div>

        <button 
          onClick={handleNext}
          className={`w-full p-5 ${activeTheme.bg} hover:opacity-90 text-white font-black text-lg flex items-center justify-center gap-2 transition-all relative z-10`}
        >
          {step < 3 ? (
            <>Next <ChevronRight className="w-5 h-5" /></>
          ) : (
            <>Enter the Campaign <CheckCircle2 className="w-5 h-5" /></>
          )}
        </button>

      </div>
    </div>
  );
}