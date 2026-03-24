import { Shield, Skull, AlertCircle } from 'lucide-react';

export default function MapGrid({ 
  mapData, 
  tokens, 
  onTileClick, 
  selectedTokenId, 
  isDM 
}) {
  // Default to a 20x15 grid if the DM hasn't set one yet
  const cols = mapData?.cols || 20;
  const rows = mapData?.rows || 15;
  const CELL_SIZE = 50; // Fixed pixel size for each grid square

  // Generate the grid tiles for click targets
  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      tiles.push({ x, y });
    }
  }

  return (
    <div className="relative overflow-auto custom-scrollbar border border-slate-700 rounded-xl bg-slate-950 shadow-inner max-h-[70vh]">
      <div 
        className="relative transform-gpu"
        style={{ 
          width: cols * CELL_SIZE, 
          height: rows * CELL_SIZE,
          backgroundImage: mapData?.imageUrl ? `url(${mapData.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* The Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        ></div>

        {/* Clickable Tiles Layer */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)` }}>
          {tiles.map((tile) => (
            <div 
              key={`${tile.x}-${tile.y}`}
              onClick={() => onTileClick(tile.x, tile.y)}
              className="w-full h-full hover:bg-white/20 transition-colors cursor-pointer z-10"
            />
          ))}
        </div>

        {/* Tokens Layer */}
        {Object.values(tokens || {}).map(token => {
          const isSelected = selectedTokenId === token.id;
          const isEnemy = token.type === 'enemy';
          
          return (
            <div
              key={token.id}
              className={`absolute transition-all duration-500 ease-in-out z-20 flex items-center justify-center pointer-events-none`}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                transform: `translate(${token.x * CELL_SIZE}px, ${token.y * CELL_SIZE}px)`
              }}
            >
              <div className={`relative w-10 h-10 rounded-full shadow-lg border-2 ${isSelected ? 'ring-4 ring-white animate-pulse' : ''} ${isEnemy ? 'border-red-500 bg-red-950' : 'border-indigo-500 bg-indigo-950'}`}>
                
                {token.img ? (
                  <img src={token.img} alt={token.name} className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isEnemy ? <Skull className="w-6 h-6 text-red-400" /> : <Shield className="w-6 h-6 text-indigo-400" />}
                  </div>
                )}

                {/* Condition Indicators */}
                {(token.conditions?.length > 0) && (
                  <div className="absolute -top-2 -right-2 bg-fuchsia-600 rounded-full p-0.5 shadow border border-fuchsia-300 animate-bounce">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {/* DM Tag & HP Ring */}
                {isDM && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                    {token.name.substring(0, 8)}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}