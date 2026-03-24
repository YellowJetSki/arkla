import { useRef } from 'react';
import { Sparkles, BookOpen, Download, Upload, Database } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

export default function BioTab({ char, charId, isDM, updateField, activeTheme, THEMES, restoreCharacter }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(char, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Cleans up the name for the file (e.g. "Wendy_Warmwind_Backup.json")
    const safeName = (char.name || 'Character').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `arkla_${safeName}_backup.json`;
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
        if (importedData && importedData.name) {
          await restoreCharacter(importedData);
        } else {
          alert("Invalid character backup file.");
        }
      } catch (err) {
        console.error("Error parsing JSON", err);
        alert("Could not read the backup file. It might be corrupted.");
      }
      // Reset input so they can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        
        {/* THEME PICKER */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-slate-300 text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Signature Theme Color
          </h4>
          <div className="flex gap-3">
            {Object.keys(THEMES).map(t => (
              <button 
                key={t} 
                onClick={() => updateField('theme', t)} 
                className={`w-8 h-8 rounded-full ${THEMES[t].bg} ${char.theme === t || (!char.theme && t === 'indigo') ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110' : 'opacity-50 hover:opacity-100'} transition-all`}
                title={`Select ${t} theme`}
              ></button>
            ))}
          </div>
        </div>

        {/* NEW: CHARACTER SAFETY NET */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-slate-300 text-sm mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> Character Data Backup
          </h4>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">Download your sheet to your device, or restore it from a previous save file. This instantly syncs with the DM.</p>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className={`flex-1 flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-700 ${activeTheme.text} border ${activeTheme.border} py-2 rounded-lg text-sm font-bold transition-colors`}
            >
              <Download className="w-4 h-4" /> Export
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-600 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <Upload className="w-4 h-4" /> Restore
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
            />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2 px-1"><BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Personality Traits</h3>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(char.traits || {}).map(([key, val]) => (
            <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
              <h4 className={`font-bold ${activeTheme.text} capitalize text-xs tracking-wider mb-2`}>{key}</h4>
              <p className="text-slate-300 text-sm italic">"{val}"</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2 px-1"><BookOpen className={`w-5 h-5 ${activeTheme.text}`} /> Lore & Legend</h3>
        <CollapsibleSection title="Character Backstory" defaultOpen={true}>
          {isDM ? (
            <textarea 
              defaultValue={char.backstory || ''} 
              onBlur={(e) => updateField('backstory', e.target.value)} 
              className={`w-full min-h-[300px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:${activeTheme.border} resize-y leading-relaxed custom-scrollbar`} 
            />
          ) : (
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{char.backstory || ''}</div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}