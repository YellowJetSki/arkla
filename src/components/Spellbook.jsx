import { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Flame, Sparkles, BookOpen, Target, ShieldAlert, Wand2, Search, Plus, Shield, Settings, BrainCircuit, Hammer, X, Filter } from 'lucide-react';
import CollapsibleSection from './shared/CollapsibleSection';
import SpellDiscovery from './SpellDiscovery';

const SPELL_FILTERS = ['All', 'Cantrips', 'Leveled', 'Concentration', 'Action', 'Bonus', 'Reaction'];

export default function Spellbook({ char, charId, isDM }) {
  const [showSearch, setShowSearch] = useState(false);
  const [isEditingSlots, setIsEditingSlots] = useState(false); 
  const [isForgingSpell, setIsForgingSpell] = useState(false);
  const [customSpell, setCustomSpell] = useState({ name: '', level: 0, castTime: '1 Action', desc: '' });
  
  // NEW: Smart Spell Filtering State
  const [activeFilter, setActiveFilter] = useState('All');

  const spellSlots = char.spellSlots || {};
  const spells = char.spells || [];

  const handleSlotToggle = async (level, currentIndex, max) => {
    if (isDM) return; 
    const currentAmount = spellSlots[level]?.current || 0;
    let newAmount;
    if (currentIndex < currentAmount) {
      newAmount = currentAmount - 1; 
    } else {
      newAmount = currentAmount + 1; 
    }
    const updatedSlots = { ...spellSlots, [level]: { ...spellSlots[level], current: newAmount, max: max } };
    await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
  };

  const handleQuickCast = async (level) => {
    if (isDM || level === 0) return;
    const currentAmount = spellSlots[level]?.current || 0;
    if (currentAmount > 0) {
      const updatedSlots = { 
        ...spellSlots, 
        [level]: { ...spellSlots[level], current: currentAmount - 1 } 
      };
      await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
    }
  };

  const toggleConcentration = async () => {
    if (isDM) return;
    await updateDoc(doc(db, 'characters', charId), { isConcentrating: !char.isConcentrating });
  };

  const addSpellToGrimoire = async (newSpell) => {
    await updateDoc(doc(db, 'characters', charId), {
      spells: arrayUnion(newSpell)
    });
  };

  const handleForgeCustomSpell = async (e) => {
    e.preventDefault();
    if (!customSpell.name || !customSpell.desc) return;
    
    await addSpellToGrimoire({
      name: customSpell.name,
      level: Number(customSpell.level),
      castTime: customSpell.castTime,
      desc: customSpell.desc
    });
    
    setCustomSpell({ name: '', level: 0, castTime: '1 Action', desc: '' });
    setIsForgingSpell(false);
  };

  const updateSlotMax = async (level, newMax) => {
    const numMax = parseInt(newMax) || 0;
    const updatedSlots = { ...spellSlots };
    
    if (numMax > 0) {
      updatedSlots[level] = { 
        current: Math.min(updatedSlots[level]?.current || 0, numMax), 
        max: numMax 
      };
    } else {
      delete updatedSlots[level]; 
    }
    
    await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
  };

  // NEW: Filtering Engine
  const filteredSpells = spells.filter(spell => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Cantrips') return spell.level === 0;
    if (activeFilter === 'Leveled') return spell.level > 0;
    if (activeFilter === 'Concentration') return spell.desc.toLowerCase().includes('concentration');
    if (activeFilter === 'Action') return (spell.castTime || '').toLowerCase().includes('1 action');
    if (activeFilter === 'Bonus') return (spell.castTime || '').toLowerCase().includes('bonus action');
    if (activeFilter === 'Reaction') return (spell.castTime || '').toLowerCase().includes('reaction');
    return true;
  });

  const groupedSpells = filteredSpells.reduce((acc, spell) => {
    const lvl = spell.level === 0 ? 'Cantrips' : `Level ${spell.level}`;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(spell);
    return acc;
  }, {});

  const hasSpellStats = char.spellSave || char.spellAttack;

  return (
    <div className="space-y-6">
      
      {hasSpellStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-fuchsia-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-fuchsia-400"/> Save DC</span>
            <span className="text-xl font-black text-white">{char.spellSave}</span>
          </div>
          <div className="bg-slate-900 border border-fuchsia-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Target className="w-4 h-4 text-fuchsia-400"/> Attack</span>
            <span className="text-xl font-black text-white">{char.spellAttack}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Flame className="w-5 h-5 text-fuchsia-400" /> Spell Slots</h3>
          {!isDM && (
            <button 
              onClick={() => setIsEditingSlots(!isEditingSlots)} 
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${isEditingSlots ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'bg-slate-900 border-slate-700 text-fuchsia-400 hover:text-fuchsia-300 hover:bg-slate-700'}`}
            >
              <Settings className="w-3 h-3" /> {isEditingSlots ? 'Done Editing' : 'Edit Slots'}
            </button>
          )}
        </div>
        
        {isEditingSlots ? (
          <div className="space-y-3 relative z-10 animate-in fade-in">
            <p className="text-xs text-slate-400 mb-2">Set your maximum spell slots per level. Set to 0 to remove.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <div key={level} className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level {level}</span>
                  <input 
                    type="number" 
                    value={spellSlots[level]?.max || ''} 
                    onChange={(e) => updateSlotMax(level, e.target.value)}
                    placeholder="0"
                    className="w-12 bg-slate-800 border border-slate-600 rounded text-center text-white py-1 focus:border-fuchsia-500 focus:outline-none text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          Object.keys(spellSlots).length === 0 ? (
            <p className="text-sm text-slate-500 italic relative z-10">No spell slots configured for this character. Click Edit to add them.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
              {Object.entries(spellSlots).map(([level, data]) => (
                <div key={level} className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Level {level}</span>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: data.max }).map((_, i) => (
                      <button key={i} onClick={() => handleSlotToggle(level, i, data.max)} disabled={isDM} className={`w-6 h-6 rounded-full border-2 transition-all duration-300 shrink-0 ${i < data.current ? 'bg-fuchsia-500 border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.5)] cursor-pointer' : 'bg-slate-800 border-slate-600 opacity-50 cursor-pointer'}`} title={i < data.current ? "Click to expend" : "Click to regain"} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1 border-b border-slate-700 pb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-fuchsia-400" /> Book of Magic</h3>
          {!isDM ? (
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${showSearch ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-fuchsia-400 hover:text-fuchsia-300 hover:bg-slate-700'}`}
            >
              <Search className="w-3 h-3" /> {showSearch ? 'Close Discovery' : 'Discover Spells'}
            </button>
          ) : (
            <button 
              onClick={() => setIsForgingSpell(!isForgingSpell)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${isForgingSpell ? 'bg-fuchsia-700 border-fuchsia-500 text-white' : 'bg-slate-800 border-slate-700 text-fuchsia-400 hover:text-fuchsia-300 hover:bg-slate-700'}`}
            >
              <Hammer className="w-3 h-3" /> {isForgingSpell ? 'Cancel Forge' : 'Forge Custom Spell'}
            </button>
          )}
        </div>

        {/* NEW: Smart Spell Filter Bar */}
        {spells.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 my-auto mr-1" />
            {SPELL_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeFilter === filter ? 'bg-fuchsia-600 text-white border-fuchsia-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* DM ONLY: CUSTOM SPELL FORGE */}
        {isDM && isForgingSpell && (
          <form onSubmit={handleForgeCustomSpell} className="bg-slate-900/80 p-4 md:p-5 rounded-xl border border-fuchsia-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2 space-y-4">
            <h4 className="text-sm font-bold text-fuchsia-400 flex items-center gap-2"><Hammer className="w-4 h-4" /> Homebrew Spell Forge</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Spell Name</label>
                <input type="text" required value={customSpell.name} onChange={e => setCustomSpell({...customSpell, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. Arcane Eruption" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Spell Level</label>
                <select value={customSpell.level} onChange={e => setCustomSpell({...customSpell, level: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500">
                  <option value="0">Cantrip (0)</option>
                  {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Casting Time</label>
              <input type="text" required value={customSpell.castTime} onChange={e => setCustomSpell({...customSpell, castTime: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. 1 Action, 1 Bonus Action" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description & Effects</label>
              <textarea required value={customSpell.desc} onChange={e => setCustomSpell({...customSpell, desc: e.target.value})} className="w-full min-h-[100px] bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 resize-y" placeholder="Describe the damage, saving throws, and effects..." />
            </div>

            <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Inject into Grimoire
            </button>
          </form>
        )}

        {showSearch && !isDM && <SpellDiscovery onAddSpell={addSpellToGrimoire} />}

        {Object.keys(groupedSpells).length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 border-dashed rounded-xl p-8 text-center text-slate-500">
            {spells.length === 0 ? (isDM ? 'Forge spells here.' : 'Use Discover Spells to find new magic.') : 'No spells match this filter.'}
          </div>
        ) : (
          Object.entries(groupedSpells).map(([levelName, levelSpells]) => (
            <CollapsibleSection key={levelName} title={`${levelName} (${levelSpells.length})`} icon={Sparkles} defaultOpen={levelName === 'Cantrips' || activeFilter !== 'All'}>
              <div className="grid grid-cols-1 gap-3">
                {levelSpells.map((spell, idx) => {
                  const hasSlotAvailable = spell.level > 0 && (spellSlots[spell.level]?.current || 0) > 0;
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-fuchsia-300 text-lg">{spell.name}</h4>
                          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 mt-1 inline-block">{spell.castTime || '1 Action'}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          {!isDM && spell.level > 0 && (
                            <button 
                              onClick={() => handleQuickCast(spell.level)}
                              disabled={!hasSlotAvailable}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-colors shrink-0 ${hasSlotAvailable ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                            >
                              <Wand2 className="w-3 h-3" /> {hasSlotAvailable ? 'Cast' : 'No Slots'}
                            </button>
                          )}
                          {!isDM && (spell.desc.toLowerCase().includes('concentration') || spell.desc.toLowerCase().includes('duration: concentration')) && (
                            <button 
                              onClick={toggleConcentration}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-colors shrink-0 ${char.isConcentrating ? 'bg-amber-500 text-slate-900 cursor-pointer animate-pulse' : 'bg-slate-800 text-amber-500 border border-amber-900/50 hover:bg-slate-700 cursor-pointer'}`}
                            >
                              <BrainCircuit className="w-3 h-3" /> Conc.
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{spell.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          ))
        )}
      </div>
    </div>
  );
}