import React, { useState } from 'react';
import { Save, BookOpen } from 'lucide-react';

export default function BioTab({ char, updateField, activeTheme }) {
  const [backstoryDraft, setBackstoryDraft] = useState(char.backstory || '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Physical Appearance & Traits */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-2">
          <BookOpen className={`w-4 h-4 ${activeTheme.text}`} /> Roleplay Traits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Personality</label>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">{char.traits?.personality || 'None'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ideals</label>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">{char.traits?.ideal || 'None'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bonds</label>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">{char.traits?.bond || 'None'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Flaws</label>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">{char.traits?.flaws || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Backstory Editor */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm flex flex-col h-[500px]">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <BookOpen className={`w-4 h-4 ${activeTheme.text}`} /> Backstory
          </h3>
          {backstoryDraft !== (char.backstory || '') && (
            <button onClick={() => updateField('backstory', backstoryDraft)} className={`flex items-center gap-2 ${activeTheme.bg} hover:opacity-80 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-md`}>
              <Save className="w-3 h-3" /> Save Changes
            </button>
          )}
        </div>
        <textarea
          value={backstoryDraft}
          onChange={(e) => setBackstoryDraft(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-slate-600 custom-scrollbar"
          placeholder="Write your character's history here..."
        />
      </div>

    </div>
  );
}