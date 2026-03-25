import { 
  User, ZoomIn, ZoomOut, Target, 
  EyeOff, Heart, EarOff, Flame, Ghost, Link, 
  Ban, Cloud, Lock, Mountain, Skull, ArrowDown, 
  Stars, Moon, AlertCircle, BrainCircuit
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import MapDrawings from './MapDrawings';

const CONDITION_ICONS = {
  'Blinded': { icon: EyeOff, color: 'bg-slate-700 text-slate-300 border-slate-500' },
  'Charmed': { icon: Heart, color: 'bg-pink-600 text-white border-pink-400' },
  'Deafened': { icon: EarOff, color: 'bg-slate-700 text-slate-300 border-slate-500' },
  'Exhaustion': { icon: Flame, color: 'bg-orange-600 text-white border-orange-400' },
  'Frightened': { icon: Ghost, color: 'bg-purple-600 text-white border-purple-400' },
  'Grappled': { icon: Link, color: 'bg-amber-600 text-white border-amber-400' },
  'Incapacitated': { icon: Ban, color: 'bg-red-600 text-white border-red-400' },
  'Invisible': { icon: Cloud, color: 'bg-sky-400/50 text-white border-sky-300' },
  'Paralyzed': { icon: Lock, color: 'bg-yellow-500 text-yellow-950 border-yellow-300' },
  'Petrified': { icon: Mountain, color: 'bg-stone-500 text-white border-stone-300' },
  'Poisoned': { icon: Skull, color: 'bg-lime-500 text-lime-950 border-lime-300' },
  'Prone': { icon: ArrowDown, color: 'bg-amber-700 text-white border-amber-500' },
  'Restrained': { icon: Link, color: 'bg-orange-700 text-white border-orange-500' },
  'Stunned': { icon: Stars, color: 'bg-yellow-400 text-yellow-900 border-yellow-200' },
  'Unconscious': { icon: Moon, color: 'bg-indigo-800 text-indigo-200 border-indigo-500' }
};

const TokenImage = ({ token, isEnemy }) => {
  const [fallbackStep, setFallbackStep] = useState(0);

  useEffect(() => {
    setFallbackStep(0);
  }, [token.name, token.img]);

  const handleError = () => {
    if (fallbackStep === 0) setFallbackStep(token.img ? 1 : 2);
    else if (fallbackStep === 1) setFallbackStep(2);
  };

  if (fallbackStep === 2) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-full border-2 border-transparent relative">
        <User className={`w-4 h-4 md:w-5 md:h-5 ${isEnemy ? 'text-red-400' : 'text-indigo-400'} ${token.size > 1 ? 'scale-150' : ''}`} />
      </div>
    );
  }

  const formattedName = token.name ? token.name.toLowerCase().split(' ')[0] : 'unknown';
  const imgSrc = fallbackStep === 0 ? `/${formattedName}_bm.png` : token.img;

  return <img src={imgSrc} alt={token.name} className="w-full h-full rounded-full object-cover bg-slate-800 border-2 border-transparent relative" onError={handleError} />;
};

