import { 
  User, ZoomIn, ZoomOut, Target, 
  EyeOff, Heart, EarOff, Flame, Ghost, Link, 
  Ban, Cloud, Lock, Mountain, Skull, ArrowDown, 
  Stars, Moon, AlertCircle, BrainCircuit, Maximize, Ruler, CircleDashed, ArrowUpCircle, Image as ImageIcon, Trash2, X, Activity, Eye, Hand, Swords 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import MapDrawings from './MapDrawings';
import TokenContextMenu from './TokenContextMenu';

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

const getShortName = (fullName) => {
  if (!fullName) return 'Unknown';
  const match = fullName.match(/["'“”‘’]([^"'“”‘’]+)["'“”‘’]/);
  if (match) return match[1];
  return fullName.split(' ')[0];
};

const TokenImage = ({ token, parsedName }) => {
  const [fallbackStep, setFallbackStep] = useState(0);
  useEffect(() => { setFallbackStep(0); }, [parsedName, token.img]);
  const handleError = () => {
    if (fallbackStep === 0) setFallbackStep(token.img ? 1 : 2);
    else if (fallbackStep === 1) setFallbackStep(2);
  };
  if (fallbackStep === 2) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-full border-[3px] border-slate-950 shadow-inner relative">
        <User className={`w-4 h-4 md:w-5 md:h-5 ${token.type === 'enemy' ? 'text-red-500' : token.type === 'npc' ? 'text-slate-400' : 'text-indigo-400'} ${token.size > 1 ? 'scale-150' : ''}`} />
      </div>
    );
  }
  const formattedName = parsedName ? parsedName.toLowerCase().split(' ')[0] : 'unknown';
  const imgSrc = fallbackStep === 0 ? `/${formattedName}_bm.png` : token.img;
  return <img src={imgSrc} alt={parsedName} className="w-full h-full rounded-full object-cover bg-slate-900 border-[3px] border-slate-950 shadow-inner relative" onError={handleError} />;
};

