import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LogOut } from 'lucide-react';
import MapGrid from './MapGrid';
import DisplayWaitingScreen from './DisplayWaitingScreen';
import DisplayHandoutOverlay from './DisplayHandoutOverlay';

export default function BattleMapDisplay({ onLogout }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, fogOfWar: false, drawings: [], environment: 'none', gridColor: 'rgba(255,255,255,0.35)' });
  const [tokens, setTokens] = useState({});
  const [activeHandout, setActiveHandout] = useState(null);
  const [initiative, setInitiative] = useState(null);

  // FIXED: Added state for live characters/enemies to ensure visual states (like Bloodied rings) sync perfectly!
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);

  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const safeCols = Math.min(100, Math.max(1, isNaN(Number(data.cols)) ? 20 : Number(data.cols)));
        const safeRows = Math.min(100, Math.max(1, isNaN(Number(data.rows)) ? 15 : Number(data.rows)));

        setMapData({
          imageUrl: data.imageUrl || '',
          cols: safeCols,
          rows: safeRows,
          isPublished: data.isPublished || false,
          activeTokenId: data.activeTokenId || null,
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          fogOfWar: data.fogOfWar || false,
          drawings: data.drawings || [],
          environment: data.environment || 'none'
        });
        setTokens(data.tokens || {});
      }
    });
    return () => unsub();
  }, []);

  // Sync Live Character/Enemy Data
  useEffect(() => {
    const unsubChars = onSnapshot(collection(db, 'characters'), (snap) => {
       setActivePlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubEnemies = onSnapshot(collection(db, 'active_enemies'), (snap) => {
       setActiveEnemies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubChars(); unsubEnemies(); };
  }, []);

  useEffect(() => {
    const initRef = doc(db, 'campaign', 'initiative');
    const unsub = onSnapshot(initRef, (docSnap) => {
      if (docSnap.exists()) setInitiative(docSnap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsub = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const targetId = data.displayHandoutId !== undefined ? data.displayHandoutId : data.latestShareId;
        if (targetId && data.items) {
          const baseItem = data.items.find(i => targetId.startsWith(i.id));
          setActiveHandout(baseItem && baseItem.url ? baseItem : null);
        } else {
          setActiveHandout(null);
        }
      }
    });
    return () => unsub();
  }, []);

  if (!mapData.isPublished && !activeHandout) {
    return <DisplayWaitingScreen mapData={mapData} onLogout={onLogout} />;
  }

  const activeActor = initiative && initiative.activeTurn >= 0 ? initiative.order[initiative.activeTurn] : null;

  return (
    <div className="fixed inset-0 bg-black z-[99999] flex items-center justify-center overflow-hidden">
      
      {mapData.imageUrl && <img src={mapData.imageUrl} alt="Preload Cache" style={{ display: 'none' }} />}

      <DisplayHandoutOverlay activeHandout={activeHandout} setActiveHandout={setActiveHandout} />

      <div className="relative w-full h-full flex items-center justify-center">
        <MapGrid 
          mapData={mapData} 
          tokens={tokens} 
          activePlayers={activePlayers}    {/* ADDED */}
          activeEnemies={activeEnemies}    {/* ADDED */}
          activeActor={activeActor} 
          onTileClick={() => {}} 
          onTokenClick={() => {}}
          selectedTokenId={null}
          isDM={false} 
          isDisplayMode={true}
        />
        
        {/* Soft, long gradient vignette that doesn't encroach on the map */}
        <div 
          className="absolute inset-0 pointer-events-none z-[10000]"
          style={{
            boxShadow: 'inset 0 0 150px 50px rgba(0,0,0,0.8)',
            background: 'radial-gradient(ellipse at center, transparent 70%, rgba(0,0,0,0.5) 90%, rgba(0,0,0,1) 100%)'
          }}
        />
      </div>
      
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