import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Image as ImageIcon, X, Send, Trash2, Eye, AlertTriangle } from 'lucide-react';

export default function DMHandoutManager({ onClose }) {
  const [handouts, setHandouts] = useState([]);
  const [newHandout, setNewHandout] = useState({ name: '', url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen to the live shared loot/handout database
  useEffect(() => {
    const lootRef = doc(db, 'campaign', 'shared_loot');
    const unsub = onSnapshot(lootRef, (docSnap) => {
      if (docSnap.exists()) {
        setHandouts(docSnap.data().items || []);
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
      
      // Update the array and set the 'latestShareId'. 
      // The player's CharacterCard listens for 'latestShareId' to trigger the fullscreen popup!
      await setDoc(lootRef, {
        items: [newItem, ...handouts],
        latestShareId: newItem.id
      }, { merge: true });

      setNewHandout({ name: '', url: '' });
    } catch (error) {
      console.error("Error sharing handout:", error);
    }
    setIsSubmitting(false);
  };

  const handleRevoke = async (id) => {
    if (window.confirm("Revoke this image? It will disappear from all player sheets.")) {
      try {
        const lootRef = doc(db, 'campaign', 'shared_loot');
        const updatedItems = handouts.filter(item => item.id !== id);
        await updateDoc(lootRef, { items: updatedItems });
      } catch (error) {
        console.error("Error revoking handout:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md h-[100dvh] overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-4xl shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-500">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/90 rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <ImageIcon className="w-6 h-6" /> Handouts & Visuals
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-800/30">
          
          {/* LEFT: Upload Form */}
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" /> Broadcast New Image
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Paste an image URL here. It will immediately pop up in full screen for all active players and save to their Party Vault.
              </p>
              
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Image Name / Title</label>
                  <input 
                    type="text" 
                    required 
                    value={newHandout.name} 
                    onChange={e => setNewHandout({...newHandout, name: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                    placeholder="e.g. Ancient Map of Arkla" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Image URL</label>
                  <input 
                    type="url" 
                    required 
                    value={newHandout.url} 
                    onChange={e => setNewHandout({...newHandout, url: e.target.value})} 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" 
                    placeholder="https://example.com/map.jpg" 
                  />
                </div>

                {newHandout.url && (
                  <div className="mt-4 p-2 bg-slate-950 rounded-lg border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Preview</p>
                    <img 
                      src={newHandout.url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded shadow-inner"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'; }}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || !newHandout.name || !newHandout.url}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md mt-4"
                >
                  <Send className="w-4 h-4" /> Broadcast to Party
                </button>
              </form>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                When you click broadcast, the image will forcefully open on every player's device. Once they close it, it remains accessible in their "Party Loot" tab until you revoke it.
              </p>
            </div>
          </div>

          {/* RIGHT: Active Handouts */}
          <div className="space-y-4 lg:border-l lg:border-slate-700 lg:pl-8">
            <h3 className="font-bold text-white border-b border-slate-700 pb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" /> Currently Shared Visuals
            </h3>

            {handouts.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-slate-800 p-4 rounded-xl border border-slate-700">No images are currently shared with the party.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {handouts.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg group relative">
                    <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3 bg-slate-800 flex justify-between items-center">
                      <h4 className="font-bold text-white text-sm truncate mr-2">{item.name}</h4>
                      <button 
                        onClick={() => handleRevoke(item.id)} 
                        className="text-slate-500 hover:text-red-400 bg-slate-900 p-1.5 rounded transition-colors shrink-0"
                        title="Revoke Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}