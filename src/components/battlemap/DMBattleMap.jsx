import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs, writeBatch, deleteField, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, X, Image as ImageIcon, Loader2, Users } from 'lucide-react';
import MapGrid from './MapGrid';
import BattlemapPresetsModal from './BattlemapPresetsModal';
import DialogModal from '../shared/DialogModal';
import MapDrawings from './MapDrawings';
import TokenContextMenu from './TokenContextMenu';
import ImageSelector from '../shared/ImageSelector';
import BattlemapControls from './BattlemapControls';
import TokenLayer from './TokenLayer';

const LOCAL_MAPS = [
  { label: 'Tutorial Forest', value: '/tutorial_forest_enc.png' },
  { label: 'Screwbeard Cave', value: '/screwbeard_cave_enc.png' }
];

const getShortName = (fullName) => {
  if (!fullName) return 'Unknown';
  const match = fullName.match(/["']([^"']+)["']/);
  if (match) return match[1];
  return fullName.split(' ')[0];
};

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
  const [contextMenu, setContextMenu] = useState(null);

  const containerRef = useRef(null);

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
          } else setActivePlayers([]);
        }
      } catch (error) {
        console.error("Aborted fetch due to DB error:", error);
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
        setIsSavingMap(false); setIsEditingMap(false);
      });
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.onload = () => {
      const calcCols = Math.min(100, Math.max(1, Math.round(img.naturalWidth / tempGridScale)));
      const calcRows = Math.min(100, Math.max(1, Math.round(img.naturalHeight / tempGridScale)));
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: tempImageUrl, cols: calcCols, rows: calcRows, gridColor: tempGridColor }, { merge: true }).then(() => {
        setIsSavingMap(false); setIsEditingMap(false);
      });
    };
    img.onerror = () => {
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: tempImageUrl, cols: 20, rows: 15, gridColor: tempGridColor }, { merge: true }).then(() => {
        setIsSavingMap(false); setIsEditingMap(false);
        setDialog({ isOpen: true, title: 'Dimension Error', message: 'Could not read image dimensions. Defaulted to 20x15.', type: 'alert', onConfirm: closeDialog });
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
      batch.set(mapRef, { ...presetData.mapData, tokens: presetData.tokens, isPublished: false });

      const presetEnemies = Object.values(presetData.tokens || {}).filter(t => t.type === 'enemy');
      for (const enemy of presetEnemies) {
         batch.set(doc(db, 'active_enemies', enemy.id), {
            ...(enemy.entityData || {}), 
            name: enemy.name, hp: enemy.hp || 10, maxHp: enemy.maxHp || enemy.hp || 10,
            currentHp: enemy.hp || 10, speed: enemy.speed || 30, img: enemy.img || '',
            conditions: enemy.conditions || [], size: enemy.size || 1, isConcentrating: enemy.isConcentrating || false
         });
      }
      await batch.commit();
      setSelectedTokenId(null);
    } catch (error) { console.error("Restore error:", error); }
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
      id: actor.id, name: getShortName(actor.name), type: type, img: actor.img || '', 
      speed: actor.speed || 30, conditions: actor.conditions || [], x: 0, y: 0, 
      size: getCreatureSize(actor.name), isHidden: false, 
      hp: actor.currentHp ?? actor.hp ?? 0, maxHp: actor.maxHp ?? actor.hp ?? 1,
      tempHp: actor.tempHp || 0, aura: 0, elevation: 0, isConcentrating: actor.isConcentrating || false
    };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${actor.id}`]: newToken });
  };

  const stageAllActive = async () => {
    const updates = {};
    let pX = 0, eX = 0;
    activePlayers.filter(p => !tokens[p.id]).forEach(p => {
      updates[`tokens.${p.id}`] = { id: p.id, name: getShortName(p.name), type: 'player', img: p.img || '', speed: p.speed || 30, conditions: p.conditions || [], x: pX++, y: 0, size: getCreatureSize(p.name), isHidden: false, hp: p.hp || 0, maxHp: p.maxHp || 1, tempHp: p.tempHp || 0, aura: 0, elevation: 0, isConcentrating: p.isConcentrating || false };
    });
    activeEnemies.filter(e => !tokens[e.id]).forEach(e => {
      updates[`tokens.${e.id}`] = { id: e.id, name: getShortName(e.name), type: 'enemy', img: e.img || '', speed: e.speed || 30, conditions: e.conditions || [], x: eX++, y: 2, size: getCreatureSize(e.name), isHidden: false, hp: e.currentHp ?? e.hp ?? 0, maxHp: e.maxHp ?? e.hp ?? 1, tempHp: e.tempHp || 0, aura: 0, elevation: 0, isConcentrating: e.isConcentrating || false };
    });
    if (Object.keys(updates).length > 0) await updateDoc(doc(db, 'campaign', 'battlemap'), updates);
  };

  const removeToken = async (tokenId) => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}`]: deleteField() });
    if (selectedTokenId === tokenId) setSelectedTokenId(null);
  };

  const handleToggleHidden = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.isHidden`]: !(tokens[targetId].isHidden || false) });
  };

  const handleUpdateTokenImage = (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    setImagePrompt({ isOpen: true, tokenId: targetId, url: tokens[targetId].img || '' });
  };

  const confirmUpdateTokenImage = async (e) => {
    e.preventDefault();
    const { tokenId, url } = imagePrompt;
    if (!tokenId || !tokens[tokenId] || !url) {
       setImagePrompt({ isOpen: false, tokenId: null, url: '' });
       return;
    }
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.img`]: url });
      const collectionName = tokens[tokenId].type === 'player' ? 'characters' : 'active_enemies';
      batch.update(doc(db, collectionName, tokenId), { img: url });
      await batch.commit();
    } catch (error) { console.error("Token image update failed", error); }
    setImagePrompt({ isOpen: false, tokenId: null, url: '' });
  };

  const handleUpdateTokenHpLive = async (tokenId, newHpVal) => {
    const targetToken = tokens[tokenId];
    if (!targetToken) return;
    
    const parsedHp = Math.max(0, Math.min(targetToken.maxHp || 1000, parseInt(newHpVal, 10)));
    if (isNaN(parsedHp)) return;
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.hp`]: parsedHp });
      
      const collectionName = targetToken.type === 'player' ? 'characters' : 'active_enemies';
      if (targetToken.type === 'enemy') {
        batch.update(doc(db, collectionName, tokenId), { currentHp: parsedHp });
      } else {
        batch.update(doc(db, collectionName, tokenId), { hp: parsedHp });
      }
      await batch.commit();
    } catch (e) {
      console.error("Failed to sync HP to entity", e);
    }
  };

  const handleToggleTokenSize = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const currentSize = tokens[targetId].size || 1;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.size`]: currentSize >= 4 ? 1 : currentSize + 1 });
  };

  const handleToggleAura = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const currentAura = tokens[targetId].aura || 0;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.aura`]: currentAura === 0 ? 10 : currentAura === 10 ? 15 : currentAura === 15 ? 30 : 0 });
  };

  const handleToggleElevation = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const current = tokens[targetId].elevation || 0;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.elevation`]: current === 0 ? 10 : current === 10 ? 20 : current === 20 ? 30 : current === 30 ? 60 : 0 });
  };

  const handleToggleConcentration = async (tokenId) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const t = tokens[targetId];
    const newConcState = !t.isConcentrating;
    const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';

    const batch = writeBatch(db);
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.isConcentrating`]: newConcState });
    batch.update(doc(db, collectionName, targetId), { isConcentrating: newConcState });
    await batch.commit();
  };

  const toggleCondition = async (tokenId, cond) => {
    const targetId = tokenId || selectedTokenId;
    if (!targetId || !tokens[targetId]) return;
    const t = tokens[targetId];
    const currentConds = t.conditions || [];
    const newConds = currentConds.includes(cond) ? currentConds.filter(c => c !== cond) : [...currentConds, cond];
      
    const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
    const batch = writeBatch(db);
    batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${targetId}.conditions`]: newConds });
    batch.update(doc(db, collectionName, targetId), { conditions: newConds });
    await batch.commit();
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
    await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: [...mapData.drawings, newLine] });
  };

  const handleUpdateToken = async (tokenId, updates) => {
    const updatedTokens = { ...tokens, [tokenId]: { ...tokens[tokenId], ...updates } };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    
    const token = tokens[tokenId];
    if (updates.hp !== undefined) {
      if (token.type === 'player') await updateDoc(doc(db, 'characters', tokenId), { hp: updates.hp });
      else if (token.type === 'enemy') await updateDoc(doc(db, 'active_enemies', tokenId), { currentHp: updates.hp });
    }
    setContextMenu(null);
  };

  const handleDeleteToken = async (tokenId) => {
    const updatedTokens = { ...tokens };
    const token = updatedTokens[tokenId];
    delete updatedTokens[tokenId];
    
    if (token.type === 'enemy') await deleteDoc(doc(db, 'active_enemies', tokenId));
    await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    setContextMenu(null);
  };

  const handleClearDrawings = () => {
    setDialog({ isOpen: true, title: 'Clear Drawings', message: 'Clear all drawings and templates from the map?', type: 'confirm', onConfirm: async () => { await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: [] }); closeDialog(); }});
  };

  useEffect(() => {
    if (isEditingMap) {
      setTempImageUrl(mapData.imageUrl);
      setTempGridScale(30); 
      setTempGridColor(mapData.gridColor || 'rgba(255,255,255,0.35)');
    }
  }, [isEditingMap, mapData.imageUrl, mapData.gridColor]);

  const launchDisplayTab = () => { window.open(window.location.pathname + '?display=true', '_blank'); };

  const unstagedPlayers = activePlayers.filter(p => !tokens[p.id]);
  const unstagedEnemies = activeEnemies.filter(e => !tokens[e.id]);
  const hasUnstagedActors = unstagedPlayers.length > 0 || unstagedEnemies.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-h-0 relative">
      
      {imagePrompt.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={confirmUpdateTokenImage} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="p-4 border-b border-indigo-900/50 bg-indigo-900/10 flex items-center justify-between">
               <h3 className="font-bold text-indigo-400 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Update Token Image</h3>
               <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6">
                <ImageSelector 
                  label="New Token Image"
                  value={imagePrompt.url}
                  onChange={(val) => setImagePrompt({...imagePrompt, url: val})}
                  iconColor="text-indigo-400"
                  inputClassName="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
             </div>
             <div className="p-4 bg-slate-800 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500">Update</button>
             </div>
          </form>
        </div>
      )}

      {contextMenu && (
        <TokenContextMenu token={contextMenu.token} x={contextMenu.x} y={contextMenu.y} onUpdate={handleUpdateToken} onDelete={handleDeleteToken} onClose={() => setContextMenu(null)} />
      )}

      <BattlemapPresetsModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} currentMapData={mapData} currentTokens={tokens} activeEnemies={activeEnemies} onRestorePreset={handleRestorePreset} />

      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      {/* Control Bar */}
      <BattlemapControls 
        isDrawingMode={isDrawingMode} setIsDrawingMode={setIsDrawingMode}
        drawingShape={drawingShape} setDrawingShape={setDrawingShape}
        drawingColor={drawingColor} setDrawingColor={setDrawingColor}
        handleClearDrawings={handleClearDrawings}
        launchDisplayTab={launchDisplayTab}
        setIsPresetsOpen={setIsPresetsOpen}
        isEditingMap={isEditingMap} setIsEditingMap={setIsEditingMap}
        mapData={mapData} togglePublish={togglePublish}
      />

      {isEditingMap && (
        <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/80 p-5 shadow-inner animate-in fade-in slide-in-from-top-2 space-y-5 relative z-10 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preset Local Map</label>
              <select className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" onChange={(e) => setTempImageUrl(e.target.value)} value={LOCAL_MAPS.some(m => m.value === tempImageUrl) ? tempImageUrl : ''}>
                <option value="" disabled>Select a map...</option>
                {LOCAL_MAPS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
               <ImageSelector 
                 label="Custom Map Image"
                 value={tempImageUrl}
                 onChange={(val) => setTempImageUrl(val)}
                 iconColor="text-indigo-400"
                 inputClassName="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
               />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grid Cell Size (Pixels)</label>
               <input type="number" value={tempGridScale} onFocus={(e) => e.target.select()} onChange={(e) => setTempGridScale(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm font-black focus:outline-none focus:border-indigo-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grid Color</label>
              <select className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-inner" onChange={(e) => setTempGridColor(e.target.value)} value={tempGridColor}>
                <option value="rgba(255,255,255,0.35)">White (Default)</option>
                <option value="rgba(0,0,0,0.6)">Black (Snow Maps)</option>
                <option value="rgba(220,38,38,0.6)">Red (High Contrast)</option>
                <option value="transparent">Hidden</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-700/80 pt-5 mt-2">
            <button onClick={handleUpdateMapSettings} disabled={isSavingMap} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md">
              {isSavingMap ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</> : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {hasUnstagedActors && (
        <div className="bg-slate-900/50 backdrop-blur-sm p-3 md:p-4 border-b border-slate-700/50 border-dashed flex items-center flex-wrap gap-2 shadow-inner shrink-0 z-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 hidden xl:block">Stage Actors:</span>
          <button onClick={stageAllActive} className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors mr-2 flex items-center gap-1.5 shadow-sm">
            <Users className="w-3.5 h-3.5"/> Deploy All
          </button>
          <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
          {unstagedPlayers.map(p => <button key={p.id} onClick={() => stageToken(p, 'player')} className="text-[10px] md:text-xs font-bold bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm">+ {getShortName(p.name)}</button>)}
          {unstagedEnemies.map(e => <button key={e.id} onClick={() => stageToken(e, 'enemy')} className="text-[10px] md:text-xs font-bold bg-red-900/30 border border-red-500/30 text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm">+ {getShortName(e.name)}</button>)}
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 custom-scrollbar relative min-h-0">
        {!mapData.imageUrl ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <Map className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-bold">No map active.</p>
            <button onClick={() => setIsEditingMap(true)} className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Configure Map</button>
          </div>
        ) : (
          <div className="min-w-max min-h-max bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-2xl mx-auto w-max relative group">
            <div ref={containerRef} className="relative overflow-hidden rounded-lg shadow-inner border border-slate-700" style={{ width: `${mapData.cols * 50}px`, height: `${mapData.rows * 50}px`, backgroundImage: `url(${mapData.imageUrl})`, backgroundSize: '100% 100%' }}>
              <MapGrid 
                mapData={mapData} tokens={tokens} activePlayers={activePlayers} activeEnemies={activeEnemies}
                onTileClick={handleTileClick} onTokenClick={(id) => setSelectedTokenId(selectedTokenId === id ? null : id)}
                selectedTokenId={selectedTokenId} isDM={true} onTokenDrop={handleTokenDrop}
                showMovementRangeFor={showRulerFor ? tokens[showRulerFor] : null} onToggleRuler={(id) => setShowRulerFor(showRulerFor === id ? null : id)}
                isDrawingMode={isDrawingMode} drawingColor={drawingColor} drawingShape={drawingShape}
                onDrawEnd={handleDrawEnd} onUpdateHpLive={handleUpdateTokenHpLive} onToggleSize={handleToggleTokenSize}
                onToggleAura={handleToggleAura} onToggleElevation={handleToggleElevation} onToggleConcentration={handleToggleConcentration}
                onToggleCondition={toggleCondition} onUpdateImage={handleUpdateTokenImage} onToggleHidden={handleToggleHidden}
                onRemoveToken={removeToken} onDeselect={() => setSelectedTokenId(null)}
              />

              <MapDrawings drawings={mapData.drawings || []} activeTool={isDrawingMode ? 'draw' : 'move'} currentColor={drawingColor} containerRef={containerRef} onSaveDrawing={handleDrawEnd} />

              <TokenLayer 
                tokens={tokens}
                mapData={mapData}
                selectedTokenId={selectedTokenId}
                setSelectedTokenId={setSelectedTokenId}
                isDrawingMode={isDrawingMode}
                handleTokenDrop={handleTokenDrop}
                handleUpdateTokenHpLive={handleUpdateTokenHpLive}
                setContextMenu={setContextMenu}
              />

            </div>
          </div>
        )}
      </div>
    </div>
  );
}