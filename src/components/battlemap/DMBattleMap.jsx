import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, Send, EyeOff, Eye, Settings, Trash2, X, Image as ImageIcon, MonitorPlay, Loader2, Save, Users, Heart, Maximize, Ruler, CircleDashed, ArrowUpCircle, BrainCircuit } from 'lucide-react';
import MapGrid from './MapGrid';
import BattlemapPresetsModal from './BattlemapPresetsModal';

const LOCAL_MAPS = [
  { label: 'Tutorial Forest', value: '/tutorial_forest_enc.png' },
  { label: 'Screwbeard Cave', value: '/screwbeard_cave_enc.png' }
];

export default function DMBattleMap() {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, ping: null, gridColor: 'rgba(255,255,255,0.35)' });
  const [tokens, setTokens] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  const [showRulerFor, setShowRulerFor] = useState(null);
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempGridScale, setTempGridScale] = useState(30); 
  const [tempGridColor, setTempGridColor] = useState('rgba(255,255,255,0.35)');

  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const rawCols = Number(data.cols);
        const rawRows = Number(data.rows);
        const safeCols = Math.min(100, Math.max(1, isNaN(rawCols) ? 20 : rawCols));
        const safeRows = Math.min(100, Math.max(1, isNaN(rawRows) ? 15 : rawRows));

        setMapData({
          imageUrl: data.imageUrl || '',
          cols: safeCols,
          rows: safeRows,
          isPublished: data.isPublished || false,
          activeTokenId: data.activeTokenId || null,
          ping: data.ping || null,
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)'
        });
        setTokens(data.tokens || {});
      } else {
        setDoc(mapRef, { imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null, ping: null, gridColor: 'rgba(255,255,255,0.35)' });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, 'campaign', 'main_session'));
        if (sessionSnap.exists()) {
          const playerIds = sessionSnap.data().unlockedCharacters || [];
          const validIds = playerIds.filter(id => id && typeof id === 'string');
          
          if (validIds.length > 0) {
            const playerDocs = await Promise.all(validIds.map(id => getDoc(doc(db, 'characters', id))));
            setActivePlayers(playerDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
          } else {
            setActivePlayers([]);
          }
        }
        
        const enemySnap = await getDocs(collection(db, 'active_enemies'));
        setActiveEnemies(enemySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Safely aborted fetch due to database error:", error);
      }
    };
    fetchData();
  }, []);

  const handleUpdateMapSettings = () => {
    setIsSavingMap(true);

    if (!tempImageUrl) {
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: '', cols: 20, rows: 15, gridColor: tempGridColor }, { merge: true }).then(() => {
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
        rows: calcRows,
        gridColor: tempGridColor
      }, { merge: true }).then(() => {
        setIsSavingMap(false);
        setIsEditingMap(false);
      });
    };

    img.onerror = () => {
      setDoc(doc(db, 'campaign', 'battlemap'), { 
        imageUrl: tempImageUrl,
        cols: 20,
        rows: 15,
        gridColor: tempGridColor
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
      isPublished: false 
    });
    
    const presetEnemies = Object.values(presetData.tokens || {}).filter(t => t.type === 'enemy');
    for (const enemy of presetEnemies) {
       await setDoc(doc(db, 'active_enemies', enemy.id), {
          name: enemy.name,
          hp: enemy.hp || 10,
          currentHp: enemy.hp || 10,
          ac: 10, 
          speed: enemy.speed || 30
       }, { merge: true });
    }

    setSelectedTokenId(null);
  };

  const getCreatureSize = (name) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('giant crocodile')) return 3; 
    if (lowerName.includes('bear') || lowerName.includes('boar') || lowerName.includes('dire wolf')) return 2; 
    return 1; 
  };

  const stageToken = async (actor, type) => {
    if (tokens[actor.id]) return; 
    const newToken = { 
      id: actor.id, 
      name: actor.name || 'Unknown', 
      type: type, 
      img: actor.img || '', 
      speed: actor.speed || 30, 
      conditions: actor.conditions || [], 
      x: 0, 
      y: 0, 
      size: getCreatureSize(actor.name), 
      isHidden: false, 
      hp: actor.currentHp ?? actor.hp ?? 0,
      maxHp: actor.maxHp ?? actor.hp ?? 1,
      aura: 0,
      elevation: 0, 
      isConcentrating: actor.isConcentrating || false
    };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: { ...tokens, [actor.id]: newToken } }, { merge: true });
  };

  const stageAllActive = async () => {
    const newTokens = { ...tokens };
    let pX = 0;
    let eX = 0;
    
    unstagedPlayers.forEach(p => {
      newTokens[p.id] = { id: p.id, name: p.name || 'Unknown', type: 'player', img: p.img || '', speed: p.speed || 30, conditions: p.conditions || [], x: pX++, y: 0, size: getCreatureSize(p.name), isHidden: false, hp: p.hp || 0, maxHp: p.maxHp || 1, aura: 0, elevation: 0, isConcentrating: p.isConcentrating || false };
    });
    unstagedEnemies.forEach(e => {
      newTokens[e.id] = { id: e.id, name: e.name || 'Unknown', type: 'enemy', img: e.img || '', speed: e.speed || 30, conditions: e.conditions || [], x: eX++, y: 2, size: getCreatureSize(e.name), isHidden: false, hp: e.currentHp ?? e.hp ?? 0, maxHp: e.maxHp ?? e.hp ?? 1, aura: 0, elevation: 0, isConcentrating: e.isConcentrating || false };
    });
    
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: newTokens }, { merge: true });
  };

  const removeToken = async (tokenId) => {
    const updatedTokens = { ...tokens };
    delete updatedTokens[tokenId];
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
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

  const handleUpdateTokenHp = async (newHp) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], hp: newHp } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    
    const type = tokens[selectedTokenId].type;
    const collectionName = type === 'player' ? 'characters' : 'active_enemies';
    try {
      if (type === 'enemy') {
        await updateDoc(doc(db, collectionName, selectedTokenId), { currentHp: newHp });
      } else {
        await updateDoc(doc(db, collectionName, selectedTokenId), { hp: newHp });
      }
    } catch (e) {
      console.error("Failed to sync HP to entity", e);
    }
  };

  const handleToggleTokenSize = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const currentSize = tokens[selectedTokenId].size || 1;
    const newSize = currentSize >= 4 ? 1 : currentSize + 1; 
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], size: newSize } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
  };

  const handleToggleAura = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const currentAura = tokens[selectedTokenId].aura || 0;
    const newAura = currentAura === 0 ? 10 : currentAura === 10 ? 15 : currentAura === 15 ? 30 : 0; 
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], aura: newAura } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
  };

  const handleToggleElevation = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const current = tokens[selectedTokenId].elevation || 0;
    const newElev = current === 0 ? 10 : current === 10 ? 20 : current === 20 ? 30 : current === 30 ? 60 : 0;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], elevation: newElev } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
  };

  const handleToggleConcentration = async () => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const current = tokens[selectedTokenId].isConcentrating || false;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], isConcentrating: !current } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
  };

  const toggleCondition = async (cond) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const t = tokens[selectedTokenId];
    const currentConds = t.conditions || [];
    const newConds = currentConds.includes(cond) 
      ? currentConds.filter(c => c !== cond) 
      : [...currentConds, cond];
      
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...t, conditions: newConds } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    
    const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
    await updateDoc(doc(db, collectionName, selectedTokenId), { conditions: newConds });
  };

  const handleTileClick = async (x, y) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    const updatedTokens = { ...tokens, [selectedTokenId]: { ...tokens[selectedTokenId], x, y } };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
    setSelectedTokenId(null); 
  };

  const handleTokenDrop = async (tokenId, x, y) => {
    if (!tokenId || !tokens[tokenId]) return;
    const updatedTokens = { ...tokens, [tokenId]: { ...tokens[tokenId], x, y } };
    await setDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens }, { merge: true });
  };

  const handlePing = async (x, y) => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), {
      ping: { x, y, timestamp: Date.now() }
    });
  };

  const unstagedPlayers = activePlayers.filter(p => !tokens[p.id]);
  const unstagedEnemies = activeEnemies.filter(e => !tokens[e.id]);
  const hasUnstagedActors = unstagedPlayers.length > 0 || unstagedEnemies.length > 0;

  useEffect(() => {
    if (isEditingMap) {
      setTempImageUrl(mapData.imageUrl);
      setTempGridScale(30); 
      setTempGridColor(mapData.gridColor || 'rgba(255,255,255,0.35)');
    }
  }, [isEditingMap, mapData.imageUrl, mapData.gridColor]);

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
            className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors"
            title="Cast to a second monitor"
          >
            <MonitorPlay className="w-3 h-3" /> Cast Display
          </button>

          <button 
            onClick={() => setIsPresetsOpen(true)}
            className="bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors mr-auto md:mr-2"
          >
            <Save className="w-3 h-3" /> Presets
          </button>

          <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors">
            <Settings className="w-3 h-3" /> Config
          </button>
          
          <button 
            onClick={togglePublish} 
            className={`px-4 py-1.5 rounded-lg font-black text-[10px] md:text-xs flex items-center gap-2 transition-all shadow-md ${mapData.isPublished ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-400 border border-slate-600 hover:text-white'}`}
          >
            {mapData.isPublished ? <><Send className="w-3 h-3"/> LIVE</> : <><EyeOff className="w-3 h-3"/> HIDDEN</>}
          </button>
        </div>
      </div>

      {isEditingMap && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 space-y-4">
          {/* NEW QoL: Grid Color Toggle added to config panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Grid Color</label>
              <select 
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                onChange={(e) => setTempGridColor(e.target.value)}
                value={tempGridColor}
              >
                <option value="rgba(255,255,255,0.35)">White (Default)</option>
                <option value="rgba(0,0,0,0.6)">Black (Snow Maps)</option>
                <option value="rgba(220,38,38,0.6)">Red (High Contrast)</option>
                <option value="transparent">Hidden</option>
              </select>
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

      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          
          {selectedTokenId && tokens[selectedTokenId] ? (
            <div className="flex items-center gap-2 bg-indigo-900/50 px-3 py-1.5 rounded-lg border border-indigo-400/50 shadow-inner animate-in zoom-in-95 w-full md:w-auto overflow-x-auto custom-scrollbar">
              <span className="text-xs font-bold text-white mr-auto md:mr-0 whitespace-nowrap">Selected: {tokens[selectedTokenId].name}</span>
              
              <div className="flex items-center gap-1 border-l border-indigo-500/30 pl-2 ml-1" title="Edit HP">
                <Heart className="w-3 h-3 text-red-400" />
                <input 
                  type="number" 
                  value={tokens[selectedTokenId].hp || 0}
                  onChange={(e) => handleUpdateTokenHp(Number(e.target.value))}
                  className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-white text-xs font-bold focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <button onClick={handleToggleTokenSize} className="text-indigo-300 hover:text-white ml-1 border-l border-indigo-500/30 pl-2 flex items-center gap-1 shrink-0" title="Cycle Token Size (1x1, 2x2, 3x3, 4x4)">
                <Maximize className="w-3 h-3" />
                <span className="text-[10px] font-bold">{tokens[selectedTokenId].size || 1}x</span>
              </button>

              <button onClick={handleToggleAura} className="text-sky-300 hover:text-white ml-1 border-l border-indigo-500/30 pl-2 flex items-center gap-1 shrink-0" title="Cycle Aura Radius (10ft, 15ft, 30ft)">
                <CircleDashed className="w-3 h-3" />
                {tokens[selectedTokenId].aura > 0 && <span className="text-[10px] font-bold">{tokens[selectedTokenId].aura}ft</span>}
              </button>

              <button onClick={handleToggleElevation} className="text-emerald-300 hover:text-white ml-1 border-l border-indigo-500/30 pl-2 flex items-center gap-1 shrink-0" title="Cycle Elevation (+10ft, +20ft, etc.)">
                <ArrowUpCircle className="w-3 h-3" />
                {tokens[selectedTokenId].elevation > 0 && <span className="text-[10px] font-bold">+{tokens[selectedTokenId].elevation}</span>}
              </button>

              <button onClick={handleToggleConcentration} className={`ml-1 border-l border-indigo-500/30 pl-2 flex items-center gap-1 shrink-0 transition-colors ${tokens[selectedTokenId].isConcentrating ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'}`} title="Toggle Spell Concentration">
                <BrainCircuit className="w-3 h-3" />
              </button>

              <button 
                onClick={() => setShowRulerFor(showRulerFor === selectedTokenId ? null : selectedTokenId)} 
                className={`ml-2 border-l border-indigo-500/30 pl-2 flex items-center gap-1 shrink-0 transition-colors ${showRulerFor === selectedTokenId ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-300'}`} 
                title="Toggle Movement Radius Ruler"
              >
                <Ruler className="w-3 h-3" />
              </button>

              <button onClick={handleUpdateTokenImage} className="text-emerald-400 hover:text-emerald-300 ml-2 border-l border-indigo-500/30 pl-2 shrink-0" title="Set Custom Image URL"><ImageIcon className="w-4 h-4"/></button>
              
              <button onClick={handleToggleHidden} className="text-slate-400 hover:text-white ml-2 border-l border-indigo-500/30 pl-2 shrink-0" title={tokens[selectedTokenId].isHidden ? "Reveal Token" : "Hide Token"}>
                {tokens[selectedTokenId].isHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>

              <button onClick={() => removeToken(selectedTokenId)} className="text-red-400 hover:text-red-300 ml-2 border-l border-indigo-500/30 pl-2 shrink-0" title="Remove from board"><Trash2 className="w-4 h-4"/></button>
              
              <select 
                className="bg-slate-950 text-fuchsia-400 border border-fuchsia-500/40 rounded px-2 py-1 text-xs font-bold focus:outline-none ml-2 border-l border-indigo-500/30 shrink-0"
                onChange={(e) => {
                  if(e.target.value) {
                    toggleCondition(e.target.value);
                    e.target.value = ""; 
                  }
                }}
              >
                <option value="">+ Cond</option>
                {['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button onClick={() => setSelectedTokenId(null)} className="text-slate-400 hover:text-white ml-2 bg-slate-950 p-1 rounded shrink-0" title="Deselect"><X className="w-3 h-3"/></button>
            </div>
          ) : (
            <>
              {!hasUnstagedActors ? (
                <span className="text-xs font-bold text-slate-500 italic flex items-center gap-2 px-2"><Map className="w-4 h-4"/> All active actors deployed.</span>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 hidden xl:block">Stage:</span>
                  
                  <button onClick={stageAllActive} className="text-[10px] md:text-xs bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 px-2 py-1 rounded hover:bg-emerald-600 transition-colors mr-2 flex items-center gap-1">
                    <Users className="w-3 h-3"/> Deploy All
                  </button>

                  <div className="w-px h-4 bg-slate-700 mx-1"></div>

                  {unstagedPlayers.map(p => (
                    <button key={p.id} onClick={() => stageToken(p, 'player')} className="text-[10px] md:text-xs bg-indigo-900/40 border border-indigo-500/50 text-indigo-200 px-2 py-1 rounded hover:bg-indigo-600 transition-colors">+ {(p.name || 'Unknown').split(' ')[0]}</button>
                  ))}
                  {unstagedEnemies.map(e => (
                    <button key={e.id} onClick={() => stageToken(e, 'enemy')} className="text-[10px] md:text-xs bg-red-900/40 border border-red-500/50 text-red-200 px-2 py-1 rounded hover:bg-red-600 transition-colors">+ {(e.name || 'Unknown').substring(0,8)}</button>
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
        onTokenDrop={handleTokenDrop}
        onPing={handlePing}
        showMovementRangeFor={showRulerFor ? tokens[showRulerFor] : null}
      />
    </div>
  );
}