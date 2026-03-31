import { useState, useEffect } from 'react';

export default function TokenLayer({
  tokens,
  mapData,
  selectedTokenId,
  setSelectedTokenId,
  isDrawingMode,
  handleTokenDrop,
  handleUpdateTokenHpLive,
  setContextMenu
}) {
  const [hoveredTokenId, setHoveredTokenId] = useState(null);
  const [isMagnifying, setIsMagnifying] = useState(false);

  // Listen for the 'Z' key to magnify the hovered token
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'z' && hoveredTokenId) {
        setIsMagnifying(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key.toLowerCase() === 'z') {
        setIsMagnifying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hoveredTokenId]);

  return (
    <>
      {/* MAGNIFIED INSPECT OVERLAY */}
      {isMagnifying && hoveredTokenId && tokens[hoveredTokenId] && (
        <div className="fixed inset-0 z-[999999] pointer-events-none flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative flex flex-col items-center animate-in zoom-in-90 duration-200">
            <img 
              src={tokens[hoveredTokenId].img} 
              alt={tokens[hoveredTokenId].name} 
              className="max-w-[400px] max-h-[400px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" 
            />
            <h2 className="mt-6 text-4xl font-black text-white tracking-widest uppercase drop-shadow-xl">
              {tokens[hoveredTokenId].name}
            </h2>
            {/* Show HP to DM only during inspect if you want, or keep it visual only */}
          </div>
        </div>
      )}

      {Object.values(tokens).map(token => {
        const isSelected = mapData.activeTokenId === token.id || selectedTokenId === token.id;
        const gridPixelSize = 50 * (token.size || 1);
        
        return (
          <div
            key={token.id}
            className={`absolute cursor-grab active:cursor-grabbing transition-all duration-200 z-20 ${isSelected ? 'z-30 scale-110' : ''}`}
            style={{ 
              width: `${gridPixelSize}px`, 
              height: `${gridPixelSize}px`, 
              transform: `translate(${token.x * 50}px, ${token.y * 50}px)` 
            }}
            onMouseEnter={() => setHoveredTokenId(token.id)}
            onMouseLeave={() => { if (hoveredTokenId === token.id) setHoveredTokenId(null); }}
            onDragEnd={(e) => {
              if (isDrawingMode) return;
              const rect = e.target.parentElement.getBoundingClientRect();
              const x = Math.max(0, Math.min(mapData.cols - token.size, Math.floor((e.clientX - rect.left) / 50)));
              const y = Math.max(0, Math.min(mapData.rows - token.size, Math.floor((e.clientY - rect.top) / 50)));
              handleTokenDrop(token.id, x, y);
            }}
            draggable={!isDrawingMode}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ token, x: e.clientX, y: e.clientY }); }}
            onClick={(e) => { e.stopPropagation(); setSelectedTokenId(selectedTokenId === token.id ? null : token.id); }}
          >
            <div className="relative w-full h-full p-0.5 group/token">
               
               {/* Quick HP HUD (DM Only, when selected) */}
               {isSelected && (
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-slate-900/95 p-1 rounded-lg border border-slate-700 shadow-2xl z-50 pointer-events-auto">
                   <button onClick={(e) => { e.stopPropagation(); handleUpdateTokenHpLive(token.id, token.hp - 10); }} className="px-1.5 py-0.5 bg-red-900/80 hover:bg-red-600 text-white text-[10px] font-bold rounded cursor-pointer">-10</button>
                   <button onClick={(e) => { e.stopPropagation(); handleUpdateTokenHpLive(token.id, token.hp - 1); }} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-600 text-white text-[10px] font-bold rounded cursor-pointer">-1</button>
                   <span className="text-[10px] font-black px-1.5 text-white min-w-[24px] text-center">{token.hp}</span>
                   <button onClick={(e) => { e.stopPropagation(); handleUpdateTokenHpLive(token.id, token.hp + 1); }} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-600 text-white text-[10px] font-bold rounded cursor-pointer">+1</button>
                 </div>
               )}

               {isSelected && <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${token.type === 'player' ? 'bg-indigo-500' : 'bg-red-500'}`}></div>}
               
               {/* THE MINIATURE OVERHANG BASE */}
               <div className={`absolute bottom-0 left-0 right-0 h-full rounded-full border-2 shadow-[0_10px_15px_rgba(0,0,0,0.8)] bg-slate-900/40 backdrop-blur-sm ${isSelected ? (token.type === 'player' ? 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]') : (token.type === 'player' ? 'border-indigo-600' : 'border-red-900')}`}>
               </div>

               {/* THE STANDING ARTWORK (Breaks out of the container) */}
               <img 
                 src={token.img} 
                 alt={token.name} 
                 className={`absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[140%] h-[140%] object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.7)] pointer-events-none ${token.isHidden ? 'opacity-50 grayscale' : ''}`} 
                 draggable={false} 
               />
               
               {/* HP Bar */}
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 z-10">
                 <div className={`h-full ${token.hp > (token.maxHp/2) ? 'bg-emerald-500' : token.hp > (token.maxHp/4) ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.max(0, Math.min(100, (token.hp / token.maxHp) * 100))}%` }}></div>
               </div>
               
               {/* Name Tag (Hover) */}
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/token:opacity-100 transition-opacity pointer-events-none border border-slate-700 z-50">
                 {token.name} {token.isHidden && '(Hidden)'}
               </div>

               {/* Status Indicators */}
               {(token.conditions?.length > 0 || token.isConcentrating) && (
                 <div className="absolute -right-1 -top-1 flex gap-0.5 flex-wrap w-6 z-40">
                    {token.isConcentrating && <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 shadow-sm animate-pulse" title="Concentrating"></div>}
                    {token.conditions?.length > 0 && <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 border border-slate-900 shadow-sm" title={token.conditions.join(', ')}></div>}
                 </div>
               )}
            </div>
          </div>
        );
      })}
    </>
  );
}