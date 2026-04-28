import React, { useState, useRef, useEffect } from 'react';

export default function MapDrawings({ 
  drawings = [], isDM = false, isDrawingMode = false, drawingShape = 'freehand',
  onDrawEnd, currentCellSize = 50, cols = 20, rows = 15, drawingColor = '#ef4444', fogOfWar = false
}) {
  const [currentLine, setCurrentLine] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift' && currentLine?.type === 'ruler') {
        setCurrentLine(prev => {
          if (!prev || prev.points.length === 0) return prev;
          const lastPoint = prev.points[prev.points.length - 1];
          return { ...prev, points: [...prev.points, lastPoint] };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLine]);

  const DistanceBadge = ({ x, y, text, color, isMask }) => {
    if (isMask) return null;
    return (
      <g className="animate-in zoom-in duration-200">
        <rect x={x - 30} y={y - 14} width="60" height="28" fill="#0f172a" rx="6" stroke={color} strokeWidth={2} />
        <text x={x} y={y + 4} fill="white" fontSize="12" fontWeight="900" textAnchor="middle" pointerEvents="none drop-shadow-md">{text}</text>
      </g>
    );
  };

  const getCoords = (e, shouldSnap = false) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);

    let x = (clientX - rect.left) / currentCellSize;
    let y = (clientY - rect.top) / currentCellSize;
    if (shouldSnap) { x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; }
    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const needsSnapping = ['circle', 'cone', 'line', 'ruler', 'torch_circle', 'torch_cone', 'sun_circle', 'sun_cone'].includes(drawingShape);
    const coords = getCoords(e.nativeEvent || e, needsSnapping);
    // Explicitly stage 2 points to prevent SVG shapes from collapsing to 0 length
    setCurrentLine({ type: drawingShape, points: [coords, coords], color: drawingColor });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const needsSnapping = ['circle', 'cone', 'line', 'ruler', 'torch_circle', 'torch_cone', 'sun_circle', 'sun_cone'].includes(currentLine.type);
    const coords = getCoords(e.nativeEvent || e, needsSnapping);
    
    setCurrentLine(prev => {
      if (prev.type === 'freehand' || prev.type === 'reveal') {
        return { ...prev, points: [...prev.points, coords] };
      } else if (prev.type === 'ruler') {
        const updatedPoints = [...prev.points];
        updatedPoints[updatedPoints.length - 1] = coords;
        return { ...prev, points: updatedPoints };
      } else {
        // Shapes, Lines, and Lights require EXACTLY 2 points (Anchor and Drag)
        return { ...prev, points: [prev.points[0], coords] };
      }
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingMode || !currentLine) return;
    if (currentLine.points.length > 1 && onDrawEnd) onDrawEnd(currentLine);
    setCurrentLine(null);
  };

  const renderShape = (line, index, isMask = false) => {
    if (!line || !line.points || line.points.length === 0) return null;
    const strokeColor = isMask ? "black" : (line.color || '#ef4444');
    const fillColor = isMask ? "black" : (line.color || '#ef4444');
    const shapeType = line.type || line.shape; 

    if (shapeType === 'freehand' || shapeType === 'reveal') {
      const d = line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * currentCellSize} ${p.y * currentCellSize}`).join(' ');
      if (!d.trim()) return null;
      return <path key={index} d={d} stroke={strokeColor} strokeWidth={shapeType === 'reveal' ? 60 : 4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={isMask ? 1 : 0.85} />;
    }

    if (line.points.length < 2) return null;

    if (shapeType === 'ruler') {
      let totalDistance = 0;
      const segments = [];
      for (let i = 0; i < line.points.length - 1; i++) {
         const pA = line.points[i];
         const pB = line.points[i+1];
         totalDistance += Math.hypot(pB.x - pA.x, pB.y - pA.y);
         segments.push(<line key={`seg-${i}`} x1={pA.x * currentCellSize} y1={pA.y * currentCellSize} x2={pB.x * currentCellSize} y2={pB.y * currentCellSize} stroke={strokeColor} strokeWidth={6} strokeDasharray="8 8" strokeLinecap="round" opacity={isMask ? 1 : 0.8} />);
         if (i > 0) segments.push(<circle key={`dot-${i}`} cx={pA.x * currentCellSize} cy={pA.y * currentCellSize} r={5} fill={strokeColor} opacity={0.9} />); 
      }
      const endPoint = line.points[line.points.length - 1];
      const distFt = Math.round(totalDistance * 5);
      return (
        <g key={index}>
          {segments}
          <DistanceBadge x={endPoint.x * currentCellSize} y={endPoint.y * currentCellSize} text={`${distFt}ft`} color={strokeColor} isMask={isMask} />
        </g>
      );
    }

    const p1 = line.points[0];
    const p2 = line.points[line.points.length - 1];
    const x1 = p1.x * currentCellSize, y1 = p1.y * currentCellSize;
    const x2 = p2.x * currentCellSize, y2 = p2.y * currentCellSize;
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const distanceFt = Math.round(distance * 5);
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;

    if (shapeType === 'line') return (
        <g key={index}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={12} strokeLinecap="round" opacity={isMask ? 1 : 0.6} />
          {distanceFt > 0 && <DistanceBadge x={midX} y={midY} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
        </g>
    );

    if (shapeType === 'circle') {
      const radius = distance * currentCellSize;
      return (
        <g key={index}>
          <circle cx={x1} cy={y1} r={radius} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} opacity={isMask ? 1 : 0.85} />
          {distanceFt > 0 && <DistanceBadge x={x1} y={y1 - radius} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
        </g>
      );
    }

    if (shapeType === 'cone') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distPx = distance * currentCellSize;
      const halfAngle = (53 / 2) * (Math.PI / 180); 
      const p2x = x1 + distPx * Math.cos(angle - halfAngle);
      const p2y = y1 + distPx * Math.sin(angle - halfAngle);
      const p3x = x1 + distPx * Math.cos(angle + halfAngle);
      const p3y = y1 + distPx * Math.sin(angle + halfAngle);
      return (
        <g key={index}>
          <polygon points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} strokeLinejoin="round" opacity={isMask ? 1 : 0.85} />
          {distanceFt > 0 && <DistanceBadge x={x2} y={y2} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
        </g>
      );
    }

    // NEW DYNAMIC LIGHTING: SPLIT INTO FLICKERING TORCH OR STATIC SUNLIGHT
    if (shapeType === 'torch_circle' || shapeType === 'sun_circle') {
      const radius = distance * currentCellSize;
      const isTorch = shapeType === 'torch_circle';
      return (
        <g key={index} className="pointer-events-none" style={{ mixBlendMode: 'screen', animation: isTorch ? 'torch-flicker 0.4s infinite alternate ease-in-out' : 'none' }}>
          <defs>
            <radialGradient id={`glow-circ-${index}`} cx={x1} cy={y1} r={radius} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isTorch ? "0.9" : "0.7"} />
              <stop offset="50%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={x1} cy={y1} r={radius} fill={`url(#glow-circ-${index})`} />
          {isDM && <circle cx={x1} cy={y1} r={radius} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />}
          {distanceFt > 0 && isDM && <DistanceBadge x={x1} y={y1 - radius} text={`${distanceFt}ft`} color="rgba(255,255,255,0.6)" isMask={isMask} />}
        </g>
      );
    }

    if (shapeType === 'torch_cone' || shapeType === 'sun_cone') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distPx = distance * currentCellSize;
      const halfAngle = (53 / 2) * (Math.PI / 180); 
      const p2x = x1 + distPx * Math.cos(angle - halfAngle);
      const p2y = y1 + distPx * Math.sin(angle - halfAngle);
      const p3x = x1 + distPx * Math.cos(angle + halfAngle);
      const p3y = y1 + distPx * Math.sin(angle + halfAngle);
      const isTorch = shapeType === 'torch_cone';

      return (
        <g key={index} className="pointer-events-none" style={{ mixBlendMode: 'screen', animation: isTorch ? 'torch-flicker 0.4s infinite alternate ease-in-out' : 'none' }}>
          <defs>
            <radialGradient id={`glow-cone-${index}`} cx={x1} cy={y1} r={distPx} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isTorch ? "0.9" : "0.7"} />
              <stop offset="50%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          <polygon points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} fill={`url(#glow-cone-${index})`} />
          {isDM && <polygon points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="6 6" fill="none" strokeLinejoin="round" />}
          {distanceFt > 0 && isDM && <DistanceBadge x={x2} y={y2} text={`${distanceFt}ft`} color="rgba(255,255,255,0.6)" isMask={isMask} />}
        </g>
      );
    }

    return null;
  };

  const paints = drawings.filter(d => (d.type || d.shape) !== 'reveal');
  const reveals = drawings.filter(d => (d.type || d.shape) === 'reveal');
  const currentPaints = currentLine && currentLine.type !== 'reveal' ? currentLine : null;
  const currentReveals = currentLine && currentLine.type === 'reveal' ? currentLine : null;

  return (
    <>
      <style>{`
        @keyframes torch-flicker { 
          0% { opacity: 0.8; } 
          25% { opacity: 1; } 
          50% { opacity: 0.7; } 
          75% { opacity: 0.95; } 
          100% { opacity: 0.85; } 
        }
      `}</style>
      <svg ref={svgRef} className={`absolute inset-0 z-[35] ${isDrawingMode ? 'cursor-crosshair pointer-events-auto touch-none' : 'pointer-events-none'}`} style={{ width: cols * currentCellSize, height: rows * currentCellSize }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}>
        {fogOfWar && (
          <defs>
            <filter id="softRevealEdge" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15" /></filter>
            <mask id="fogMask">
              <rect width="100%" height="100%" fill="white" />
              <g filter="url(#softRevealEdge)">
                {reveals.map((line, i) => renderShape(line, `rev-${i}`, true))}
                {currentReveals && renderShape(currentReveals, 'curr-rev', true)}
              </g>
            </mask>
          </defs>
        )}
        {fogOfWar && <rect width="100%" height="100%" fill="#020617" mask="url(#fogMask)" opacity={isDM ? "0.45" : "0.98"} />}
        {paints.map((line, i) => renderShape(line, `paint-${line.id || i}`))}
        {currentPaints && renderShape(currentPaints, 'curr-paint')}
      </svg>
    </>
  );
}