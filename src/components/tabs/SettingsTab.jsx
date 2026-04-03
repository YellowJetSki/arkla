import React, { useState } from 'react';
import { Palette, Download, Upload, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';
import DialogModal from '../shared/DialogModal';

export default function SettingsTab({ char, updateField, activeTheme, THEMES, restoreCharacter }) {
  const [fileError, setFileError] = useState('');
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
    e.target.value = ''; 
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      <DialogModal 
        isOpen={dialog.isOpen} 
        title={dialog.title} 
        message={dialog.message} 
        type={dialog.type} 
        onConfirm={dialog.onConfirm} 
        onCancel={closeDialog} 
      />

      {/* App Setup & Tutorial */}
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          <Sparkles className="w-5 h-5 text-amber-400" /> App Setup
        </h3>
        <p className="text-xs font-bold text-slate-400 mb-5 leading-relaxed">
          Need to review the rules, see the welcome guide, or re-select your theme? You can replay the initial startup tutorial here.
        </p>
        <button 
          onClick={() => updateField('hasCompletedTutorial', false)} 
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest py-3 px-6 rounded-xl border-2 border-slate-950 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]"
        >
          <RotateCcw className="w-5 h-5" /> Replay Tutorial
        </button>
      </div>

      {/* Theme Settings */}
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-5 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          <Palette className="w-5 h-5 text-indigo-400" /> Interface Theme
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(THEMES).map(([themeName, themeClasses]) => (
            <button
              key={themeName}
              onClick={() => updateField('theme', themeName)}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] ${char.theme === themeName ? `border-slate-950 bg-slate-950 ring-2 ring-offset-2 ring-offset-slate-800 ring-${themeName}-500` : 'border-slate-950 bg-slate-900 hover:bg-slate-950'}`}
            >
              <div className={`w-8 h-8 rounded-full ${themeClasses.bg} border-2 border-slate-950 shadow-inner`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{themeName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Character Backup */}
      <div className="bg-slate-800 border-[3px] border-slate-950 rounded-2xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          <Download className="w-5 h-5 text-emerald-400" /> Character Backup
        </h3>
        <p className="text-xs font-bold text-slate-400 mb-5 leading-relaxed">
          Export your character sheet to save it locally, or restore from a previous backup file.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black uppercase tracking-widest py-3 rounded-xl border-2 border-slate-950 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]">
            <Download className="w-5 h-5" /> Export JSON
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-black uppercase tracking-widest py-3 rounded-xl border-2 border-slate-950 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] cursor-pointer">
            <Upload className="w-5 h-5" /> Restore JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        {fileError && (
          <p className="text-xs text-red-500 font-black uppercase tracking-widest mt-4 text-center flex items-center justify-center gap-1 bg-red-950 p-2 rounded-lg border-2 border-slate-950">
            <ShieldAlert className="w-4 h-4" /> {fileError}
          </p>
        )}
      </div>

    </div>
  );
}