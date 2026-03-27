import React from 'react';

const PUBLIC_IMAGES = [
  { label: 'Bengo Map Token', url: '/bengo_bm.png' },
  { label: 'Chauzy Map', url: '/chauzy_map.png' },
  { label: 'Geepo Map Token', url: '/geepo_bm.png' },
  { label: 'Kehrfuffle Full', url: '/kehrfuffle.png' },
  { label: 'Kehrfuffle Token', url: '/kehrfuffle_bm.png' },
  { label: 'Leeta Map Token', url: '/leeta_bm.png' },
  { label: 'Screwbeard Token', url: '/screwbeard_bm.png' },
  { label: 'Screwbeard Cave', url: '/screwbeard_cave_enc.png' },
  { label: 'Tutorial Forest', url: '/tutorial_forest_enc.png' },
  { label: 'Wendy Full', url: '/wendy.png' },
  { label: 'Wendy Token', url: '/wendy_bm.png' }
];

export default function ImageSelector({ value, onChange, placeholder = "Or select a local file..." }) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mt-2"
    >
      <option value="">{placeholder}</option>
      {PUBLIC_IMAGES.map((img, idx) => (
        <option key={idx} value={img.url}>{img.label}</option>
      ))}
    </select>
  );
}