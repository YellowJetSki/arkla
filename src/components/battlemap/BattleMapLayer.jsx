import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Map as MapIcon, X, AlertTriangle, Info, Zap } from 'lucide-react';
import MapGrid from './MapGrid';

export default function BattleMapLayer({ char, charId, isOpen, onClose }) {
  const [mapData, setMapData] = useState({ imageUrl: '', cols: 20, rows: 15, isPublished: false });
  const [tokens, setTokens] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

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
      }
    });
    return () => unsub();
  }, []);

  const handleTileClick = (targetX, targetY) => {
    const myToken = tokens[charId];
    
    if (!myToken) {
      setDialog({
        isOpen: true,
        title: 'Token Not Placed',
        message: 'The DM has not placed your character on the map yet.',
        type: 'alert'
      });
      return;
    }

    const dx = Math.abs(targetX - myToken.x);
    const dy = Math.abs(targetY - myToken.y);
    const distance = Math.max(dx, dy) * 5; 

    if (distance === 0) return;

    const baseSpeed = myToken.speed || 30;

    if (distance > baseSpeed * 2) {
      setDialog({
        isOpen: true,
        title: 'Out of Range',
        message: `That tile is ${distance}ft away. Even with a Dash, you can only reach ${baseSpeed * 2}ft.`,
        type: 'alert'
      });
      return;
    }

    if (distance > baseSpeed) {
      setDialog({
        isOpen: true,
        title: 'Dash Required',
        message: `Moving ${distance}ft requires your Action to Dash. Proceed?`,
        type: 'confirm',
        onConfirm: () => moveToken(targetX, targetY)
      });
      return;
    }

    moveToken(targetX, targetY);
  };

  const moveToken = async (newX, newY) => {
    try {
      const updatedTokens = {
        ...tokens,
        [charId]: { ...tokens[charId], x: newX, y: newY }
      };
      await updateDoc(doc(db, 'campaign', 'battlemap'), { tokens: updatedTokens });
    } catch (error) {
      console.error("Failed to move token:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-widest">Tactical View</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Tap to move your character</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-slate-800 text-slate-400 p-2 rounded-xl border border-slate-700 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* DASHBOARD MODAL */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${dialog.type === 'confirm' ? 'text-amber-400' : 'text-red-400'}`}>
              {dialog.type === 'confirm' ? <Zap className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
              {dialog.title}
            </h3>
            <p className="text-sm text-slate-300 mb-6">{dialog.message}</p>
            <div className="flex gap-3 justify-end">
               <button onClick={() => setDialog({ isOpen: false })} className="px-4 py-2 text-slate-400 bg-slate-800 rounded-lg font-bold text-sm">
                 {dialog.type === 'confirm' ? 'Cancel' : 'Understood'}
               </button>
               {dialog.type === 'confirm' && (
                 <button 
                   onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); setDialog({ isOpen: false }); }} 
                   className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-sm"
                 >
                   Confirm Dash
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* MAP AREA */}
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
            onTileClick={handleTileClick} 
            selectedTokenId={charId}
            isDM={false} 
          />
        )}
      </div>

      {/* FOOTER STATS */}
      {tokens[charId] && (
        <div className="bg-slate-900 border-t border-slate-700 p-4 shrink-0 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed: {tokens[charId].speed}ft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos: {tokens[charId].x}, {tokens[charId].y}</span>
          </div>
        </div>
      )}
    </div>
  );
}