import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LogOut, X } from 'lucide-react';
import MapGrid from './MapGrid';

export default function BattleMapDisplay({ onLogout }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null });
  const [tokens, setTokens] = useState({});
  
  // NEW: Handout State
  const [activeHandout, setActiveHandout] = useState(null);

  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapData({
          imageUrl: data.imageUrl || '',
          cols: data.cols || 20,
          rows: data.rows || 15,
          isPublished: data.isPublished || false,
          activeTokenId: data.activeTokenId || null
        });
        setTokens(data.tokens || {});
      }
    });
    return () => unsub();
  }, []);

  // NEW: Listen for Handout Pushes
  useEffect(() => {
    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsub = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.latestShareId && data.items) {
          // Find the item being shared (works even if DM rebroadcasts with a timestamp appended)
          const baseItem = data.items.find(i => data.latestShareId.startsWith(i.id));
          
          // Only take over the screen if it's a visual handout with a URL
          if (baseItem && baseItem.url) {
            setActiveHandout(baseItem);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  // NEW: 10-Second Auto-Dismiss Timer for the TV Display
  useEffect(() => {
    if (activeHandout) {
      const timer = setTimeout(() => {
        setActiveHandout(null);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [activeHandout]);

  if (!mapData.isPublished && !activeHandout) {
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

  return (
    <div className="fixed inset-0 bg-black z-[99999] flex items-center justify-center overflow-hidden">
      
      {/* Massive Handout Overlay */}
      {activeHandout && (
        <div className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 backdrop-blur-3xl p-8">
          <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center">
            <img 
              src={activeHandout.url} 
              alt={activeHandout.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border-2 border-slate-700/50" 
            />
            <h2 className="mt-8 text-center text-4xl md:text-5xl font-black text-white tracking-[0.2em] drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase">
              {activeHandout.name}
            </h2>
            <button 
              onClick={() => setActiveHandout(null)}
              className="absolute -top-6 -right-6 p-4 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-600 shadow-2xl transition-colors opacity-30 hover:opacity-100"
              title="Clear from Display"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      <MapGrid 
        mapData={mapData} 
        tokens={tokens} 
        onTileClick={() => {}} 
        onTokenClick={() => {}}
        selectedTokenId={null}
        isDM={false} 
        isDisplayMode={true}
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