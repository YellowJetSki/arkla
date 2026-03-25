import { 
  User, ZoomIn, ZoomOut, Target, 
  EyeOff, Heart, EarOff, Flame, Ghost, Link, 
  Ban, Cloud, Lock, Mountain, Skull, ArrowDown, 
  Stars, Moon, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
  onTokenDrop, // NEW: Drag and Drop Handler
  onPing // NEW: Ping System Handler
}) {
  
  const rawCols = Number(mapData?.cols);
  const rawRows = Number(mapData?.rows);
  const cols = Math.min(100, Math.max(1, isNaN(rawCols) ? 20 : rawCols));
  const rows = Math.min(100, Math.max(1, isNaN(rawRows) ? 15 : rawRows));
  
  const [zoom, setZoom] = useState(isDM ? 1 : 1.5);
  const currentCellSize = 30 * zoom;
  const scrollRef = useRef(null);

  // NEW: Local state to force a re-render to hide stale pings without waiting for Firebase
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
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-700">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mb-1 drop-shadow-md">Active Turn</span>
          <div className={`bg-slate-950/80 backdrop-blur-md border-y-2 px-16 py-3 shadow-2xl ${activeToken.type === 'enemy' ? 'border-red-500/50 shadow-red-900/20' : 'border-amber-500/50 shadow-amber-900/20'}`}>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
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
          {!isDisplayMode && (
            <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)`, backgroundSize: `${currentCellSize}px ${currentCellSize}px` }}></div>
          )}

          {/* NEW: Global Ping Visual Renderer */}
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

          <div className="absolute inset-0 grid z-20" style={{ gridTemplateColumns: `repeat(${cols}, ${currentCellSize}px)`, gridTemplateRows: `repeat(${rows}, ${currentCellSize}px)` }}>
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
                  
                  // NEW: Left Click to Move (Fallback), Right Click to Ping!
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
                  
                  // NEW: Drag and Drop Handlers
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
                  // NEW: Native Draggable Attribute
                  draggable={!isDisplayMode && isDM} // DMs can drag anything. (Players can drag via their layer)
                  onDragStart={(e) => {
                    if (isDisplayMode) return;
                    e.dataTransfer.setData('tokenId', token.id);
                    e.dataTransfer.effectAllowed = "move";
                    if (onTokenClick) onTokenClick(token.id); // Select it visually while dragging
                  }}
                  onMouseDown={(e) => {
                    if (!isDisplayMode && onTokenClick && (isDM || token.id === selectedTokenId)) {
                      e.stopPropagation();
                      onTokenClick(token.id);
                    }
                  }}
                  className={`absolute transition-all duration-700 ease-in-out flex items-center justify-center ${isDisplayMode ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer hover:scale-105'} ${token.isHidden ? 'opacity-40 grayscale' : ''}`}
                  style={{
                    width: currentCellSize * tSize,
                    height: currentCellSize * tSize,
                    transform: `translate(${safeX * currentCellSize}px, ${safeY * currentCellSize}px)`
                  }}
                >
                  <div className={`relative w-[75%] h-[75%] rounded-full shadow-lg transition-all 
                    ${isSelected && !isDisplayMode ? 'ring-2 md:ring-4 ring-white animate-pulse scale-105 z-40' : 'z-10'} 
                    ${isActiveTurn ? (isDisplayMode ? 'ring-[8px] ring-amber-400 shadow-[0_0_40px_rgba(251,191,36,1)] scale-110 z-50' : 'ring-[3px] md:ring-[6px] ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse z-50') : ''} 
                    ${isDead ? 'grayscale-[0.9] opacity-60' : ''}
                    ${isBloodied && !isActiveTurn ? 'ring-[3px] ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : ''}
                    ${isEnemy && !isBloodied && !isActiveTurn && !isDead ? 'bg-red-950/80 shadow-red-900/50' : ''}
                    ${!isEnemy && !isBloodied && !isActiveTurn && !isDead ? 'bg-indigo-950/80 shadow-indigo-900/50' : ''}
                  `}>
                    
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