export default function MapGrid({ 
  mapData, 
  tokens, 
  onTileClick,
  onTokenClick, 
  selectedTokenId, 
  isDM,
  showMovementRangeFor = null,
  isDisplayMode = false,
  onTokenDrop, 
  onPing,
  isDrawingMode = false, 
  drawingColor = '#ef4444',
  onDrawEnd
}) {
  
  const rawCols = Number(mapData?.cols);
  const rawRows = Number(mapData?.rows);
  const cols = Math.min(100, Math.max(1, isNaN(rawCols) ? 20 : rawCols));
  const rows = Math.min(100, Math.max(1, isNaN(rawRows) ? 15 : rawRows));
  
  const [zoom, setZoom] = useState(isDM ? 1 : 1.5);
  const currentCellSize = 30 * zoom;
  const scrollRef = useRef(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDisplayMode) {
      const calculateOptimalZoom = () => {
        const mapPixelWidth = cols * 30; 
        const mapPixelHeight = rows * 30; 
        const padding = 40; 
        
        const zoomX = (window.innerWidth - padding) / mapPixelWidth;
        const zoomY = (window.innerHeight - padding) / mapPixelHeight;
        
        const baseZoom = Math.min(zoomX, zoomY);

        if (mapData?.activeTokenId) {
          setZoom(Math.max(baseZoom * 1.8, 1.5)); 
        } else {
          setZoom(baseZoom); 
        }
      };

      calculateOptimalZoom();
      window.addEventListener('resize', calculateOptimalZoom);
      return () => window.removeEventListener('resize', calculateOptimalZoom);
    }
  }, [isDisplayMode, cols, rows, mapData?.activeTokenId]);

  const centerOnMap = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const targetX = (cols * currentCellSize) / 2;
      const targetY = (rows * currentCellSize) / 2;
      container.scrollTo({
        left: targetX - (container.clientWidth / 2),
        top: targetY - (container.clientHeight / 2),
        behavior: 'smooth'
      });
    }
  };

  const centerOnToken = (tokenId) => {
    if (!scrollRef.current || !tokens[tokenId]) return;
    const container = scrollRef.current;
    const token = tokens[tokenId];
    const tSize = token.size || 1;
    
    const targetX = (token.x * currentCellSize) + ((currentCellSize * tSize) / 2);
    const targetY = (token.y * currentCellSize) + ((currentCellSize * tSize) / 2);
    
    container.scrollTo({
      left: targetX - (container.clientWidth / 2),
      top: targetY - (container.clientHeight / 2),
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (isDisplayMode) {
      const timeout = setTimeout(() => {
        if (mapData?.activeTokenId && tokens[mapData.activeTokenId]) {
          centerOnToken(mapData.activeTokenId);
        } else {
          centerOnMap();
        }
      }, 500); 
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisplayMode, mapData?.activeTokenId, zoom, tokens, cols, rows, currentCellSize]);

  useEffect(() => {
    if (!isDisplayMode && !isDM && selectedTokenId && tokens[selectedTokenId]) {
      setTimeout(() => centerOnToken(selectedTokenId), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDM, isDisplayMode, selectedTokenId, tokens[selectedTokenId] !== undefined]);

  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) tiles.push({ x, y });
  }

  const activeToken = mapData?.activeTokenId ? tokens[mapData.activeTokenId] : null;
  const gridColor = mapData?.gridColor || 'rgba(255,255,255,0.35)';

  return (
    <div className={`relative w-full flex flex-col overflow-hidden ${isDisplayMode ? 'h-[100dvh] rounded-none border-0 bg-black' : 'max-h-[70vh] rounded-xl border border-slate-700 bg-slate-950 shadow-inner'}`}>
      
      {!isDisplayMode && (
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-lg">
          <button onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom In"><ZoomIn className="w-5 h-5"/></button>
          <button onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom Out"><ZoomOut className="w-5 h-5"/></button>
          <div className="w-full h-px bg-slate-700 my-0.5"></div>
          <button onClick={() => centerOnToken(selectedTokenId)} className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/50 rounded transition-colors" title="Center on Me"><Target className="w-5 h-5"/></button>
        </div>
      )}

      {isDisplayMode && activeToken && (
        <div className="fixed top-8 left-8 z-[200] flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-left-8 fade-in duration-500">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-slate-800">
            <TokenImage token={activeToken} isEnemy={activeToken.type === 'enemy'} />
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">Current Turn</span>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest leading-none">
              {activeToken.name}
            </h1>
          </div>
        </div>
      )}

      {isDisplayMode && (
        <div className="absolute inset-0 z-[100] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.8)_85%,_rgba(0,0,0,1)_100%)]"></div>
      )}

      <div 
        ref={scrollRef} 
        className={`${isDisplayMode ? 'overflow-hidden flex-1 w-full' : 'overflow-auto flex-1 custom-scrollbar'} relative`}
      >
        <div 
          className="relative transition-all duration-700 origin-top-left ease-in-out"
          style={{ 
            width: cols * currentCellSize, 
            height: rows * currentCellSize,
            backgroundImage: mapData?.imageUrl ? `url(${mapData.imageUrl})` : 'none',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'top left',
            imageRendering: 'crisp-edges' 
          }}
        >
          {!isDisplayMode && gridColor !== 'transparent' && (
            <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`, backgroundSize: `${currentCellSize}px ${currentCellSize}px` }}></div>
          )}

          {/* REQ 1: SVG Drawing Overlay */}
          <MapDrawings 
            drawings={mapData?.drawings || []}
            isDrawingMode={isDrawingMode && !isDisplayMode}
            onDrawEnd={onDrawEnd}
            currentCellSize={currentCellSize}
            cols={cols}
            rows={rows}
            drawingColor={drawingColor}
          />

          {mapData?.ping && (now - mapData.ping.timestamp < 3500) && (
            <div 
              className="absolute z-50 pointer-events-none"
              style={{
                width: currentCellSize,
                height: currentCellSize,
                transform: `translate(${mapData.ping.x * currentCellSize}px, ${mapData.ping.y * currentCellSize}px)`
              }}
            >
              <div className="absolute inset-0 rounded-full border-[4px] border-sky-400 animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full border-[2px] border-white bg-sky-500/30 flex items-center justify-center">
                <Target className="w-1/2 h-1/2 text-white drop-shadow-md animate-pulse" />
              </div>
            </div>
          )}

          {/* Disable token clicks entirely if drawing mode is on so the DM doesn't drag a token while trying to draw */}
          <div className={`absolute inset-0 grid z-20 ${isDrawingMode ? 'pointer-events-none' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, ${currentCellSize}px)`, gridTemplateRows: `repeat(${rows}, ${currentCellSize}px)` }}>
            {tiles.map((tile) => {
              let tileClass = isDisplayMode ? '' : 'hover:bg-white/10'; 

              if (!isDisplayMode) {
                if (showMovementRangeFor) {
                  const tSize = showMovementRangeFor.size || 1;
                  const dx = Math.max(0, tile.x - (showMovementRangeFor.x + tSize - 1), showMovementRangeFor.x - tile.x);
                  const dy = Math.max(0, tile.y - (showMovementRangeFor.y + tSize - 1), showMovementRangeFor.y - tile.y);
                  const dist = Math.max(dx, dy) * 5;
                  const speed = showMovementRangeFor.speed || 30;

                  if (dist > 0 && dist <= speed) {
                    tileClass = 'bg-emerald-500/30 border border-emerald-400/50 hover:bg-emerald-400/50';
                  } else if (dist > speed && dist <= speed * 2) {
                    tileClass = 'bg-amber-500/30 border border-amber-400/50 hover:bg-amber-400/50';
                  }
                }
              }

              return (
                <div 
                  key={`click-${tile.x},${tile.y}`}
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    if(isDisplayMode) return;
                  }}
                  onClick={() => {
                    if(!isDisplayMode && onTileClick) onTileClick(tile.x, tile.y);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if(!isDisplayMode && onPing) onPing(tile.x, tile.y);
                  }}
                  onDragOver={(e) => { 
                    if(isDisplayMode) return;
                    e.preventDefault(); 
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    if(isDisplayMode) return;
                    e.preventDefault();
                    const dragId = e.dataTransfer.getData('tokenId');
                    if (dragId && onTokenDrop) {
                      onTokenDrop(dragId, tile.x, tile.y);
                    }
                  }}
                  className={`w-full h-full transition-colors ${isDisplayMode ? '' : 'cursor-pointer'} ${tileClass}`}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 pointer-events-none z-30">
            {Object.values(tokens || {})
              .sort((a, b) => {
                const aDead = (a.hp !== undefined && a.hp <= 0);
                const bDead = (b.hp !== undefined && b.hp <= 0);
                if (aDead && !bDead) return -1;
                if (!aDead && bDead) return 1;
                return (b.size || 1) - (a.size || 1);
              })
              .map(token => {
              const isSelected = selectedTokenId === token.id;
              const isActiveTurn = mapData?.activeTokenId === token.id; 
              const isEnemy = token.type === 'enemy';
              const tSize = token.size || 1; 
              
              const isDead = token.hp !== undefined && token.hp <= 0;
              const isBloodied = !isDead && token.hp !== undefined && token.maxHp && (token.hp <= token.maxHp / 2);
              
              if (token.isHidden && !isDM) return null; 

              const safeX = token.x || 0;
              const safeY = token.y || 0;
              
              return (
                <div
                  key={token.id}
                  draggable={!isDisplayMode && isDM && !isDrawingMode} 
                  onDragStart={(e) => {
                    if (isDisplayMode || isDrawingMode) return;
                    e.dataTransfer.setData('tokenId', token.id);
                    e.dataTransfer.effectAllowed = "move";
                    if (onTokenClick) onTokenClick(token.id); 
                  }}
                  onMouseDown={(e) => {
                    if (!isDisplayMode && onTokenClick && (isDM || token.id === selectedTokenId)) {
                      e.stopPropagation();
                      if (!isDrawingMode) onTokenClick(token.id);
                    }
                  }}
                  className={`absolute transition-all duration-700 ease-in-out flex items-center justify-center ${isDisplayMode || isDrawingMode ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer hover:scale-105'} ${token.isHidden ? 'opacity-40 grayscale' : ''}`}
                  style={{
                    width: currentCellSize * tSize,
                    height: currentCellSize * tSize,
                    transform: `translate(${safeX * currentCellSize}px, ${safeY * currentCellSize}px)`
                  }}
                >
                  
                  {token.aura > 0 && !isDead && (
                    <div 
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-dashed pointer-events-none z-0 transition-all duration-500
                        ${isEnemy ? 'border-red-500/50 bg-red-500/10' : 'border-indigo-400/50 bg-indigo-400/10'} 
                        ${isDisplayMode ? 'animate-[spin_20s_linear_infinite]' : 'animate-[spin_30s_linear_infinite]'}`}
                      style={{
                        width: currentCellSize * (tSize + (token.aura / 5) * 2),
                        height: currentCellSize * (tSize + (token.aura / 5) * 2)
                      }}
                    />
                  )}

                  <div className={`relative w-[75%] h-[75%] rounded-full shadow-lg transition-all z-10
                    ${isSelected && !isDisplayMode ? 'ring-2 md:ring-4 ring-white animate-pulse scale-105 z-40' : ''} 
                    ${isActiveTurn ? (isDisplayMode ? 'ring-[4px] ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] scale-105 z-50' : 'ring-[3px] md:ring-[6px] ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse z-50') : ''} 
                    ${isDead ? 'grayscale-[0.9] opacity-60' : ''}
                    ${isBloodied && !isActiveTurn ? 'ring-[3px] ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : ''}
                    ${isEnemy && !isBloodied && !isActiveTurn && !isDead ? 'bg-red-950/80 shadow-red-900/50' : ''}
                    ${!isEnemy && !isBloodied && !isActiveTurn && !isDead ? 'bg-indigo-950/80 shadow-indigo-900/50' : ''}
                  `}>
                    
                    {token.elevation > 0 && !isDead && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-sky-900/90 border border-sky-400 text-sky-100 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-50 whitespace-nowrap pointer-events-none">
                        +{token.elevation}ft
                      </div>
                    )}

                    {token.isConcentrating && !isDead && (
                      <div className="absolute -top-1 -left-3 bg-amber-600 rounded-full p-0.5 shadow-md border border-amber-300 z-50 pointer-events-none animate-pulse">
                        <BrainCircuit className={`${isDisplayMode ? 'w-5 h-5' : 'w-3 h-3'} text-white`} />
                      </div>
                    )}

                    <TokenImage token={token} isEnemy={isEnemy} />

                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 rounded-full z-40 pointer-events-none">
                         <Skull className="w-1/2 h-1/2 text-red-500 drop-shadow-md" />
                      </div>
                    )}

                    {(token.conditions?.length > 0) && !isDead && (
                      <div className={`absolute ${isDisplayMode ? '-top-3 -right-5 gap-2' : '-top-1 -right-3 gap-1'} flex flex-wrap-reverse justify-end w-16 z-50 pointer-events-none`}>
                        {token.conditions.map(cond => {
                          const config = CONDITION_ICONS[cond];
                          if (!config) return (
                            <div key={cond} className={`bg-fuchsia-600 rounded-full ${isDisplayMode ? 'p-1 border-2' : 'p-0.5 border'} shadow border-fuchsia-300`} title={cond}>
                              <AlertCircle className={`${isDisplayMode ? 'w-5 h-5' : 'w-3 h-3'} text-white`} />
                            </div>
                          );
                          const Icon = config.icon;
                          return (
                            <div key={cond} className={`rounded-full ${isDisplayMode ? 'p-1 border-2' : 'p-0.5 border'} shadow-md ${config.color}`} title={cond}>
                              <Icon className={`${isDisplayMode ? 'w-5 h-5' : 'w-3 h-3'}`} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {token.isHidden && isDM && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 rounded-full p-0.5 shadow-lg border border-amber-300 z-50">
                        <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                    )}

                    {isDM && !isDisplayMode && currentCellSize >= 30 && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 border border-slate-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-40">
                        {token.name.substring(0, 8)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}