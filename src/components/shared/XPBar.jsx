import { Zap } from 'lucide-react';

export default function XPBar({ exp = 0, level = 1 }) {
  // Standard D&D 5e XP Thresholds
  const xpLevels = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
  ];

  const currentLevelXP = xpLevels[level - 1] || 0;
  // If they are level 20+, just cap the next level at the max threshold
  const nextLevelXP = xpLevels[level] || xpLevels[19]; 
  
  // Calculate percentage, clamped between 0 and 100
  const progress = Math.min(100, Math.max(0, ((exp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));

  return (
    <div className="w-full mt-3 mb-2">
      <div className="flex justify-between items-end text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-emerald-400" /> XP {exp}
        </span>
        <span>Next: {nextLevelXP}</span>
      </div>
      <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.8)] relative" 
          style={{ width: `${progress}%` }}
        >
          {/* Add a tiny glowing tip to the progress bar */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
        </div>
      </div>
    </div>
  );
}