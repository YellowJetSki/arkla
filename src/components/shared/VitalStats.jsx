import { useState } from 'react';
import { Shield, Heart, Zap, Plus, Minus, ShieldPlus } from 'lucide-react';

export default function VitalStats({ 
  hp, maxHp, tempHp = 0, ac, speed, initiative, 
  onHpChange, onTempHpChange, onAcChange, onSpeedChange,
  isEditable = false, isDM = false 
}) {
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [displayHp, setDisplayHp] = useState("");

  const [isEditingTempHp, setIsEditingTempHp] = useState(false);
  const [displayTempHp, setDisplayTempHp] = useState("");

  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 w-full">
      {/* Health Badge */}
      <div className="flex items-center flex-nowrap shrink-0 gap-1 md:gap-2 bg-slate-900/80 p-1.5 md:p-2 rounded-lg border border-slate-700 shadow-inner">
        <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-400 fill-red-400/20" />
        
        {isEditable && (
          <button 
            onClick={() => onHpChange(hp - 1)}
            className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 active:scale-95 transition-transform"
          >
            <Minus className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        )}
        
        <div className="flex items-center gap-1">
          {isEditable ? (
             <input 
               type="number" 
               value={isEditingHp ? displayHp : hp} 
               onFocus={(e) => { setDisplayHp(hp); setIsEditingHp(true); e.target.select(); }}
               onChange={(e) => setDisplayHp(e.target.value)} 
               onBlur={() => { setIsEditingHp(false); onHpChange(Number(displayHp)); }}
               onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
               className="w-6 md:w-8 bg-transparent focus:bg-slate-800 text-center text-white font-bold text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-red-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
             />
          ) : (
             <span className="font-bold text-white px-1 text-sm md:text-base">{hp}</span>
          )}
          <span className="font-bold text-slate-500 text-sm md:text-base">/ {maxHp}</span>
        </div>
        
        {isEditable && (
          <button 
            onClick={() => onHpChange(hp + 1)}
            className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 active:scale-95 transition-transform"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        )}
      </div>

      {/* Temporary HP */}
      {(tempHp > 0 || isDM) && (
        <div className="flex items-center flex-nowrap shrink-0 gap-1 md:gap-2 bg-yellow-900/20 p-1.5 md:p-2 rounded-lg border border-yellow-700/50 shadow-inner">
          <ShieldPlus className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
          
          {isDM && (
            <button 
              onClick={() => onTempHpChange(Math.max(0, tempHp - 1))}
              className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 active:scale-95 transition-transform"
            >
              <Minus className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-1">
             {isDM ? (
                 <input 
                   type="number" 
                   value={isEditingTempHp ? displayTempHp : tempHp} 
                   onFocus={(e) => { setDisplayTempHp(tempHp); setIsEditingTempHp(true); e.target.select(); }}
                   onChange={(e) => setDisplayTempHp(e.target.value)} 
                   onBlur={() => { setIsEditingTempHp(false); onTempHpChange(Number(displayTempHp)); }}
                   onKeyDown={(e) => { if(e.key === 'Enter') e.target.blur(); }}
                   className="w-6 md:w-8 bg-transparent focus:bg-yellow-900/50 text-center text-yellow-400 font-bold text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-yellow-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                 />
             ) : (
                <span className="font-bold text-yellow-400 px-1 text-sm md:text-base">{tempHp}</span>
             )}
             <span className="font-bold text-yellow-600 text-sm md:text-base">THP</span>
          </div>
          
          {isDM && (
            <button 
              onClick={() => onTempHpChange(tempHp + 1)}
              className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      )}

      {/* Armor Class */}
      <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-700 shadow-inner">
        <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-400 fill-blue-400/20" />
        {isDM ? (
          <input 
            type="number" 
            defaultValue={ac} 
            onBlur={(e) => onAcChange(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="w-8 bg-transparent text-white font-bold text-sm md:text-base focus:outline-none border-b border-transparent focus:border-blue-500 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        ) : (
          <span className="font-bold text-white text-sm md:text-base">{ac}</span>
        )}
        <span className="font-bold text-slate-500 text-sm md:text-base">AC</span>
      </div>

      {/* Initiative */}
      {initiative !== undefined && initiative !== null && (
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-700 shadow-inner">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-yellow-400/20" />
          <span className="font-bold text-white text-sm md:text-base">
            {initiative >= 0 ? '+' : ''}{initiative} INIT
          </span>
        </div>
      )}

      {/* Speed */}
      <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-slate-700 shadow-inner">
        <span className="text-slate-500 text-xs md:text-sm font-bold">SPD</span>
        {isDM ? (
          <input 
            type="number" 
            defaultValue={speed} 
            onBlur={(e) => onSpeedChange(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="w-8 bg-transparent text-white font-bold text-sm md:text-base focus:outline-none border-b border-transparent focus:border-slate-400 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        ) : (
          <span className="font-bold text-white text-sm md:text-base">{speed}</span>
        )}
      </div>
    </div>
  );
}