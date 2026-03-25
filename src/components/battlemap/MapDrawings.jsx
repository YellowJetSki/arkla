import React, { useState, useRef } from 'react';

export default function MapDrawings({ 
  drawings = [], 
  isDrawingMode = false, 
  drawingShape = 'freehand',
  onDrawEnd, 
  currentCellSize, 
  cols, 
  rows,
  drawingColor = '#ef4444'
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
      if (prev.type === 'freehand') {
        return { ...prev, points: [...prev.points, coords] };
      } else {
        // For shapes, we just need the start and the current endpoint
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

  const renderShape = (line, index) => {
    if (!line || !line.points || line.points.length === 0) return null;
    const p1 = line.points[0];
    const p2 = line.points[line.points.length - 1];

    if (line.type === 'freehand') {
      const d = line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * currentCellSize} ${p.y * currentCellSize}`).join(' ');
      return <path key={index} d={d} stroke={line.color || '#ef4444'} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
    }

    if (!p2) return null;

    const x1 = p1.x * currentCellSize;
    const y1 = p1.y * currentCellSize;
    const x2 = p2.x * currentCellSize;
    const y2 = p2.y * currentCellSize;

    if (line.type === 'line') {
      return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={line.color} strokeWidth={8} strokeLinecap="round" opacity={0.6} />;
    }

    if (line.type === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return (
        <circle key={index} cx={x1} cy={y1} r={radius} stroke={line.color} strokeWidth={4} fill={line.color} fillOpacity={0.2} opacity={0.85} />
      );
    }

    if (line.type === 'cone') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      // Standard D&D 53 degree cone
      const halfAngle = (53 / 2) * (Math.PI / 180); 
      
      const p2x = x1 + distance * Math.cos(angle - halfAngle);
      const p2y = y1 + distance * Math.sin(angle - halfAngle);
      
      const p3x = x1 + distance * Math.cos(angle + halfAngle);
      const p3y = y1 + distance * Math.sin(angle + halfAngle);

      return (
        <polygon key={index} points={`${x1},${y1} ${p2x},${p2y} ${p3x},${p3y}`} stroke={line.color} strokeWidth={4} fill={line.color} fillOpacity={0.2} strokeLinejoin="round" opacity={0.85} />
      );
    }

    return null;
  };

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
      {drawings.map((line, i) => renderShape(line, line.id || i))}
      {currentLine && renderShape(currentLine, 'current')}
    </svg>
  );
}