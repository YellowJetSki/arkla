import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Flame, Sparkles, BookOpen, Target, ShieldAlert, Wand2, Search, Plus, Shield, Settings, BrainCircuit, Hammer, X, Filter, Trash2 } from 'lucide-react';
import CollapsibleSection from './shared/CollapsibleSection';
import SpellDiscovery from './SpellDiscovery';

const SPELL_FILTERS = ['All', 'Cantrips', 'Leveled', 'Concentration', 'Action', 'Bonus', 'Reaction'];

export default function Spellbook({ char, charId, isDM, showDialog }) {
  const [showSearch, setShowSearch] = useState(false);
  const [isEditingSlots, setIsEditingSlots] = useState(false); 
  const [isForgingSpell, setIsForgingSpell] = useState(false);
  
  // Comprehensive API-matched state
  const [customSpell, setCustomSpell] = useState({ 
    name: '', 
    level: 0, 
    castTime: '1 Action', 
    range: '60 feet', 
    components: 'V, S', 
    duration: 'Instantaneous', 
    desc: '' 
  });
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [spellToCast, setSpellToCast] = useState(null);

  const spellSlots = char.spellSlots || {};
  const spells = char.spells || [];

  const currentMaxSpellLevel = Object.keys(spellSlots).length > 0 
    ? Math.max(...Object.keys(spellSlots).map(Number)) 
    : 0;

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

  const executeCast = async (castLevel) => {
    if (isDM || castLevel === 0) return;
    const currentAmount = spellSlots[castLevel]?.current || 0;
    if (currentAmount > 0) {
      const updatedSlots = { 
        ...spellSlots, 
        [castLevel]: { ...spellSlots[castLevel], current: currentAmount - 1 } 
      };
      await updateDoc(doc(db, 'characters', charId), { spellSlots: updatedSlots });
    }
    setSpellToCast(null);
  };

  const toggleConcentration = async () => {
    if (isDM) return;
    try {
      await runTransaction(db, async (transaction) => {
        const charRef = doc(db, 'characters', charId);
        const mapRef = doc(db, 'campaign', 'battlemap');
        
        const newConcState = !char.isConcentrating;
        
        transaction.update(charRef, { isConcentrating: newConcState });
        
        const mapDoc = await transaction.get(mapRef);
        if (mapDoc.exists() && mapDoc.data().tokens && mapDoc.data().tokens[charId]) {
          const mapTokens = mapDoc.data().tokens;
          mapTokens[charId].isConcentrating = newConcState;
          transaction.update(mapRef, { tokens: mapTokens });
        }
      });
    } catch (err) {
      console.error("Concentration sync failed:", err);
    }
  };

  const addSpellToGrimoire = async (newSpell) => {
    await updateDoc(doc(db, 'characters', charId), {
      spells: arrayUnion(newSpell)
    });
  };

  const removeSpellFromGrimoire = async (spellToRemove) => {
    showDialog({
      title: 'Remove Spell?',
      message: `Are you sure you want to permanently delete ${spellToRemove.name} from this spellbook?`,
      type: 'confirm',
      onConfirm: async () => {
        await updateDoc(doc(db, 'characters', charId), {
          spells: arrayRemove(spellToRemove)
        });
        showDialog({ isOpen: false });
      },
      onCancel: () => showDialog({ isOpen: false })
    });
  };

  const handleForgeCustomSpell = async (e) => {
    e.preventDefault();
    if (!customSpell.name || !customSpell.desc) return;
    
    // Save perfectly matching the API object structure
    await addSpellToGrimoire({
      name: customSpell.name,
      level: Number(customSpell.level),
      casting_time: customSpell.castTime,
      range: customSpell.range,
      components: customSpell.components.split(',').map(c => c.trim()),
      duration: customSpell.duration,
      desc: customSpell.desc
    });
    
    setCustomSpell({ name: '', level: 0, castTime: '1 Action', range: '60 feet', components: 'V, S', duration: 'Instantaneous', desc: '' });
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

  const filteredSpells = spells.filter(spell => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Cantrips') return spell.level === 0;
    if (activeFilter === 'Leveled') return spell.level > 0;
    if (activeFilter === 'Concentration') return spell.desc.toLowerCase().includes('concentration') || (spell.duration || '').toLowerCase().includes('concentration');
    if (activeFilter === 'Action') return (spell.castTime || spell.casting_time || '').toLowerCase().includes('1 action');
    if (activeFilter === 'Bonus') return (spell.castTime || spell.casting_time || '').toLowerCase().includes('bonus action');
    if (activeFilter === 'Reaction') return (spell.castTime || spell.casting_time || '').toLowerCase().includes('reaction');
    return true;
  });

  const groupedSpells = filteredSpells.reduce((acc, spell) => {
    const lvl = spell.level === 0 ? 'Cantrips' : `Level ${spell.level}`;
    if (!acc[lvl]) acc[lvl] = [];
    acc[lvl].push(spell);
    return acc;
  }, {});

  const highestLevelName = Object.keys(groupedSpells)
    .filter(k => k !== 'Cantrips')
    .sort((a, b) => parseInt(a.replace('Level ', '')) - parseInt(b.replace('Level ', '')))
    .reverse()[0];

  const hasSpellStats = char.spellSave || char.spellAttack;

  return (
    <div className="space-y-6">
      
      {spellToCast && !isDM && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-fuchsia-500/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(217,70,239,0.3)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-fuchsia-950/30">
              <h3 className="font-bold text-fuchsia-400 flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> Cast Spell
              </h3>
              <button onClick={() => setSpellToCast(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-black text-white mb-2">{spellToCast.name}</h4>
              <p className="text-sm text-slate-400 mb-6">Select a slot level to expend for this cast. Base level is {spellToCast.level}.</p>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => l >= spellToCast.level && spellSlots[l]).map(level => {
                  const slots = spellSlots[level];
                  const hasSlots = slots && slots.current > 0;
                  return (
                    <button 
                      key={level}
                      onClick={() => executeCast(level)}
                      disabled={!hasSlots}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${hasSlots ? 'bg-slate-800 border-fuchsia-500/50 hover:bg-fuchsia-600 hover:border-fuchsia-400 group cursor-pointer' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}
                    >
                      <span className={`text-sm font-bold ${hasSlots ? 'text-white' : 'text-slate-500'}`}>Lvl {level}</span>
                      <span className={`text-[10px] uppercase font-bold ${hasSlots ? 'text-fuchsia-400 group-hover:text-fuchsia-200' : 'text-slate-600'}`}>{slots.current}/{slots.max} Slots</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSpellStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-fuchsia-900/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-fuchsia-400"/> Save DC</span>
            <span className="text-2xl font-black text-white">{char.spellSave}</span>
          </div>
          <div className="bg-slate-900 border border-fuchsia-900/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Target className="w-4 h-4 text-fuchsia-400"/> Attack</span>
            <span className="text-2xl font-black text-white">{char.spellAttack}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="text-lg font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest drop-shadow-sm"><Flame className="w-5 h-5" /> Spell Slots</h3>
          {isDM && (
            <button 
              onClick={() => setIsEditingSlots(!isEditingSlots)} 
              className={`text-[10px] md:text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isEditingSlots ? 'bg-fuchsia-600 border-fuchsia-500 text-white' : 'bg-slate-900 border-slate-700 text-fuchsia-400 hover:text-white hover:bg-slate-700'}`}
            >
              <Settings className="w-3.5 h-3.5" /> {isEditingSlots ? 'Done Editing' : 'Config Slots'}
            </button>
          )}
        </div>
        
        {isEditingSlots && isDM ? (
          <div className="space-y-4 relative z-10 animate-in fade-in bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 shadow-inner">
            <p className="text-xs text-slate-400 mb-2">Set your maximum spell slots per level. Set to 0 to remove.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                <div key={level} className="bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-inner">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {level}</span>
                  <input 
                    type="number" 
                    value={spellSlots[level]?.max || ''} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateSlotMax(level, e.target.value)}
                    placeholder="0"
                    className="w-14 bg-slate-800 border border-slate-600 rounded-lg text-center text-white py-1.5 focus:border-fuchsia-500 focus:outline-none text-sm font-bold shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          Object.keys(spellSlots).length === 0 ? (
            <p className="text-sm text-slate-500 italic relative z-10 bg-slate-900/50 p-4 rounded-xl border border-slate-800 border-dashed text-center">No spell slots configured for this character. {isDM ? "Click Config to add them." : "Slots are gained upon leveling up."}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
              {Object.entries(spellSlots).map(([level, data]) => (
                <div key={level} className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 shadow-sm hover:border-fuchsia-500/30 transition-colors">
                  <span className="text-[10px] font-black text-fuchsia-500/70 uppercase tracking-widest block mb-3 border-b border-slate-800 pb-1">Level {level}</span>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: data.max }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSlotToggle(level, i, data.max)} 
                        disabled={isDM} 
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-300 shrink-0 ${i < data.current ? 'bg-fuchsia-500 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)] cursor-pointer hover:scale-110' : 'bg-slate-800 border-slate-600 opacity-50 cursor-pointer hover:opacity-80'}`} 
                        title={i < data.current ? "Click to expend" : "Click to regain"} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1 border-b border-slate-700 pb-3">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest"><BookOpen className="w-5 h-5 text-fuchsia-400" /> Book of Magic</h3>
          {!isDM ? (
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`text-[10px] md:text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${showSearch ? 'bg-slate-700 border-slate-500 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-slate-800/80 border-slate-700 text-fuchsia-400 hover:text-white hover:bg-slate-700'}`}
            >
              <Search className="w-3.5 h-3.5" /> {showSearch ? 'Close Archives' : 'Discover Spells'}
            </button>
          ) : (
            <button 
              onClick={() => setIsForgingSpell(!isForgingSpell)}
              className={`text-[10px] md:text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border shadow-sm ${isForgingSpell ? 'bg-fuchsia-700 border-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-slate-800/80 border-slate-700 text-fuchsia-400 hover:text-white hover:bg-slate-700'}`}
            >
              <Hammer className="w-3.5 h-3.5" /> {isForgingSpell ? 'Close Forge' : 'Forge Custom'}
            </button>
          )}
        </div>

        {spells.length > 0 && (
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 my-auto mr-2" />
            {SPELL_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${activeFilter === filter ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {isDM && isForgingSpell && (
          <form onSubmit={handleForgeCustomSpell} className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-fuchsia-500/30 shadow-inner mb-6 animate-in fade-in slide-in-from-top-2 space-y-4">
            <h4 className="text-sm font-black text-fuchsia-400 flex items-center gap-2 uppercase tracking-widest border-b border-fuchsia-900/50 pb-2"><Hammer className="w-4 h-4" /> Homebrew Spell Forge</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Spell Name</label>
                <input type="text" onFocus={(e) => e.target.select()} required value={customSpell.name} onChange={e => setCustomSpell({...customSpell, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Arcane Eruption" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Spell Level</label>
                <select value={customSpell.level} onChange={e => setCustomSpell({...customSpell, level: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-fuchsia-500 shadow-inner">
                  <option value="0">Cantrip (0)</option>
                  {[1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Casting Time</label>
                <input type="text" onFocus={(e) => e.target.select()} required value={customSpell.castTime} onChange={e => setCustomSpell({...customSpell, castTime: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. 1 Action" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Range</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.range} onChange={e => setCustomSpell({...customSpell, range: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. 60 feet" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Components</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.components} onChange={e => setCustomSpell({...customSpell, components: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. V, S, M" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                <input type="text" onFocus={(e) => e.target.select()} value={customSpell.duration} onChange={e => setCustomSpell({...customSpell, duration: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Concentration" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description & Effects</label>
              <textarea required value={customSpell.desc} onChange={e => setCustomSpell({...customSpell, desc: e.target.value})} className="w-full min-h-[100px] bg-slate-950 border border-slate-600 rounded-xl px-3 py-3 text-slate-300 text-sm focus:outline-none focus:border-fuchsia-500 resize-y shadow-inner leading-relaxed" placeholder="Describe the damage, saving throws, and effects..." />
            </div>

            <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all flex items-center justify-center gap-2 mt-2">
              <Plus className="w-4 h-4" /> Inject into Grimoire
            </button>
          </form>
        )}

        {showSearch && !isDM && <SpellDiscovery onAddSpell={addSpellToGrimoire} allowAdd={isDM} maxSpellLevel={isDM ? 9 : currentMaxSpellLevel} />}

        {Object.keys(groupedSpells).length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 italic">
            {spells.length === 0 ? (isDM ? 'Forge spells here.' : 'Use Discover Spells to find new magic.') : 'No spells match this filter.'}
          </div>
        ) : (
          Object.entries(groupedSpells).map(([levelName, levelSpells]) => (
            <CollapsibleSection 
              key={levelName} 
              title={`${levelName} (${levelSpells.length})`} 
              icon={Sparkles} 
              defaultOpen={levelName === 'Cantrips' || levelName === highestLevelName || activeFilter !== 'All'}
            >
              <div className="grid grid-cols-1 gap-4">
                {levelSpells.map((spell, idx) => {
                  const canCastAny = levelName === 'Cantrips' || Object.values(spellSlots).some(s => s.current > 0);
                  const isConcentration = (spell.desc || '').toLowerCase().includes('concentration') || (spell.duration || '').toLowerCase().includes('concentration');
                  
                  return (
                    <div key={idx} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 rounded-xl p-5 group shadow-sm hover:border-fuchsia-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-fuchsia-300 text-xl flex items-center gap-2 drop-shadow-sm mb-2">
                            {spell.name}
                            {isDM && (
                              <button 
                                onClick={() => removeSpellFromGrimoire(spell)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 bg-slate-950 p-1.5 rounded transition-all shadow-inner"
                                title="Remove Spell"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </h4>
                          <div className="flex gap-2 flex-wrap">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded shadow-inner">{spell.castTime || spell.casting_time || '1 Action'}</span>
                             {spell.range && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded shadow-inner">{spell.range}</span>}
                             {spell.duration && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded shadow-inner">{spell.duration}</span>}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {!isDM && spell.level > 0 && (
                            <button 
                              onClick={() => setSpellToCast(spell)}
                              disabled={!canCastAny}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${canCastAny ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white cursor-pointer shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}
                            >
                              <Wand2 className="w-3.5 h-3.5" /> {canCastAny ? 'Cast' : 'No Slots'}
                            </button>
                          )}
                          {!isDM && isConcentration && (
                            <button 
                              onClick={toggleConcentration}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors ${char.isConcentrating ? 'bg-amber-500 text-slate-900 cursor-pointer animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-800 text-amber-500 border border-amber-900/50 hover:bg-slate-700 cursor-pointer'}`}
                            >
                              <BrainCircuit className="w-3.5 h-3.5" /> Conc.
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