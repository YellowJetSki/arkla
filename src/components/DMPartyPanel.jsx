import { Users, UserPlus } from 'lucide-react';
import DMPlayerCard from './DMPlayerCard';

export default function DMPartyPanel({ unlockedCharacters, setIsBuildingCharacter }) {
  return (
    <aside className="w-full h-[40vh] lg:h-full bg-slate-900 flex flex-col shrink-0">
      <div className="p-4 border-b-[3px] border-slate-950 flex justify-between items-center bg-indigo-600 shrink-0 relative z-10">
         <h2 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
           <Users className="w-5 h-5"/> The Party
         </h2>
         <button 
           onClick={() => setIsBuildingCharacter(true)} 
           className="text-[10px] font-black uppercase tracking-widest bg-indigo-950 text-indigo-400 hover:bg-indigo-900 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 border-2 border-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
         >
           <UserPlus className="w-3 h-3"/> New
         </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-4 bg-slate-800">
         {unlockedCharacters.length === 0 ? (
           <div className="text-center p-6 text-xs text-slate-500 font-bold uppercase tracking-widest border-2 border-slate-950 border-dashed rounded-xl bg-slate-900">
             Waiting for players...
           </div>
         ) : (
           unlockedCharacters.map(id => <DMPlayerCard key={id} charId={id} />)
         )}
      </div>
    </aside>
  );
}