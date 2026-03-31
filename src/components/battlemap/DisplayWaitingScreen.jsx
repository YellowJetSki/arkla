import { LogOut } from 'lucide-react';

export default function DisplayWaitingScreen({ onLogout }) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
      <img 
        src="/icon.png" 
        alt="Campaign Logo" 
        className="w-32 h-32 md:w-48 md:h-48 opacity-30 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] grayscale" 
        onError={(e) => e.target.style.display = 'none'} 
      />
      <button 
        onClick={onLogout}
        className="absolute top-4 right-4 p-2.5 bg-slate-900/60 text-slate-400 hover:text-white rounded-xl transition-all duration-300 opacity-60 hover:opacity-100 shadow-lg border border-slate-700 z-[100000]"
        title="Exit Display"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}