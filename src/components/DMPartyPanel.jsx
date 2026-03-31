import { Users, UserPlus } from 'lucide-react';
import DMPlayerCard from './DMPlayerCard';

export default function DMPartyPanel({ unlockedCharacters, setIsBuildingCharacter }) {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[350px] border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0 h-[40vh] lg:h-full">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-indigo-950/20 shrink-0">
         <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
           <Users className="w-4 h-4"/> The Party
         </h2>
         <button 
           onClick={() => setIsBuildingCharacter(true)} 
           className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 shadow-sm"
         >
           <UserPlus className="w-3 h-3"/> New
         </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
         {unlockedCharacters.length === 0 ? (
           <div className="text-center p-4 text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl">
             Waiting for players...
           </div>
         ) : (
           unlockedCharacters.map(id => <DMPlayerCard key={id} charId={id} />)
         )}
      </div>
    </aside>
  );
}