import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Map } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    
    // Grabs the token data AND merges it with the deep entity stats (actions, flavor, etc.)
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
    setDialog({
      isOpen: true,
      title: 'Deploy Preset',
      message: `Deploying "${name}" will wipe the current active enemies and replace them with this preset's enemies. Proceed?`,
      type: 'confirm',
      onConfirm: () => {
        onRestorePreset(data);
        closeDialog();
        onClose();
      }
    });
  };

  return (
    <>
      <DialogModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} onCancel={closeDialog} />

      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
          
          <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 shrink-0">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-400" /> Encounter Presets
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg border border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            
            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3">Save Current Board State</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Goblin Ambush..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim() || isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Saved Encounters</h3>
              {Object.keys(presets).length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-6">No presets saved yet. Build a map and hit save!</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(presets).map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 group hover:border-slate-600 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-200">{name}</h4>
                        <p className="text-[10px] text-slate-500">{Object.keys(data.tokens).length} Enemies • {data.mapData.cols}x{data.mapData.rows} Grid</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDeploy(name, data)} 
                          className="bg-emerald-900/40 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-900/50 hover:border-transparent"
                        >
                          <Upload className="w-3 h-3" /> Deploy
                        </button>
                        <button onClick={() => handleDeletePreset(name)} className="text-slate-500 hover:text-red-400 p-1.5 transition-colors">
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