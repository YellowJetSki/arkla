import { useState } from 'react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
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
      const batch = writeBatch(db);
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

      batch.update(charRef, updates);

      const mapDoc = await getDoc(mapRef);
      if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
        batch.update(mapRef, { [`tokens.${charId}.hp`]: previewHp });
      }
      
      await batch.commit();

      setTimeout(() => {
        onClose();
      }, 2000); 
      
    } catch (error) {
      console.error("Short Rest Failed:", error);
      setIsResting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      
      {/* Immersive Campfire Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-md shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Solid Color Header */}
        <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-orange-600 relative z-10">
          <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest">
            <Flame className="w-5 h-5 animate-pulse" /> Camp
          </h2>
          {!isResting && (
            <button onClick={onClose} className="text-slate-950 bg-orange-500 hover:bg-orange-400 transition-colors p-1.5 rounded-lg border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-4 h-4 font-black" />
            </button>
          )}
        </div>

        <div className="p-6 relative z-10">
          {isResting ? (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-orange-500 mb-4 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Rested & Ready</h3>
              <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Health and Hit Dice updated.</p>
              
              {shortRestResources.length > 0 && (
                <div className="bg-slate-950 border-2 border-orange-900 rounded-xl p-4 w-full text-left shadow-inner">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">Resources Recovered:</span>
                  <ul className="text-sm font-bold text-slate-300 space-y-1.5">
                    {shortRestResources.map(r => <li key={r.name} className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-500"/> {r.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              
              <div className="text-center mb-6">
                <Tent className="w-12 h-12 text-orange-500 mx-auto mb-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Catch Your Breath</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                  You have <strong className="text-orange-500 text-sm">{currentDice}</strong> Hit Dice ({diceType}) available. Grab your dice!
                </p>
              </div>

              <div className="bg-slate-950 border-2 border-orange-900 p-4 rounded-xl flex items-start gap-3 mb-6 shadow-inner">
                <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-wider leading-relaxed">
                  For each Hit Die rolled, add your Constitution modifier (<strong className="text-white text-sm">{formattedConMod}</strong>) to calculate healing.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-indigo-400" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-300">Dice Spent</span>
                  </div>
                  <input 
                    type="number" 
                    value={spentDice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSpentDice(e.target.value)}
                    placeholder="0"
                    max={currentDice}
                    min="0"
                    className="w-16 md:w-20 bg-slate-950 border-2 border-slate-800 rounded-lg px-2 py-2 text-white font-black text-lg md:text-xl text-center focus:outline-none focus:border-orange-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  />
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldPlus className="w-5 h-5 text-orange-500" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-300">HP Regained</span>
                  </div>
                  <input 
                    type="number" 
                    value={hpRegained}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setHpRegained(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-16 md:w-20 bg-slate-950 border-2 border-slate-800 rounded-lg px-2 py-2 text-white font-black text-lg md:text-xl text-center focus:outline-none focus:border-orange-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-slate-950 pt-6">
                <div className="flex flex-col items-center sm:items-start bg-slate-950 px-4 py-2 rounded-xl border-2 border-slate-900 shadow-inner w-full sm:w-auto">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">New HP</span>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-xl md:text-2xl font-black text-white leading-none">{previewHp} <span className="text-slate-600 text-sm">/ {maxHp}</span></span>
                  </div>
                </div>
                
                <button 
                  onClick={handleConfirmRest} 
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-slate-950 font-black uppercase tracking-widest text-xs md:text-sm px-6 py-4 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
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