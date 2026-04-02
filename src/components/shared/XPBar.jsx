import { ArrowUpCircle } from 'lucide-react';

export default function XPBar({ 
  currentXp, 
  nextLevelXp, 
  xpPercent, 
  canLevelUp, 
  isDM, 
  isEditingXp, 
  displayXp, 
  setDisplayXp, 
  setIsEditingXp, 
  adjustXp, 
  updateField, 
  onOpenLevelUp 
}) {
  return (
    <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-2">
      <div className={`absolute left-0 top-0 bottom-0 ${canLevelUp ? 'bg-amber-500/30' : 'bg-blue-500/20'} transition-all duration-500`} style={{ width: `${xpPercent}%` }}></div>
      <div className="relative z-10 flex items-center gap-2 pl-2">
        {canLevelUp && !isDM ? (
           <button 
             onClick={onOpenLevelUp} 
             className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"
           >
             <ArrowUpCircle className="w-3.5 h-3.5" /> Level Up
           </button>
        ) : (
           <>
             <ArrowUpCircle className={`w-4 h-4 ${canLevelUp ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
             <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Experience</span>
           </>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-1 pr-1">
        <button onClick={() => adjustXp(-50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
        <div className="flex items-center gap-1 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-0.5 md:py-1">
          
          <input 
            type="number" 
            value={isEditingXp ? displayXp : currentXp} 
            onFocus={(e) => { setDisplayXp(currentXp); setIsEditingXp(true); e.target.select(); }}
            onChange={(e) => setDisplayXp(e.target.value)} 
            onBlur={() => { setIsEditingXp(false); updateField('exp', Number(displayXp)); }}
            onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
            className="w-12 md:w-16 bg-transparent focus:outline-none text-right font-black text-sm md:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-100" 
          />
          
          <span className="text-slate-500 font-black text-sm md:text-base">/</span>
          <span className="w-12 md:w-16 text-left text-slate-400 text-sm md:text-base font-bold">{nextLevelXp}</span>
        </div>
        <button onClick={() => adjustXp(50)} className="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 font-bold flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
      </div>
    </div>
  );
}