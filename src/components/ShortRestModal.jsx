import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Tent, X, Heart, ShieldPlus, CheckCircle2, Dices, Info, Sparkles } from 'lucide-react';

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
      await runTransaction(db, async (transaction) => {
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

        // 1. Update the character sheet
        transaction.update(charRef, updates);

        // 2. Sync HP to the Battle Map token
        const mapDoc = await transaction.get(mapRef);
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          const mapTokens = mapDoc.data().tokens;
          mapTokens[charId].hp = previewHp;
          transaction.update(mapRef, { tokens: mapTokens });
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh]">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col relative overflow-hidden">
        
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/90 relative z-10">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Tent className="w-5 h-5" /> Short Rest
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-2xl font-black text-white mb-2">Rested & Ready</h3>
              <p className="text-sm text-slate-400 mb-4">Your health and Hit Dice have been updated.</p>
              
              {shortRestResources.length > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3 w-full text-left">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-2">Resources Recovered:</span>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    {shortRestResources.map(r => <li key={r.name} className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-emerald-400"/> {r.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white mb-2">Catch Your Breath</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  You have <strong className="text-emerald-400">{currentDice}</strong> Hit Dice ({diceType}) available to spend. Grab your physical dice!
                </p>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-lg flex items-start gap-3 mb-6">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-100/80 leading-relaxed">
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
                    onChange={(e) => setSpentDice(e.target.value)}
                    placeholder="0"
                    max={currentDice}
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-black text-xl text-center focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldPlus className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-slate-300">HP Regained</span>
                  </div>
                  <input 
                    type="number" 
                    value={hpRegained}
                    onChange={(e) => setHpRegained(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-black text-xl text-center focus:outline-none focus:border-emerald-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/50 pt-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New HP</span>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-xl font-black text-white">{previewHp} <span className="text-slate-500 text-sm">/ {maxHp}</span></span>
                  </div>
                </div>
                
                <button 
                  onClick={handleConfirmRest} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
                >
                  Confirm Rest
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}