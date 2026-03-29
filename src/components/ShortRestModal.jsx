import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Tent, X, Heart, ShieldPlus, CheckCircle2, Dices, Info, Sparkles, Flame } from 'lucide-react';

export default function ShortRestModal({ char, charId, onClose }) {
  const [isResting, setIsResting] = useState(false);
  const [spentDice, setSpentDice] = useState('');
  const [hpRegained, setHpRegained] = useState('');

  const currentHp = char.hp ?? 0;
  const maxHp = char.maxHp || 10;
  const currentDice = char.hitDice?.current ?? char.level;
  const diceType = char.hitDice?.type || 'd8';
  
  const conMod = Math.floor(((char.stats?.CON || 10) - 10) / 2);
  const formattedConMod = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  const previewHp = Math.min(maxHp, currentHp + (parseInt(hpRegained, 10) || 0));

  const shortRestResources = (char.resources || []).filter(r => r.recharge === 'short' || (r.desc || '').toLowerCase().includes('short rest'));

  const handleConfirmRest = async () => {
    setIsResting(true);

    const safeSpent = parseInt(spentDice, 10) || 0;
    const boundedSpent = Math.max(0, Math.min(safeSpent, currentDice));
    
    try {
      const charRef = doc(db, 'characters', charId);
      const mapRef = doc(db, 'campaign', 'battlemap');

      const updates = {
        hp: previewHp,
        'hitDice.current': currentDice - boundedSpent,
      };

      if (previewHp > 0 && currentHp === 0) {
        updates['deathSaves.successes'] = 0;
        updates['deathSaves.failures'] = 0;
      }

      if (shortRestResources.length > 0) {
        const updatedResources = char.resources.map(res => {
          if (shortRestResources.some(sr => sr.name === res.name)) {
            return { ...res, current: res.max };
          }
          return res;
        });
        updates.resources = updatedResources;
      }

      updateDoc(charRef, updates).catch(console.error);

      getDoc(mapRef).then(mapDoc => {
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          updateDoc(mapRef, { [`tokens.${charId}.hp`]: previewHp }).catch(console.error);
        }
      });
      
      setTimeout(() => {
        onClose();
      }, 2000); 
      
    } catch (error) {
      console.error("Short Rest Failed:", error);
      setIsResting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl h-[100dvh] overflow-hidden animate-in fade-in duration-700">
      
      {/* Immersive Campfire Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-orange-500/30 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(234,88,12,0.15)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 relative z-10">
          <h2 className="text-xl font-black text-orange-400 flex items-center gap-2 uppercase tracking-widest">
            <Flame className="w-5 h-5 animate-pulse" /> Camp
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 hover:border-orange-500/50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-orange-400 mb-4 drop-shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
              <h3 className="text-2xl font-black text-white mb-2">Rested & Ready</h3>
              <p className="text-sm text-slate-400 mb-4">Your health and Hit Dice have been updated.</p>
              
              {shortRestResources.length > 0 && (
                <div className="bg-orange-950/30 border border-orange-900/50 rounded-xl p-3 w-full text-left">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-2">Resources Recovered:</span>
                  <ul className="text-sm text-orange-200/80 space-y-1">
                    {shortRestResources.map(r => <li key={r.name} className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-orange-400"/> {r.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              
              <div className="text-center mb-6">
                <Tent className="w-12 h-12 text-orange-500/50 mx-auto mb-3" />
                <h3 className="text-2xl font-black text-white mb-2">Catch Your Breath</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  You have <strong className="text-orange-400">{currentDice}</strong> Hit Dice ({diceType}) available to spend. Grab your physical dice!
                </p>
              </div>

              <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-inner">
                <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-100/80 leading-relaxed">
                  For each Hit Die you roll, add your Constitution modifier (<strong className="text-white font-black">{formattedConMod}</strong>) to the result to calculate your healing.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-300">Dice Spent</span>
                  </div>
                  <input 
                    type="number" 
                    value={spentDice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSpentDice(e.target.value)}
                    placeholder="0"
                    max={currentDice}
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white font-black text-xl text-center focus:outline-none focus:border-orange-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  />
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldPlus className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-bold text-slate-300">HP Regained</span>
                  </div>
                  <input 
                    type="number" 
                    value={hpRegained}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setHpRegained(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-white font-black text-xl text-center focus:outline-none focus:border-orange-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/50 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New HP</span>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-2xl font-black text-white">{previewHp} <span className="text-slate-500 text-sm font-bold">/ {maxHp}</span></span>
                  </div>
                </div>
                
                <button 
                  onClick={handleConfirmRest} 
                  className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)] transition-all flex items-center gap-2"
                >
                  Rest by the Fire
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}