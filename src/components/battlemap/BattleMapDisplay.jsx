import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LogOut } from 'lucide-react';
import MapGrid from './MapGrid';

export default function BattleMapDisplay({ onLogout }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, ping: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [] });
  const [tokens, setTokens] = useState({});
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);

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
          activeTokenId: data.activeTokenId || null,
          ping: data.ping || null,
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          drawings: data.drawings || []
        });
        setTokens(data.tokens || {});
      }
    });
    return () => unsub();
  }, []);

  // Fetch real-time actor data to calculate Bloodied and Temp HP states for the display
  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, 'characters'), (snap) => {
       const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setActivePlayers(players);
    });
    
    const unsubEnemies = onSnapshot(collection(db, 'active_enemies'), (snap) => {
       const enemies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setActiveEnemies(enemies);
    });

    return () => {
      unsubPlayers();
      unsubEnemies();
    };
  }, []);

  if (!mapData.isPublished) {
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
      <MapGrid 
        mapData={mapData} 
        tokens={tokens} 
        activePlayers={activePlayers}
        activeEnemies={activeEnemies}
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