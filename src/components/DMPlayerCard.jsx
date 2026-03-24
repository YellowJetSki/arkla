import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Heart, Coins, Skull, UserMinus, AlertTriangle, Star, Maximize2, Eye, Brain, Maximize, Sparkles, ArrowUpCircle } from 'lucide-react';
import { CONDITIONS_LIST } from '../data/campaignData';
import CharacterCard from './CharacterCard';
import ImageModal from './shared/ImageModal';
import QuickTraits from './shared/QuickTraits';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const THEMES = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-600', border: 'border-indigo-500/50', ring: 'ring-indigo-500' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-600', border: 'border-emerald-500/50', ring: 'ring-emerald-500' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-600', border: 'border-rose-500/50', ring: 'ring-rose-500' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-600', border: 'border-amber-500/50', ring: 'ring-amber-500' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-600', border: 'border-sky-500/50', ring: 'ring-sky-500' },
};

export default function DMPlayerCard({ charId }) {
  const [char, setChar] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFullSheetOpen, setIsFullSheetOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(''); 

  // FIXED: Local HP Buffer for safe DM typing
  const [displayHp, setDisplayHp] = useState("");
  const [isEditingHp, setIsEditingHp] = useState(false);

  useEffect(() => {
    const charRef = doc(db, 'characters', charId);
    const unsubscribe = onSnapshot(charRef, (docSnap) => {
      if (docSnap.exists()) setChar(docSnap.data());
    });
    return () => unsubscribe();
  }, [charId]);

  const updateField = async (field, value) => {
    if (!char) return;
    const charRef = doc(db, 'characters', charId);
    if (field.startsWith('currency.')) {
      const currencyType = field.split('.')[1];
      await updateDoc(charRef, { [`currency.${currencyType}`]: Number(value) });
    } else {
      await updateDoc(charRef, { [field]: Number(value) });
    }
    
    if (['inventory', 'backstory', 'journal'].includes(field)) {
      setSaveToast('Saved to Cloud');
      setTimeout(() => setSaveToast(''), 2500);
    }
  };

  const submitHpUpdate = async (newHpVal) => {
    if (!char) return; 
    const parsedHp = parseInt(newHpVal, 10);
    const safeHp = isNaN(parsedHp) ? 0 : parsedHp;
    const boundedHp = Math.max(0, Math.min(safeHp, char.maxHp || 10));
    
    let updates = { hp: boundedHp };
    if (boundedHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    await updateField('hp', updates.hp);
    if (updates['deathSaves.successes'] !== undefined) await updateDoc(doc(db, 'characters', charId), updates);
  };

  const adjustHp = async (amount) => {
    if (!char) return;
    const currentHp = char.hp || 0;
    const boundedHp = Math.max(0, Math.min(currentHp + amount, char.maxHp || 10));
    let updates = { hp: boundedHp };
    if (boundedHp > 0 && currentHp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
    }
    await updateField('hp', updates.hp);
    if (updates['deathSaves.successes'] !== undefined) await updateDoc(doc(db, 'characters', charId), updates);
  };

  const handleAddCondition = async (e) => {
    const condition = e.target.value;
    if (!condition || !char) return;
    await updateDoc(doc(db, 'characters', charId), { conditions: arrayUnion(condition) });
    e.target.value = ''; 
  };

  const handleRemoveCondition = async (condition) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', charId), { conditions: arrayRemove(condition) });
  };

  const toggleInspiration = async (e) => {
    e.stopPropagation();
    if (!char) return;
    await updateDoc(doc(db, 'characters', charId), { inspiration: !char.inspiration });
  };

  const updateDeathSaves = async (type, value) => {
    if (!char) return;
    await updateDoc(doc(db, 'characters', charId), { [`deathSaves.${type}`]: value });
  };

  const confirmReset = async () => {
    await deleteDoc(doc(db, 'characters', charId));
    await updateDoc(doc(db, 'campaign', 'main_session'), { unlockedCharacters: arrayRemove(charId) });
    setIsResetModalOpen(false);
  };

  if (!char) return <div className="animate-pulse bg-slate-800 rounded-2xl h-96 border border-slate-700"></div>;

  const activeConditions = char.conditions || [];
  const isUnconscious = (char.hp || 0) <= 0;
  
  const wisMod = Math.floor((char.stats?.WIS - 10) / 2) || 0;
  const passivePerception = 10 + wisMod; 
  
  const hpPercent = Math.max(0, Math.min(100, ((char.hp || 0) / (char.maxHp || 1)) * 100));
  const hpColor = hpPercent > 50 ? 'bg-emerald-500/20' : hpPercent > 20 ? 'bg-yellow-500/20' : 'bg-red-500/30';

  const currentXp = char.exp || 0;
  const nextLevelXp = XP_THRESHOLDS[char.level] || 355000;
  const prevLevelXp = XP_THRESHOLDS[char.level - 1] || 0;
  const xpPercent = Math.max(0, Math.min(100, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  const activeTheme = THEMES[char.theme] || THEMES.indigo;

  return (
    <>
      {saveToast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl border border-emerald-900/50 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {saveToast}
        </div>
      )}

      <ImageModal isOpen={isImageOpen} url={`/${charId}.png`} alt={char.name} onClose={() => setIsImageOpen(false)} />

      <div className={`bg-slate-800 border ${isUnconscious ? 'border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'border-slate-700'} rounded-2xl shadow-xl relative flex flex-col h-full transition-colors overflow-hidden`}>
        
        {/* FIXED: The "Fat Finger" Portrait Trap - Removed button wrapper, restricted to maximize icon */}
        <div className="w-full h-40 md:h-48 relative group shrink-0 overflow-hidden block">
          <div className={`w-full h-full relative ${char.isConcentrating ? `ring-4 ring-inset ${activeTheme.ring} animate-pulse z-20` : ''}`}>
            <img src={`/${charId}.png`} alt={char.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isUnconscious ? 'grayscale' : ''}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }} />
            {char.isConcentrating && <div className={`absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm ${activeTheme.text} px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${activeTheme.border}`}>Concentrating</div>}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent pointer-events-none z-10"></div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setIsImageOpen(true); }} 
            className="absolute top-3 right-3 p-2 bg-slate-900/50 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
            title="View Full Portrait"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>

          {isUnconscious && <div className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-[1px] pointer-events-none z-10"><Skull className="w-12 h-12 text-white drop-shadow-md animate-pulse" /></div>}
        </div>

        <div className="p-5 md:p-6 flex flex-col flex-1 space-y-5">
          
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className={`font-black text-2xl leading-tight break-words ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h3>
                <button onClick={toggleInspiration} className={`shrink-0 transition-colors z-10 relative cursor-pointer ${char.inspiration ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110' : 'text-slate-500 hover:text-yellow-400/50'}`}><Star className="w-6 h-6 fill-current pointer-events-none" /></button>
              </div>
              <p className={`${activeTheme.text} text-base font-bold break-words text-balance w-full mt-1`}>{char.class} • Lvl {char.level}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsFullSheetOpen(true); }} 
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl transition-colors shadow-sm z-10 relative cursor-pointer" 
                title="Open Full Sheet"
              >
                <Maximize2 className="w-5 h-5 pointer-events-none" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsResetModalOpen(true); }} 
                className="p-2.5 bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900/30 hover:border-red-500/50 rounded-xl transition-colors shadow-sm z-10 relative cursor-pointer" 
                title="Kick Player"
              >
                <UserMinus className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
          </div>

          <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner h-10">
            <div className={`absolute left-0 top-0 bottom-0 ${activeTheme.bg} opacity-20 transition-all duration-500`} style={{ width: `${xpPercent}%` }}></div>
            <div className="relative z-10 flex items-center justify-between px-3 h-full">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className={`w-4 h-4 ${activeTheme.text}`} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden sm:block">XP</span>
              </div>
              <div className="flex items-center gap-2 text-white bg-slate-800/50 border border-slate-600 rounded px-2 py-0.5">
                <input 
                  type="number" 
                  value={currentXp} 
                  onChange={(e) => updateField('exp', Number(e.target.value))} 
                  className="w-14 bg-transparent focus:outline-none text-right font-black text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-100" 
                />
                <span className="text-slate-500 font-black text-sm">/</span>
                <span className="w-14 text-left text-slate-400 text-sm font-bold">{nextLevelXp}</span>
              </div>
            </div>
          </div>

          <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner min-h-[64px] flex items-center">
            <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500`} style={{ width: `${hpPercent}%` }}></div>
            <div className="relative z-10 flex items-center justify-between w-full p-3 sm:p-4">
              
              {isUnconscious ? (
                <div className="flex items-center gap-3 sm:gap-6 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-1">PASS</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map(num => <button key={`pass-${num}`} onClick={() => updateDeathSaves('successes', (char.deathSaves?.successes || 0) === num ? num - 1 : num)} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${(char.deathSaves?.successes || 0) >= num ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-800 border-slate-600 hover:border-emerald-500/50'}`} />)}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-700/50"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-1">FAIL</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map(num => <button key={`fail-${num}`} onClick={() => updateDeathSaves('failures', (char.deathSaves?.failures || 0) === num ? num - 1 : num)} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${(char.deathSaves?.failures || 0) >= num ? 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)]' : 'bg-slate-800 border-slate-600 hover:border-red-500/50'}`} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-widest hidden sm:block">Hit Points</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {!isUnconscious && (
                  <button onClick={() => adjustHp(-1)} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">-</button>
                )}
                
                <div className="flex items-center gap-1.5 text-white bg-slate-800/50 border border-slate-600 rounded-lg px-2 py-1 md:py-2">
                  <input 
                    type="number" 
                    value={isEditingHp ? displayHp : (char.hp ?? 0)} 
                    onFocus={() => { setDisplayHp(char.hp ?? 0); setIsEditingHp(true); }}
                    onChange={(e) => setDisplayHp(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    onBlur={(e) => {
                      setIsEditingHp(false);
                      submitHpUpdate(e.target.value);
                    }}
                    className={`w-12 bg-transparent focus:outline-none text-center font-black text-xl md:text-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isUnconscious && !isEditingHp ? 'text-red-400' : ''} ${isEditingHp ? activeTheme.text : ''}`} 
                  />
                  <span className="text-slate-500 font-black text-lg md:text-xl">/</span>
                  <span className="w-12 text-center text-slate-400 text-lg md:text-xl font-bold">{char.maxHp || 10}</span>
                </div>

                {!isUnconscious && (
                  <button onClick={() => adjustHp(1)} className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center border border-slate-600 transition-colors shadow-sm cursor-pointer">+</button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={`bg-slate-900 p-3 sm:p-4 rounded-xl border ${activeTheme.border} flex flex-col justify-center items-center shadow-sm`}>
               <label className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider"><Shield className={`w-4 h-4 ${activeTheme.text}`} /> AC</label>
              <input type="number" defaultValue={char.ac || 10} onBlur={(e) => updateField('ac', e.target.value)} className="w-full bg-transparent border-b border-slate-600 focus:border-indigo-500 focus:outline-none text-white font-black text-center text-2xl sm:text-3xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            
            <div className={`col-span-2 flex flex-col justify-center gap-3 bg-slate-900/50 p-3 sm:p-4 rounded-xl border ${activeTheme.border} text-sm font-bold text-slate-400 shadow-sm`}>
              <div className="flex items-center justify-between px-2"><span className="flex items-center gap-2"><Eye className={`w-4 h-4 ${activeTheme.text}`}/> Perception</span><span className="text-white text-base sm:text-lg">{passivePerception}</span></div>
              <div className="border-t border-slate-700/50"></div>
              <div className="flex items-center justify-between px-2"><span className="flex items-center gap-2"><Brain className={`w-4 h-4 ${activeTheme.text}`}/> Insight</span><span className="text-white text-base sm:text-lg">{passivePerception}</span></div>
            </div>
          </div>

          <QuickTraits features={char.features || []} />

          {activeConditions.length > 0 && (
            <div className="bg-slate-900/50 p-4 sm:p-5 rounded-xl border border-fuchsia-900/30 shadow-inner animate-in fade-in duration-300">
              <label className="flex items-center gap-2 text-sm text-fuchsia-400 font-bold mb-3">
                <AlertCircle className="w-4 h-4" /> Active Conditions
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activeConditions.map(cond => (
                  <div key={cond} className="bg-fuchsia-900/40 border border-fuchsia-700/50 text-fuchsia-300 text-xs uppercase font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm group">
                    {cond} 
                    <button 
                      onClick={() => handleRemoveCondition(cond)} 
                      className="text-fuchsia-500 hover:text-fuchsia-300 transition-colors focus:outline-none ml-1 cursor-pointer"
                      title="Clear Condition"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {isResetModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm h-[100dvh]" onClick={(e) => e.stopPropagation()}>
          <div className="bg-slate-800 border border-red-900/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h2 className="text-xl font-bold">Reset {char.name}?</h2>
            </div>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">This will instantly kick the player to the login screen and wipe their live session data.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsResetModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmReset} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-md transition-colors">Yes, Reset</button>
            </div>
          </div>
        </div>
      )}
      
      {isFullSheetOpen && <CharacterCard currentUser={{ charId }} isDM={true} onClose={() => setIsFullSheetOpen(false)} />}
    </>
  );
}