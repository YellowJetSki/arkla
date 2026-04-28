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

  // Helper to draw the measurement badges cleanly
  const DistanceBadge = ({ x, y, text, color, isMask }) => {
    if (isMask) return null;
    return (
      <g className="animate-in zoom-in duration-200">
        <rect x={x - 30} y={y - 14} width="60" height="28" fill="#0f172a" rx="6" stroke={color} strokeWidth={2} />
        <text x={x} y={y + 4} fill="white" fontSize="12" fontWeight="900" textAnchor="middle" pointerEvents="none drop-shadow-md">
          {text}
        </text>
      </g>
    );
  };

  const getCoords = (e, shouldSnap = false) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = (clientX - rect.left) / currentCellSize;
    let y = (clientY - rect.top) / currentCellSize;

    // Snap to intersections or half-squares for precision AoE
    if (shouldSnap) {
      x = Math.round(x * 2) / 2;
      y = Math.round(y * 2) / 2;
    }

    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (!isDrawingMode) return;
    const needsSnapping = ['circle', 'cone', 'line', 'ruler'].includes(drawingShape);
    const coords = getCoords(e.nativeEvent || e, needsSnapping);
    setCurrentLine({ type: drawingShape, points: [coords], color: drawingColor });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const needsSnapping = ['circle', 'cone', 'line', 'ruler'].includes(currentLine.type);
    const coords = getCoords(e.nativeEvent || e, needsSnapping);
    
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

    const rawDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const distanceFt = Math.round(rawDistance * 5);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    if (shapeType === 'ruler') {
      return (
        <g key={index}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={6} strokeDasharray="8 8" strokeLinecap="round" opacity={isMask ? 1 : 0.8} />
          <DistanceBadge x={midX} y={midY} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />
        </g>
      );
    }

    if (shapeType === 'line') {
      return (
        <g key={index}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={12} strokeLinecap="round" opacity={isMask ? 1 : 0.6} />
          {distanceFt > 0 && <DistanceBadge x={midX} y={midY} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
        </g>
      );
    }

    if (shapeType === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return (
        <g key={index}>
          <circle cx={x1} cy={y1} r={radius} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} opacity={isMask ? 1 : 0.85} />
          {distanceFt > 0 && <DistanceBadge x={x1} y={y1 - radius} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
        </g>
      );
    }

    if (shapeType === 'cone') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const halfAngle = (53 / 2) * (Math.PI / 180); // 53 degrees creates a standard D&D cone ratio
      
      const p2x = x1 + distance * Math.cos(angle - halfAngle);
      const p2y = y1 + distance * Math.sin(angle - halfAngle);
      
      const p3x = x1 + distance * Math.cos(angle + halfAngle);
      const p3y = y1 + distance * Math.sin(angle + halfAngle);

      return (
        <g key={index}>
          <polygon points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} stroke={strokeColor} strokeWidth={4} fill={fillColor} fillOpacity={isMask ? 1 : 0.2} strokeLinejoin="round" opacity={isMask ? 1 : 0.85} />
          {distanceFt > 0 && <DistanceBadge x={x2} y={y2} text={`${distanceFt}ft`} color={strokeColor} isMask={isMask} />}
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