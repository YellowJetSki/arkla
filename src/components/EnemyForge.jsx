import { useState, useEffect } from 'react';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, X, Save, Shield, Heart, Wind, Swords, Search, Loader2, Plus, Target, Brain, Eye, Wand2 } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import ImageSelector from './shared/ImageSelector';
import { applySanctuaryFilter } from '../services/arklaEngine';
import { fetchAllSpells, fetchSpellDetails } from '../services/srdApi';

export default function EnemyForge({ onClose }) {
  const [activeTab, setActiveTab] = useState('custom'); 
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const [enemy, setEnemy] = useState({
    name: '', size: 'Medium', type: 'Humanoid', alignment: 'Unaligned', challenge_rating: 1,
    ac: 10, hp: 10, speed: '30 ft.',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    saves: '', skills: '', vulnerabilities: '', resistances: '', immunities: '', conditionImmunities: '',
    senses: 'passive Perception 10', languages: '--',
    traits: '', actions: '', reactions: '',
    imageUrl: '', tokenUrl: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [srdEnemies, setSrdEnemies] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Spell Injector State
  const [srdSpells, setSrdSpells] = useState([]);
  const [spellSearch, setSpellSearch] = useState('');
  const [filteredSpells, setFilteredSpells] = useState([]);
  const [showSpellDropdown, setShowSpellDropdown] = useState(false);

  useEffect(() => {
    fetchAllSpells().then(setSrdSpells);
  }, []);

  const handleSpellSearchChange = (e) => {
    const val = e.target.value;
    setSpellSearch(val);
    if (val.length > 1) {
      setFilteredSpells(srdSpells.filter(s => s.name.toLowerCase().includes(val.toLowerCase())));
      setShowSpellDropdown(true);
    } else {
      setShowSpellDropdown(false);
    }
  };

  const handleInjectSpell = async (indexStr, targetField) => {
    setShowSpellDropdown(false);
    setSpellSearch('');
    const details = await fetchSpellDetails(indexStr);
    if (details) {
      const spellText = `***${details.name}.*** *Level ${details.level} ${details.school}*.\n**Casting Time:** ${details.castingTime}\n**Range:** ${details.range}\n**Components:** ${details.components}\n**Duration:** ${details.duration}\n\n${details.desc}`;
      setEnemy(prev => ({
        ...prev,
        [targetField]: prev[targetField] ? `${prev[targetField]}\n\n${spellText}` : spellText
      }));
    }
  };

  const handleStatChange = (stat, val) => {
    setEnemy(prev => ({ ...prev, stats: { ...prev.stats, [stat]: Number(val) } }));
  };

  const handleSaveCustom = async (e) => {
    e.preventDefault();
    if (!enemy.name) {
      setDialog({ isOpen: true, title: 'Missing Name', message: 'The monster needs a name.', type: 'alert' });
      return;
    }

    setIsSaving(true);
    try {
      let tokenSize = 1;
      if (enemy.size === 'Large') tokenSize = 2;
      if (enemy.size === 'Huge') tokenSize = 3;
      if (enemy.size === 'Gargantuan') tokenSize = 4;

      const newEnemy = {
        ...enemy,
        flavor: `${enemy.size} ${enemy.type}, ${enemy.alignment}`,
        ac: Number(enemy.ac),
        hp: Number(enemy.hp),
        currentHp: Number(enemy.hp),
        maxHp: Number(enemy.hp),
        challenge_rating: Number(enemy.challenge_rating),
        size: tokenSize,
        conditions: [],
        features: enemy.traits ? [{ name: 'Traits', desc: enemy.traits }] : [],
        parsedActions: enemy.actions ? [{ name: 'Actions', desc: enemy.actions }] : [],
        isHomebrew: true
      };

      await addDoc(collection(db, 'active_enemies'), newEnemy);
      onClose();
    } catch (error) {
      console.error("Error forging enemy:", error);
      setDialog({ isOpen: true, title: 'Forge Error', message: 'Failed to summon enemy.', type: 'alert' });
    } finally {
      setIsSaving(false);
    }
  };

  const searchApi = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSrdEnemies(data.results || []);
    } catch (err) {
      setDialog({ isOpen: true, title: 'API Error', message: 'Failed to search bestiary.', type: 'alert' });
    }
    setIsSearching(false);
  };

  const loadApiEnemyIntoForge = async (url) => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const data = await res.json();

      const profs = data.proficiencies || [];
      const savesList = profs.filter(p => p.proficiency.index.startsWith('saving-throw-')).map(p => `${p.proficiency.name.split(' ').pop()} +${p.value}`).join(', ');
      const skillsList = profs.filter(p => p.proficiency.index.startsWith('skill-')).map(p => `${p.proficiency.name.replace('Skill: ', '')} +${p.value}`).join(', ');

      const formattedTraits = (data.special_abilities || []).map(f => `${f.name}. ${f.desc}`).join('\n\n');
      const formattedActions = (data.actions || []).map(a => `${a.name}. ${a.desc}`).join('\n\n');
      const formattedReactions = (data.reactions || []).map(r => `${r.name}. ${r.desc}`).join('\n\n');

      setEnemy({
        name: applySanctuaryFilter(data.name),
        size: data.size || 'Medium',
        type: data.type || 'Humanoid',
        alignment: data.alignment || 'Unaligned',
        challenge_rating: data.challenge_rating || 1,
        ac: data.armor_class?.[0]?.value || 10,
        hp: data.hit_points || 10,
        speed: data.speed?.walk || '30 ft.',
        stats: {
          STR: data.strength || 10,
          DEX: data.dexterity || 10,
          CON: data.constitution || 10,
          INT: data.intelligence || 10,
          WIS: data.wisdom || 10,
          CHA: data.charisma || 10
        },
        saves: savesList,
        skills: skillsList,
        vulnerabilities: (data.damage_vulnerabilities || []).join(', '),
        resistances: (data.damage_resistances || []).join(', '),
        immunities: (data.damage_immunities || []).join(', '),
        conditionImmunities: (data.condition_immunities || []).map(c => c.name).join(', '),
        senses: `passive Perception ${data.senses?.passive_perception || 10}`,
        languages: data.languages || '--',
        traits: applySanctuaryFilter(formattedTraits),
        actions: applySanctuaryFilter(formattedActions),
        reactions: applySanctuaryFilter(formattedReactions),
        imageUrl: data.image ? `https://www.dnd5eapi.co${data.image}` : '',
        tokenUrl: data.image ? `https://www.dnd5eapi.co${data.image}` : ''
      });

      setActiveTab('custom');
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Import Error', message: 'Failed to load monster data into the forge.', type: 'alert' });
    }
    setIsSaving(false);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-5xl shadow-[0_0_40px_rgba(220,38,38,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden">
          
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-4">
               <h2 className="text-xl font-black text-red-400 flex items-center gap-2 uppercase tracking-widest">
                 <Skull className="w-5 h-5" /> Monster Forge
               </h2>
               <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                 <button onClick={() => setActiveTab('custom')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${activeTab === 'custom' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Custom Board</button>
                 <button onClick={() => setActiveTab('api')} className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors ${activeTab === 'api' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>API Search</button>
               </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {activeTab === 'custom' ? (
              <form onSubmit={handleSaveCustom} className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monster Name</label>
                    <input type="text" value={enemy.name} onChange={e => setEnemy({...enemy, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. The Brevar Chieftain" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Size</label>
                    <select value={enemy.size} onChange={e => setEnemy({...enemy, size: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500">
                      {['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                    <input type="text" value={enemy.type} onChange={e => setEnemy({...enemy, type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Undead" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alignment</label>
                    <input type="text" value={enemy.alignment} onChange={e => setEnemy({...enemy, alignment: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Chaotic Evil" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Challenge Rating</label>
                    <input type="number" value={enemy.challenge_rating} onChange={e => setEnemy({...enemy, challenge_rating: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><Heart className="w-3 h-3 text-red-400" /> HP</label>
                    <input type="number" value={enemy.hp} onChange={e => setEnemy({...enemy, hp: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-red-500 shadow-inner" />
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><Shield className="w-3 h-3 text-amber-400" /> AC</label>
                    <input type="number" value={enemy.ac} onChange={e => setEnemy({...enemy, ac: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-red-500 shadow-inner" />
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><Wind className="w-3 h-3 text-sky-400" /> Speed</label>
                    <input type="text" value={enemy.speed} onChange={e => setEnemy({...enemy, speed: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-red-500 shadow-inner" placeholder="e.g. 30 ft." />
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Ability Scores</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {Object.keys(enemy.stats).map(stat => (
                      <div key={stat} className="bg-slate-950 border border-slate-700 rounded-xl p-2 flex flex-col items-center shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat}</span>
                        <input 
                          type="number" 
                          value={enemy.stats[stat]} 
                          onChange={(e) => handleStatChange(stat, e.target.value)}
                          className="w-full bg-transparent text-white font-black text-xl text-center focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Saving Throws</label><input type="text" value={enemy.saves} onChange={e => setEnemy({...enemy, saves: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Dex +5, Con +4" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Skills</label><input type="text" value={enemy.skills} onChange={e => setEnemy({...enemy, skills: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Stealth +6, Perception +4" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Resistances</label><input type="text" value={enemy.resistances} onChange={e => setEnemy({...enemy, resistances: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Cold, Fire" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Damage Immunities</label><input type="text" value={enemy.immunities} onChange={e => setEnemy({...enemy, immunities: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Poison" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senses</label><input type="text" value={enemy.senses} onChange={e => setEnemy({...enemy, senses: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Darkvision 60 ft." /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Languages</label><input type="text" value={enemy.languages} onChange={e => setEnemy({...enemy, languages: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="e.g. Common, Goblin" /></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Actions & Traits */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Swords className="w-3 h-3 text-red-400" /> Actions & Attacks</label>
                      <textarea value={enemy.actions} onChange={e => setEnemy({...enemy, actions: e.target.value})} className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar leading-relaxed" placeholder="Multiattack. The Brevar makes two attacks..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Traits & Passive Abilities</label>
                      <textarea value={enemy.traits} onChange={e => setEnemy({...enemy, traits: e.target.value})} className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar leading-relaxed" placeholder="Pack Tactics. The creature has advantage..." />
                    </div>
                  </div>

                  {/* Right Column: Spell Injector */}
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-fuchsia-900/30 shadow-inner">
                    <label className="block text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Wand2 className="w-3 h-3" /> Spell Injector
                    </label>
                    <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Search the SRD to instantly append full spell descriptions into the monster's block.</p>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={spellSearch} 
                        onChange={handleSpellSearchChange} 
                        placeholder="Search Spells..." 
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500" 
                      />
                      {showSpellDropdown && filteredSpells.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-600 rounded-lg shadow-2xl z-50">
                          {filteredSpells.map(s => (
                            <div key={s.index} className="px-3 py-2 text-sm text-slate-300 hover:bg-fuchsia-600 hover:text-white border-b border-slate-800 last:border-0 flex items-center justify-between group">
                              <span>{s.name}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleInjectSpell(s.index, 'actions')} className="bg-slate-950 hover:bg-white hover:text-fuchsia-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">To Actions</button>
                                <button onClick={() => handleInjectSpell(s.index, 'traits')} className="bg-slate-950 hover:bg-white hover:text-fuchsia-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">To Traits</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <ImageSelector 
                    label="Monster Artwork"
                    value={enemy.imageUrl}
                    onChange={(val) => setEnemy({...enemy, imageUrl: val})}
                    iconColor="text-red-400"
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner"
                  />
                  <ImageSelector 
                    label="Battle Token"
                    value={enemy.tokenUrl}
                    onChange={(val) => setEnemy({...enemy, tokenUrl: val})}
                    iconColor="text-red-400"
                    inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 shadow-inner"
                  />
                </div>
                
                <button type="submit" disabled={isSaving} className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  {isSaving ? 'Summoning...' : 'Summon Custom Monster'}
                </button>
              </form>
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <form onSubmit={searchApi} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search API for Monsters (e.g. Goblin)..." className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-white font-bold focus:outline-none focus:border-red-500" />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 px-4 py-2 rounded-lg text-white font-bold text-sm uppercase tracking-wider">Search</button>
                </form>
                
                {isSearching ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
                ) : (
                  <div className="space-y-2">
                    {srdEnemies.map(s => (
                      <div key={s.index} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group">
                        <span className="font-bold text-white flex items-center gap-2"><Skull className="w-4 h-4 text-slate-500"/> {s.name}</span>
                        <button onClick={() => loadApiEnemyIntoForge(s.url)} disabled={isSaving} className="bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/50 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3"/> Load as Template
                        </button>
                      </div>
                    ))}
                    {searchQuery && srdEnemies.length === 0 && <p className="text-center text-slate-500 italic p-4">No monsters found.</p>}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}