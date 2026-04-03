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
    <div className="relative bg-slate-900 border-2 border-slate-950 rounded-xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-between p-2 mt-4">
      <div className={`absolute left-0 top-0 bottom-0 ${canLevelUp ? 'bg-amber-500/30' : 'bg-blue-500/20'} transition-all duration-500 border-r-2 border-slate-950`} style={{ width: `${xpPercent}%` }}></div>
      <div className="relative z-10 flex items-center gap-2 pl-2">
        {canLevelUp && !isDM ? (
           <button 
             onClick={onOpenLevelUp} 
             className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-slate-950 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] animate-pulse"
           >
             <ArrowUpCircle className="w-3.5 h-3.5" /> Level Up
           </button>
        ) : (
           <>
             <ArrowUpCircle className={`w-4 h-4 ${canLevelUp ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`} />
             <span className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest drop-shadow-sm">Experience</span>
           </>
        )}
      </div>
      <div className="relative z-10 flex items-center gap-1 pr-1">
        <button onClick={() => adjustXp(-50)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-black flex items-center justify-center border-2 border-slate-900 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] cursor-pointer">-</button>
        <div className="flex items-center gap-1 text-white bg-slate-950 border-2 border-slate-900 rounded-lg px-2 py-0.5 md:py-1 shadow-inner">
          
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
          <span className="w-12 md:w-16 text-left text-slate-400 text-sm md:text-base font-black">{nextLevelXp}</span>
        </div>
        <button onClick={() => adjustXp(50)} className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-black flex items-center justify-center border-2 border-slate-900 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] cursor-pointer">+</button>
      </div>
    </div>
  );
}