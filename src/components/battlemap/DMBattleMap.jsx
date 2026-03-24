import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, Image as ImageIcon, Send, ShieldAlert, EyeOff, Crosshair, Users, Settings } from 'lucide-react';
import MapGrid from './MapGrid';

export default function DMBattleMap() {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false });
  const [tokens, setTokens] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

  // 1. Sync Live Map State
  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMapData({
          imageUrl: data.imageUrl || '',
          cols: data.cols || 20,
          rows: data.rows || 15,
          isPublished: data.isPublished || false
        });
        setTokens(data.tokens || {});
      } else {
        setDoc(mapRef, { imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {} });
      }
    });
    return () => unsub();
  }, []);

  // 2. Fetch Available Actors to stage as Tokens
  useEffect(() => {
    const fetchData = async () => {
      // Get Players
      const sessionSnap = await getDoc(doc(db, 'campaign', 'main_session'));
      if (sessionSnap.exists()) {
        const playerIds = sessionSnap.data().unlockedCharacters || [];
        const playerDocs = await Promise.all(playerIds.map(id => getDoc(doc(db, 'characters', id))));
        setActivePlayers(playerDocs.map(d => ({ id: d.id, ...d.data() })));
      }
      // Get Enemies
      const enemySnap = await getDocs(collection(db, 'active_enemies'));
      setActiveEnemies(enemySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const handleUpdateMapSettings = async () => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: tempImageUrl });
    setIsEditingMap(false);
  };

  const togglePublish = async () => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), { isPublished: !mapData.isPublished });
  };

  // Add a token to the board (defaults to 0,0)
  const stageToken = async (actor, type) => {
    if (tokens[actor.id]) return; // Already on board
    
    const newToken = {
      id: actor.id,
      name: actor.name,
      type: type, // 'player' or 'enemy'
      img: type === 'player' ? `/${actor.id}.png` : '', // Enemy images could be added later
      speed: actor.speed || 30, // Base D&D speed
      conditions: actor.conditions || [],
      x: 0,
      y: 0
    };

    const updatedTokens = { ...tokens, [actor.id]: newToken };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
  };

  const removeToken = async (tokenId) => {
    const updatedTokens = { ...tokens };
    delete updatedTokens[tokenId];
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  // The Magic: Click a staged token, then click the grid to move it
  const handleTileClick = async (x, y) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;

    const updatedTokens = {
      ...tokens,
      [selectedTokenId]: { ...tokens[selectedTokenId], x, y }
    };

    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    setSelectedTokenId(null); // Deselect after moving
  };

  return (
    <div className="space-y-6">
      {/* DM CONTROLS */}
      <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-xl font-black text-indigo-400 flex items-center gap-2 mb-1">
            <Map className="w-6 h-6" /> Tactical Battle Map
          </h2>
          <p className="text-sm text-slate-400">Upload a map, stage tokens, and publish to players.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
            <Settings className="w-4 h-4" /> Map Settings
          </button>
          
          <button 
            onClick={togglePublish} 
            className={`px-6 py-2 rounded-lg font-black text-sm flex items-center gap-2 transition-all shadow-md ${mapData.isPublished ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-600 hover:text-white'}`}
          >
            {mapData.isPublished ? <><Send className="w-4 h-4"/> LIVE TO PLAYERS</> : <><EyeOff className="w-4 h-4"/> HIDDEN (DRAFT)</>}
          </button>
        </div>
      </div>

      {isEditingMap && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Map Background URL</label>
          <div className="flex gap-2">
            <input 
              type="url" 
              defaultValue={mapData.imageUrl}
              onChange={(e) => setTempImageUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://example.com/dungeon-map.jpg"
            />
            <button onClick={handleUpdateMapSettings} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-lg">Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* STAGING AREA (SIDEBAR) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
              <Crosshair className="w-4 h-4 text-indigo-400" /> Token Staging
            </h3>
            <p className="text-xs text-slate-400 mb-4 italic">Click an actor to stage them on the board. Then click their token below, and click the map to place them.</p>
            
            {/* Players */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> Players</h4>
              <div className="flex flex-wrap gap-2">
                {activePlayers.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => stageToken(p, 'player')}
                    disabled={!!tokens[p.id]}
                    className="text-xs bg-slate-900 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-2 py-1 rounded hover:border-indigo-500 transition-colors"
                  >
                    + {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Enemies */}
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Enemies</h4>
              <div className="flex flex-wrap gap-2">
                {activeEnemies.map(e => (
                  <button 
                    key={e.id} 
                    onClick={() => stageToken(e, 'enemy')}
                    disabled={!!tokens[e.id]}
                    className="text-xs bg-slate-900 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-2 py-1 rounded hover:border-red-500 transition-colors"
                  >
                    + {e.name.substring(0,10)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIVE TOKENS LIST */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-black text-white mb-4 border-b border-slate-700 pb-2">On The Board</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {Object.values(tokens).length === 0 ? (
                <p className="text-xs text-slate-500">No tokens staged.</p>
              ) : (
                Object.values(tokens).map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTokenId(selectedTokenId === t.id ? null : t.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${selectedTokenId === t.id ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${t.type === 'enemy' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                      <span className="text-xs font-bold text-white truncate max-w-[100px]">{t.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeToken(t.id); }}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* THE MAP GRID */}
        <div className="xl:col-span-3">
          <MapGrid 
            mapData={mapData} 
            tokens={tokens} 
            onTileClick={handleTileClick} 
            selectedTokenId={selectedTokenId}
            isDM={true} 
          />
        </div>

      </div>
    </div>
  );
}