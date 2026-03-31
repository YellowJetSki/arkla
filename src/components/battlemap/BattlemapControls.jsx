import { Map, PenTool, Circle, Triangle, Eraser, MonitorPlay, Save, Settings, Send, EyeOff } from 'lucide-react';

export default function BattlemapControls({
  isDrawingMode, setIsDrawingMode,
  drawingShape, setDrawingShape,
  drawingColor, setDrawingColor,
  handleClearDrawings,
  launchDisplayTab,
  setIsPresetsOpen,
  isEditingMap, setIsEditingMap,
  mapData, togglePublish
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/50 p-3 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-20">
      <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2 shrink-0 uppercase tracking-widest drop-shadow-sm">
        <Map className="w-5 h-5" /> Battlefield
      </h2>
      
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar">
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner mr-2 shrink-0">
          <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isDrawingMode ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'}`}>
            <PenTool className="w-3.5 h-3.5" /> Pen
          </button>
          {isDrawingMode && (
            <div className="flex items-center gap-1.5 px-2 border-l border-slate-700/50 ml-1 pl-2">
              <button onClick={() => setDrawingShape('freehand')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'freehand' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><PenTool className="w-3 h-3" /></button>
              <button onClick={() => setDrawingShape('line')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'line' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><div className="w-3 h-0.5 bg-current rotate-45" /></button>
              <button onClick={() => setDrawingShape('circle')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'circle' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><Circle className="w-3 h-3" /></button>
              <button onClick={() => setDrawingShape('cone')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'cone' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}><Triangle className="w-3 h-3" /></button>
              <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
              {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
                <button key={c} onClick={() => setDrawingColor(c)} className={`w-5 h-5 rounded-full border-2 transition-all ${drawingColor === c ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
          <button onClick={handleClearDrawings} className="text-slate-500 hover:text-red-400 p-2 ml-1 border-l border-slate-700/50 transition-colors"><Eraser className="w-4 h-4" /></button>
        </div>

        <button onClick={launchDisplayTab} className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 uppercase tracking-wider"><MonitorPlay className="w-3.5 h-3.5" /> Cast</button>
        <button onClick={() => setIsPresetsOpen(true)} className="bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 uppercase tracking-wider"><Save className="w-3.5 h-3.5" /> Presets</button>
        <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 uppercase tracking-wider"><Settings className="w-3.5 h-3.5" /> Config</button>
        <button onClick={togglePublish} className={`px-4 py-1.5 rounded-lg font-black text-[10px] md:text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 uppercase tracking-widest ${mapData.isPublished ? 'bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'}`}>
          {mapData.isPublished ? <><Send className="w-3.5 h-3.5"/> LIVE</> : <><EyeOff className="w-3.5 h-3.5"/> HIDDEN</>}
        </button>
      </div>
    </div>
  );
}