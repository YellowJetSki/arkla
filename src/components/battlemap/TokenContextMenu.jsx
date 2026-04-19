import { Maximize, CircleDashed, ArrowUpCircle, BrainCircuit, Ruler, EyeOff, Image as ImageIcon, Trash2, Skull, X } from 'lucide-react';
import { useState } from 'react';

// Common D&D 5e Conditions
const CONDITIONS_LIST = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'
];

export default function TokenContextMenu({ 
  token, 
  tokenX, 
  mapCols, 
  displayName, 
  onUpdateHpLive, 
  onDeselect, 
  onToggleSize, 
  onToggleAura, 
  onToggleElevation, 
  onToggleConcentration, 
  onToggleRuler, 
  onToggleHidden, 
  onUpdateImage, 
  onRemoveToken, 
  onToggleCondition,
  showMovementRangeFor 
}) {
  const [showConditions, setShowConditions] = useState(false);
  
  // Decide whether to render the menu to the left or right of the token so it doesn't go off-screen
  const openLeft = tokenX > (mapCols - 4);
  const positionClass = openLeft ? 'right-full mr-2' : 'left-full ml-2';

  return (
    <div className={`absolute top-0 ${positionClass} flex flex-col gap-2 z-[100] w-48 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto`}>
      
      {/* HEADER */}
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-indigo-600 px-3 py-2 flex justify-between items-center border-b-2 border-slate-950">
          <span className="font-black text-[10px] uppercase tracking-widest text-slate-950 truncate drop-shadow-sm">{displayName}</span>
          <button onClick={(e) => { e.stopPropagation(); onDeselect(); }} className="text-slate-950 hover:text-white transition-colors"><X className="w-4 h-4 font-black" /></button>
        </div>
        
        <div className="p-2 grid grid-cols-4 gap-1.5 bg-slate-950">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSize(token.id); }} 
            className="p-2 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-950 shadow-inner flex items-center justify-center" 
            title="Toggle Token Size"
          >
            <Maximize className="w-4 h-4" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleAura(token.id); }} 
            className={`p-2 rounded-lg transition-colors border shadow-inner flex items-center justify-center ${token.aura > 0 ? 'bg-indigo-600 text-white border-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'}`} 
            title="Toggle Aura (Light/Effect)"
          >
            <CircleDashed className="w-4 h-4" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleElevation(token.id); }} 
            className={`p-2 rounded-lg transition-colors border shadow-inner flex items-center justify-center ${token.elevation > 0 ? 'bg-sky-500 text-slate-950 border-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'}`} 
            title="Toggle Flight/Elevation"
          >
            <ArrowUpCircle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleConcentration(token.id); }} 
            className={`p-2 rounded-lg transition-colors border shadow-inner flex items-center justify-center ${token.isConcentrating ? 'bg-amber-400 text-slate-950 border-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'}`} 
            title="Toggle Concentration"
          >
            <BrainCircuit className="w-4 h-4" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onToggleRuler(token.id); }} 
            className={`p-2 rounded-lg transition-colors border shadow-inner flex items-center justify-center ${showMovementRangeFor?.id === token.id ? 'bg-emerald-500 text-slate-950 border-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'}`} 
            title="Show Movement Range"
          >
            <Ruler className="w-4 h-4" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onToggleHidden(token.id); }} 
            className={`p-2 rounded-lg transition-colors border shadow-inner flex items-center justify-center ${token.isHidden ? 'bg-amber-500 text-slate-950 border-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'}`} 
            title="Hide from Players"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onUpdateImage(token.id); }} 
            className="p-2 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-950 shadow-inner flex items-center justify-center" 
            title="Change Token Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); if(onRemoveToken) onRemoveToken(token.id); }} 
            className="p-2 bg-slate-900 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-950 shadow-inner flex items-center justify-center" 
            title="Undeploy / Delete Token"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK HP EDIT */}
      {token.hp !== undefined && (
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] p-2">
          <div className="flex gap-1.5 mb-2">
            <button onClick={(e) => { e.stopPropagation(); onUpdateHpLive(token.id, token.hp - 1); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">- 1</button>
            <button onClick={(e) => { e.stopPropagation(); onUpdateHpLive(token.id, token.hp - 5); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">- 5</button>
          </div>
          <div className="flex gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onUpdateHpLive(token.id, token.hp + 1); }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">+ 1</button>
            <button onClick={(e) => { e.stopPropagation(); onUpdateHpLive(token.id, token.hp + 5); }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">+ 5</button>
          </div>
        </div>
      )}

      {/* CONDITIONS TOGGLE */}
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowConditions(!showConditions); }}
          className={`w-full px-3 py-2 flex justify-between items-center transition-colors ${showConditions ? 'bg-fuchsia-600 text-slate-950' : 'bg-slate-950 hover:bg-slate-800 text-fuchsia-500'}`}
        >
          <span className="font-black text-[10px] uppercase tracking-widest">Conditions</span>
          <Skull className="w-4 h-4" />
        </button>
        
        {showConditions && (
          <div className="p-2 grid grid-cols-2 gap-1 bg-slate-900 max-h-48 overflow-y-auto custom-scrollbar">
            {CONDITIONS_LIST.map(cond => {
              const isActive = (token.conditions || []).includes(cond);
              return (
                <button 
                  key={cond}
                  onClick={(e) => { e.stopPropagation(); onToggleCondition(token.id, cond); }}
                  className={`text-left px-2 py-1.5 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-fuchsia-500 text-slate-950 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'}`}
                >
                  {cond}
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}