import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowUpCircle, X, Sparkles, Loader2 } from 'lucide-react';

export default function LevelUpModal({ char, charId, onClose }) {
  const [isNotifying, setIsNotifying] = useState(false);

  const handleNotifyDM = async () => {
    setIsNotifying(true);
    try {
      await updateDoc(doc(db, 'characters', charId), {
        levelUpPending: true
      });
      onClose();
    } catch (err) {
      console.error("Error notifying DM:", err);
      setIsNotifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-500">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-600/20 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse"></div>

      <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/50 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-black text-amber-400 flex items-center gap-2 uppercase tracking-widest">
            <ArrowUpCircle className="w-6 h-6" /> Ascension
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 text-center relative z-10 space-y-6">
          <Sparkles className="w-16 h-16 text-amber-400 mx-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div>
            <h3 className="text-3xl font-black text-white mb-2">Power Brews Within!</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              You feel a surge of energy and new abilities awakening within you. A notification has been sent to the DM to update your sheet with your new level, features, and mastery.
            </p>
          </div>
          
          <button 
            onClick={handleNotifyDM} 
            disabled={isNotifying}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
          >
            {isNotifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acknowledge & Notify DM'}
          </button>
        </div>
      </div>
    </div>
  );
}