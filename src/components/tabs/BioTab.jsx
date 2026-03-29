import React from 'react';
import { BookOpen, User, UploadCloud, DownloadCloud } from 'lucide-react';
import DebouncedTextarea from '../shared/DebouncedTextarea';

export default function BioTab({ char, charId, isDM, updateField, activeTheme, THEMES, restoreCharacter }) {

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
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (restoreCharacter) {
           restoreCharacter(importedData);
        }
      } catch (err) {
        console.error("Failed to parse character data:", err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${activeTheme.bg} blur-[100px] opacity-10 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 relative z-10 border-b border-slate-700/50 pb-2 uppercase tracking-widest drop-shadow-sm">
          <User className={`w-5 h-5 ${activeTheme.text}`} /> Physical Appearance
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Age', field: 'age', placeholder: 'e.g. 24' },
            { label: 'Height', field: 'height', placeholder: 'e.g. 5\'10"' },
            { label: 'Weight', field: 'weight', placeholder: 'e.g. 160 lbs' },
            { label: 'Eyes', field: 'eyes', placeholder: 'e.g. Emerald' },
            { label: 'Skin', field: 'skin', placeholder: 'e.g. Fair' },
            { label: 'Hair', field: 'hair', placeholder: 'e.g. Black' }
          ].map((item) => (
            <div key={item.field} className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 shadow-inner group focus-within:border-slate-500 transition-colors">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 group-focus-within:text-slate-300 transition-colors">{item.label}</label>
              <input 
                type="text" 
                value={char[item.field] || ''} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateField(item.field, e.target.value)}
                placeholder={item.placeholder}
                disabled={isDM}
                className="w-full bg-transparent text-white text-sm font-bold focus:outline-none placeholder-slate-700"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
        <div className={`absolute bottom-0 left-0 w-64 h-64 ${activeTheme.bg} blur-[100px] opacity-10 rounded-full pointer-events-none`}></div>
        
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 relative z-10 border-b border-slate-700/50 pb-2 uppercase tracking-widest drop-shadow-sm">
          <BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Backstory & Lore
        </h3>
        
        <div className="flex-1 relative z-10 bg-slate-900/80 rounded-xl border border-slate-700/50 shadow-inner overflow-hidden focus-within:border-slate-500 transition-colors">
          <DebouncedTextarea 
            initialValue={char.backstory || ''} 
            onSave={(val) => updateField('backstory', val)} 
            disabled={isDM}
            placeholder="Where did you come from? What drives you?"
            className="w-full h-full min-h-[300px] p-5 bg-transparent text-slate-300 text-sm focus:outline-none resize-none leading-relaxed custom-scrollbar font-medium" 
          />
        </div>
      </div>

      {!isDM && (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Character Backup</h3>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleExport}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors border border-slate-600 flex items-center gap-2 shadow-sm"
              >
                <DownloadCloud className="w-4 h-4" /> Download JSON
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-colors border border-slate-600 flex items-center gap-2 shadow-sm">
                  <UploadCloud className="w-4 h-4" /> Restore JSON
                </button>
              </div>
           </div>
           <p className="text-[10px] text-slate-500 mt-4 max-w-sm mx-auto">
             Restoring from a JSON backup will permanently overwrite this character's current stats, inventory, and lore.
           </p>
        </div>
      )}

    </div>
  );
}