import { Gem, DownloadCloud, Sparkles } from 'lucide-react';

export default function PartyLootModal({ item, onDismiss }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Immersive Treasure Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/50 rounded-3xl w-full max-w-sm shadow-[0_0_60px_rgba(16,185,129,0.3)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Ambient Top Highlight */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none"></div>

        <div className="p-6 relative z-10 flex flex-col items-center text-center mt-4">
          
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full animate-pulse"></div>
            <div className="w-20 h-20 bg-slate-950/80 border border-emerald-400/50 rounded-2xl shadow-inner flex items-center justify-center relative z-10 transform -rotate-3 hover:rotate-0 transition-transform">
              <Gem className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            </div>
          </div>

          <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Party Loot Acquired
          </h2>
          
          <h3 className="text-2xl font-black text-white mb-2 drop-shadow-md">
            {item.name}
          </h3>
          
          {item.source && (
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800 mb-6 shadow-inner">
               Shared by {item.source}
             </span>
          )}

          {item.url ? (
            <div className="w-full h-40 rounded-xl overflow-hidden border border-emerald-900/50 mb-6 shadow-inner relative group">
              <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
              <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
          ) : (
            <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6 text-sm text-slate-300 text-left whitespace-pre-wrap leading-relaxed shadow-inner max-h-40 overflow-y-auto custom-scrollbar">
              {item.desc}
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-950/50 border-t border-slate-800 relative z-10">
          <button 
            onClick={onDismiss} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
          >
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[50%] transition-transform duration-1000 ease-out pointer-events-none"></div>
            <DownloadCloud className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Stash in Vault</span>
          </button>
        </div>

      </div>
    </div>
  );
}