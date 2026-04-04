import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Sparkles, X, Search, Plus, Send, Trash2, Award } from 'lucide-react';
import { fetchAllTraitsAndFeatures, fetchTraitOrFeatureDetails } from '../services/srdApi';
import DialogModal from './shared/DialogModal';

export default function DMFeatVault({ activePlayers, activeEnemies, onClose }) {
  const [vaultFeats, setVaultFeats] = useState([]);
  const [newFeat, setNewFeat] = useState({ name: '', desc: '', hasTracker: false, trackerMax: 1, trackerRecharge: 'long' });
  
  const [srdFeatsList, setSrdFeatsList] = useState([]);
  const [filteredFeats, setFilteredFeats] = useState([]);
  const [showSrdDropdown, setShowSrdDropdown] = useState(false);

  const [playerData, setPlayerData] = useState([]);
  const [assignTargets, setAssignTargets] = useState({});

  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchAllTraitsAndFeatures().then(setSrdFeatsList);
    
    const fetchPlayers = async () => {
      const data = [];
      for (const id of activePlayers) {
        const snap = await getDoc(doc(db, 'characters', id));
        if (snap.exists()) data.push({ id, name: snap.data().name });
      }
      setPlayerData(data);
    };
    fetchPlayers();

    const vaultRef = doc(db, 'campaign', 'feat_vault');
    const unsub = onSnapshot(vaultRef, (snap) => {
      if (snap.exists()) setVaultFeats(snap.data().feats || []);
    });
    return () => unsub();
  }, [activePlayers]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewFeat(prev => ({ ...prev, name: val }));
    if (val.length > 2) {
      setFilteredFeats(srdFeatsList.filter(s => s.name.toLowerCase().includes(val.toLowerCase())));
      setShowSrdDropdown(true);
    } else setShowSrdDropdown(false);
  };

  const handleSelectSrdFeat = async (url) => {
    setShowSrdDropdown(false);
    const details = await fetchTraitOrFeatureDetails(url);
    if (details) {
      setNewFeat(prev => ({ ...prev, name: details.name, desc: details.desc }));
    }
  };

  const handleSaveToVault = async (e) => {
    e.preventDefault();
    if (!newFeat.name) return;
    
    const featToSave = { ...newFeat, id: `feat_${Date.now()}` };
    const vaultRef = doc(db, 'campaign', 'feat_vault');
    
    await setDoc(vaultRef, { feats: [featToSave, ...vaultFeats] }, { merge: true });
    setNewFeat({ name: '', desc: '', hasTracker: false, trackerMax: 1, trackerRecharge: 'long' });
  };

  const handleDeleteFromVault = (featId) => {
    setDialog({
      isOpen: true, title: 'Delete Feat', message: 'Permanently remove this feature from the DM Vault?', type: 'confirm',
      onConfirm: async () => {
        const updatedFeats = vaultFeats.filter(s => s.id !== featId);
        await updateDoc(doc(db, 'campaign', 'feat_vault'), { feats: updatedFeats });
        closeDialog();
      }
    });
  };

  const handleAssign = async (feat, targetId) => {
    if (!targetId) return;

    const isPlayer = playerData.some(p => p.id === targetId);
    
    try {
      const formattedFeature = { name: feat.name, desc: feat.desc, isDefensive: false };

      if (isPlayer) {
        let updates = { features: arrayUnion(formattedFeature) };
        if (feat.hasTracker) {
            const newRes = { id: `res_${Date.now()}`, name: feat.name, max: Number(feat.trackerMax), current: Number(feat.trackerMax), recharge: feat.trackerRecharge, isPool: false };
            const charSnap = await getDoc(doc(db, 'characters', targetId));
            if (charSnap.exists()) {
                const currentRes = charSnap.data().resources || [];
                updates.resources = [...currentRes, newRes];
            }
        }
        await updateDoc(doc(db, 'characters', targetId), updates);
      } else {
        await updateDoc(doc(db, 'active_enemies', targetId), { features: arrayUnion(formattedFeature) });
      }
      setDialog({ isOpen: true, title: 'Success', message: `${feat.name} injected into target's sheet.`, type: 'alert', onConfirm: closeDialog });
      setAssignTargets(prev => ({ ...prev, [feat.id]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-6xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
          
          <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-amber-500 rounded-t-xl shrink-0 relative z-10">
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
              <Sparkles className="w-6 h-6" /> Feat & Trait Vault
            </h2>
            <button onClick={onClose} className="text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-5 h-5 font-black" />
            </button>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-950 relative z-10">
            
            <div className="space-y-6">
              <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <h3 className="font-black text-amber-400 mb-4 border-b-2 border-slate-950 pb-2 flex items-center gap-2 uppercase tracking-widest text-sm drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  <Plus className="w-4 h-4" /> Forge / Fetch Feature
                </h3>
                
                <form onSubmit={handleSaveToVault} className="space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Search className="w-3 h-3"/> Feature Name (SRD)</label>
                    <input type="text" required value={newFeat.name} onChange={handleNameChange} className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-amber-500 shadow-inner" placeholder="e.g. Action Surge" />
                    
                    {showSrdDropdown && filteredFeats.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-slate-900 border-2 border-slate-950 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] z-50">
                        {filteredFeats.map(s => (
                          <div key={s.index} onClick={() => handleSelectSrdFeat(s.url)} className="px-4 py-3 text-sm font-bold text-slate-300 hover:bg-amber-500 hover:text-slate-950 cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-900">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={newFeat.hasTracker} onChange={(e) => setNewFeat({...newFeat, hasTracker: e.target.checked})} className="w-4 h-4 rounded border-slate-600 text-amber-500 bg-slate-800 focus:ring-amber-500" />
                        <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Assign Usage Tracker?</span>
                    </label>
                    
                    {newFeat.hasTracker && (
                        <div className="flex gap-4 animate-in fade-in">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Slots</label>
                            <input type="number" value={newFeat.trackerMax} onChange={(e) => setNewFeat({...newFeat, trackerMax: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recharges On</label>
                            <select value={newFeat.trackerRecharge} onChange={(e) => setNewFeat({...newFeat, trackerRecharge: e.target.value})} className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500">
                            <option value="short">Short Rest</option>
                            <option value="long">Long Rest</option>
                            <option value="none">Never</option>
                            </select>
                        </div>
                        </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Description & Effects</label>
                    <textarea required value={newFeat.desc} onChange={e => setNewFeat({...newFeat, desc: e.target.value})} className="w-full min-h-[120px] bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-slate-300 font-medium text-sm focus:outline-none focus:border-amber-500 shadow-inner resize-y leading-relaxed" placeholder="Detailed feature mechanics..."></textarea>
                  </div>

                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none mt-6">
                    <Send className="w-4 h-4 font-black" /> Save to Vault
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-4 lg:border-l-[3px] lg:border-slate-900 lg:pl-8">
              <h3 className="font-black text-white border-b-[3px] border-slate-900 pb-3 flex items-center gap-2 uppercase tracking-widest text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <Award className="w-6 h-6 text-amber-500" /> Vault Inventory
              </h3>

              {vaultFeats.length === 0 ? (
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 bg-slate-900 p-8 rounded-2xl border-2 border-slate-950 border-dashed text-center shadow-inner mt-4">Vault is empty.</p>
              ) : (
                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                  {vaultFeats.map((feat) => (
                    <div key={feat.id} className="bg-slate-900 border-[3px] border-slate-950 rounded-xl overflow-hidden flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                      
                      <div className="p-4 bg-slate-900 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2">
                           <div>
                             <h4 className="font-black text-white text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">{feat.name}</h4>
                             {feat.hasTracker && <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1 block">Has Tracker ({feat.trackerMax} / {feat.trackerRecharge})</span>}
                           </div>
                           <button onClick={() => handleDeleteFromVault(feat.id)} className="text-slate-500 hover:text-red-500 bg-slate-950 hover:bg-red-950 border-2 border-slate-900 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"><Trash2 className="w-4 h-4 font-black" /></button>
                        </div>
                        
                        <p className="text-xs text-slate-300 font-bold leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">{feat.desc}</p>
                        
                        <div className="flex gap-2 w-full mt-2 pt-3 border-t-2 border-slate-950">
                           <select 
                             value={assignTargets[feat.id] || ''} 
                             onChange={(e) => setAssignTargets(prev => ({...prev, [feat.id]: e.target.value}))}
                             className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-lg px-2 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-500 shadow-inner"
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
                             onClick={() => handleAssign(feat, assignTargets[feat.id])}
                             disabled={!assignTargets[feat.id]}
                             className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none shrink-0 text-[10px]"
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