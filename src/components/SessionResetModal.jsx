import { AlertTriangle } from 'lucide-react';

export default function SessionResetModal({ onLogout }) {
  
  const handleKick = () => {
    if (onLogout) onLogout();
    // Forces the browser to completely dump its memory and reload the page
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(220,38,38,0.2)] text-center flex flex-col items-center animate-in zoom-in-95 duration-500 max-h-[90dvh] overflow-y-auto">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-pulse shrink-0" />
        <h2 className="text-2xl font-bold text-white mb-2">Session Reset</h2>
        <p className="text-slate-300 mb-8 leading-relaxed text-sm">
          The DM has reset your character data or removed you from the active session. You must log back in to rejoin the campaign.
        </p>
        <button 
          onClick={handleKick} 
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shrink-0"
        >
          Return to Login Screen
        </button>
      </div>
    </div>
  );
}