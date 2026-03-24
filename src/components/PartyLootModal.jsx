import { Gem, X, Sparkles } from 'lucide-react';

export default function PartyLootModal({ item, onDismiss }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 overflow-hidden relative">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/20 blur-[60px] pointer-events-none"></div>

        <div className="p-4 md:p-5 border-b border-slate-700/50 flex justify-between items-center shrink-0 bg-slate-900/80 relative z-10">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Gem className="w-6 h-6 animate-pulse" /> New Loot Discovered!
          </h2>
          <button 
            onClick={onDismiss} 
            className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-slate-500 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Image Container - Using flex-1 to naturally fill space without warping */}
        <div className="relative bg-slate-950 flex-1 min-h-[250px] md:min-h-[350px] flex items-center justify-center p-6 border-b border-slate-800">
          {/* Subtle spinning magical background behind the item */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none"></div>
          
          <img 
            src={item.url} 
            alt={item.name} 
            className="w-full h-full max-h-[300px] object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] relative z-10 animate-in zoom-in duration-700 delay-150" 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Magical+Item'; }}
          />
        </div>
        
        <div className="p-6 md:p-8 bg-slate-900 text-center shrink-0 relative z-10">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-6 drop-shadow-lg break-words text-balance leading-tight flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
            {item.name}
            <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
          </h3>
          
          <button 
            onClick={onDismiss} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
          >
            Claim & Add to Vault
          </button>
        </div>

      </div>
    </div>
  );
}