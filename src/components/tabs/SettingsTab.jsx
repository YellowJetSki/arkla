import React, { useState } from 'react';
import { Palette, Download, Upload, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';

export default function SettingsTab({ char, updateField, activeTheme, THEMES, restoreCharacter }) {
  const [fileError, setFileError] = useState('');
  const [importConfirmData, setImportConfirmData] = useState(null);

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
        setImportConfirmData(importedData); // Trigger the custom modal instead of window.confirm
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
      
      {/* CUSTOM IMPORT CONFIRMATION MODAL */}
      {importConfirmData && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5"/> Overwrite Character?
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              This will completely overwrite your current character with the data from the backup file. This cannot be undone. Proceed?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setImportConfirmData(null)} className="px-4 py-2 text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={() => { restoreCharacter(importConfirmData); setImportConfirmData(null); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 transition-colors text-white rounded-lg font-bold text-sm">Confirm Restore</button>
            </div>
          </div>
        </div>
      )}

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