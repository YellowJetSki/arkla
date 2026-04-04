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

      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-3xl p-8 max-w-sm w-full shadow-[12px_12px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center animate-in zoom-in-95 duration-500 relative z-10 overflow-hidden">
        
        {/* Shattered Seal effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-2xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/20 blur-2xl rounded-full -ml-16 -mb-16 pointer-events-none"></div>

        <div className="w-24 h-24 bg-red-950 border-[3px] border-slate-950 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative">
          <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-2xl"></div>
          <ZapOff className="w-12 h-12 text-red-500 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] relative z-10" />
        </div>
        
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Banished</h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed text-sm font-bold">
          The connection to the realm has been severed. The Dungeon Master has reset your data or removed you from the active session. 
        </p>
        
        <button 
          onClick={handleKick} 
          className="w-full bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white border-[3px] border-slate-950 font-black tracking-widest uppercase py-4 rounded-xl transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:shadow-none relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Sever Connection
          </span>
        </button>

      </div>
    </div>
  );
}