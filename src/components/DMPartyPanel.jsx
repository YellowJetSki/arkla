import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Users, UserPlus, Clock, Sun, Moon, Sunrise, Sunset, ChevronLeft, ChevronRight } from 'lucide-react';
import DMPlayerCard from './DMPlayerCard';

export default function DMPartyPanel({ unlockedCharacters, setIsBuildingCharacter }) {
  const [campaignTime, setCampaignTime] = useState({ day: 1, timeOfDay: 'Morning' });

  // Subscribe to the global campaign clock
  useEffect(() => {
    const timeRef = doc(db, 'campaign', 'time');
    const unsub = onSnapshot(timeRef, (docSnap) => {
      if (docSnap.exists()) {
        setCampaignTime(docSnap.data());
      } else {
        // Initialize if it doesn't exist yet
        setDoc(timeRef, { day: 1, timeOfDay: 'Morning' });
      }
    });
    return () => unsub();
  }, []);

  const updateTime = async (updates) => {
    await updateDoc(doc(db, 'campaign', 'time'), updates);
  };

  const cycleTime = () => {
    const phases = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const nextIdx = (phases.indexOf(campaignTime.timeOfDay) + 1) % phases.length;
    let nextDay = campaignTime.day;
    
    // Automatically advance the day if we sleep through the night
    if (nextIdx === 0) nextDay++; 
    
    updateTime({ timeOfDay: phases[nextIdx], day: nextDay });
  };

  const getTimeIcon = () => {
    switch(campaignTime.timeOfDay) {
      case 'Morning': return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'Afternoon': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'Evening': return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'Night': return <Moon className="w-4 h-4 text-indigo-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <aside className="w-full h-[40vh] lg:h-full bg-slate-900 flex flex-col shrink-0">
      <div className="p-4 border-b-[3px] border-slate-950 flex flex-col gap-3 bg-indigo-600 shrink-0 relative z-10">
         
         <div className="flex justify-between items-center">
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
         
         {/* THE CAMPAIGN CLOCK */}
         <div className="bg-slate-950 border-2 border-slate-900 rounded-xl p-2 flex items-center justify-between shadow-inner">
           <div className="flex items-center gap-2">
             <button onClick={() => updateTime({ day: Math.max(1, campaignTime.day - 1) })} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Previous Day">
               <ChevronLeft className="w-4 h-4" />
             </button>
             <span className="text-xs font-black text-white uppercase tracking-widest w-[70px] text-center drop-shadow-md">Day {campaignTime.day}</span>
             <button onClick={() => updateTime({ day: campaignTime.day + 1 })} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Next Day">
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
           
           <div className="w-0.5 h-6 bg-slate-800 mx-1"></div>
           
           <button onClick={cycleTime} className="flex-1 flex items-center justify-center gap-2 hover:bg-slate-800 p-1.5 rounded-lg transition-colors group" title="Cycle Time of Day">
             {getTimeIcon()}
             <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest w-16 text-left transition-colors">{campaignTime.timeOfDay}</span>
           </button>
         </div>

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