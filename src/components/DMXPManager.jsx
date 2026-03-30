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
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0 relative z-10">
          <h2 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm">
            <Star className="w-5 h-5" /> Grant Experience
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 relative z-10 space-y-6">
          
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-5 shadow-inner text-center">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">XP Amount</label>
            <input 
              type="number" 
              value={xpAmount} 
              onFocus={(e) => e.target.select()}
              onChange={(e) => setXpAmount(e.target.value)} 
              placeholder="0" 
              className="w-full bg-transparent text-white font-black text-4xl text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b-2 border-slate-700 focus:border-amber-500 pb-2 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => handleGrantXP(true)} 
              disabled={isSubmitting || !xpAmount}
              className="w-full bg-amber-900/40 border border-amber-500/50 hover:bg-amber-600 disabled:opacity-50 text-amber-400 hover:text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Divide Evenly Among Party
            </button>
            <button 
              onClick={() => handleGrantXP(false)} 
              disabled={isSubmitting || !xpAmount}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" /> Grant Full Amount to Everyone
            </button>
          </div>

          {partyData.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mt-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Current Party Status</h4>
               <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                 {partyData.map(p => {
                    const threshold = XP_THRESHOLDS[p.level] || XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
                    const percent = Math.min(100, ((p.exp || 0) / threshold) * 100);
                    return (
                      <div key={p.id} className="bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {p.name} {p.levelUpPending && <ArrowUpCircle className="w-3 h-3 text-amber-400 animate-pulse"/>}
                          </span>
                          <span className="text-amber-400 font-bold">{p.exp || 0} <span className="text-slate-500">/ {threshold}</span></span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: `${percent}%` }}></div>
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