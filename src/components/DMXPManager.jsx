import { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { TrendingUp, Users, User, Award } from 'lucide-react';
import { PREMADE_CHARACTERS } from '../data/campaignData';

export default function DMXPManager({ unlockedCharacters }) {
  const [xpAmount, setXpAmount] = useState('');
  const [target, setTarget] = useState('party'); // 'party' or specific charId
  const [isAwarding, setIsAwarding] = useState(false);

  const handleAwardXP = async (e) => {
    e.preventDefault();
    if (!xpAmount || isNaN(xpAmount) || Number(xpAmount) <= 0) return;
    
    setIsAwarding(true);
    const amount = Number(xpAmount);

    try {
      const targets = target === 'party' ? unlockedCharacters : [target];

      for (const charId of targets) {
        const charRef = doc(db, 'characters', charId);
        const charSnap = await getDoc(charRef);
        
        if (charSnap.exists()) {
          const currentExp = charSnap.data().exp || 0;
          await updateDoc(charRef, { exp: currentExp + amount });
        }
      }
      
      setXpAmount(''); // Clear input on success
      // Optional: Add a temporary success toast here if desired
    } catch (error) {
      console.error("Failed to award XP:", error);
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl mb-8">
      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5" /> Award Experience
      </h3>
      
      <form onSubmit={handleAwardXP} className="flex flex-col sm:flex-row items-end gap-3">
        <div className="w-full sm:flex-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {target === 'party' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <select 
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="party">Entire Party (Divided manually)</option>
              <optgroup label="Individual Players">
                {unlockedCharacters.map(id => (
                  <option key={id} value={id}>
                    {PREMADE_CHARACTERS[id]?.name || id}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="w-full sm:w-32">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">XP Amount</label>
          <input 
            type="number" 
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            placeholder="e.g. 150"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={isAwarding || !xpAmount}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors h-10"
        >
          {isAwarding ? '...' : <><Award className="w-4 h-4" /> Award</>}
        </button>
      </form>
    </div>
  );
}