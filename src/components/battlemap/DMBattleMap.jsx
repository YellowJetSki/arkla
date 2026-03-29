import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, Send, EyeOff, Eye, Settings, Trash2, X, Image as ImageIcon, MonitorPlay, Loader2, Save, Users, Heart, Maximize, Ruler, CircleDashed, ArrowUpCircle, BrainCircuit, PenTool, Eraser, Triangle, Circle } from 'lucide-react';
import MapGrid from './MapGrid';
import BattlemapPresetsModal from './BattlemapPresetsModal';
import DialogModal from '../shared/DialogModal';

const LOCAL_MAPS = [
  { label: 'Tutorial Forest', value: '/tutorial_forest_enc.png' },
  { label: 'Screwbeard Cave', value: '/screwbeard_cave_enc.png' }
];

export default function DMBattleMap() {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [] });
  const [tokens, setTokens] = useState({});
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  
  const [showRulerFor, setShowRulerFor] = useState(null);
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawingShape, setDrawingShape] = useState('freehand'); 
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempGridScale, setTempGridScale] = useState(30); 
  const [tempGridColor, setTempGridColor] = useState('rgba(255,255,255,0.35)');

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
  
  const [imagePrompt, setImagePrompt] = useState({ isOpen: false, tokenId: null, url: '' });

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
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          drawings: data.drawings || []
        });
        setTokens(data.tokens || {});
      } else {
        setDoc(mapRef, { imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [] });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const sessionSnap = await getDoc(doc(db, 'campaign', 'main_session'));
        if (sessionSnap.exists()) {
          const playerIds = sessionSnap.data().unlockedCharacters || [];
          const validIds = playerIds.filter(id => id && typeof id === 'string');
          
          if (validIds.length > 0) {
            const unsubPlayers = onSnapshot(collection(db, 'characters'), (snap) => {
               const players = snap.docs.filter(d => validIds.includes(d.id)).map(d => ({ id: d.id, ...d.data() }));
               setActivePlayers(players);
            });
            return () => unsubPlayers();
          } else {
            setActivePlayers([]);
          }
        }
      } catch (error) {
        console.error("Safely aborted fetch due to database error:", error);
      }
    };
    
    const unsubEnemies = onSnapshot(collection(db, 'active_enemies'), (snap) => {
       const enemies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setActiveEnemies(enemies);
    });

    fetchSessionData();
    return () => unsubEnemies();
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
        setDialog({ isOpen: true, title: 'Map Dimension Error', message: 'Could not read exact image dimensions. Defaulted to a 20x15 grid.', type: 'alert', onConfirm: closeDialog });
      });
    };

    img.src = tempImageUrl;
  };

  const togglePublish = async () => {
    await setDoc(doc(db, 'campaign', 'battlemap'), { isPublished: !mapData.isPublished }, { merge: true });
  };

  const handleRestorePreset = async (presetData) => {
    try {
      const batch = writeBatch(db);
      
      const enemyDocs = await getDocs(collection(db, 'active_enemies'));
      enemyDocs.forEach((docSnap) => batch.delete(docSnap.ref));

      const mapRef = doc(db, 'campaign', 'battlemap');
      batch.set(mapRef, {
        ...presetData.mapData,
        tokens: presetData.tokens,
        isPublished: false 
      });

      const presetEnemies = Object.values(presetData.tokens || {}).filter(t => t.type === 'enemy');
      for (const enemy of presetEnemies) {
         const enemyRef = doc(db, 'active_enemies', enemy.id);
         batch.set(enemyRef, {
            ...(enemy.entityData || {}), 
            name: enemy.name,
            hp: enemy.hp || 10,
            maxHp: enemy.maxHp || enemy.hp || 10,
            currentHp: enemy.hp || 10,
            speed: enemy.speed || 30,
            img: enemy.img || '',
            conditions: enemy.conditions || [],
            size: enemy.size || 1,
            isConcentrating: enemy.isConcentrating || false
         });
      }

      await batch.commit();
      setSelectedTokenId(null);
    } catch (error) {
      console.error("Error restoring preset:", error);
    }
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
      tempHp: actor.tempHp || 0,
      aura: 0,
      elevation: 0, 
      isConcentrating: actor.isConcentrating || false
    };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${actor.id}`]: newToken });
  };

  const stageAllActive = async () => {
    const updates = {};
    let pX = 0;
    let eX = 0;
    
    unstagedPlayers.forEach(p => {
      updates[`tokens.${p.id}`] = { id: p.id, name: p.name || 'Unknown', type: 'player', img: p.img || '', speed: p.speed || 30, conditions: p.conditions || [], x: pX++, y: 0, size: getCreatureSize(p.name), isHidden: false, hp: p.hp || 0, maxHp: p.maxHp || 1, tempHp: p.tempHp || 0, aura: 0, elevation: 0, isConcentrating: p.isConcentrating || false };
    });
    unstagedEnemies.forEach(e => {
      updates[`tokens.${e.id}`] = { id: e.id, name: e.name || 'Unknown', type: 'enemy', img: e.img || '', speed: e.speed || 30, conditions: e.conditions || [], x: eX++, y: 2, size: getCreatureSize(e.name), isHidden: false, hp: e.currentHp ?? e.hp ?? 0, maxHp: e.maxHp ?? e.hp ?? 1, tempHp: e.tempHp || 0, aura: 0, elevation: 0, isConcentrating: e.isConcentrating || false };
    });
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'campaign', 'battlemap'), updates);
    }
  };

  const removeToken = async (tokenId) => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}`]: deleteField() });
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  const handleToggleHidden = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const isCurrentlyHidden = tokens[targetId].isHidden || false;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.isHidden`]: !isCurrentlyHidden });
  };

  const handleUpdateTokenImage = (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    setImagePrompt({ isOpen: true, tokenId: targetId, url: tokens[targetId].img || '' });
  };

  const confirmUpdateTokenImage = async (e) => {
    e.preventDefault();
    const targetId = imagePrompt.tokenId;
    const url = imagePrompt.url;
    
    if (!targetId || !tokens[targetId] || !url) {
       setImagePrompt({ isOpen: false, tokenId: null, url: '' });
       return;
    }

    try {
      await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.img`]: url });
      const type = tokens[targetId].type;
      const collectionName = type === 'player' ? 'characters' : 'active_enemies';
      await updateDoc(doc(db, collectionName, targetId), { img: url });
    } catch (error) {
      console.error("Failed to update token image", error);
    }
    setImagePrompt({ isOpen: false, tokenId: null, url: '' });
  };

  const handleUpdateTokenHpLive = async (tokenId, newHpVal) => {
    const parsedHp = parseInt(newHpVal, 10);
    if (isNaN(parsedHp) || !tokenId || !tokens[tokenId]) return;
    
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.hp`]: parsedHp });
    
    const type = tokens[tokenId].type;
    const collectionName = type === 'player' ? 'characters' : 'active_enemies';
    try {
      if (type === 'enemy') {
        await updateDoc(doc(db, collectionName, tokenId), { currentHp: parsedHp, hp: parsedHp });
      } else {
        await updateDoc(doc(db, collectionName, tokenId), { hp: parsedHp });
      }
    } catch (e) {
      console.error("Failed to sync HP to entity", e);
    }
  };

  const handleToggleTokenSize = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const currentSize = tokens[targetId].size || 1;
    const newSize = currentSize >= 4 ? 1 : currentSize + 1; 
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.size`]: newSize });
  };

  const handleToggleAura = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const currentAura = tokens[targetId].aura || 0;
    const newAura = currentAura === 0 ? 10 : currentAura === 10 ? 15 : currentAura === 15 ? 30 : 0; 
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.aura`]: newAura });
  };

  const handleToggleElevation = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const current = tokens[targetId].elevation || 0;
    const newElev = current === 0 ? 10 : current === 10 ? 20 : current === 20 ? 30 : current === 30 ? 60 : 0;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.elevation`]: newElev });
  };

  const handleToggleConcentration = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    
    const t = tokens[targetId];
    const newConcState = !t.isConcentrating;
    
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.isConcentrating`]: newConcState });
    
    const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
    await updateDoc(doc(db, collectionName, targetId), { isConcentrating: newConcState });
  };

  const toggleCondition = async (tokenId, cond) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const t = tokens[targetId];
    const currentConds = t.conditions || [];
    const newConds = currentConds.includes(cond) 
      ? currentConds.filter(c => c !== cond) 
      : [...currentConds, cond];
      
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.conditions`]: newConds });
    
    const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
    await updateDoc(doc(db, collectionName, targetId), { conditions: newConds });
  };

  const handleTileClick = async (x, y) => {
    if (!selectedTokenId || !tokens[selectedTokenId]) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { 
      [`tokens.${selectedTokenId}.x`]: x, 
      [`tokens.${selectedTokenId}.y`]: y 
    });
    setSelectedTokenId(null); 
  };

  const handleTokenDrop = async (tokenId, x, y) => {
    if (!tokenId || !tokens[tokenId]) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { 
      [`tokens.${tokenId}.x`]: x, 
      [`tokens.${tokenId}.y`]: y 
    });
  };

  const handleDrawEnd = async (lineData) => {
    const newLine = { ...lineData, id: Date.now(), shape: drawingShape };
    await updateDoc(doc(db, 'campaign', 'battlemap'), {
      drawings: arrayUnion(newLine)
    });
  };

  const handleClearDrawings = () => {
    setDialog({
      isOpen: true,
      title: 'Clear Drawings',
      message: 'Clear all drawings and templates from the map?',
      type: 'confirm',
      onConfirm: async () => {
        await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: [] });
        closeDialog();
      }
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
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {/* Custom Input Modal for Token Images */}
      {imagePrompt.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={confirmUpdateTokenImage} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="p-4 border-b border-indigo-900/50 bg-indigo-900/10 flex items-center justify-between">
               <h3 className="font-bold text-indigo-400 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Update Token Image</h3>
               <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Image URL</label>
                <input 
                  type="url" 
                  value={imagePrompt.url} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setImagePrompt({...imagePrompt, url: e.target.value})} 
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" 
                  autoFocus 
                  required
                />
             </div>
             <div className="p-4 bg-slate-800 flex gap-3 justify-end border-t border-slate-700">
                <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md">Update</button>
             </div>
          </form>
        </div>
      )}

      <BattlemapPresetsModal 
        isOpen={isPresetsOpen} 
        onClose={() => setIsPresetsOpen(false)} 
        currentMapData={mapData}
        currentTokens={tokens}
        activeEnemies={activeEnemies}
        onRestorePreset={handleRestorePreset}
      />

      <div className="bg-slate-900/80 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2 shrink-0 uppercase tracking-widest drop-shadow-sm">
          <Map className="w-5 h-5" /> Battlefield
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar">
          
          <div className="flex items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner mr-2 shrink-0">
            <button 
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isDrawingMode ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'}`}
            >
              <PenTool className="w-3.5 h-3.5" /> Pen
            </button>
            
            {isDrawingMode && (
              <div className="flex items-center gap-1.5 px-2 border-l border-slate-700/50 ml-1 pl-2">
                <button onClick={() => setDrawingShape('freehand')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'freehand' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`} title="Freehand"><PenTool className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('line')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'line' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`} title="Line/Wall"><div className="w-3 h-0.5 bg-current rotate-45" /></button>
                <button onClick={() => setDrawingShape('circle')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'circle' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`} title="Sphere/Radius"><Circle className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('cone')} className={`p-1.5 rounded-lg transition-colors ${drawingShape === 'cone' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`} title="Cone"><Triangle className="w-3 h-3" /></button>
                
                <div className="w-px h-4 bg-slate-700/50 mx-1"></div>
                
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
                  <button key={c} onClick={() => setDrawingColor(c)} className={`w-5 h-5 rounded-full border-2 transition-all ${drawingColor === c ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
            <button onClick={handleClearDrawings} className="text-slate-500 hover:text-red-400 p-2 ml-1 border-l border-slate-700/50 transition-colors" title="Clear Map Drawings">
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={launchDisplayTab}
            className="bg-indigo-900/40 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors shadow-sm shrink-0 uppercase tracking-wider"
            title="Cast to a second monitor"
          >
            <MonitorPlay className="w-3.5 h-3.5" /> Cast Display
          </button>

          <button 
            onClick={() => setIsPresetsOpen(true)}
            className="bg-amber-900/30 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors shadow-sm shrink-0 uppercase tracking-wider"
          >
            <Save className="w-3.5 h-3.5" /> Presets
          </button>

          <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs flex items-center gap-2 transition-colors shadow-sm shrink-0 uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" /> Config
          </button>
          
          <button 
            onClick={togglePublish} 
            className={`px-5 py-2 rounded-xl font-black text-[10px] md:text-xs flex items-center gap-2 transition-all shadow-md shrink-0 uppercase tracking-widest ${mapData.isPublished ? 'bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'}`}
          >
            {mapData.isPublished ? <><Send className="w-3.5 h-3.5"/> LIVE</> : <><EyeOff className="w-3.5 h-3.5"/> HIDDEN</>}
          </button>
        </div>
      </div>

      {isEditingMap && (
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 shadow-inner animate-in fade-in slide-in-from-top-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preset Local Map</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
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
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Or Custom Web URL</label>
               <input 
                 type="url" 
                 value={tempImageUrl}
                 onFocus={(e) => e.target.select()}
                 onChange={(e) => setTempImageUrl(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
                 placeholder="https://example.com/map.jpg"
               />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grid Cell Size (Pixels)</label>
               <input 
                 type="number" 
                 value={tempGridScale}
                 onFocus={(e) => e.target.select()}
                 onChange={(e) => setTempGridScale(Number(e.target.value))}
                 className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm font-black focus:outline-none focus:border-indigo-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
               />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grid Color</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
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

          <div className="flex justify-end border-t border-slate-700/80 pt-5 mt-2">
            <button 
              onClick={handleUpdateMapSettings} 
              disabled={isSavingMap}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              {isSavingMap ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating Grid...</> : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {hasUnstagedActors && (
        <div className="bg-slate-900/50 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-slate-700/50 border-dashed flex items-center flex-wrap gap-2 shadow-inner">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 hidden xl:block">Stage Actors:</span>
          
          <button onClick={stageAllActive} className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors mr-2 flex items-center gap-1.5 shadow-sm">
            <Users className="w-3.5 h-3.5"/> Deploy All
          </button>

          <div className="w-px h-5 bg-slate-700/50 mx-1"></div>

          {unstagedPlayers.map(p => (
            <button key={p.id} onClick={() => stageToken(p, 'player')} className="text-[10px] md:text-xs font-bold bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm">+ {(p.name || 'Unknown').split(' ')[0]}</button>
          ))}
          {unstagedEnemies.map(e => (
            <button key={e.id} onClick={() => stageToken(e, 'enemy')} className="text-[10px] md:text-xs font-bold bg-red-900/30 border border-red-500/30 text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm">+ {(e.name || 'Unknown').substring(0,8)}</button>
          ))}
        </div>
      )}

      <MapGrid 
        mapData={mapData} 
        tokens={tokens} 
        activePlayers={activePlayers}
        activeEnemies={activeEnemies}
        onTileClick={handleTileClick} 
        onTokenClick={(id) => setSelectedTokenId(selectedTokenId === id ? null : id)}
        selectedTokenId={selectedTokenId}
        isDM={true} 
        onTokenDrop={handleTokenDrop}
        showMovementRangeFor={showRulerFor ? tokens[showRulerFor] : null}
        onToggleRuler={(id) => setShowRulerFor(showRulerFor === id ? null : id)}
        isDrawingMode={isDrawingMode}
        drawingColor={drawingColor}
        drawingShape={drawingShape}
        onDrawEnd={handleDrawEnd}
        onUpdateHpLive={handleUpdateTokenHpLive}
        onToggleSize={handleToggleTokenSize}
        onToggleAura={handleToggleAura}
        onToggleElevation={handleToggleElevation}
        onToggleConcentration={handleToggleConcentration}
        onToggleCondition={toggleCondition}
        onUpdateImage={handleUpdateTokenImage}
        onToggleHidden={handleToggleHidden}
        onRemoveToken={removeToken}
        onDeselect={() => setSelectedTokenId(null)}
      />
    </div>
  );
}