// =========================================================================
// THE UPGRADED WEATHER & ENVIRONMENT ENGINE
// =========================================================================
const EnvironmentOverlay = ({ environment }) => {
  if (!environment || environment === 'none') return null;

  const styles = `
    .env-overlay {
       position: absolute;
       inset: 0;
       pointer-events: none;
       z-index: 80;
       overflow: hidden;
    }

    @keyframes rain-fall {
       0% { background-position: 0px 0px, 0px 0px; }
       100% { background-position: -100px 300px, -150px 400px; }
    }
    @keyframes blizzard-fall {
       0% { background-position: 0px 0px, 0px 0px, 0px 0px; }
       100% { background-position: 300px 1000px, 200px 800px, 150px 600px; }
    }
    @keyframes fog-drift {
      0% { transform: translate(0, 0); }
      100% { transform: translate(25%, 25%); } 
    }
    @keyframes god-rays {
       0% { transform: translateX(-10%) rotate(25deg); opacity: 0.3; }
       50% { opacity: 0.6; }
       100% { transform: translateX(10%) rotate(25deg); opacity: 0.3; }
    }
    @keyframes moon-drift {
       0% { transform: translateX(-5%) rotate(-15deg); opacity: 0.3; }
       50% { opacity: 0.6; }
       100% { transform: translateX(5%) rotate(-15deg); opacity: 0.3; }
    }

    .env-light_rain {
       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cline x1='50' y1='0' x2='45' y2='20' stroke='rgba(255,255,255,0.4)' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E");
       animation: rain-fall 0.8s linear infinite;
    }

    /* SOFTER, MOODIER HEAVY RAIN */
    .env-heavy_rain {
       background-image:
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='40' y1='0' x2='30' y2='30' stroke='rgba(200,220,255,0.3)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"),
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cline x1='60' y1='0' x2='45' y2='40' stroke='rgba(200,220,255,0.2)' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
       animation: rain-fall 0.3s linear infinite;
       background-color: rgba(15, 25, 40, 0.4); 
    }

    .env-blizzard {
       background-image:
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='40' cy='40' r='2.5' fill='white' opacity='0.9'/%3E%3Ccircle cx='120' cy='90' r='1.5' fill='white' opacity='0.7'/%3E%3C/svg%3E"),
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Ccircle cx='80' cy='150' r='3.5' fill='white' opacity='0.8'/%3E%3Ccircle cx='220' cy='50' r='2' fill='white' opacity='0.6'/%3E%3C/svg%3E"),
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Ccircle cx='50' cy='100' r='4' fill='white' opacity='0.5'/%3E%3C/svg%3E");
       animation: blizzard-fall 1.2s linear infinite;
       background-color: rgba(255, 255, 255, 0.15);
    }

    /* BEAUTIFUL DRIFTING FOG */
    .env-fog::before {
       content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
       background-image:
         radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 20%),
         radial-gradient(circle at 80% 60%, rgba(255,255,255,0.1) 0%, transparent 25%),
         radial-gradient(circle at 50% 80%, rgba(255,255,255,0.08) 0%, transparent 20%),
         radial-gradient(circle at 10% 80%, rgba(255,255,255,0.05) 0%, transparent 15%);
       background-size: 50% 50%;
       animation: fog-drift 30s linear infinite;
       pointer-events: none;
    }
    .env-fog { background-color: rgba(200, 210, 220, 0.08); }

    /* ETHEREAL SHIFTING GOD-RAYS */
    .env-sunlight::before {
       content: ""; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
       background-image: repeating-linear-gradient(90deg, transparent 0%, rgba(255, 250, 200, 0.15) 10%, transparent 20%);
       animation: god-rays 15s infinite alternate ease-in-out;
       mix-blend-mode: color-dodge;
       pointer-events: none;
    }
    .env-sunlight { background-color: rgba(255, 235, 180, 0.05); }

    .env-moonlight::after {
       content: ""; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
       background-image: repeating-linear-gradient(90deg, transparent 0%, rgba(150, 180, 255, 0.1) 15%, transparent 30%);
       animation: moon-drift 15s infinite alternate ease-in-out;
       mix-blend-mode: screen;
       pointer-events: none;
    }
    .env-moonlight { background-color: rgba(10, 15, 45, 0.5); mix-blend-mode: multiply; }

    .env-embers {
       background-image:
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='50' cy='50' r='2.5' fill='%23ff6600' opacity='0.9'/%3E%3Ccircle cx='150' cy='120' r='3.5' fill='%23ff2200' opacity='0.7'/%3E%3C/svg%3E"),
         url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Ccircle cx='100' cy='200' r='2' fill='%23ffaa00' opacity='0.9'/%3E%3C/svg%3E");
       animation: blizzard-fall 4s linear infinite reverse;
       background-color: rgba(30, 10, 0, 0.4);
       mix-blend-mode: overlay;
    }
    
    .env-toxic::before {
       content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
       background-image:
         radial-gradient(circle at 20% 30%, rgba(34,197,94,0.15) 0%, transparent 20%),
         radial-gradient(circle at 80% 60%, rgba(16,185,129,0.1) 0%, transparent 25%);
       background-size: 50% 50%;
       animation: fog-drift 25s linear infinite;
       pointer-events: none;
       mix-blend-mode: hard-light;
    }
    .env-toxic { background-color: rgba(5, 150, 105, 0.1); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className={`env-overlay env-${environment}`} />
    </>
  );
};
// =========================================================================

export default function MapGrid({ 
  mapData, tokens, activePlayers = [], activeEnemies = [], activeActor = null,
  onTileClick, onTokenClick, onTokenSelectMultiple, selectedTokenIds = [], 
  isDM, showMovementRangeFor = null, onToggleRuler,
  isDisplayMode = false, isPlayerMap = false, isDrawingMode = false, 
  drawingColor = '#ef4444', drawingShape = 'freehand', onDrawEnd,
  onUpdateHpLive, onToggleSize, onToggleAura, onToggleElevation, onToggleConcentration, onToggleCondition, onUpdateImage, onToggleHidden, onRemoveToken, onDeselect
}) {
  
  const rawCols = Number(mapData?.cols);
  const rawRows = Number(mapData?.rows);
  const cols = Math.min(100, Math.max(1, isNaN(rawCols) ? 20 : rawCols));
  const rows = Math.min(100, Math.max(1, isNaN(rawRows) ? 15 : rawRows));
  
  const [zoom, setZoom] = useState(isDM ? 1.5 : 2); 
  const currentCellSize = 40 * zoom; 
  const scrollRef = useRef(null);

  const [isPanning, setIsPanning] = useState(false);
  const hasPanned = useRef(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [initialPinchDist, setInitialPinchDist] = useState(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);

  const centerOnMap = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      container.scrollTo({ left: (cols * currentCellSize) / 2 - (container.clientWidth / 2), top: (rows * currentCellSize) / 2 - (container.clientHeight / 2), behavior: 'smooth' });
    }
  };

  const centerOnToken = (tokenId) => {
    if (!scrollRef.current || !tokens[tokenId]) return;
    const container = scrollRef.current;
    const token = tokens[tokenId];
    const tSize = token.size || 1;
    container.scrollTo({ left: (token.x * currentCellSize) + ((currentCellSize * tSize) / 2) - (container.clientWidth / 2), top: (token.y * currentCellSize) + ((currentCellSize * tSize) / 2) - (container.clientHeight / 2), behavior: 'smooth' });
  };

  const activeTurnId = activeActor?.id && tokens[activeActor.id] ? activeActor.id : null;
  const cameraTargetId = isPlayerMap ? (selectedTokenIds.length > 0 ? selectedTokenIds[0] : null) : activeTurnId;
  const targetTokenX = cameraTargetId && tokens[cameraTargetId] ? tokens[cameraTargetId].x : null;
  const targetTokenY = cameraTargetId && tokens[cameraTargetId] ? tokens[cameraTargetId].y : null;

  useEffect(() => {
    if (isDisplayMode || isPlayerMap) {
      const calculateOptimalZoom = () => {
        const zoomX = (window.innerWidth - 40) / (cols * 40);
        const zoomY = (window.innerHeight - 40) / (rows * 40);
        const baseZoom = Math.max(Math.min(zoomX, zoomY), 1.2); 
        if (isPlayerMap) setZoom(Math.max(baseZoom * 1.8, 1.5)); 
        else if (cameraTargetId) setZoom(Math.max(baseZoom * 1.5, 1.5)); 
        else setZoom(baseZoom); 
      };
      calculateOptimalZoom();
      window.addEventListener('resize', calculateOptimalZoom);
      return () => window.removeEventListener('resize', calculateOptimalZoom);
    }
  }, [isDisplayMode, isPlayerMap, cols, rows, cameraTargetId]);

  useEffect(() => {
    if (cameraTargetId && (isDisplayMode || isPlayerMap)) {
      const timer = setTimeout(() => centerOnToken(cameraTargetId), 300);
      return () => clearTimeout(timer);
    } else if (isDisplayMode) {
      const timer = setTimeout(() => centerOnMap(), 300);
      return () => clearTimeout(timer);
    }
  }, [cameraTargetId, targetTokenX, targetTokenY, isDisplayMode, isPlayerMap, zoom]);

  const handleMapMouseDown = (e) => {
    if (isDisplayMode || isDrawingMode) return;
    if (e.shiftKey) {
      hasPanned.current = false;
      const rect = scrollRef.current.children[0].getBoundingClientRect();
      setSelectionBox({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
      return;
    }
    hasPanned.current = false;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, scrollLeft: scrollRef.current.scrollLeft, scrollTop: scrollRef.current.scrollTop });
  };

  const handleMapMouseMove = (e) => {
    if (selectionBox) {
      const rect = scrollRef.current.children[0].getBoundingClientRect();
      setSelectionBox(prev => ({ ...prev, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top }));
      return;
    }
    if (!isPanning || !scrollRef.current) return;
    hasPanned.current = true;
    scrollRef.current.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
    scrollRef.current.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
  };

  const handleMapMouseUp = () => {
    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.currentX) / currentCellSize;
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX) / currentCellSize;
      const minY = Math.min(selectionBox.startY, selectionBox.currentY) / currentCellSize;
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY) / currentCellSize;
      const selectedIds = Object.values(tokens).filter(t => {
        const cx = t.x + (t.size || 1) / 2;
        const cy = t.y + (t.size || 1) / 2;
        return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
      }).map(t => t.id);

      if (selectedIds.length > 0) {
        if (onTokenSelectMultiple) onTokenSelectMultiple(selectedIds);
      } else {
        if (onDeselect) onDeselect();
      }
      setSelectionBox(null);
      return;
    }
    setIsPanning(false);
  };

  const getPinchDistance = (touches) => Math.sqrt(Math.pow(touches[0].clientX - touches[1].clientX, 2) + Math.pow(touches[0].clientY - touches[1].clientY, 2));

  const handleTouchStart = (e) => {
    if (isDisplayMode) return;
    hasPanned.current = false;
    if (e.touches.length === 2) {
      setIsPanning(false); setInitialPinchDist(getPinchDistance(e.touches)); setInitialPinchZoom(zoom);
    } else if (e.touches.length === 1 && !isDrawingMode) {
      setIsPanning(true); setPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, scrollLeft: scrollRef.current.scrollLeft, scrollTop: scrollRef.current.scrollTop });
    }
  };

  const handleTouchMove = (e) => {
    if (!scrollRef.current || isDisplayMode) return;
    if (e.touches.length === 2 && initialPinchDist) {
      if (e.cancelable) e.preventDefault(); 
      hasPanned.current = true;
      setZoom(Math.min(Math.max(initialPinchZoom * (getPinchDistance(e.touches) / initialPinchDist), 0.5), 3));
    } else if (e.touches.length === 1 && isPanning) {
      hasPanned.current = true;
      scrollRef.current.scrollLeft = panStart.scrollLeft - (e.touches[0].clientX - panStart.x);
      scrollRef.current.scrollTop = panStart.scrollTop - (e.touches[0].clientY - panStart.y);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) { setInitialPinchDist(null); setInitialPinchZoom(null); }
    if (e.touches.length === 0) setIsPanning(false);
  };

  const gridColor = mapData?.gridColor || 'rgba(255,255,255,0.35)';

  const cellGroups = {};
  Object.values(tokens || {}).forEach(t => {
    if (t.isHidden && !isDM) return;
    const key = `${t.x || 0},${t.y || 0}`;
    if (!cellGroups[key]) cellGroups[key] = [];
    cellGroups[key].push(t.id);
  });

  let mapCursorClass = 'cursor-auto';
  if (!isDisplayMode) {
     if (isDrawingMode) mapCursorClass = 'cursor-crosshair touch-none'; 
     else mapCursorClass = isPanning ? 'cursor-grabbing' : 'cursor-grab';
  }

  return (
    <div className={`relative w-full flex flex-col overflow-hidden h-full ${isDisplayMode ? 'rounded-none border-0 bg-black' : 'rounded-none md:rounded-2xl border-none md:border-[3px] border-slate-950 bg-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,1)]'}`}>
      
      <EnvironmentOverlay environment={mapData?.environment} />

      {!isDisplayMode && (
        <div className="absolute top-4 right-4 z-[90] flex flex-col gap-2 bg-slate-900 border-2 border-slate-950 p-2 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <button onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"><ZoomIn className="w-5 h-5"/></button>
          <button onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"><ZoomOut className="w-5 h-5"/></button>
          <div className="w-full h-0.5 bg-slate-950 my-0.5"></div>
          <button onClick={() => centerOnToken(cameraTargetId || mapData?.activeTokenId)} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-indigo-900/50"><Target className="w-5 h-5"/></button>
        </div>
      )}

      {(isDisplayMode || isPlayerMap) && activeActor && (
        <div className="fixed top-8 left-8 z-[200] flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-left-8 fade-in duration-500">
          {tokens[activeActor.id] ? (
             <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-slate-800 shrink-0">
               <TokenImage token={tokens[activeActor.id]} parsedName={getShortName(activeActor.name)} />
             </div>
          ) : (
             <div className="w-14 h-14 rounded-full border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-slate-900 flex items-center justify-center shrink-0">
               {activeActor.type === 'enemy' ? <Skull className="w-6 h-6 text-red-500" /> : <Swords className="w-6 h-6 text-indigo-400" />}
             </div>
          )}
          <div className="flex flex-col pr-4">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">Current Turn</span>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest leading-none drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {getShortName(activeActor.name)}
            </h1>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef} 
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`${isDisplayMode ? 'overflow-hidden flex-1 w-full' : 'overflow-auto flex-1 custom-scrollbar'} relative ${mapCursorClass}`}
      >
        <div 
          className="relative transition-all duration-700 origin-top-left ease-in-out"
          style={{ width: cols * currentCellSize, height: rows * currentCellSize, backgroundImage: mapData?.imageUrl ? `url(${mapData.imageUrl})` : 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'top left', imageRendering: 'crisp-edges' }}
        >
          
          {selectionBox && !isDisplayMode && (
            <div className="absolute border-[3px] border-indigo-400 bg-indigo-500/20 z-[100] pointer-events-none transition-all duration-75" style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY)
            }} />
          )}

          {!isDisplayMode && gridColor !== 'transparent' && (
            <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-500" style={{ backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`, backgroundSize: `${currentCellSize}px ${currentCellSize}px` }}></div>
          )}

          <MapDrawings 
            drawings={mapData?.drawings || []} fogOfWar={mapData?.fogOfWar} isDM={isDM}
            isDrawingMode={isDrawingMode && !isDisplayMode} drawingShape={drawingShape} 
            onDrawEnd={onDrawEnd} currentCellSize={currentCellSize} cols={cols} rows={rows} drawingColor={drawingColor} 
          />

          <div className={`absolute inset-0 grid z-20 ${isDrawingMode ? 'pointer-events-none' : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, ${currentCellSize}px)`, gridTemplateRows: `repeat(${rows}, ${currentCellSize}px)` }}>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const tile = { x: i % cols, y: Math.floor(i / cols) };
              let tileClass = isDisplayMode ? '' : 'hover:bg-white/20'; 

              if (!isDisplayMode && showMovementRangeFor) {
                  const tSize = showMovementRangeFor.size || 1;
                  const dx = Math.max(0, tile.x - (showMovementRangeFor.x + tSize - 1), showMovementRangeFor.x - tile.x);
                  const dy = Math.max(0, tile.y - (showMovementRangeFor.y + tSize - 1), showMovementRangeFor.y - tile.y);
                  const dist = Math.max(dx, dy) * 5;
                  const speed = showMovementRangeFor.speed || 30;

                  if (dist > 0 && dist <= speed) tileClass = 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.5),_transparent)] border border-emerald-400/50 hover:bg-emerald-400/70';
                  else if (dist > speed && dist <= speed * 2) tileClass = 'bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.5),_transparent)] border border-amber-400/50 hover:bg-amber-400/70';
              }

              return (
                <div 
                  key={`click-${tile.x},${tile.y}`}
                  onMouseDown={(e) => { 
                    if(isDisplayMode || isPlayerMap) { e.preventDefault(); return; } 
                    if(isDrawingMode) e.stopPropagation(); 
                  }}
                  onClick={(e) => { 
                    if(isPanning || hasPanned.current || selectionBox) return; 
                    if(!isDisplayMode && !isPlayerMap && onTileClick) onTileClick(tile.x, tile.y); 
                  }}
                  className={`w-full h-full transition-colors ${tileClass}`}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 pointer-events-none z-30">
            {Object.values(tokens || {}).sort((a, b) => {
                const aDead = (a.hp !== undefined && a.hp <= 0);
                const bDead = (b.hp !== undefined && b.hp <= 0);
                if (aDead && !bDead) return -1;
                if (!aDead && bDead) return 1;
                return (b.size || 1) - (a.size || 1);
              }).map(token => {
              const isSelected = selectedTokenIds.includes(token.id);
              const isActiveTurn = activeActor?.id === token.id; 
              
              const isEnemy = token.type === 'enemy';
              const isPlayer = token.type === 'player';
              const isNPC = token.type === 'npc';
              
              const tSize = token.size || 1; 
              
              const entityData = isEnemy ? activeEnemies.find(e => e.id === token.id) : isPlayer ? activePlayers.find(p => p.id === token.id) : null;
              const rawName = entityData ? entityData.name : token.name;
              const match = rawName ? rawName.match(/["']([^"']+)["']/) : null;
              const displayName = match ? match[1] : (rawName ? rawName.split(' ')[0] : 'Unknown');

              const tHp = entityData ? (entityData.currentHp ?? entityData.hp) : token.hp;
              const tMaxHp = entityData ? (entityData.maxHp ?? entityData.hp) : token.maxHp;
              const tTempHp = entityData ? entityData.tempHp : token.tempHp;

              const isDead = tHp !== undefined && tHp <= 0;
              const isBloodied = !isDead && tHp !== undefined && tMaxHp && (tHp <= tMaxHp / 2);
              
              if (token.isHidden && !isDM) return null; 

              const safeX = token.x || 0;
              const safeY = token.y || 0;
              const group = cellGroups[`${safeX},${safeY}`]?.sort() || [];
              const stackIndex = group.indexOf(token.id);
              const offsetXY = stackIndex > 0 ? stackIndex * 6 : 0;
              
              return (
                <div
                  key={token.id}
                  onMouseDown={(e) => {
                    if (!isDisplayMode && !isPlayerMap && onTokenClick && (isDM || isSelected)) {
                      e.stopPropagation();
                      if (!isDrawingMode) onTokenClick(token.id, e.shiftKey);
                    }
                  }}
                  className={`absolute transition-all duration-700 ease-in-out flex items-center justify-center ${isDisplayMode || isDrawingMode || isPlayerMap ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer hover:scale-105'} ${token.isHidden ? 'opacity-40 grayscale' : ''}`}
                  style={{ width: currentCellSize * tSize, height: currentCellSize * tSize, transform: `translate(${safeX * currentCellSize + offsetXY}px, ${safeY * currentCellSize - offsetXY}px)` }}
                >
                  
                  {token.aura > 0 && !isDead && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" style={{ width: currentCellSize * (tSize + (token.aura / 5) * 2), height: currentCellSize * (tSize + (token.aura / 5) * 2) }}>
                      <div className={`w-full h-full rounded-full border-[4px] border-dashed transition-all duration-500 ${isEnemy ? 'border-red-500/80 bg-red-500/20' : 'border-indigo-400/80 bg-indigo-400/20'} ${isDisplayMode ? 'animate-[spin_20s_linear_infinite]' : 'animate-[spin_30s_linear_infinite]'}`} />
                    </div>
                  )}

                  <div className={`relative w-[80%] h-[80%] rounded-full shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transition-all z-10
                    ${isSelected && !isDisplayMode ? 'ring-[4px] ring-white scale-105 z-40' : ''} 
                    ${isActiveTurn ? (isDisplayMode ? 'ring-[6px] ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-105 z-50' : 'ring-[4px] md:ring-[6px] ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse z-50') : ''} 
                    ${isDead ? 'grayscale-[0.9] opacity-60' : ''}
                    ${isBloodied && !isActiveTurn && !isNPC ? 'ring-[4px] ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : ''}
                    ${isEnemy && !isBloodied && !isActiveTurn && !isDead ? 'ring-[3px] ring-slate-950 bg-red-950 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : ''}
                    ${isPlayer && !isBloodied && !isActiveTurn && !isDead ? 'ring-[3px] ring-slate-950 bg-indigo-950 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''}
                    ${isNPC && !isBloodied && !isActiveTurn && !isDead ? 'ring-[3px] ring-slate-950 bg-slate-800 shadow-[0_0_15px_rgba(148,163,184,0.5)]' : ''}
                  `}>
                    
                    {token.elevation > 0 && !isDead && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sky-500 border-2 border-slate-950 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)] z-50 whitespace-nowrap pointer-events-none">+{token.elevation}ft</div>
                    )}

                    {token.isConcentrating && !isDead && (
                      <div className="absolute -top-2 -left-2 bg-amber-400 rounded-full p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] border-2 border-slate-950 z-50 pointer-events-none animate-pulse"><BrainCircuit className={`${isDisplayMode ? 'w-6 h-6' : 'w-4 h-4'} text-slate-950`} /></div>
                    )}

                    <TokenImage token={token} parsedName={displayName} />

                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 rounded-full z-40 pointer-events-none"><Skull className="w-2/3 h-2/3 text-red-500 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" /></div>
                    )}

                    {(tTempHp > 0) && !isDead && <div className="absolute inset-0 rounded-full ring-[4px] ring-inset ring-indigo-400 shadow-[inset_0_0_20px_rgba(129,140,248,0.8)] z-30 pointer-events-none animate-pulse"></div>}

                    {(token.conditions?.length > 0) && !isDead && (
                      <div className={`absolute ${isDisplayMode ? '-top-3 -right-5 gap-2' : '-top-2 -right-3 gap-1'} flex flex-wrap-reverse justify-end w-20 z-50 pointer-events-none`}>
                        {token.conditions.map(cond => {
                          const config = CONDITION_ICONS[cond];
                          if (!config) return <div key={cond} className={`bg-fuchsia-500 rounded-full ${isDisplayMode ? 'p-1 border-2' : 'p-1 border-2'} shadow-[2px_2px_0px_rgba(0,0,0,1)] border-slate-950`}><AlertCircle className={`${isDisplayMode ? 'w-5 h-5' : 'w-3 h-3'} text-slate-950`} /></div>;
                          const Icon = config.icon;
                          return <div key={cond} className={`rounded-full ${isDisplayMode ? 'p-1 border-2' : 'p-1 border-2'} shadow-[2px_2px_0px_rgba(0,0,0,1)] border-slate-950 ${config.color}`} title={cond}><Icon className={`${isDisplayMode ? 'w-5 h-5' : 'w-3 h-3'}`} /></div>;
                        })}
                      </div>
                    )}
                    
                    {token.isHidden && isDM && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-500 rounded-full p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] border-2 border-slate-950 z-50"><EyeOff className="w-3 h-3 md:w-4 md:h-4" /></div>}
                  </div>

                  {isDM && !isDisplayMode && tHp !== undefined && !isDead && !isNPC && (
                    <div className="absolute -bottom-2 left-[5%] w-[90%] h-2 bg-slate-950 rounded-full overflow-hidden border-2 border-slate-950 z-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] pointer-events-none">
                       {(tTempHp > 0) && <div className="absolute top-0 left-0 h-full bg-indigo-500 z-20 shadow-[0_0_5px_rgba(99,102,241,0.8)]" style={{ width: `${Math.min(100, (tTempHp / (tMaxHp || 1)) * 100)}%` }} />}
                       <div className={`absolute top-0 left-0 h-full z-10 transition-all ${tHp / (tMaxHp || 1) > 0.5 ? 'bg-emerald-500' : tHp / (tMaxHp || 1) > 0.2 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(0, Math.min(100, (tHp / (tMaxHp || 1)) * 100))}%` }} />
                    </div>
                  )}

                  {isDM && !isDisplayMode && currentCellSize >= 30 && <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-slate-950 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none z-40">{displayName.substring(0, 10)}</div>}

                </div>
              );
            })}
          </div>
        </div>

        {/* FREELY FLOATING CONTEXT MENU */}
        {selectedTokenIds.length > 0 && !isDisplayMode && !isPlayerMap && isDM && (
          <TokenContextMenu 
            selectedTokens={selectedTokenIds.map(id => tokens[id]).filter(Boolean)}
            activeEnemies={activeEnemies}
            activePlayers={activePlayers}
            onUpdateHpLive={onUpdateHpLive}
            onDeselect={onDeselect}
            onToggleSize={onToggleSize}
            onToggleAura={onToggleAura}
            onToggleElevation={onToggleElevation}
            onToggleConcentration={onToggleConcentration}
            onToggleRuler={onToggleRuler}
            onToggleHidden={onToggleHidden}
            onUpdateImage={onUpdateImage}
            onRemoveToken={onRemoveToken}
            onToggleCondition={onToggleCondition}
            showMovementRangeFor={showMovementRangeFor}
          />
        )}

      </div>
    </div>
  );
}