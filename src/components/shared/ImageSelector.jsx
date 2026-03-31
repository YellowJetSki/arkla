import { Image as ImageIcon } from 'lucide-react';

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

export default function ImageSelector({ value, onChange, label = "Image Selection", inputClassName = "", iconColor = "text-slate-400" }) {
  return (
    <div>
      <label className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 gap-1">
        <ImageIcon className={`w-3 h-3 ${iconColor}`} /> {label}
      </label>
      
      <select 
        value={PUBLIC_IMAGES.some(g => g.urls.includes(value)) ? value : ""} 
        onChange={(e) => onChange(e.target.value)} 
        className={inputClassName || "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 shadow-inner appearance-none cursor-pointer"}
      >
        <option value="" disabled>Select an image...</option>
        
        {PUBLIC_IMAGES.map(group => (
          <optgroup key={group.category} label={`— ${group.category} —`} className="bg-slate-900 text-indigo-300 font-black italic mt-2">
            {group.urls.map(url => (
              <option key={url} value={url} className="text-white font-medium not-italic bg-slate-800">
                {url.replace('/', '')}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}