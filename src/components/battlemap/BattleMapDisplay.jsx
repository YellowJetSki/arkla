import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LogOut } from 'lucide-react';
import MapGrid from './MapGrid';
import DisplayWaitingScreen from './DisplayWaitingScreen';
import DisplayHandoutOverlay from './DisplayHandoutOverlay';

export default function BattleMapDisplay({ onLogout }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null });
  const [tokens, setTokens] = useState({});
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

  // Listen for Handout Pushes
  useEffect(() => {
    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsub = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Prioritize the dedicated TV display ID, fallback to latestShareId for backward compatibility
        const targetId = data.displayHandoutId !== undefined ? data.displayHandoutId : data.latestShareId;
        
        if (targetId && data.items) {
          const baseItem = data.items.find(i => targetId.startsWith(i.id));
          if (baseItem && baseItem.url) {
            setActiveHandout(baseItem);
          } else {
            setActiveHandout(null);
          }
        } else {
          setActiveHandout(null);
        }
      }
    });
    return () => unsub();
  }, []);

  if (!mapData.isPublished && !activeHandout) {
    return <DisplayWaitingScreen onLogout={onLogout} />;
  }

  return (
    <div className="fixed inset-0 bg-black z-[99999] flex items-center justify-center overflow-hidden">
      
      <DisplayHandoutOverlay 
        activeHandout={activeHandout} 
        setActiveHandout={setActiveHandout} 
      />

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