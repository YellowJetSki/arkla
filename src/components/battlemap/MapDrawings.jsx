import React, { useState, useRef } from 'react';

export default function MapDrawings({ 
  drawings = [], 
  isDrawingMode = false, 
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
    // Support both mouse and touch events
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
    setCurrentLine({ points: [coords], color: drawingColor });
  };

  const handlePointerMove = (e) => {
    if (!isDrawingMode || !currentLine) return;
    const coords = getCoords(e.nativeEvent || e);
    setCurrentLine(prev => ({
      ...prev,
      points: [...prev.points, coords]
    }));
  };

  const handlePointerUp = () => {
    if (!isDrawingMode || !currentLine) return;
    if (currentLine.points.length > 1 && onDrawEnd) {
      onDrawEnd(currentLine);
    }
    setCurrentLine(null);
  };

  const renderLine = (line, index) => {
    if (!line || !line.points || line.points.length === 0) return null;
    const d = line.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * currentCellSize} ${p.y * currentCellSize}`).join(' ');
    
    return (
      <path 
        key={index} 
        d={d} 
        stroke={line.color || '#ef4444'} 
        strokeWidth={4} 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        opacity={0.85}
      />
    );
  };

  return (
    <svg
      ref={svgRef}
      // If drawing mode is active, this SVG intercepts clicks (z-[35] is above tokens). If false, it ignores clicks.
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
      {drawings.map((line, i) => renderLine(line, line.id || i))}
      {currentLine && renderLine(currentLine, 'current')}
    </svg>
  );
}