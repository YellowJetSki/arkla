import React from 'react';
import { 
  Swords, PenTool, HardDriveDownload, HardDriveUpload, Book, 
  ShieldAlert, PackagePlus, Image as ImageIcon, Eraser, RefreshCw, LogOut 
} from 'lucide-react';

export default function DMControlNav({
  showScratchpad,
  setShowScratchpad,
  handleExportCampaign,
  fileInputRef,
  handleImportCampaign,
  activeManager,
  setActiveManager,
  confirmClearConditions,
  confirmResetSession,
  onLogout
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 md:p-6 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-4 z-40">
      <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-start">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-indigo-400/50 shrink-0">
          <Swords className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white tracking-widest uppercase">The Forge</h1>
          <p className="text-indigo-400 font-bold text-xs md:text-sm">Command Center</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
        
        <button onClick={() => setShowScratchpad(!showScratchpad)} className={`px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${showScratchpad ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'}`}>
          <PenTool className="w-4 h-4" /> Notes
        </button>

        <div className="flex bg-slate-950/50 p-1 rounded-lg border border-slate-700 shadow-inner mr-2 ml-2">
          <button onClick={handleExportCampaign} className="hover:bg-slate-800 text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5"><HardDriveDownload className="w-4 h-4" /> <span className="hidden md:inline">Backup</span></button>
          <button onClick={() => fileInputRef.current?.click()} className="hover:bg-slate-800 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5"><HardDriveUpload className="w-4 h-4" /> <span className="hidden md:inline">Restore</span></button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportCampaign} className="hidden" />
        </div>

        <button onClick={() => setActiveManager(activeManager === 'rules' ? null : 'rules')} className={`px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'rules' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800/80 hover:bg-slate-700 text-sky-400 border-sky-900/50'}`}>
          <Book className="w-4 h-4" /> <span className="hidden md:inline">Rules</span>
        </button>
        <button onClick={() => setActiveManager(activeManager === 'encounters' ? null : 'encounters')} className={`px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'encounters' ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-amber-900/50'}`}>
          <ShieldAlert className="w-4 h-4" /> <span className="hidden md:inline">Encounters</span>
        </button>
        <button onClick={() => setActiveManager(activeManager === 'items' ? null : 'items')} className={`px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'items' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border-emerald-900/50'}`}>
          <PackagePlus className="w-4 h-4" /> <span className="hidden md:inline">Vault</span>
        </button>
        <button onClick={() => setActiveManager(activeManager === 'handouts' ? null : 'handouts')} className={`px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border shadow-sm ${activeManager === 'handouts' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-800/80 hover:bg-slate-700 text-purple-400 border-purple-900/50'}`}>
          <ImageIcon className="w-4 h-4" /> <span className="hidden md:inline">Handouts</span>
        </button>
        
        <div className="w-px h-8 bg-slate-700 hidden md:block mx-1"></div>

        <button onClick={confirmClearConditions} className="bg-fuchsia-900/30 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white border border-fuchsia-900/50 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2"><Eraser className="w-4 h-4" /> Sweep</button>
        <button onClick={confirmResetSession} className="bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/50 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Wipe</button>
        <button onClick={onLogout} className="bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-2"><LogOut className="w-4 h-4" /> Exit</button>
      </div>
    </div>
  );
}