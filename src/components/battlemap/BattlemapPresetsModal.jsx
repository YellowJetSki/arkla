import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Map } from 'lucide-react';
import { collection, getDocs, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DialogModal from '../shared/DialogModal';

export default function BattlemapPresetsModal({ isOpen, onClose, currentMapData, currentTokens, activeEnemies, onRestorePreset }) {
  const [presets, setPresets] = useState({});
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (!isOpen) return;
    const loadPresets = async () => {
      const snap = await getDoc(doc(db, 'campaign', 'battlemap_presets'));
      if (snap.exists()) setPresets(snap.data().presets || {});
    };
    loadPresets();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    setIsSaving(true);
    
    const cleanMapData = { ...currentMapData, isPublished: false };
    
    const enemyTokens = Object.keys(currentTokens).reduce((acc, key) => {
      if (currentTokens[key].type === 'enemy') {
        const fullEntityData = activeEnemies.find(e => e.id === key) || {};
        acc[key] = { ...currentTokens[key], entityData: fullEntityData };
      }
      return acc;
    }, {});
    
    const updatedPresets = {
      ...presets,
      [newPresetName]: {
        mapData: cleanMapData,
        tokens: enemyTokens,
        savedAt: new Date().toISOString()
      }
    };
    
    await setDoc(doc(db, 'campaign', 'battlemap_presets'), { presets: updatedPresets }, { merge: true });
    setPresets(updatedPresets);
    setNewPresetName('');
    setIsSaving(false);
  };

  const handleDeletePreset = (name) => {
    setDialog({
      isOpen: true,
      title: 'Delete Preset',
      message: `Are you sure you want to permanently delete preset "${name}"?`,
      type: 'confirm',
      onConfirm: async () => {
        const updatedPresets = { ...presets };
        delete updatedPresets[name];
        await setDoc(doc(db, 'campaign', 'battlemap_presets'), { presets: updatedPresets });
        setPresets(updatedPresets);
        closeDialog();
      }
    });
  };

  const handleDeploy = (name, data) => {
    const safeData = {
      mapData: data.mapData || { cols: 20, rows: 15, imageUrl: '' },
      tokens: data.tokens || {}
    };

    setDialog({
      isOpen: true,
      title: 'Deploy Preset',
      message: `Deploying "${name}" will wipe the current active enemies and replace them with this preset's enemies. Proceed?`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          // Erase all existing Active Enemies
          const activeSnap = await getDocs(collection(db, 'active_enemies'));
          const batch = writeBatch(db);
          activeSnap.docs.forEach(d => {
            batch.delete(doc(db, 'active_enemies', d.id));
          });
          
          // Repopulate with preset enemies
          Object.keys(safeData.tokens).forEach(tokenId => {
            const token = safeData.tokens[tokenId];
            if (token.type === 'enemy' && token.entityData) {
              const enemyRef = doc(db, 'active_enemies', tokenId);
              batch.set(enemyRef, { ...token.entityData, id: tokenId });
            }
          });
          
          await batch.commit();

          onRestorePreset(safeData);
          closeDialog();
          onClose();
        } catch(e) {
          console.error("Failed to deploy preset:", e);
          setDialog({ isOpen: true, title: 'Error', message: 'Failed to deploy preset to database.', type: 'alert' });
        }
      },
      onCancel: closeDialog
    });
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border-[3px] border-slate-950 rounded-2xl w-full max-w-xl shadow-[12px_12px_0px_rgba(0,0,0,1)] flex flex-col max-h-[85dvh] overflow-hidden">
          
          <div className="flex justify-between items-center p-4 border-b-[3px] border-slate-950 bg-indigo-500 shrink-0">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]">
              <Map className="w-5 h-5" /> Encounter Presets
            </h2>
            <button onClick={onClose} className="text-slate-950 hover:text-white transition-colors bg-indigo-400 hover:bg-indigo-600 p-1.5 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
              <X className="w-5 h-5 font-black" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6 bg-slate-950">
            
            <div className="bg-slate-900 border-[3px] border-slate-950 shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-xl p-5">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b-2 border-slate-950 pb-2">Save Current Board State</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={newPresetName}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Goblin Ambush..."
                  className="flex-1 bg-slate-950 border-2 border-slate-900 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <button 
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim() || isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-950 font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all border-2 border-slate-950 flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none shrink-0"
                >
                  <Save className="w-4 h-4 font-black" /> Save
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b-2 border-slate-900 pb-2">Saved Encounters</h3>
              {Object.keys(presets).length === 0 ? (
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500 text-center py-6 bg-slate-900 border-2 border-slate-950 border-dashed rounded-xl shadow-inner">No presets saved yet.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.entries(presets).map(([name, data]) => (
                    <div key={name} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-4 rounded-xl border-[3px] border-slate-950 shadow-[4px_4px_0px_rgba(0,0,0,1)] gap-4">
                      <div>
                        <h4 className="font-black text-white text-lg uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          <span className="text-indigo-400">{Object.keys(data.tokens || {}).length} Enemies</span> • {data.mapData?.cols || 20}x{data.mapData?.rows || 15} Grid
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleDeploy(name, data)} 
                          className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                        >
                          <Upload className="w-3.5 h-3.5 font-black" /> Deploy
                        </button>
                        <button 
                          onClick={() => handleDeletePreset(name)} 
                          className="text-slate-500 bg-slate-950 hover:text-red-500 hover:bg-red-950 border-2 border-slate-900 hover:border-red-900 p-2 rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
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
    </>
  );
}