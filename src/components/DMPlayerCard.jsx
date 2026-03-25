import { useState, useEffect } from 'react';
import { doc, onSnapshot, writeBatch, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Eye, Maximize2, UserX, ChevronDown, ChevronUp, Sword, Zap, Sparkles } from 'lucide-react';
import CharacterCard from './CharacterCard';

export default function DMPlayerCard({ charId }) {
  const [char, setChar] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [kickConfirm, setKickConfirm] = useState(false); 
  const [showSummary, setShowSummary] = useState(false);
  
  const [activeSpell, setActiveSpell] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    if (!charId) return;

    const charRef = doc(db, 'characters', charId);
    const unsub = onSnapshot(charRef, (docSnap) => {
      if (docSnap.exists()) setChar(docSnap.data());
    });
    return () => unsub();
  }, [charId]);

  const handleKickPlayer = async () => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'campaign', 'main_session'), { unlockedCharacters: arrayRemove(charId) });
      batch.update(doc(db, 'characters', charId), { hasCompletedTutorial: false });
      await batch.commit();
    } catch (error) {
      console.error("Failed to kick player:", error);
    }
  };

  if (!char) return null;

  const hpPercent = Math.max(0, Math.min(100, ((char.hp || 0) / (char.maxHp || 1)) * 100));
  const hpColor = hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';
  const isUnconscious = (char.hp || 0) <= 0;
  
  // REQ 8: Correct Passive Perception Calculation
  const wisScore = char.stats?.WIS || 10;
  const wisMod = Math.floor((wisScore - 10) / 2);
  const proficiencyBonus = Math.ceil(((char.level || 1) / 4) + 1);
  const hasPerception = (char.proficiencies?.skills || '').toLowerCase().includes('perception');
  const passivePerception = 10 + wisMod + (hasPerception ? proficiencyBonus : 0);

  const bonusActions = (char.features || []).filter(f => f.desc.toLowerCase().includes('bonus action'));
  const reactions = (char.features || []).filter(f => f.desc.toLowerCase().includes('reaction'));
  
  const passives = (char.features || []).filter(f => 
    !f.desc.toLowerCase().includes('bonus action') && 
    !f.desc.toLowerCase().includes('reaction')
  );

  return (
    <>
      {kickConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-red-400 flex items-center gap-2">
              <UserX className="w-5 h-5"/> Kick Player?
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to kick <strong>{char.name}</strong> from the active session? This will also reset their tutorial status.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setKickConfirm(false)} className="px-4 py-2 text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={() => { handleKickPlayer(); setKickConfirm(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 transition-colors text-white rounded-lg font-bold text-sm">Kick Player</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-md flex flex-col relative transition-all hover:border-indigo-500/30">
        {isUnconscious && <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-10" />}
        
        <div className="flex items-center gap-4 p-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-700 relative shadow-inner">
            <img src={`/${charId}.png`} alt={char.name} className={`w-full h-full object-cover object-top ${isUnconscious ? 'grayscale' : ''}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} />
            {char.tempHp > 0 && <div className="absolute bottom-0 right-0 bg-blue-600 border-t border-l border-blue-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-tl-lg shadow-lg">+{char.tempHp}</div>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-black truncate text-sm sm:text-base ${isUnconscious ? 'text-red-400' : 'text-white'}`}>{char.name}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowSummary(!showSummary)} className="text-slate-400 hover:text-amber-400 p-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors shadow-sm" title="Toggle Cheat Sheet">
                  {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={() => setKickConfirm(true)} className="text-slate-400 hover:text-red-400 p-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-red-500/50 transition-colors shadow-sm" title="Kick from Session">
                  <UserX className="w-4 h-4" />
                </button>
                <button onClick={() => setIsExpanded(true)} className="text-slate-400 hover:text-indigo-400 p-1.5 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition-colors shadow-sm" title="Open Full Sheet">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner">
                <Shield className="w-3 h-3 text-indigo-400" /> <span className="font-bold">{char.ac || 10}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-inner">
                <Eye className="w-3 h-3 text-emerald-400" /> <span className="font-bold">PP: {passivePerception}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="h-5 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative flex items-center justify-center shadow-inner">
            <div className={`absolute left-0 top-0 bottom-0 ${hpColor} transition-all duration-500 opacity-80`} style={{ width: `${hpPercent}%` }}></div>
            <span className="relative z-10 text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-widest">{char.hp} / {char.maxHp} HP</span>
          </div>
        </div>

        {showSummary && (
          <div className="bg-slate-950 border-t border-slate-800 p-3 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
            
            <div className="mb-3">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1.5"><Sword className="w-3 h-3" /> Attacks / Actions</h4>
              <div className="space-y-1.5">
                {(char.attacks || []).map((atk, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="font-bold text-slate-300 truncate">{atk.name}</span>
                    <span className="text-slate-400 font-mono shrink-0">{atk.hit} • {atk.damage}</span>
                  </div>
                ))}
                {(!char.attacks || char.attacks.length === 0) && <p className="text-[10px] text-slate-500 italic">No weapon attacks.</p>}
              </div>
            </div>

            {(bonusActions.length > 0 || reactions.length > 0) && (
              <div className="mb-3">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 mb-1.5"><Zap className="w-3 h-3" /> Quick Features</h4>
                <div className="space-y-1.5">
                  {bonusActions.map((feat, i) => (
                    <div key={`ba-${i}`} className="text-xs bg-slate-900 p-1.5 rounded border border-slate-800">
                      <span className="font-bold text-amber-300 mr-2">Bonus:</span><span className="text-slate-400">{feat.name}</span>
                    </div>
                  ))}
                  {reactions.map((feat, i) => (
                    <div key={`re-${i}`} className="text-xs bg-slate-900 p-1.5 rounded border border-slate-800">
                      <span className="font-bold text-purple-300 mr-2">Reaction:</span><span className="text-slate-400">{feat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passives.length > 0 && (
              <div className="mb-3">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1.5"><Eye className="w-3 h-3" /> Passives & Senses</h4>
                <div className="flex flex-wrap gap-1">
                  {passives.map((feat, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveFeature(activeFeature === i ? null : i)} 
                      className={`text-[10px] ${activeFeature === i ? 'bg-emerald-600 text-white' : 'bg-emerald-950/40 text-emerald-300'} border border-emerald-900/50 px-1.5 py-0.5 rounded truncate max-w-[120px] transition-colors`}
                    >
                      {feat.name}
                    </button>
                  ))}
                </div>
                {activeFeature !== null && (
                  <div className="mt-1.5 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded text-xs text-emerald-200 animate-in fade-in slide-in-from-top-1 whitespace-pre-wrap">
                    {passives[activeFeature].desc}
                  </div>
                )}
              </div>
            )}

            {char.spells && char.spells.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-1.5"><Sparkles className="w-3 h-3" /> Magic Arsenal</h4>
                <div className="flex flex-wrap gap-1">
                  {char.spells.map((spell, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveSpell(activeSpell === i ? null : i)} 
                      className={`text-[10px] ${activeSpell === i ? 'bg-indigo-600 text-white' : 'bg-indigo-950/40 text-indigo-300'} border border-indigo-900/50 px-1.5 py-0.5 rounded truncate max-w-[120px] transition-colors`}
                    >
                      {spell.name}
                    </button>
                  ))}
                </div>
                {activeSpell !== null && (
                  <div className="mt-1.5 bg-indigo-950/40 border border-indigo-500/30 p-2 rounded text-xs text-indigo-200 animate-in fade-in slide-in-from-top-1 whitespace-pre-wrap">
                    {char.spells[activeSpell].desc}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {isExpanded && <CharacterCard currentUser={{ charId }} onLogout={() => setIsExpanded(false)} isDM={true} onClose={() => setIsExpanded(false)} />}
    </>
  );
}