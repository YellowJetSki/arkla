import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Flame, X, Search, Plus, Send, Trash2, BookOpen } from 'lucide-react';
import { fetchAllSpells, fetchSpellDetails } from '../services/srdApi';
import DialogModal from './shared/DialogModal';

export default function DMSpellVault({ activePlayers, activeEnemies, onClose }) {
  const [vaultSpells, setVaultSpells] = useState([]);
  const [newSpell, setNewSpell] = useState({ name: '', level: 1, school: 'Evocation', castingTime: '1 Action', range: '60 feet', duration: 'Instantaneous', components: 'V, S', concentration: false, desc: '' });
  
  const [srdSpellsList, setSrdSpellsList] = useState([]);
  const [filteredSpells, setFilteredSpells] = useState([]);
  const [showSrdDropdown, setShowSrdDropdown] = useState(false);

  const [playerData, setPlayerData] = useState([]);
  const [assignTargets, setAssignTargets] = useState({});

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchAllSpells().then(setSrdSpellsList);
    
    const fetchPlayers = async () => {
      const data = [];
      for (const id of activePlayers) {
        const snap = await getDoc(doc(db, 'characters', id));
        if (snap.exists()) data.push({ id, name: snap.data().name });
      }
      setPlayerData(data);
    };
    fetchPlayers();

    const vaultRef = doc(db, 'campaign', 'spell_vault');
    const unsub = onSnapshot(vaultRef, (snap) => {
      if (snap.exists()) setVaultSpells(snap.data().spells || []);
    });
    return () => unsub();
  }, [activePlayers]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewSpell(prev => ({ ...prev, name: val }));
    if (val.length > 2) {
      setFilteredSpells(srdSpellsList.filter(s => s.name.toLowerCase().includes(val.toLowerCase())));
      setShowSrdDropdown(true);
    } else setShowSrdDropdown(false);
  };

  const handleSelectSrdSpell = async (index) => {
    setShowSrdDropdown(false);
    const details = await fetchSpellDetails(index);
    if (details) {
      setNewSpell({
        ...details,
        level: details.level || 0,
        concentration: details.concentration || false
      });
    }
  };

  const handleSaveToVault = async (e) => {
    e.preventDefault();
    if (!newSpell.name) return;
    
    const spellToSave = { ...newSpell, id: `spell_${Date.now()}` };
    const vaultRef = doc(db, 'campaign', 'spell_vault');
    
    await setDoc(vaultRef, { spells: [spellToSave, ...vaultSpells] }, { merge: true });
    setNewSpell({ name: '', level: 1, school: 'Evocation', castingTime: '1 Action', range: '60 feet', duration: 'Instantaneous', components: 'V, S', concentration: false, desc: '' });
  };

  const handleDeleteFromVault = (spellId) => {
    setDialog({
      isOpen: true, title: 'Delete Spell', message: 'Permanently remove this spell from the DM Vault?', type: 'confirm',
      onConfirm: async () => {
        const updatedSpells = vaultSpells.filter(s => s.id !== spellId);
        await updateDoc(doc(db, 'campaign', 'spell_vault'), { spells: updatedSpells });
        closeDialog();
      }
    });
  };

  const handleAssign = async (spell, targetId) => {
    if (!targetId) return;

    const isPlayer = playerData.some(p => p.id === targetId);
    
    try {
      if (isPlayer) {
        await updateDoc(doc(db, 'characters', targetId), { spells: arrayUnion(spell) });
      } else {
        const formattedFeature = { name: `Spell: ${spell.name}`, desc: spell.desc, isDefensive: false };
        await updateDoc(doc(db, 'active_enemies', targetId), { features: arrayUnion(formattedFeature) });
      }
      setDialog({ isOpen: true, title: 'Success', message: `${spell.name} injected into target's sheet.`, type: 'alert', onConfirm: closeDialog });
      setAssignTargets(prev => ({ ...prev, [spell.id]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-6xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-fuchsia-600 rounded-t-xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
              <Flame className="w-6 h-6" /> Spell Vault
            </h2>
            <button onClick={onClose} className="text-slate-950 bg-fuchsia-500 hover:bg-fuchsia-400 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-5 h-5 font-black" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-950 relative z-10">
            
            <div className="space-y-6">
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <h3 className="font-black text-fuchsia-400 mb-4 border-b-2 border-slate-950 pb-2 flex items-center gap-2 uppercase tracking-widest text-sm drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  <Plus className="w-4 h-4" /> Forge / Fetch Spell
                </h3>
                
                <form onSubmit={handleSaveToVault} className="space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Search className="w-3 h-3"/> Spell Name (SRD)</label>
                    <input type="text" required value={newSpell.name} onChange={handleNameChange} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Fireball" />
                    
                    {showSrdDropdown && filteredSpells.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border-2 border-slate-950 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50">
                        {filteredSpells.map(s => (
                          <div key={s.index} onClick={() => handleSelectSrdSpell(s.index)} className="px-4 py-3 text-sm font-bold text-slate-300 hover:bg-fuchsia-600 hover:text-slate-950 cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Level (0 = Cantrip)</label>
                      <input type="number" value={newSpell.level} onChange={e => setNewSpell({...newSpell, level: Number(e.target.value)})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">School</label>
                      <input type="text" value={newSpell.school} onChange={e => setNewSpell({...newSpell, school: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Casting Time</label>
                      <input type="text" value={newSpell.castingTime} onChange={e => setNewSpell({...newSpell, castingTime: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Range</label>
                      <input type="text" value={newSpell.range} onChange={e => setNewSpell({...newSpell, range: e.target.value})} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border-2 border-slate-900 p-3 rounded-xl w-fit">
                      <input type="checkbox" checked={newSpell.concentration} onChange={e => setNewSpell({...newSpell, concentration: e.target.checked})} className="w-4 h-4 rounded border-slate-600 text-fuchsia-500 bg-slate-800 focus:ring-fuchsia-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requires Concentration</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description & Mechanics</label>
                    <textarea required value={newSpell.desc} onChange={e => setNewSpell({...newSpell, desc: e.target.value})} className="w-full min-h-[120px] bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-slate-300 font-medium text-sm focus:outline-none focus:border-fuchsia-500 shadow-inner resize-y leading-relaxed" placeholder="Detailed spell description..."></textarea>
                  </div>

                  <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none mt-6">
                    <Send className="w-4 h-4 font-black" /> Save to Vault
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4 lg:border-l-[3px] lg:border-slate-900 lg:pl-8">
              <h3 className="font-black text-white border-b-[3px] border-slate-900 pb-3 flex items-center gap-2 uppercase tracking-widest text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <BookOpen className="w-6 h-6 text-fuchsia-500" /> Vault Inventory
              </h3>

              {vaultSpells.length === 0 ? (
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 bg-slate-900 p-8 rounded-2xl border-2 border-slate-950 border-dashed text-center shadow-inner mt-4">Vault is empty.</p>
              ) : (
                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                  {vaultSpells.map((spell) => (
                    <div key={spell.id} className="bg-slate-900 border-[3px] border-slate-950 rounded-xl overflow-hidden flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      
                      <div className="p-4 bg-slate-900 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2">
                           <div>
                             <h4 className="font-black text-white text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">{spell.name}</h4>
                             <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mt-1 block">Level {spell.level} • {spell.school}</span>
                           </div>
                           <button onClick={() => handleDeleteFromVault(spell.id)} className="text-slate-500 hover:text-red-500 bg-slate-950 hover:bg-red-950 border-2 border-slate-900 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Trash2 className="w-4 h-4 font-black" /></button>
                        </div>
                        
                        <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{spell.desc}</p>
                        
                        <div className="flex gap-2 w-full mt-2 pt-3 border-t-2 border-slate-950">
                           <select 
                             value={assignTargets[spell.id] || ''} 
                             onChange={(e) => setAssignTargets(prev => ({...prev, [spell.id]: e.target.value}))}
                             className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-lg px-2 py-2 text-white font-bold text-xs focus:outline-none focus:border-fuchsia-500 shadow-inner"
                           >
                             <option value="">Select Target...</option>
                             <optgroup label="The Party">
                               {playerData.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </optgroup>
                             <optgroup label="Active Threats">
                               {activeEnemies.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                             </optgroup>
                           </select>
                           <button 
                             onClick={() => handleAssign(spell, assignTargets[spell.id])}
                             disabled={!assignTargets[spell.id]}
                             className="bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-50 text-slate-950 font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 text-[10px]"
                           >
                             Assign
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}