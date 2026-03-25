import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, Send, EyeOff, Eye, Settings, Trash2, X, Image as ImageIcon, MonitorPlay, Loader2, Save } from 'lucide-react';
import MapGrid from './MapGrid';
import BattlemapPresetsModal from './BattlemapPresetsModal';

const LOCAL_MAPS = [
  { label: 'Tutorial Forest', value: '/tutorial_forest_enc.png' },
  { label: 'Screwbeard Cave', value: '/screwbeard_cave_enc.png' }
];

export default function DMBattleMap() {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null });
  const [tokens, setTokens] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  
  // Default grid scale set to 30px
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempGridScale, setTempGridScale] = useState(30); 

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
      } else {
        setDoc(mapRef, { imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const sessionSnap = await getDoc(doc(db, 'campaign', 'main_session'));
      if (sessionSnap.exists()) {
        const playerIds = sessionSnap.data().unlockedCharacters || [];
        const playerDocs = await Promise.all(playerIds.map(id => getDoc(doc(db, 'characters', id))));
        setActivePlayers(playerDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      }
      const enemySnap = await getDocs(collection(db, 'active_enemies'));
      setActiveEnemies(enemySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const handleUpdateMapSettings = () => {
    setIsSavingMap(true);

    if (!tempImageUrl) {
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: '', cols: 20, rows: 15 }, { merge: true }).then(() => {
        setIsSavingMap(false);
        setIsEditingMap(false);
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    
    img.onload = () => {
      const calcCols = Math.min(100, Math.max(1, Math.round(img.naturalWidth / tempGridScale)));
      const calcRows = Math.min(100, Math.max(1, Math.round(img.naturalHeight / tempGridScale)));

      setDoc(doc(db, 'campaign', 'battlemap'), { 
        imageUrl: tempImageUrl,
        cols: calcCols,
        rows: calcRows
      }, { merge: true }).then(() => {
        setIsSavingMap(false);
        setIsEditingMap(false);
      });
    };

    img.onerror = () => {
      setDoc(doc(db, 'campaign', 'battlemap'), { 
        imageUrl: tempImageUrl,
        cols: 20,
        rows: 15
      }, { merge: true }).then(() => {
        setIsSavingMap(false);
        setIsEditingMap(false);
        alert("Could not read exact image dimensions. Defaulted to a 20x15 grid.");
      });
    };

    img.src = tempImageUrl;
  };

  const togglePublish = async () => {
    await setDoc(doc(db, 'campaign', 'battlemap'), { isPublished: !mapData.isPublished }, { merge: true });
  };

  const handleRestorePreset = async (presetData) => {
    await setDoc(doc(db, 'campaign', 'battlemap'), {
      ...presetData.mapData,
      tokens: presetData.tokens,
      isPublished: false // Always load presets secretly
    });
    setSelectedTokenId(null);
  };

  const getCreatureSize = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('giant crocodile')) return 3; 
    if (lowerName.includes('bear') || lowerName.includes('boar') || lowerName.includes('dire wolf')) return 2; 
    return 1; 
  };

  const stageToken = async (actor, type) => {
    if (tokens[actor.id]) return; 
    const newToken = { id: actor.id, name: actor.name || 'Unknown', type: type, img: actor.img || '', speed: actor.speed || 30, conditions: actor.conditions || [], x: 0, y: 0, size: getCreatureSize(actor.name), isHidden: false };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: { ...tokens, [actor.id]: newToken } }, { merge: true });
  };

  const removeToken = async (tokenId) => {
    const updatedTokens = { ...tokens };
    delete updatedTokens[tokenId];
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  const handleToggleHidden = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const isCurrentlyHidden = tokens[selectedTokenId].isHidden || false;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], isHidden: !isCurrentlyHidden } };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
  };

  const handleUpdateTokenImage = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const url = window.prompt("Paste a custom Image URL for this token:");
    if (!url) return;

    try {
      const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], img: url } };
      await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
      const type = tokens[selectedTokenId].type;
      const collectionName = type === 'player' ? 'characters' : 'active_enemies';
      await updateDoc(doc(db, collectionName, selectedTokenId), { img: url });
    } catch (error) {
      console.error("Failed to update token image", error);
    }
  };

  const handleTileClick = async (x, y) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], x, y } };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
    setSelectedTokenId(null); 
  };

  const unstagedPlayers = activePlayers.filter(p => !tokens[p.id]);
  const unstagedEnemies = activeEnemies.filter(e => !tokens[e.id]);
  const hasUnstagedActors = unstagedPlayers.length > 0 || unstagedEnemies.length > 0;

  useEffect(() => {
    if (isEditingMap) {
      setTempImageUrl(mapData.imageUrl);
      setTempGridScale(30); // Default to 30px on open
    }
  }, [isEditingMap, mapData.imageUrl]);

  const launchDisplayTab = () => {
    const displayUrl = window.location.pathname + '?display=true';
    window.open(displayUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <BattlemapPresetsModal 
        isOpen={isPresetsOpen} 
        onClose={() => setIsPresetsOpen(false)} 
        currentMapData={mapData}
        currentTokens={tokens}
        onRestorePreset={handleRestorePreset}
      />

      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-4 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2">
          <Map className="w-5 h-5" /> Battlefield
        </h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={launchDisplayTab}
            className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
            title="Cast to a second monitor"
          >
            <MonitorPlay className="w-3 h-3" /> Cast Display
          </button>

          <button 
            onClick={() => setIsPresetsOpen(true)}
            className="bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors mr-auto md:mr-2"
          >
            <Save className="w-3 h-3" /> Presets
          </button>

          <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors">
            <Settings className="w-3 h-3" /> Config
          </button>
          
          <button 
            onClick={togglePublish} 
            className={`px-4 py-1.5 rounded-lg font-black text-xs flex items-center gap-2 transition-all shadow-md ${mapData.isPublished ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-600 hover:text-white'}`}
          >
            {mapData.isPublished ? <><Send className="w-3 h-3"/> LIVE</> : <><EyeOff className="w-3 h-3"/> HIDDEN</>}
          </button>
        </div>
      </div>

      {isEditingMap && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preset Local Map</label>
              <select 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                onChange={(e) => setTempImageUrl(e.target.value)}
                value={LOCAL_MAPS.some(m => m.value === tempImageUrl) ? tempImageUrl : ''}
              >
                <option value="" disabled>Select a map...</option>
                {LOCAL_MAPS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Or Custom Web URL</label>
               <input 
                 type="url" 
                 value={tempImageUrl}
                 onChange={(e) => setTempImageUrl(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                 placeholder="https://example.com/map.jpg"
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Grid Cell Size (Pixels)</label>
               <input 
                 type="number" 
                 value={tempGridScale}
                 onChange={(e) => setTempGridScale(Number(e.target.value))}
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-black focus:outline-none focus:border-indigo-500"
               />
               <p className="text-[9px] text-slate-500 mt-1">Adjust if grid lines don't perfectly align. Standard is 30.</p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-700 pt-4 mt-2">
            <button 
              onClick={handleUpdateMapSettings} 
              disabled={isSavingMap}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSavingMap ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating Grid...</> : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* DM TOOLBOX / STAGING AREA */}
      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          
          {selectedTokenId && tokens[selectedTokenId] ? (
            <div className="flex items-center gap-2 bg-indigo-900/50 px-3 py-1.5 rounded-lg border border-indigo-400/50 shadow-inner animate-in zoom-in-95 w-full md:w-auto">
              <span className="text-xs font-bold text-white mr-auto md:mr-0">Selected: {tokens[selectedTokenId].name}</span>
              
              <button onClick={handleUpdateTokenImage} className="text-emerald-400 hover:text-emerald-300 ml-2 border-l border-indigo-500/30 pl-2" title="Set Custom Image URL"><ImageIcon className="w-4 h-4"/></button>
              
              <button onClick={handleToggleHidden} className="text-slate-400 hover:text-white ml-2 border-l border-indigo-500/30 pl-2" title={tokens[selectedTokenId].isHidden ? "Reveal Token" : "Hide Token"}>
                {tokens[selectedTokenId].isHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>

              <button onClick={() => removeToken(selectedTokenId)} className="text-red-400 hover:text-red-300 ml-2 border-l border-indigo-500/30 pl-2" title="Remove from board"><Trash2 className="w-4 h-4"/></button>
              <button onClick={() => setSelectedTokenId(null)} className="text-slate-400 hover:text-white ml-2 bg-slate-950 p-1 rounded" title="Deselect"><X className="w-3 h-3"/></button>
            </div>
          ) : (
            <>
              {!hasUnstagedActors ? (
                <span className="text-xs font-bold text-slate-500 italic flex items-center gap-2 px-2"><Map className="w-4 h-4"/> All active actors deployed.</span>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 hidden xl:block">Stage:</span>
                  {unstagedPlayers.map(p => (
                    <button key={p.id} onClick={() => stageToken(p, 'player')} className="text-xs bg-indigo-900/40 border border-indigo-500/50 text-indigo-200 px-2 py-1 rounded hover:bg-indigo-600 transition-colors">+ {p.name.split(' ')[0]}</button>
                  ))}
                  {unstagedEnemies.map(e => (
                    <button key={e.id} onClick={() => stageToken(e, 'enemy')} className="text-xs bg-red-900/40 border border-red-500/50 text-red-200 px-2 py-1 rounded hover:bg-red-600 transition-colors">+ {e.name.substring(0,8)}</button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <MapGrid 
        mapData={mapData} 
        tokens={tokens} 
        onTileClick={handleTileClick} 
        onTokenClick={(id) => setSelectedTokenId(selectedTokenId === id ? null : id)}
        selectedTokenId={selectedTokenId}
        isDM={true} 
      />
    </div>
  );
}