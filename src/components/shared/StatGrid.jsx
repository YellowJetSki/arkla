export default function StatGrid({ stats = {} }) {
  // Official 5e math to convert an Ability Score into a Modifier
  const calculateModifier = (score) => {
    const mod = Math.floor((Number(score || 10) - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Enforce the standard D&D stat order visually
  const STAT_ORDER = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
      {STAT_ORDER.map(stat => {
        const score = stats[stat] || 10;
        const mod = calculateModifier(score);
        
        return (
          <div 
            key={stat} 
            className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center shadow-md relative overflow-hidden group hover:border-indigo-500/50 transition-colors"
          >
            {/* Ambient Top Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 group-hover:bg-indigo-500 transition-colors"></div>
            
            <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 z-10">
              {stat}
            </span>
            
            {/* Massive Auto-Calculated Modifier */}
            <span className="text-3xl md:text-4xl font-black text-white mb-1 z-10 drop-shadow-sm">
              {mod}
            </span>
            
            {/* Small Base Score in a Badge */}
            <div className="bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-600 shadow-inner z-10">
              <span className="text-xs md:text-sm font-bold text-slate-400">
                {score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}