import { Shield, Heart, Wind, Moon, Sun, Swords, BookOpen, PawPrint } from 'lucide-react';

export default function CompanionTab({ char, activeTheme }) {
  const companion = char.companion;
  if (!companion) return null;

  const isCurrentlyDormant = companion.isDormant && char.level < companion.awakeLevel;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {isCurrentlyDormant && (
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-6 text-center shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 z-10 flex flex-col items-center justify-center">
             <Moon className="w-12 h-12 text-slate-500 mb-3 opacity-50 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
             <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{companion.name} is Dormant</h3>
             <p className="text-sm font-bold text-slate-500 mt-2 max-w-md mx-auto">
               This companion is currently inactive or hasn't fully awakened yet. They will awaken when {char.name || 'you'} reaches Level {companion.awakeLevel}.
             </p>
          </div>
          <div className="opacity-20 grayscale pointer-events-none">
             <CompanionContent companion={companion} activeTheme={activeTheme} />
          </div>
        </div>
      )}

      {!isCurrentlyDormant && (
        <div className="relative">
          {companion.isDormant && (
            <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] z-20 flex items-center gap-1">
              <Sun className="w-3 h-3" /> Awakened
            </div>
          )}
          <CompanionContent companion={companion} activeTheme={activeTheme} />
        </div>
      )}
    </div>
  );
}

function CompanionContent({ companion, activeTheme }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-4 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bg} opacity-20 blur-[50px] rounded-full pointer-events-none`}></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b-2 border-slate-950 pb-4 relative z-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none">
              <PawPrint className={`w-8 h-8 ${activeTheme.text} drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`} /> {companion.name}
            </h2>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800 inline-block shadow-inner">{companion.species}</p>
          </div>
          
          <div className="flex gap-2">
            <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Heart className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HP</span>
              <span className="text-xl font-black text-white leading-none mt-1">{companion.hp}</span>
            </div>
            <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Shield className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AC</span>
              <span className="text-xl font-black text-white leading-none mt-1">{companion.ac}</span>
            </div>
            <div className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Wind className="w-5 h-5 text-sky-400 mb-1" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SPD</span>
              <span className="text-xl font-black text-white leading-none mt-1">{companion.speed}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-2 relative z-10">
          {Object.entries(companion.stats || {}).map(([stat, value]) => {
             const mod = Math.floor((value - 10) / 2);
             const displayMod = mod >= 0 ? `+${mod}` : mod;
             return (
               <div key={stat} className="bg-slate-900 border-2 border-slate-950 rounded-xl p-3 flex flex-col items-center shadow-inner">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat}</span>
                 <span className="text-2xl font-black text-white leading-none drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{value}</span>
                 <span className={`text-xs font-black mt-1 bg-slate-950 px-1.5 py-0.5 rounded ${mod >= 0 ? activeTheme.text : 'text-red-400'}`}>{displayMod}</span>
               </div>
             );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
             <Swords className={`w-5 h-5 ${activeTheme.text}`} /> Actions & Attacks
           </h3>
           <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-inner">
             {companion.attacks || 'No specific attacks listed.'}
           </p>
        </div>

        <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b-2 border-slate-950 pb-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
             <BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Traits & Features
           </h3>
           <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-inner">
             {companion.traits || companion.desc || 'No specific traits listed.'}
           </p>
        </div>
      </div>
    </div>
  );
}