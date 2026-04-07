import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map as MapIcon, X, AlertTriangle, Zap } from 'lucide-react';
import MapGrid from './MapGrid';
import { getConditionMechanics } from '../../services/arklaEngine';

export default function BattleMapLayer({ char, charId, isOpen, onClose }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [], fogOfWar: false });
  const [tokens, setTokens] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert' });
  const [initiative, setInitiative] = useState(null);
  
  const [activePlayers, setActivePlayers] = useState([]);
  const [activeEnemies, setActiveEnemies] = useState([]);
  
  const [showRange, setShowRange] = useState(false);
  const [hasMovedThisTurn, setHasMovedThisTurn] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);

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
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          drawings: data.drawings || [],
          fogOfWar: data.fogOfWar || false
        });
        setTokens(data.tokens || {});
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const initRef = doc(db, 'campaign', 'initiative');
    const unsub = onSnapshot(initRef, (docSnap) => {
      if (docSnap.exists()) setInitiative(docSnap.data());
    });
    return () => unsub();
  }, []);

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

  useEffect(() => {
    if (mapData.activeTokenId === charId) {
      setHasMovedThisTurn(false);
    }
  }, [mapData.activeTokenId, charId]);

  const handleTokenClick = (tokenId) => {
    if (tokenId === charId) {
      setShowRange(!showRange); 
    }
  };

  const myToken = tokens[charId];
  const conditionMechanics = myToken ? getConditionMechanics(myToken.conditions || []) : null;
  let dynamicSpeed = myToken ? myToken.speed || 30 : 30;
  
  if (conditionMechanics) {
     if (conditionMechanics.speedOverride !== null) {
       dynamicSpeed = conditionMechanics.speedOverride;
     } else {
       dynamicSpeed = Math.floor(dynamicSpeed * conditionMechanics.speedMultiplier);
     }
  }

  const handleTileClick = (targetX, targetY) => {
    if (!myToken) {
      setDialog({ isOpen: true, title: 'Token Not Placed', message: 'The DM has not placed your character on the map yet.', type: 'alert' });
      return;
    }

    if (mapData.activeTokenId !== charId) {
      setDialog({ isOpen: true, title: 'Not Your Turn', message: 'You can only move your character during your active turn in the initiative order.', type: 'alert' });
      return;
    }

    if (hasMovedThisTurn) {
      setDialog({ isOpen: true, title: 'Movement Exhausted', message: 'You have already moved this turn. Wait for the next round to move again.', type: 'alert' });
      return;
    }

    const isOccupied = Object.values(tokens).some(t => {
      if (t.isHidden) return false; 
      const size = t.size || 1;
      return targetX >= t.x && targetX < t.x + size && targetY >= t.y && targetY < t.y + size;
    });

    if (isOccupied) {
      setDialog({ isOpen: true, title: 'Space Occupied', message: 'There is already a creature occupying that space on the battlefield.', type: 'alert' });
      return;
    }

    const dx = Math.abs(targetX - myToken.x);
    const dy = Math.abs(targetY - myToken.y);
    const distance = Math.max(dx, dy) * 5; 

    if (distance === 0) return;

    if (dynamicSpeed === 0) {
      setDialog({ isOpen: true, title: 'Immobilized', message: 'You cannot move. Your speed is currently 0ft due to an active condition.', type: 'alert' });
      return;
    }

    if (distance > dynamicSpeed * 2) {
      setDialog({ isOpen: true, title: 'Out of Range', message: `That tile is ${distance}ft away. Even with a Dash, you can only reach ${dynamicSpeed * 2}ft.`, type: 'alert' });
      return;
    }

    if (distance > dynamicSpeed) {
      setPendingMove({ x: targetX, y: targetY }); 
      setDialog({
        isOpen: true,
        title: 'Dash Required',
        message: `Moving ${distance}ft requires you to use the Dash Action. This will consume your main Action for the turn, meaning you cannot cast a standard spell or make a standard attack. Proceed?`,
        type: 'confirm'
      });
      return;
    }

    moveToken(targetX, targetY);
  };

  const executePendingMove = () => {
    if (!pendingMove) return;
    moveToken(pendingMove.x, pendingMove.y);
  };

  const moveToken = async (newX, newY) => {
    try {
      await runTransaction(db, async (transaction) => {
        const mapRef = doc(db, 'campaign', 'battlemap');
        const mapDoc = await transaction.get(mapRef);
        
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          const mapTokens = mapDoc.data().tokens;
          mapTokens[charId].x = newX;
          mapTokens[charId].y = newY;
          transaction.update(mapRef, { tokens: mapTokens });
        }
      });
      
      setShowRange(false); 
      setHasMovedThisTurn(true); 
      setPendingMove(null);
    } catch (error) {
      console.error("Failed to move token:", error);
    }
  };

  if (!isOpen) return null;

  const isMapAvailable = mapData.isPublished && mapData.imageUrl;
  const activeActor = initiative?.order?.[initiative.activeTurn] || null;

  return (
    <div className={`fixed inset-x-0 bottom-0 z-[45] bg-slate-950 transition-all duration-500 ease-in-out flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.8)] border-t-[3px] border-slate-900 ${isOpen ? 'h-[80dvh] md:h-screen md:w-[calc(100%-350px)] lg:w-[calc(100%-400px)] md:right-0 md:left-auto md:border-t-0 md:border-l-[3px]' : 'h-0 opacity-0 pointer-events-none'}`}>
      
      <div className="h-10 md:h-12 bg-slate-900 border-b-[3px] border-slate-950 flex items-center justify-between px-4 shrink-0">
        <h3 className="font-black text-emerald-400 uppercase tracking-widest text-xs flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          <MapIcon className="w-4 h-4"/> Tactical View
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5 font-black" />
        </button>
      </div>

      {dialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl max-w-sm w-full p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <h3 className={`text-lg font-black mb-2 flex items-center gap-2 uppercase tracking-widest ${dialog.type === 'confirm' ? 'text-amber-400' : 'text-red-400'}`}>
              {dialog.type === 'confirm' ? <Zap className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
              {dialog.title}
            </h3>
            <p className="text-sm text-slate-300 mb-6 font-bold leading-relaxed">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
               <button onClick={() => { setDialog({ isOpen: false }); setPendingMove(null); }} className="px-5 py-2.5 text-slate-400 bg-slate-800 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">
                 {dialog.type === 'confirm' ? 'Cancel' : 'Understood'}
               </button>
               {dialog.type === 'confirm' && (
                 <button 
                   onClick={() => { executePendingMove(); setDialog({ isOpen: false }); }} 
                   className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                 >
                   Confirm Dash
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 w-full bg-black relative min-h-0 overflow-hidden">
         {!isMapAvailable ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <MapIcon className="w-12 h-12 mb-4 opacity-30 drop-shadow-sm" />
              <p className="font-black uppercase tracking-widest text-sm">Waiting for DM to reveal map...</p>
            </div>
         ) : (
            <MapGrid 
              mapData={mapData} 
              tokens={tokens} 
              activeActor={activeActor}
              activePlayers={activePlayers}
              activeEnemies={activeEnemies}
              onTileClick={handleTileClick} 
              onTokenClick={handleTokenClick}
              selectedTokenId={charId}
              isDM={false} 
              isPlayerMap={true}
              showMovementRangeFor={showRange ? { ...tokens[charId], speed: dynamicSpeed } : null}
            />
         )}
      </div>

      <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-slate-950/20 to-transparent pointer-events-none md:hidden"></div>
      
      {myToken && (
        <div className="bg-slate-900 border-t-[3px] border-slate-950 p-3 shrink-0 flex justify-center gap-6 z-50 relative shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dynamicSpeed === 0 ? 'text-red-500' : 'text-slate-300'}`}>Move: {dynamicSpeed}ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dynamicSpeed === 0 ? 'text-red-500' : 'text-slate-300'}`}>Dash: {dynamicSpeed * 2}ft</span>
          </div>
        </div>
      )}
    </div>
  );
}