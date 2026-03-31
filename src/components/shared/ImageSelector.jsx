import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

const PUBLIC_IMAGES = [
  { 
    category: 'Battle Maps', 
    urls: ['/tutorial_forest_enc.png', '/screwbeard_cave_enc.png', '/chauzy_map.png'] 
  },
  { 
    category: 'Tokens', 
    urls: ['/bengo_bm.png', '/geepo_bm.png', '/kehrfuffle_bm.png', '/leeta_bm.png', '/screwbeard_bm.png', '/strider_bm.png', '/wendy_bm.png'] 
  },
  { 
    category: 'Portraits & Art', 
    urls: ['/kehrfuffle.png', '/strider.png', '/wendy.png', '/icon.png'] 
  }
];

export default function ImageSelector({ value, onChange, label = "Image URL", placeholder = "https://...", inputClassName = "", iconColor = "text-slate-400" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <label className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
        <span className="flex items-center gap-1"><ImageIcon className={`w-3 h-3 ${iconColor}`} /> {label}</span>
        <button 
          type="button" 
          onClick={() => setIsOpen(true)} 
          className="text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 px-2 py-0.5 rounded transition-colors shadow-sm"
        >
          Open Gallery
        </button>
      </label>
      
      <input 
        type="url" 
        value={value} 
        onFocus={(e) => e.target.select()} 
        onChange={(e) => onChange(e.target.value)} 
        className={inputClassName || "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner"} 
        placeholder={placeholder} 
      />
      
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Asset Gallery
                </h3>
                <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded bg-slate-900 border border-slate-700"><X className="w-4 h-4"/></button>
              </div>
              
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {PUBLIC_IMAGES.map(group => (
                  <div key={group.category}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">{group.category}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {group.urls.map(url => (
                        <button 
                          key={url} 
                          type="button" 
                          onClick={() => { onChange(url); setIsOpen(false); }} 
                          className="aspect-square bg-slate-950 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all group relative focus:outline-none"
                        >
                          <img src={url} alt={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                            <span className="text-[10px] text-white font-bold text-center break-all leading-tight">{url.split('/').pop()}</span>
                            <span className="text-[8px] text-indigo-400 uppercase tracking-widest mt-2 bg-indigo-900/50 px-2 py-0.5 rounded">Select</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}