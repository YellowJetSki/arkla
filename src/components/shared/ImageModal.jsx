import { X } from 'lucide-react';

export default function ImageModal({ isOpen, url, alt, onClose }) {
  if (!isOpen || !url) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }} 
        className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-lg z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>
      
      <img 
        src={url} 
        alt={alt} 
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90dvh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative z-40"
        onError={(e) => { e.target.src = 'https://via.placeholder.com/800?text=Image+Not+Found'; }}
      />
    </div>
  );
}