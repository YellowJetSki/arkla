import React, { useState } from 'react';
import { Palette, Download, Upload, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';
import DialogModal from '../shared/DialogModal';

export default function SettingsTab({ char, updateField, activeTheme, THEMES, restoreCharacter }) {
  const [fileError, setFileError] = useState('');
  
  // Hook into the global DialogModal system
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));

  const handleExport = () => {
    const dataStr = JSON.stringify(char, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${char.name.replace(/\s+/g, '_').toLowerCase()}_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.name || !importedData.stats) throw new Error("Invalid format");
        
        // Trigger the global DialogModal
        setDialog({
          isOpen: true,
          title: 'Overwrite Character?',
          message: 'This will completely overwrite your current character with the data from the backup file. This cannot be undone. Proceed?',
          type: 'confirm',
          onConfirm: () => {
            restoreCharacter(importedData);
            closeDialog();
          }
        });

      } catch (err) {
        setFileError("Invalid character backup file.");
        setTimeout(() => setFileError(''), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* Global Dialog Modal */}
      <DialogModal 
        isOpen={dialog.isOpen} 
        title={dialog.title} 
        message={dialog.message} 
        type={dialog.type} 
        onConfirm={dialog.onConfirm} 
        onCancel={closeDialog} 
      />

      {/* App Setup & Tutorial */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> App Setup
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Need to review the rules, see the welcome guide, or re-select your theme? You can replay the initial startup tutorial here.
        </p>
        <button 
          onClick={() => updateField('hasCompletedTutorial', false)} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 px-6 rounded-lg border border-amber-900/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Replay Startup Tutorial
        </button>
      </div>

      {/* Theme Settings */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" /> Interface Theme
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(THEMES).map(([themeName, themeClasses]) => (
            <button
              key={themeName}
              onClick={() => updateField('theme', themeName)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${char.theme === themeName ? `border-${themeName}-500 bg-slate-800` : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
            >
              <div className={`w-6 h-6 rounded-full ${themeClasses.bg} shadow-sm`}></div>
              <span className="text-xs font-bold text-slate-300 capitalize">{themeName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Character Backup */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" /> Character Backup
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Export your character sheet to save it locally, or restore from a previous backup file if you made a mistake.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-2.5 rounded-lg border border-emerald-900/50 transition-colors">
            <Download className="w-4 h-4" /> Export Backup
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-lg border border-amber-900/50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Restore Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {fileError && (
          <p className="text-xs text-red-400 font-bold mt-3 text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" /> {fileError}
          </p>
        )}
      </div>

    </div>
  );
}