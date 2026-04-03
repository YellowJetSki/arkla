import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Star, X, Users, Award, ArrowUpCircle } from 'lucide-react';

const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];

export default function DMXPManager({ activePlayers, onClose }) {
  const [xpAmount, setXpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partyData, setPartyData] = useState([]);

  useEffect(() => {
    const fetchPartyData = async () => {
      const data = [];
      for (const id of activePlayers) {
        const snap = await getDoc(doc(db, 'characters', id));
        if (snap.exists()) {
          data.push({ id, ...snap.data() });
        }
      }
      setPartyData(data);
    };
    fetchPartyData();
  }, [activePlayers]);

  const handleGrantXP = async (divideEvenly) => {
    const amount = parseInt(xpAmount, 10);
    if (isNaN(amount) || amount <= 0 || partyData.length === 0) return;

    setIsSubmitting(true);
    const batch = writeBatch(db);
    const xpPerPlayer = divideEvenly ? Math.floor(amount / partyData.length) : amount;

    partyData.forEach(player => {
      const currentXP = player.exp || 0;
      const currentLevel = player.level || 1;
      const newXP = currentXP + xpPerPlayer;
      
      let levelUpPending = player.levelUpPending || false;
      const thresholdForNextLevel = XP_THRESHOLDS[currentLevel];
      
      if (thresholdForNextLevel && newXP >= thresholdForNextLevel) {
        levelUpPending = true;
      }

      batch.update(doc(db, 'characters', player.id), { 
        exp: newXP,
        levelUpPending: levelUpPending
      });
    });

    try {
      await batch.commit();
      setXpAmount('');
      onClose();
    } catch (error) {
      console.error("Error granting XP:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-md shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Solid Color Header */}
        <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-amber-500 rounded-t-xl shrink-0 relative z-10">
          <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
            <Star className="w-6 h-6 font-black" /> Grant Experience
          </h2>
          <button onClick={onClose} className="text-slate-950 hover:bg-amber-300 bg-amber-400 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
            <X className="w-5 h-5 font-black" />
          </button>
        </div>

        <div className="p-6 relative z-10 space-y-6 bg-slate-950">
          
          <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Total XP to Grant</label>
            <input 
              type="number" 
              value={xpAmount} 
              onFocus={(e) => e.target.select()}
              onChange={(e) => setXpAmount(e.target.value)} 
              placeholder="0" 
              className="w-full bg-slate-950 text-amber-400 font-black text-5xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-2 border-slate-900 rounded-xl py-4 focus:border-amber-500 transition-colors shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <button 
              onClick={() => handleGrantXP(true)} 
              disabled={isSubmitting || !xpAmount}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 text-xs"
            >
              <Users className="w-5 h-5" /> Divide Evenly Among Party
            </button>
            <button 
              onClick={() => handleGrantXP(false)} 
              disabled={isSubmitting || !xpAmount}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-500 hover:text-amber-400 font-black uppercase tracking-widest py-4 rounded-xl transition-all border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 text-xs"
            >
              <Award className="w-5 h-5" /> Grant Full Amount to Everyone
            </button>
          </div>

          {partyData.length > 0 && (
            <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 mt-8 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b-2 border-slate-950 pb-2">Current Party Status</h4>
               <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                 {partyData.map(p => {
                    const threshold = XP_THRESHOLDS[p.level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
                    const percent = Math.min(100, ((p.exp || 0) / threshold) * 100);
                    return (
                      <div key={p.id} className="bg-slate-950 p-3 rounded-xl border-2 border-slate-900 flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-white uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                            {p.name} {p.levelUpPending && <ArrowUpCircle className="w-4 h-4 text-amber-500 animate-pulse"/>}
                          </span>
                          <span className="text-amber-500 font-black text-sm">{p.exp || 0} <span className="text-slate-600 text-xs">/ {threshold}</span></span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                           <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                 })}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}