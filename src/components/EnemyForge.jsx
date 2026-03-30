import { useState } from 'react';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skull, X, Save, Shield, Heart, Wind, Swords, Image as ImageIcon, Search, Loader2, Plus, Target } from 'lucide-react';
import DialogModal from './shared/DialogModal';
import { applySanctuaryFilter } from '../services/arklaEngine';

export default function EnemyForge({ onClose }) {
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' or 'api'
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  // Custom Enemy State (Robust Version)
  const [enemy, setEnemy] = useState({
    name: '', size: 'Medium', type: 'Humanoid', alignment: 'Unaligned', challenge_rating: 1,
    ac: 10, hp: 10, speed: '30 ft.',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    saves: '', skills: '', vulnerabilities: '', resistances: '', immunities: '', conditionImmunities: '',
    senses: 'passive Perception 10', languages: '--',
    traits: '', actions: '', reactions: '',
    imageUrl: '', tokenUrl: ''
  });

  // API Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [srdEnemies, setSrdEnemies] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const importApiEnemy = async (url) => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://www.dnd5eapi.co${url}`);
      const data = await res.json();

      let tokenSize = 1;
      if (data.size === 'Large') tokenSize = 2;
      if (data.size === 'Huge') tokenSize = 3;
      if (data.size === 'Gargantuan') tokenSize = 4;

      const calcMod = (score) => {
         const mod = Math.floor((score - 10) / 2);
         return mod >= 0 ? `+${mod}` : `${mod}`;
      };

      const newEnemy = {
        name: applySanctuaryFilter(data.name),
        flavor: applySanctuaryFilter(`${data.size} ${data.type}, ${data.alignment}`),
        ac: data.armor_class?.[0]?.value || 10,
        hp: data.hit_points || 10,
        currentHp: data.hit_points || 10,
        maxHp: data.hit_points || 10,
        speed: data.speed?.walk || '30 ft.',
        stats: {
          STR: calcMod(data.strength), DEX: calcMod(data.dexterity), CON: calcMod(data.constitution),
          INT: calcMod(data.intelligence), WIS: calcMod(data.wisdom), CHA: calcMod(data.charisma)
        },
        passivePerception: data.senses?.passive_perception || 10,
        features: (data.special_abilities || []).map(f => ({ name: applySanctuaryFilter(f.name), desc: applySanctuaryFilter(f.desc) })),
        actions: (data.actions || []).map(a => ({ name: applySanctuaryFilter(a.name), desc: applySanctuaryFilter(a.desc) })),
        size: tokenSize,
        conditions: [],
        img: data.image ? `https://www.dnd5eapi.co${data.image}` : '',
        isHomebrew: false
      };

      const enemyId = `enemy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await setDoc(doc(db, 'active_enemies', enemyId), newEnemy);
      setDialog({ isOpen: true, title: 'Summoned', message: `${data.name} added to the board!`, type: 'alert', onConfirm: onClose });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, title: 'Import Error', message: 'Failed to import monster.', type: 'alert' });
    }
    setIsSaving(false);
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-4xl shadow-[0_0_40px_rgba(220,38,38,0.2)] flex flex-col max-h-[90dvh] relative overflow-hidden">
          
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Swords className="w-3 h-3 text-red-400" /> Actions & Attacks</label>
                    <textarea value={enemy.actions} onChange={e => setEnemy({...enemy, actions: e.target.value})} className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar" placeholder="Multiattack..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Traits & Passive Abilities</label>
                    <textarea value={enemy.traits} onChange={e => setEnemy({...enemy, traits: e.target.value})} className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500 shadow-inner resize-y custom-scrollbar" placeholder="Pack Tactics..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <div>
                    <label className="flex items-center gap-1 block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><ImageIcon className="w-3 h-3" /> Monster Artwork URL</label>
                    <input type="url" value={enemy.imageUrl} onChange={e => setEnemy({...enemy, imageUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><Target className="w-3 h-3" /> Token URL (For Battlemap)</label>
                    <input type="url" value={enemy.tokenUrl} onChange={e => setEnemy({...enemy, tokenUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500" placeholder="https://..." />
                  </div>
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
                        <button onClick={() => importApiEnemy(s.url)} disabled={isSaving} className="bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/50 transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3"/> Summon
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