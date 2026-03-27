import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, collection, runTransaction } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map as MapIcon, X, AlertTriangle, Zap } from 'lucide-react';
import MapGrid from './MapGrid';
import { getConditionMechanics } from '../../services/arklaEngine';

export default function BattleMapLayer({ char, charId, isOpen, onClose }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false, activeTokenId: null, ping: null, gridColor: 'rgba(255,255,255,0.35)', drawings: [] });
  const [tokens, setTokens] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert' });
  
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
          ping: data.ping || null,
          gridColor: data.gridColor || 'rgba(255,255,255,0.35)',
          drawings: data.drawings || []
        });
        setTokens(data.tokens || {});
      }
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

  // Engine Integration: Calculate true speed based on active conditions
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
      // Replaced standard updateDoc with a transaction to prevent race conditions 
      // where the player moving overwrites a DM's simultaneous HP change
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

  const handlePing = async (x, y, type = 'default') => {
    await updateDoc(doc(db, 'campaign', 'battlemap'), {
      ping: { x, y, type, timestamp: Date.now() }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-widest">Tactical View</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Tap your token to see range. Long-press to ping.</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-slate-800 text-slate-400 p-2 rounded-xl border border-slate-700 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {dialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${dialog.type === 'confirm' ? 'text-amber-400' : 'text-red-400'}`}>
              {dialog.type === 'confirm' ? <Zap className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
              {dialog.title}
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
               <button onClick={() => { setDialog({ isOpen: false }); setPendingMove(null); }} className="px-4 py-2 text-slate-400 bg-slate-800 rounded-lg font-bold text-sm">
                 {dialog.type === 'confirm' ? 'Cancel' : 'Understood'}
               </button>
               {dialog.type === 'confirm' && (
                 <button 
                   onClick={() => { executePendingMove(); setDialog({ isOpen: false }); }} 
                   className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md"
                 >
                   Confirm Dash
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden p-2 md:p-8 flex items-center justify-center bg-slate-950">
        {!mapData.isPublished ? (
          <div className="text-center">
            <MapIcon className="w-16 h-16 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">Waiting for DM to reveal map...</p>
          </div>
        ) : (
          <MapGrid 
            mapData={mapData} 
            tokens={tokens} 
            activePlayers={activePlayers}
            activeEnemies={activeEnemies}
            onTileClick={handleTileClick} 
            onTokenClick={handleTokenClick}
            selectedTokenId={charId}
            isDM={false} 
            showMovementRangeFor={showRange ? tokens[charId] : null}
            onPing={handlePing}
          />
        )}
      </div>

      {myToken && (
        <div className="bg-slate-900 border-t border-slate-700 p-4 shrink-0 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dynamicSpeed === 0 ? 'text-red-500' : 'text-slate-400'}`}>Move: {dynamicSpeed}ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dynamicSpeed === 0 ? 'text-red-500' : 'text-slate-400'}`}>Dash: {dynamicSpeed * 2}ft</span>
          </div>
        </div>
      )}
    </div>
  );
}