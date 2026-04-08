import React, { useState, useRef } from 'react';

export default function MapDrawings({ 
  drawings = [], 
  isDM = false,
  isDrawingMode = false, 
  drawingShape = 'freehand',
  onDrawEnd, 
  currentCellSize = 50, 
  cols = 20, 
  rows = 15,
  drawingColor = '#ef4444',
  fogOfWar = false
}) {
  const [currentLine, setCurrentLine] = useState(null);
  const svgRef = useRef(null);

  const getCoords = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) / currentCellSize,
      y: (clientY - rect.top) / currentCellSize
    };
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const coords = getCoords(e.nativeEvent || e);
    setCurrentLine({ type: drawingShape, points: [coords], color: drawingColor });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const coords = getCoords(e.nativeEvent || e);
    
    setCurrentLine(prev => {
      if (prev.type === 'freehand' || prev.type === 'reveal') {
        return { ...prev, points: [...prev.points, coords] };
      } else {
        return { ...prev, points: [prev.points[0], coords] };
      }
    });
  };

  const handlePointerUp = () => {
    if (!isDrawingMode || !currentLine) return;
    if (currentLine.points.length > 1 && onDrawEnd) {
      onDrawEnd(currentLine);
    }
    setCurrentLine(null);
  };

  const renderShape = (line, index, isMask = false) => {
    if (!line || !line.points || line.points.length === 0) return null;
    const p1 = line.points[0];
    const p2 = line.points[line.points.length - 1];

    const strokeColor = isMask ? "black" : (line.color || '#ef4444');
    const fillColor = isMask ? "black" : (line.color || '#ef4444');
    const shapeType = line.type || line.shape; 

    if (shapeType === 'freehand' || shapeType === 'reveal') {
      const strokeWidth = shapeType === 'reveal' ? 60 : 4;
      const d = line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * currentCellSize} ${p.y * currentCellSize}`).join(' ');
      return <path key={index} d={d} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={isMask ? 1 : 0.85} />;
    }

    if (!p2) return null;

    const x1 = p1.x * currentCellSize;
    const y1 = p1.y * currentCellSize;
    const x2 = p2.x * currentCellSize;
    const y2 = p2.y * currentCellSize;

    // THE NEW RULER LOGIC
    if (shapeType === 'ruler') {
      const distance = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 5);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      return (
        <g key={index}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={6} strokeDasharray="8 8" strokeLinecap="round" opacity={isMask ? 1 : 0.8} />
          <rect x={midX - 30} y={midY - 14} width="60" height="28" fill="#0f172a" rx="6" stroke={strokeColor} strokeWidth={2} />
          <text x={midX} y={midY + 4} fill="white" fontSize="12" fontWeight="900" textAnchor="middle" pointerEvents="none">{distance}ft</text>
        </g>
      );
    }

    if (shapeType === 'line') {
      return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={8} strokeLinecap="round" opacity={isMask ? 1 : 0.6} />;
    }

    if (shapeType === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return (
        <circle key={index} cx={x1} cy={y1} r={radius} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} opacity={isMask ? 1 : 0.85} />
      );
    }

    if (shapeType === 'cone') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const halfAngle = (53 / 2) * (Math.PI / 180); 
      
      const p2x = x1 + distance * Math.cos(angle - halfAngle);
      const p2y = y1 + distance * Math.sin(angle - halfAngle);
      
      const p3x = x1 + distance * Math.cos(angle + halfAngle);
      const p3y = y1 + distance * Math.sin(angle + halfAngle);

      return (
        <polygon key={index} points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} strokeLinejoin="round" opacity={isMask ? 1 : 0.85} />
      );
    }

    return null;
  };

  const paints = drawings.filter(d => (d.type || d.shape) !== 'reveal');
  const reveals = drawings.filter(d => (d.type || d.shape) === 'reveal');
  
  const currentPaints = currentLine && currentLine.type !== 'reveal' ? currentLine : null;
  const currentReveals = currentLine && currentLine.type === 'reveal' ? currentLine : null;

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 z-[35] ${isDrawingMode ? 'cursor-crosshair pointer-events-auto touch-none' : 'pointer-events-none'}`}
      style={{ width: cols * currentCellSize, height: rows * currentCellSize }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* THE FOG OF WAR MASK LAYER */}
      {fogOfWar && (
        <defs>
          <filter id="softRevealEdge" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" />
          </filter>

          <mask id="fogMask">
            <rect width="100%" height="100%" fill="white" />
            <g filter="url(#softRevealEdge)">
              {reveals.map((line, i) => renderShape(line, `rev-${i}`, true))}
              {currentReveals && renderShape(currentReveals, 'curr-rev', true)}
            </g>
          </mask>
        </defs>
      )}

      {fogOfWar && (
        <rect 
          width="100%" 
          height="100%" 
          fill="#020617" 
          mask="url(#fogMask)" 
          opacity={isDM ? "0.45" : "0.98"} 
        />
      )}

      {/* THE STANDARD DRAWING LAYER */}
      {paints.map((line, i) => renderShape(line, `paint-${line.id || i}`))}
      {currentPaints && renderShape(currentPaints, 'curr-paint')}
    </svg>
  );
}