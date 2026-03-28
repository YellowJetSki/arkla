import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map as MapIcon, User } from 'lucide-react';

export default function StickyBattleNav({ onToggleMap, isMapOpen, activeTheme }) {
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsPublished(docSnap.data().isPublished || false);
      }
    });
    return () => unsub();
  }, []);

  if (!isPublished) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] p-4 pointer-events-none animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
        <div className={`bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] flex p-1.5 gap-1 w-full max-w-[300px] relative overflow-hidden transition-all duration-500`}>
          
          {/* Subtle ambient glow behind the nav based on theme */}
          <div className={`absolute inset-0 opacity-20 ${activeTheme.bg} blur-xl transition-colors duration-500 pointer-events-none`}></div>

          <button 
            onClick={() => onToggleMap(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full transition-all duration-300 font-black text-xs uppercase tracking-widest relative z-10 ${
              !isMapOpen 
                ? `${activeTheme.bg} text-white ${activeTheme.shadow} scale-100` 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 scale-95'
            }`}
          >
            <User className="w-4 h-4" /> Sheet
          </button>
          
          <button 
            onClick={() => onToggleMap(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full transition-all duration-300 font-black text-xs uppercase tracking-widest relative z-10 ${
              isMapOpen 
                ? `${activeTheme.bg} text-white ${activeTheme.shadow} scale-100` 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 scale-95'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Battle
            
            {/* Pulsing red dot to indicate the battle map is live while the player is on their sheet */}
            {!isMapOpen && (
              <span className="absolute top-3 right-6 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
            )}
          </button>

        </div>
      </div>
    </div>
  );
}