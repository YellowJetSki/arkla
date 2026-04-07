import { BookOpen } from 'lucide-react';
import ImageSelector from '../shared/ImageSelector';

export default function StepLore({ formData, updateField }) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 text-indigo-400 border-b border-slate-800 pb-2 mb-4">
        <BookOpen className="w-5 h-5" /> <h3 className="font-bold uppercase tracking-widest text-sm">Lore & Aesthetics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageSelector 
          label="Sheet Portrait"
          value={formData.imageUrl}
          onChange={(val) => updateField('imageUrl', val)}
          inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <ImageSelector 
          label="Battle Token"
          value={formData.tokenImg}
          onChange={(val) => updateField('tokenImg', val)}
          inputClassName="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
        />
      </div>
      
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Physical Appearance (Optional)</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Age', field: 'age', placeholder: 'e.g. 24' },
            { label: 'Height', field: 'height', placeholder: 'e.g. 5\'10"' }
          ].map((item) => (
            <div key={item.field} className="bg-slate-950 border border-slate-700 rounded-lg p-2 focus-within:border-indigo-500 transition-colors">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{item.label}</span>
              <input 
                type="text" 
                value={formData[item.field] || ''} 
                onChange={(e) => updateField(item.field, e.target.value)} 
                placeholder={item.placeholder}
                className="w-full bg-transparent text-white text-xs font-bold focus:outline-none placeholder-slate-700" 
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</label>
        <input 
          type="text" 
          onFocus={(e) => e.target.select()} 
          value={formData.alignment} 
          onChange={e => updateField('alignment', e.target.value)} 
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner" 
          placeholder="e.g. Chaotic Neutral" 
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Backstory</label>
        <textarea 
          value={formData.backstory} 
          onChange={e => updateField('backstory', e.target.value)} 
          className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 shadow-inner resize-y custom-scrollbar" 
          placeholder="Where did you come from? What drives you?" 
        />
      </div>
    </div>
  );
}