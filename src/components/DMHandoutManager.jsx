import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Image as ImageIcon, X, Send, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ImageSelector from './shared/ImageSelector';
import DialogModal from './shared/DialogModal';

export default function DMHandoutManager({ onClose }) {
  const [handouts, setHandouts] = useState([]);
  const [currentDisplayId, setCurrentDisplayId] = useState(null);
  const [newHandout, setNewHandout] = useState({ name: '', url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsub = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHandouts(data.items || []);
        setCurrentDisplayId(data.displayHandoutId !== undefined ? data.displayHandoutId : data.latestShareId);
      }
    });
    return () => unsub();
  }, []);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!newHandout.name || !newHandout.url) return;
    setIsSubmitting(true);

    try {
      const newItem = {
        id: `handout_${Date.now()}`,
        name: newHandout.name,
        url: newHandout.url
      };

      const lootRef = doc(db, 'campaign', 'shared_loot');
      
      await setDoc(lootRef, {
        items: [newItem, ...handouts],
        latestShareId: newItem.id,
        displayHandoutId: newItem.id
      }, { merge: true });

      setNewHandout({ name: '', url: '' });
    } catch (error) {
      console.error("Error sharing handout:", error);
    }
    setIsSubmitting(false);
  };

  const handleRebroadcast = async (item) => {
    try {
      const newId = `${item.id}_${Date.now()}`;
      const lootRef = doc(db, 'campaign', 'shared_loot');
      await updateDoc(lootRef, { 
        latestShareId: newId,
        displayHandoutId: newId
      });
    } catch (error) {
      console.error("Error rebroadcasting handout:", error);
    }
  };

  const handleHideFromDisplay = async () => {
    try {
      const lootRef = doc(db, 'campaign', 'shared_loot');
      await updateDoc(lootRef, { displayHandoutId: null });
    } catch (error) {
      console.error("Error hiding handout:", error);
    }
  };

  const handleRevoke = (id) => {
    setDialog({
      isOpen: true,
      title: 'Revoke Handout',
      message: "Revoke this image? It will completely disappear from all player sheets.",
      type: 'confirm',
      onConfirm: async () => {
        try {
          const lootRef = doc(db, 'campaign', 'shared_loot');
          const updatedItems = handouts.filter(item => item.id !== id);
          
          const updates = { items: updatedItems };
          if (currentDisplayId && currentDisplayId.startsWith(id)) {
            updates.displayHandoutId = null;
          }

          await updateDoc(lootRef, updates);
        } catch (error) {
          console.error("Error revoking handout:", error);
        }
        closeDialog();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />
      
      <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-4xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Solid Color Header */}
        <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-emerald-500 rounded-t-xl shrink-0 relative z-10">
          <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
            <ImageIcon className="w-6 h-6" /> Handouts & Visuals
          </h2>
          <button onClick={onClose} className="text-slate-950 hover:text-white transition-colors bg-emerald-400 hover:bg-emerald-600 p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
            <X className="w-5 h-5 font-black" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-950 relative z-10">
          
          {/* Left Column: Broadcast */}
          <div className="space-y-6">
            <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-emerald-400 mb-4 border-b-2 border-slate-950 pb-2 flex items-center gap-2 uppercase tracking-widest text-sm drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <Send className="w-4 h-4" /> Broadcast New Image
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-5 leading-relaxed uppercase tracking-wider">
                Paste an image URL here or select a local file. It will immediately pop up in full screen for all active players and save to their Party Vault.
              </p>
              
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Image Name / Title</label>
                  <input 
                    type="text" 
                    required 
                    value={newHandout.name} 
                    onChange={e => setNewHandout({...newHandout, name: e.target.value})} 
                    className="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner" 
                    placeholder="e.g. Ancient Map of Arkla" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Direct Image URL</label>
                  <ImageSelector 
                    value={newHandout.url} 
                    onChange={(url) => setNewHandout({...newHandout, url})} 
                    iconColor="text-emerald-500"
                    inputClassName="w-full bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                {newHandout.url && (
                  <div className="mt-4 p-3 bg-slate-950 rounded-xl border-2 border-slate-900 shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Preview</p>
                    <img 
                      src={newHandout.url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg border-2 border-slate-950 shadow-inner"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'; }}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || !newHandout.name || !newHandout.url}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none mt-6"
                >
                  <Send className="w-4 h-4 font-black" /> Broadcast to Party
                </button>
              </form>
            </div>

            <div className="bg-indigo-950 p-4 rounded-xl border-2 border-indigo-900 flex items-start gap-3 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
              <p className="text-[10px] md:text-xs font-bold text-indigo-300 uppercase tracking-wider leading-relaxed">
                When you click broadcast, the image will forcefully open on every player's device and stay on the TV Display until you choose to hide it. Players can dismiss it, but it remains accessible in their "Party Loot" tab until you revoke it.
              </p>
            </div>
          </div>

          {/* Right Column: Active Handouts */}
          <div className="space-y-4 lg:border-l-[3px] lg:border-slate-900 lg:pl-8">
            <h3 className="font-black text-white border-b-[3px] border-slate-900 pb-3 flex items-center gap-2 uppercase tracking-widest text-lg drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
              <Eye className="w-6 h-6 text-emerald-500" /> Shared Visuals
            </h3>

            {handouts.filter(i => i.url).length === 0 ? (
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500 bg-slate-900 p-8 rounded-2xl border-2 border-slate-950 border-dashed text-center shadow-inner mt-4">No images are currently shared.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                {handouts.filter(i => i.url).map((item) => {
                  const isCurrentlyDisplayed = currentDisplayId && currentDisplayId.startsWith(item.id);

                  return (
                    <div key={item.id} className={`bg-slate-900 border-[3px] rounded-xl overflow-hidden flex flex-col shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all ${isCurrentlyDisplayed ? 'border-emerald-500' : 'border-slate-950'}`}>
                      <div className="h-32 w-full overflow-hidden bg-slate-950 relative border-b-2 border-slate-950">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-500" />
                        {isCurrentlyDisplayed && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] border-2 border-slate-950 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Live on TV
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-900 flex flex-col gap-3 mt-auto">
                        <h4 className="font-black text-white text-sm truncate drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{item.name}</h4>
                        
                        <div className="flex gap-2 w-full">
                          {isCurrentlyDisplayed ? (
                            <button 
                              onClick={handleHideFromDisplay} 
                              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none flex justify-center items-center gap-1"
                              title="Hide from Display/TV"
                            >
                              <EyeOff className="w-3 h-3" /> Hide
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRebroadcast(item)} 
                              className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none flex justify-center items-center gap-1"
                              title="Force this image to pop up on all screens again"
                            >
                              <Eye className="w-3 h-3" /> Show TV
                            </button>
                          )}
                          <button 
                            onClick={() => handleRevoke(item.id)} 
                            className="bg-slate-900 text-slate-500 hover:text-red-500 hover:bg-slate-800 border-2 border-slate-950 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                            title="Revoke Image"
                          >
                            <Trash2 className="w-4 h-4 font-black" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}