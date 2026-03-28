import { AlertTriangle, ZapOff } from 'lucide-react';

export default function SessionResetModal({ onLogout }) {
  
  const handleKick = () => {
    if (onLogout) onLogout();
    // Forces the browser to completely dump its memory and reload the page
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      {/* Immersive Banishment Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(220,38,38,0.3)] text-center flex flex-col items-center animate-in zoom-in-95 duration-500 relative z-10 overflow-hidden">
        
        {/* Shattered Seal effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/20 blur-2xl rounded-full -ml-16 -mb-16 pointer-events-none"></div>

        <div className="w-24 h-24 bg-red-950/50 rounded-2xl border border-red-900/50 flex items-center justify-center mb-6 shadow-inner relative">
          <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-2xl"></div>
          <ZapOff className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] relative z-10" />
        </div>
        
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-red-400 uppercase tracking-widest mb-3">Banished</h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed text-sm font-medium">
          The connection to the realm has been severed. The Dungeon Master has reset your data or removed you from the active session. 
        </p>
        
        <button 
          onClick={handleKick} 
          className="w-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700 hover:border-red-500 font-black tracking-widest uppercase py-4 rounded-xl transition-all duration-300 shadow-lg group relative overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out pointer-events-none"></div>
          <span className="relative z-10 flex items-center justify-center gap-2">
            Sever Connection
          </span>
        </button>

      </div>
    </div>
  );
}