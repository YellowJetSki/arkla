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
    <div className="fixed bottom-0 left-0 right-0 z-[90] p-4 pointer-events-none">
      <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl flex p-1.5 gap-2 w-full max-w-[280px]">
          <button 
            onClick={() => onToggleMap(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${!isMapOpen ? `${activeTheme.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
          >
            <User className="w-4 h-4" /> Sheet
          </button>
          
          <button 
            onClick={() => onToggleMap(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${isMapOpen ? `${activeTheme.bg} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MapIcon className="w-4 h-4" /> Battle
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}