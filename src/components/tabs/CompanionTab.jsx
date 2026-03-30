import { Shield, Heart, Wind, Moon, Sun, Swords, BookOpen, PawPrint } from 'lucide-react';

export default function CompanionTab({ char, activeTheme }) {
  const companion = char.companion;
  if (!companion) return null;

  const isCurrentlyDormant = companion.isDormant && char.level < companion.awakeLevel;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {isCurrentlyDormant && (
        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 text-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
             <Moon className="w-12 h-12 text-slate-500 mb-3 opacity-50" />
             <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">{companion.name} is Dormant</h3>
             <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
               This companion is currently inactive or hasn't fully awakened yet. They will awaken when {char.name} reaches Level {companion.awakeLevel}.
             </p>
          </div>
          {/* Faded background representation of the companion */}
          <div className="opacity-10 blur-sm pointer-events-none">
             <CompanionContent companion={companion} activeTheme={activeTheme} />
          </div>
        </div>
      )}

      {!isCurrentlyDormant && (
        <div className="relative">
          {companion.isDormant && (
            <div className="absolute -top-3 -right-3 bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-20 flex items-center gap-1">
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
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bg} opacity-10 blur-[50px] rounded-full pointer-events-none`}></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-slate-800 pb-4 relative z-10 gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <PawPrint className={`w-6 h-6 ${activeTheme.text}`} /> {companion.name}
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{companion.species}</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-inner">
              <Heart className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">HP</span>
              <span className="text-lg font-black text-white">{companion.hp}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-inner">
              <Shield className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">AC</span>
              <span className="text-lg font-black text-white">{companion.ac}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[70px] shadow-inner">
              <Wind className="w-4 h-4 text-sky-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Speed</span>
              <span className="text-lg font-black text-white">{companion.speed}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6 relative z-10">
          {Object.entries(companion.stats || {}).map(([stat, value]) => {
             const mod = Math.floor((value - 10) / 2);
             const displayMod = mod >= 0 ? `+${mod}` : mod;
             return (
               <div key={stat} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center shadow-inner">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat}</span>
                 <span className="text-xl font-black text-white">{value}</span>
                 <span className={`text-xs font-bold ${mod >= 0 ? activeTheme.text : 'text-red-400'}`}>{displayMod}</span>
               </div>
             );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
             <Swords className={`w-4 h-4 ${activeTheme.text}`} /> Actions & Attacks
           </h3>
           <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
             {companion.attacks || 'No specific attacks listed.'}
           </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
             <BookOpen className={`w-4 h-4 ${activeTheme.text}`} /> Description & Traits
           </h3>
           <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
             {companion.desc || 'No description provided.'}
           </p>
        </div>
      </div>
    </div>
  );
}