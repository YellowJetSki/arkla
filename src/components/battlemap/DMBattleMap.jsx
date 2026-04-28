import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, collection, getDocs, writeBatch, deleteField, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map, Send, EyeOff, Eye, Settings, Trash2, X, Image as ImageIcon, MonitorPlay, Loader2, Save, Users, PenTool, Circle, Triangle, Eraser, LayoutDashboard, Ruler, User, RotateCcw, Sun, Flashlight, Flame } from 'lucide-react';
import MapGrid from './MapGrid';
import BattlemapPresetsModal from './BattlemapPresetsModal';
import DialogModal from '../shared/DialogModal';
import ImageSelector from '../shared/ImageSelector';

const getShortName = (fullName) => {
  if (!fullName) return 'Unknown';
  const match = fullName.match(/["'“”‘’]([^"'“”‘’]+)["'“”‘’]/);
  if (match) return match[1];
  return fullName.split(' ')[0];
};

export default function DMBattleMap() {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [], fogOfWar: false, environment: 'none' });
  const [tokens, setTokens] = useState({});
  const [selectedTokenIds, setSelectedTokenIds] = useState([]);
  const tokensRef = useRef(tokens);
  
  const [showRulerFor, setShowRulerFor] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#f59e0b');
  const [drawingShape, setDrawingShape] = useState('freehand'); 
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isSavingMap, setIsSavingMap] = useState(false);
  
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [tempGridScale, setTempGridScale] = useState(30); 
  const [tempGridColor, setTempGridColor] = useState('rgba(255,255,255,0.35)');
  const [tempEnvironment, setTempEnvironment] = useState('none');

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
  const [imagePrompt, setImagePrompt] = useState({ isOpen: false, tokenId: null, url: '' });

  const getSelectedEntity = () => {
    if (selectedTokenIds.length !== 1) return null;
    const targetId = selectedTokenIds[0];
    const token = tokens[targetId];
    if (!token) return null;
    if (token.type === 'player') return activePlayers.find(p => p.id === targetId);
    if (token.type === 'enemy') return activeEnemies.find(e => e.id === targetId);
    return null;
  };
  
  const selectedEntity = getSelectedEntity();

  useEffect(() => { tokensRef.current = tokens; }, [tokens]);

  useEffect(() => {
    const mapRef = doc(db, 'campaign', 'battlemap');
    const unsub = onSnapshot(mapRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const safeCols = Math.min(100, Math.max(1, isNaN(Number(data.cols)) ? 20 : Number(data.cols)));
        const safeRows = Math.min(100, Math.max(1, isNaN(Number(data.rows)) ? 15 : Number(data.rows)));

        setMapData({
          imageUrl: data.imageUrl || '', cols: safeCols, rows: safeRows, isPublished: data.isPublished || false,
          activeTokenId: data.activeTokenId || null, gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          drawings: data.drawings || [], fogOfWar: data.fogOfWar || false, environment: data.environment || 'none'
        });
        setTokens(data.tokens || {});
      } else {
        setDoc(mapRef, { imageUrl: '', cols: 20, rows: 15, isPublished: false, tokens: {}, activeTokenId: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [], fogOfWar: false, environment: 'none' });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubChars = onSnapshot(collection(db, 'characters'), (snap) => setActivePlayers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEnemies = onSnapshot(collection(db, 'active_enemies'), (snap) => setActiveEnemies(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubChars(); unsubEnemies(); };
  }, []);

  useEffect(() => {
    const activePlayerIds = activePlayers.map(p => p.id);
    const tokensToRemove = Object.values(tokensRef.current).filter(t => t.type === 'player' && !activePlayerIds.includes(t.id));
    if (tokensToRemove.length > 0) {
      const updates = {};
      tokensToRemove.forEach(t => { updates[`tokens.${t.id}`] = deleteField(); });
      updateDoc(doc(db, 'campaign', 'battlemap'), updates).catch(console.error);
      setSelectedTokenIds(prev => prev.filter(id => !tokensToRemove.some(t => t.id === id)));
    }
  }, [activePlayers]);

  const handleUpdateMapSettings = () => {
    setIsSavingMap(true);
    if (!tempImageUrl) {
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: '', cols: 20, rows: 15, gridColor: tempGridColor, environment: tempEnvironment }, { merge: true }).then(() => { setIsSavingMap(false); setIsEditingMap(false); });
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.onload = () => {
      const calcCols = Math.min(100, Math.max(1, Math.round(img.naturalWidth / tempGridScale)));
      const calcRows = Math.min(100, Math.max(1, Math.round(img.naturalHeight / tempGridScale)));
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: tempImageUrl, cols: calcCols, rows: calcRows, gridColor: tempGridColor, environment: tempEnvironment }, { merge: true }).then(() => { setIsSavingMap(false); setIsEditingMap(false); });
    };
    img.onerror = () => {
      setDoc(doc(db, 'campaign', 'battlemap'), { imageUrl: tempImageUrl, cols: 20, rows: 15, gridColor: tempGridColor, environment: tempEnvironment }, { merge: true }).then(() => {
        setIsSavingMap(false); setIsEditingMap(false);
        setDialog({ isOpen: true, title: 'Dimension Error', message: 'Could not read image dimensions. Defaulted to 20x15.', type: 'alert', onConfirm: closeDialog });
      });
    };
    img.src = tempImageUrl;
  };

  const togglePublish = async () => await setDoc(doc(db, 'campaign', 'battlemap'), { isPublished: !mapData.isPublished }, { merge: true });
  const toggleFogOfWar = async () => await setDoc(doc(db, 'campaign', 'battlemap'), { fogOfWar: !mapData.fogOfWar }, { merge: true });

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
      setSelectedTokenIds([]);
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
      speed: actor.speed || 30, ac: actor.ac || 10, conditions: actor.conditions || [], x: 0, y: 0, 
      size: getCreatureSize(actor.name), isHidden: false, hp: actor.currentHp ?? actor.hp ?? 0, maxHp: actor.maxHp ?? actor.hp ?? 1,
      tempHp: actor.tempHp || 0, aura: 0, elevation: 0, isConcentrating: actor.isConcentrating || false
    };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${actor.id}`]: newToken });
  };

  const stageAllActive = async () => {
    const updates = {};
    let pX = 0, eX = 0;
    activePlayers.filter(p => !tokens[p.id]).forEach(p => { updates[`tokens.${p.id}`] = { id: p.id, name: getShortName(p.name), type: 'player', img: p.img || '', speed: p.speed || 30, ac: p.ac || 10, conditions: p.conditions || [], x: pX++, y: 0, size: getCreatureSize(p.name), isHidden: false, hp: p.hp || 0, maxHp: p.maxHp || 1, tempHp: p.tempHp || 0, aura: 0, elevation: 0, isConcentrating: p.isConcentrating || false }; });
    activeEnemies.filter(e => !tokens[e.id]).forEach(e => { updates[`tokens.${e.id}`] = { id: e.id, name: getShortName(e.name), type: 'enemy', img: e.img || '', speed: e.speed || 30, ac: e.ac || 10, conditions: e.conditions || [], x: eX++, y: 2, size: getCreatureSize(e.name), isHidden: false, hp: e.currentHp ?? e.hp ?? 0, maxHp: e.maxHp ?? e.hp ?? 1, tempHp: e.tempHp || 0, aura: 0, elevation: 0, isConcentrating: e.isConcentrating || false }; });
    if (Object.keys(updates).length > 0) await updateDoc(doc(db, 'campaign', 'battlemap'), updates);
  };

  const spawnNPC = async () => {
    const npcId = `npc_${Date.now()}`;
    const newToken = { id: npcId, name: 'NPC', type: 'npc', img: '', speed: 30, ac: 10, conditions: [], x: 0, y: 0, size: 1, isHidden: false, hp: 10, maxHp: 10, tempHp: 0, aura: 0, elevation: 0, isConcentrating: false };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${npcId}`]: newToken });
  };

  const spawnCrowd = async () => {
    const crowdSize = 5;
    const images = ['https://images.unsplash.com/photo-1554224311-b98dc6d8b28f?q=80&w=150&auto=format&fit=crop', 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=150&auto=format&fit=crop', 'https://images.unsplash.com/photo-1531362624558-8d193309e3e3?q=80&w=150&auto=format&fit=crop', 'https://images.unsplash.com/photo-1598453406399-53e9a7e0a8aa?q=80&w=150&auto=format&fit=crop', 'https://images.unsplash.com/photo-1601335804364-bb20b77749eb?q=80&w=150&auto=format&fit=crop'];
    const updates = {};
    for (let i = 0; i < crowdSize; i++) {
      const npcId = `npc_crowd_${Date.now()}_${i}`;
      updates[`tokens.${npcId}`] = { id: npcId, name: `NPC ${i+1}`, type: 'npc', img: images[i], speed: 30, ac: 10, conditions: [], x: i + 1, y: 1, size: 1, isHidden: false, hp: 10, maxHp: 10, tempHp: 0, aura: 0, elevation: 0, isConcentrating: false };
    }
    await updateDoc(doc(db, 'campaign', 'battlemap'), updates);
  };

  const removeToken = async (tokenId) => {
    const targetToken = tokens[tokenId];
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}`]: deleteField() });
      if (targetToken && targetToken.type === 'enemy') batch.delete(doc(db, 'active_enemies', tokenId));
      await batch.commit();
    } catch (e) { await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}`]: deleteField() }); }
    setSelectedTokenIds(prev => prev.filter(id => id !== tokenId));
  };

  const handleToggleHidden = async (tokenId) => {
    if (!tokens[tokenId]) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.isHidden`]: !(tokens[tokenId].isHidden || false) });
  };

  const handleUpdateTokenImage = (tokenId) => {
    if (!tokens[tokenId]) return;
    setImagePrompt({ isOpen: true, tokenId, url: tokens[tokenId].img || '' });
  };

  const confirmUpdateTokenImage = async (e) => {
    e.preventDefault();
    const { tokenId, url } = imagePrompt;
    if (!tokenId || !tokens[tokenId] || !url) return setImagePrompt({ isOpen: false, tokenId: null, url: '' });
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.img`]: url });
      const collectionName = tokens[tokenId].type === 'player' ? 'characters' : 'active_enemies';
      batch.update(doc(db, collectionName, tokenId), { img: url });
      await batch.commit();
    } catch (error) { await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.img`]: url }); }
    setImagePrompt({ isOpen: false, tokenId: null, url: '' });
  };

  const handleUpdateTokenHpLive = async (tokenId, newHpVal) => {
    if (newHpVal === -99999) return removeToken(tokenId);
    const targetToken = tokens[tokenId];
    if (!targetToken) return;
    const parsedHp = Math.max(0, Math.min(targetToken.maxHp || 1000, parseInt(newHpVal, 10)));
    if (isNaN(parsedHp)) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.hp`]: parsedHp });
      const collectionName = targetToken.type === 'player' ? 'characters' : 'active_enemies';
      if (targetToken.type === 'enemy') batch.update(doc(db, collectionName, tokenId), { currentHp: parsedHp });
      else if (targetToken.type === 'player') batch.update(doc(db, collectionName, tokenId), { hp: parsedHp });
      await batch.commit();
    } catch (e) { await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.hp`]: parsedHp }); }
  };

  const handleToggleTokenSize = async (tokenId) => {
    if (!tokens[tokenId]) return;
    const currentSize = tokens[tokenId].size || 1;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.size`]: currentSize >= 4 ? 1 : currentSize + 1 });
  };

  const handleToggleAura = async (tokenId) => {
    if (!tokens[tokenId]) return;
    const currentAura = tokens[tokenId].aura || 0;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.aura`]: currentAura === 0 ? 10 : currentAura === 10 ? 15 : currentAura === 15 ? 30 : 0 });
  };

  const handleToggleElevation = async (tokenId) => {
    if (!tokens[tokenId]) return;
    const current = tokens[tokenId].elevation || 0;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.elevation`]: current === 0 ? 10 : current === 10 ? 20 : current === 20 ? 30 : current === 30 ? 60 : 0 });
  };

  const handleToggleConcentration = async (tokenId) => {
    if (!tokens[tokenId]) return;
    const t = tokens[tokenId];
    const newConcState = !t.isConcentrating;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.isConcentrating`]: newConcState });
      const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
      batch.update(doc(db, collectionName, tokenId), { isConcentrating: newConcState });
      await batch.commit();
    } catch(e) { await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.isConcentrating`]: newConcState }); }
  };

  const toggleCondition = async (tokenId, cond) => {
    if (!tokens[tokenId]) return;
    const t = tokens[tokenId];
    const currentConds = t.conditions || [];
    const newConds = currentConds.includes(cond) ? currentConds.filter(c => c !== cond) : [...currentConds, cond];
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.conditions`]: newConds });
      const collectionName = t.type === 'player' ? 'characters' : 'active_enemies';
      batch.update(doc(db, collectionName, tokenId), { conditions: newConds });
      await batch.commit();
    } catch(e) { await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${tokenId}.conditions`]: newConds }); }
  };

  const handleTileClick = async (x, y) => {
    if (selectedTokenIds.length !== 1) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { [`tokens.${selectedTokenIds[0]}.x`]: x, [`tokens.${selectedTokenIds[0]}.y`]: y });
  };

  // FIXED: Using arrayUnion prevents the "disappearing shape" race condition!
  const handleDrawEnd = async (lineData) => {
    if (drawingShape === 'ruler' || lineData.type === 'ruler') return; 
    const newLine = { ...lineData, id: Date.now(), shape: drawingShape };
    await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: arrayUnion(newLine) });
  };

  const handleClearDrawings = () => setDialog({ isOpen: true, title: 'Clear Drawings', message: 'Clear all drawings and templates from the map?', type: 'confirm', onConfirm: async () => { await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: [] }); closeDialog(); }});
  
  const handleUndoDrawing = async () => {
    if (!mapData.drawings || mapData.drawings.length === 0) return;
    await updateDoc(doc(db, 'campaign', 'battlemap'), { drawings: mapData.drawings.slice(0, -1) });
  };

  useEffect(() => {
    if (isEditingMap) {
      setTempImageUrl(mapData.imageUrl); setTempGridScale(30); setTempGridColor(mapData.gridColor || 'rgba(255,255,255,0.35)'); setTempEnvironment(mapData.environment || 'none');
    }
  }, [isEditingMap, mapData.imageUrl, mapData.gridColor, mapData.environment]);

  const launchDisplayTab = () => window.open(window.location.pathname + '?display=true', '_blank');
  const returnToDashboard = () => window.location.href = window.location.pathname;

  const unstagedPlayers = activePlayers.filter(p => !tokens[p.id]);
  const unstagedEnemies = activeEnemies.filter(e => !tokens[e.id]);
  const hasUnstagedActors = unstagedPlayers.length > 0 || unstagedEnemies.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-h-0 relative h-full w-full p-4 md:p-6 overflow-hidden">
      
      {imagePrompt.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={confirmUpdateTokenImage} className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-sm shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="p-4 border-b-[3px] border-slate-950 bg-indigo-600 flex items-center justify-between">
               <h3 className="font-black text-slate-950 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Update Image</h3>
               <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="text-slate-950 bg-indigo-500 hover:bg-indigo-400 border-2 border-slate-950 p-1.5 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"><X className="w-4 h-4 font-black" /></button>
             </div>
             <div className="p-6">
                <ImageSelector label="New Token Image" value={imagePrompt.url} onChange={(val) => setImagePrompt({...imagePrompt, url: val})} iconColor="text-indigo-400" inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner" />
             </div>
             <div className="p-4 bg-slate-950 flex justify-end gap-3 border-t-2 border-slate-900">
                <button type="button" onClick={() => setImagePrompt({ isOpen: false, tokenId: null, url: '' })} className="px-5 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-950 bg-indigo-500 hover:bg-indigo-400 border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all">Update</button>
             </div>
          </form>
        </div>
      )}

      <BattlemapPresetsModal isOpen={isPresetsOpen} onClose={() => setIsPresetsOpen(false)} currentMapData={mapData} currentTokens={tokens} activeEnemies={activeEnemies} onRestorePreset={handleRestorePreset} />
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl mb-4 p-3 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 z-20">
        <div className="flex items-center gap-4 pl-2">
            <h2 className="text-lg font-black text-indigo-400 flex items-center gap-2 shrink-0 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] pr-4 border-r-2 border-slate-950"><Map className="w-5 h-5" /> War Table</h2>
            <button onClick={returnToDashboard} className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"><LayoutDashboard className="w-4 h-4" /> Command Center</button>
        </div>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-2 w-full xl:w-auto">
          <button onClick={toggleFogOfWar} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 ${mapData.fogOfWar ? 'bg-slate-400 border-slate-950 text-slate-950' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-white'}`}><Eye className="w-4 h-4" /> Fog</button>
          
          <div className="flex bg-slate-800 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] border-2 border-slate-950 shrink-0 divide-x-2 divide-slate-950 overflow-hidden">
             <button onClick={spawnNPC} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-700 flex items-center gap-1.5 transition-colors"><User className="w-4 h-4" /> +1 NPC</button>
             <button onClick={spawnCrowd} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-700 flex items-center gap-1.5 transition-colors" title="Add a crowd of 5 generic NPCs"><Users className="w-4 h-4" /> Crowd</button>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border-2 border-slate-900 shadow-inner shrink-0 mr-1 overflow-x-auto custom-scrollbar">
            <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border-2 ${isDrawingMode ? 'bg-red-500 text-slate-950 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none' : 'border-transparent text-slate-500 hover:text-red-400 hover:bg-slate-900'}`}><PenTool className="w-3.5 h-3.5" /> Pen</button>
            {isDrawingMode && (
              <div className="flex items-center gap-1.5 px-2 border-l-2 border-slate-900 ml-1 pl-2">
                <button onClick={() => setDrawingShape('freehand')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'freehand' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><PenTool className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('line')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'line' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><div className="w-3 h-0.5 bg-current rotate-45" /></button>
                <button onClick={() => setDrawingShape('circle')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'circle' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Circle className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('cone')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'cone' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Triangle className="w-3 h-3" /></button>
                
                <div className="w-0.5 h-4 bg-slate-900 mx-1"></div>
                <button onClick={() => setDrawingShape('torch_circle')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'torch_circle' ? 'bg-orange-500 border-slate-950 text-slate-950 shadow-inner' : 'border-transparent text-slate-500 hover:text-orange-400'}`} title="Draw Torch Radius (Flickering)"><Flame className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('torch_cone')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'torch_cone' ? 'bg-orange-500 border-slate-950 text-slate-950 shadow-inner' : 'border-transparent text-slate-500 hover:text-orange-400'}`} title="Draw Torch Cone (Flickering)"><Flashlight className="w-3 h-3" /></button>
                <div className="w-0.5 h-4 bg-slate-900 mx-1"></div>
                <button onClick={() => setDrawingShape('sun_circle')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'sun_circle' ? 'bg-yellow-400 border-slate-950 text-slate-950 shadow-inner' : 'border-transparent text-slate-500 hover:text-yellow-300'}`} title="Draw Sunlight Radius (Static)"><Sun className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('sun_cone')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'sun_cone' ? 'bg-yellow-400 border-slate-950 text-slate-950 shadow-inner' : 'border-transparent text-slate-500 hover:text-yellow-300'}`} title="Draw Sunlight Cone (Static)"><Triangle className="w-3 h-3 text-yellow-300" /></button>
                <div className="w-0.5 h-4 bg-slate-900 mx-1"></div>

                <button onClick={() => setDrawingShape('reveal')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'reveal' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`} title="Reveal Fog"><Eye className="w-3 h-3" /></button>
                <button onClick={() => setDrawingShape('ruler')} className={`p-1.5 rounded-lg transition-colors border-2 ${drawingShape === 'ruler' ? 'bg-slate-800 border-slate-950 text-white shadow-inner' : 'border-transparent text-slate-500 hover:text-slate-300'}`} title="Quick Measure Distance"><Ruler className="w-3 h-3" /></button>
                <div className="w-0.5 h-4 bg-slate-900 mx-1"></div>
                {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff', '#000000'].map(c => (
                  <button key={c} onClick={() => setDrawingColor(c)} className={`w-5 h-5 rounded-full border-[3px] transition-all ${drawingColor === c ? 'scale-110 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border-transparent opacity-50 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                ))}
                <div className="w-0.5 h-4 bg-slate-900 mx-1"></div>
                <button onClick={handleUndoDrawing} className="p-1.5 rounded-lg transition-colors border-2 border-transparent text-slate-500 hover:text-amber-400 hover:bg-slate-900" title="Undo Last Drawing"><RotateCcw className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <button onClick={handleClearDrawings} className="text-slate-500 hover:text-red-500 hover:bg-slate-900 p-1.5 ml-1 border-l-2 border-slate-900 transition-colors rounded-lg" title="Clear All Drawings"><Eraser className="w-4 h-4" /></button>
          </div>

          <button onClick={launchDisplayTab} className="bg-indigo-600 hover:bg-indigo-500 text-slate-950 border-2 border-slate-950 px-3 py-2 rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 uppercase tracking-widest"><MonitorPlay className="w-4 h-4" /> Cast</button>
          <button onClick={() => setIsPresetsOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-slate-950 px-3 py-2 rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 uppercase tracking-widest"><Save className="w-4 h-4" /> Presets</button>
          <button onClick={() => setIsEditingMap(!isEditingMap)} className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-2 border-slate-950 px-3 py-2 rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 uppercase tracking-widest"><Settings className="w-4 h-4" /> Config</button>
          <button onClick={togglePublish} className={`px-3 py-2 rounded-lg font-black text-[10px] flex items-center gap-1.5 transition-all border-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 uppercase tracking-widest ${mapData.isPublished ? 'bg-emerald-500 text-slate-950 border-slate-950' : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-white hover:bg-slate-900'}`}>
            {mapData.isPublished ? <><Send className="w-4 h-4"/> Player TV: LIVE</> : <><EyeOff className="w-4 h-4"/> Player TV: HIDDEN</>}
          </button>
        </div>
      </div>

      {isEditingMap && (
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl mb-4 p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2 space-y-5 relative z-10 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
               <ImageSelector label="Custom Map Image" value={tempImageUrl} onChange={(val) => setTempImageUrl(val)} iconColor="text-indigo-400" inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 shadow-inner" />
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Grid Cell Size (Pixels)</label>
               <input type="number" value={tempGridScale} onFocus={(e) => e.target.select()} onChange={(e) => setTempGridScale(Number(e.target.value))} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white text-sm font-black focus:outline-none focus:border-indigo-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Grid Color</label>
              <select className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 shadow-inner" onChange={(e) => setTempGridColor(e.target.value)} value={tempGridColor}>
                <option value="rgba(255,255,255,0.35)">White (Default)</option>
                <option value="rgba(0,0,0,0.6)">Black (Snow Maps)</option>
                <option value="rgba(220,38,38,0.6)">Red (High Contrast)</option>
                <option value="transparent">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Environment Overlay</label>
              <select className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-3 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 shadow-inner" onChange={(e) => setTempEnvironment(e.target.value)} value={tempEnvironment}>
                <option value="none">Clear Skies</option>
                <option value="light_rain">Light Rain</option>
                <option value="heavy_rain">Heavy Storm</option>
                <option value="blizzard">Blizzard Snow</option>
                <option value="embers">Embers & Ash</option>
                <option value="toxic">Toxic Miasma</option>
                <option value="fog">Creeping Fog</option>
                <option value="torchlight">Flickering Torchlight</option>
                <option value="sunlight">Bright Sunlight</option>
                <option value="moonlight">Midnight Moon</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end border-t-2 border-slate-950 pt-5 mt-2">
            <button onClick={handleUpdateMapSettings} disabled={isSavingMap} className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl border-2 border-slate-950 transition-all flex items-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">
              {isSavingMap ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</> : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {hasUnstagedActors && (
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl mb-4 p-3 flex items-center flex-wrap gap-2 shadow-[6px_6px_0px_rgba(0,0,0,1)] shrink-0 z-10">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 pl-2 hidden xl:block">Stage Actors:</span>
          <button onClick={stageAllActive} className="text-[10px] md:text-xs font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 border-2 border-slate-950 text-slate-950 px-4 py-2 rounded-lg transition-all mr-2 flex items-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Users className="w-3.5 h-3.5"/> Deploy All</button>
          <div className="w-0.5 h-6 bg-slate-950 mx-1"></div>
          {unstagedPlayers.map(p => <button key={p.id} onClick={() => stageToken(p, 'player')} className="text-[10px] md:text-xs font-black bg-indigo-500 hover:bg-indigo-400 border-2 border-slate-950 text-slate-950 px-3 py-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">+ {getShortName(p.name)}</button>)}
          {unstagedEnemies.map(e => <button key={e.id} onClick={() => stageToken(e, 'enemy')} className="text-[10px] md:text-xs font-black bg-red-500 hover:bg-red-400 border-2 border-slate-950 text-slate-950 px-3 py-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">+ {getShortName(e.name)}</button>)}
        </div>
      )}

      <div className="flex-1 w-full bg-slate-950 relative min-h-0 border-[3px] border-slate-950 rounded-2xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        {!mapData.imageUrl ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border-4 border-dashed border-slate-900 rounded-2xl bg-slate-950/50 m-4">
            <Map className="w-12 h-12 mb-4 opacity-30 drop-shadow-sm" />
            <p className="font-black uppercase tracking-widest text-sm">No map active.</p>
            <button onClick={() => setIsEditingMap(true)} className="mt-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-950 text-white px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none">Configure Map</button>
          </div>
        ) : (
          <MapGrid 
            mapData={mapData} tokens={tokens} activePlayers={activePlayers} activeEnemies={activeEnemies}
            onTileClick={handleTileClick} 
            onTokenClick={(id, multi) => setSelectedTokenIds(prev => multi ? (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]) : (prev.length === 1 && prev[0] === id ? [] : [id]))}
            onTokenSelectMultiple={(ids) => setSelectedTokenIds(ids)}
            selectedTokenIds={selectedTokenIds} isDM={true} 
            showMovementRangeFor={showRulerFor ? tokens[showRulerFor] : null} onToggleRuler={(id) => setShowRulerFor(showRulerFor === id ? null : id)}
            isDrawingMode={isDrawingMode} drawingColor={drawingColor} drawingShape={drawingShape}
            onDrawEnd={handleDrawEnd} onUpdateHpLive={handleUpdateTokenHpLive} onToggleSize={handleToggleTokenSize}
            onToggleAura={handleToggleAura} onToggleElevation={handleToggleElevation} onToggleConcentration={handleToggleConcentration}
            onToggleCondition={toggleCondition} onUpdateImage={handleUpdateTokenImage} onToggleHidden={handleToggleHidden}
            onRemoveToken={removeToken} onDeselect={() => setSelectedTokenIds([])}
          />
        )}
      </div>

      {selectedEntity && (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-slate-900 border-[3px] border-slate-950 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
          <div className="bg-indigo-600 p-3 border-b-2 border-slate-950 flex justify-between items-start relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-black text-slate-950 uppercase tracking-widest text-lg">{selectedEntity.name}</h3>
              <p className="text-[10px] font-bold text-slate-900 bg-white/20 inline-block px-2 py-0.5 rounded mt-1">{selectedEntity.type === 'player' ? `Level ${selectedEntity.level || '?'} Player` : `CR ${selectedEntity.cr || '?'} Enemy`}</p>
            </div>
            <button onClick={() => setSelectedTokenIds([])} className="text-slate-950 bg-indigo-500 hover:bg-indigo-400 border-2 border-slate-950 p-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none z-10"><X className="w-4 h-4 font-black" /></button>
            {selectedEntity.img && <img src={selectedEntity.img} className="absolute -right-4 -top-4 w-24 h-24 object-cover opacity-20 mix-blend-luminosity rounded-full" />}
          </div>
          <div className="flex bg-slate-950 border-b-2 border-slate-900">
            <div className="flex-1 p-2 text-center border-r-2 border-slate-900">
              <span className="block text-[10px] text-slate-500 font-black">AC</span>
              <span className="text-blue-400 font-black text-lg">{selectedEntity.ac || selectedEntity.armorClass || tokens[selectedTokenIds[0]]?.ac || 10}</span>
            </div>
            <div className="flex-1 p-2 text-center border-r-2 border-slate-900">
              <span className="block text-[10px] text-slate-500 font-black">HP</span>
              <span className="text-red-400 font-black text-lg">{tokens[selectedTokenIds[0]]?.hp}/{tokens[selectedTokenIds[0]]?.maxHp}</span>
            </div>
            <div className="flex-1 p-2 text-center">
              <span className="block text-[10px] text-slate-500 font-black">SPEED</span>
              <span className="text-emerald-400 font-black text-lg">{selectedEntity.speed || tokens[selectedTokenIds[0]]?.speed || 30}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {(selectedEntity.attributes || selectedEntity.stats) && (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(selectedEntity.attributes || selectedEntity.stats).map(([stat, val]) => {
                  const numVal = typeof val === 'object' ? val.value : val;
                  if (numVal === undefined) return null;
                  return (
                    <div key={stat} className="bg-slate-950 border border-slate-800 rounded p-1 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-500">{stat.substring(0,3)}</span>
                      <p className="text-sm font-black text-white">{numVal} <span className="text-slate-500 text-xs font-normal">({Math.floor((numVal - 10) / 2) >= 0 ? '+' : ''}{Math.floor((numVal - 10) / 2)})</span></p>
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <h4 className="text-xs font-black text-indigo-400 uppercase border-b border-slate-800 pb-1 mb-2">Actions & Weapons</h4>
              {selectedEntity.type === 'player' ? (
                 (selectedEntity.weapons || selectedEntity.attacks || selectedEntity.inventory?.filter(i => i.type === 'Weapon' && i.equipped) || []).length > 0 ? (
                   <div className="space-y-2">
                     {(selectedEntity.weapons || selectedEntity.attacks || selectedEntity.inventory?.filter(i => i.type === 'Weapon' && i.equipped) || []).map((w, i) => (
                        <div key={i} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-sm">
                          <p className="font-bold text-white mb-1">{w.name || w.itemName}</p>
                          <p className="text-slate-300 text-xs">{w.damage ? `Dmg: ${w.damage} ${w.damageType || ''} ` : ''}{w.properties ? `(${w.properties})` : ''}</p>
                        </div>
                     ))}
                   </div>
                 ) : <p className="text-xs text-slate-500 italic">No equipped weapons found.</p>
              ) : (
                selectedEntity.actions && selectedEntity.actions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEntity.actions.map((action, i) => (
                      <div key={i} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-sm">
                        <p className="font-bold text-white mb-1">{action.name} <span className="text-indigo-300 text-xs ml-1">{action.type}</span></p>
                        <p className="text-slate-300 text-xs">{action.desc}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-500 italic">No specific actions listed.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}