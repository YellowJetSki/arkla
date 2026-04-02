import { useState } from 'react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowUpCircle, X, Sparkles, Loader2, Dices, ShieldPlus } from 'lucide-react';

export default function LevelUpModal({ char, charId, onClose }) {
  const [isNotifying, setIsNotifying] = useState(false);
  const [choice, setChoice] = useState('average'); // 'average' or 'roll'
  const [rollValue, setRollValue] = useState('');

  const currentLevel = char.level || 1;
  const newLevel = currentLevel + 1;
  
  const hdType = char.hitDice?.type || 'd8';
  const hdMax = parseInt(hdType.replace('d', ''), 10) || 8;
  const avgHp = Math.floor(hdMax / 2) + 1;
  const conMod = Math.floor(((char.stats?.CON || 10) - 10) / 2);
  const formattedConMod = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  const hpGain = choice === 'average' ? (avgHp + conMod) : ((parseInt(rollValue, 10) || 0) + conMod);
  const finalHpGain = Math.max(1, hpGain); // Minimum of 1 HP gained per level by RAW

  const handleNotifyDM = async () => {
    setIsNotifying(true);
    try {
      const batch = writeBatch(db);
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');

      const newHpTotal = (char.hp || 10) + finalHpGain;

      const updates = {
        levelUpPending: true,
        level: newLevel,
        maxHp: (char.maxHp || 10) + finalHpGain,
        hp: newHpTotal,
        'hitDice.current': (char.hitDice?.current || 1) + 1,
        'hitDice.max': (char.hitDice?.max || 1) + 1
      };

      // Stage character updates
      batch.update(charRef, updates);

      // Safely sync to map token
      const mapDoc = await getDoc(mapRef);
      if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
        batch.update(mapRef, { [`tokens.${charId}.hp`]: newHpTotal });
      }

      // Commit all changes simultaneously
      await batch.commit();
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
            <ArrowUpCircle className="w-6 h-6" /> Level {newLevel} Ascension
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 relative z-10 space-y-6">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] mb-3" />
            <h3 className="text-2xl font-black text-white mb-2">Power Brews Within!</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Determine your new Maximum HP. You can either take the safe 5e average, or test your luck by rolling your Hit Die.
            </p>
          </div>

          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 shadow-inner">
            <button 
              onClick={() => setChoice('average')} 
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${choice === 'average' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Take Average
            </button>
            <button 
              onClick={() => setChoice('roll')} 
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${choice === 'roll' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Roll Dice
            </button>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-inner space-y-4">
            {choice === 'average' ? (
              <div className="flex justify-between items-center animate-in fade-in">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><ShieldPlus className="w-4 h-4 text-amber-400"/> Average ({avgHp}) + CON ({formattedConMod})</span>
                <span className="text-2xl font-black text-emerald-400">+{finalHpGain} HP</span>
              </div>
            ) : (
              <div className="flex items-center gap-4 animate-in fade-in">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Dices className="w-3 h-3 text-amber-400"/> Roll {hdType}</label>
                  <input 
                    type="number" 
                    max={hdMax}
                    min={1}
                    value={rollValue}
                    onChange={(e) => setRollValue(e.target.value)}
                    placeholder={`1-${hdMax}`}
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-black text-center focus:outline-none focus:border-amber-500 shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-center pt-5">
                  <span className="text-lg font-black text-slate-500">{formattedConMod}</span>
                </div>
                <div className="flex-1 pt-5 text-right">
                  <span className="text-2xl font-black text-emerald-400">+{finalHpGain} HP</span>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleNotifyDM} 
            disabled={isNotifying || (choice === 'roll' && (!rollValue || rollValue < 1 || rollValue > hdMax))}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:shadow-none"
          >
            {isNotifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Level & Notify DM'}
          </button>
        </div>
      </div>
    </div>
  );
}