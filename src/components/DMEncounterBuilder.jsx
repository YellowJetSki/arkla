import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PREMADE_ENEMIES } from '../data/campaignData';
import { Swords, Plus, Trash2, Zap, ShieldAlert } from 'lucide-react';

export default function DMEncounterBuilder() {
  const [stagedEnemies, setStagedEnemies] = useState([]);
  const [selectedEnemy, setSelectedEnemy] = useState(PREMADE_ENEMIES[0].id);

  const handleStageEnemy = () => {
    const enemyTemplate = PREMADE_ENEMIES.find(e => e.id === selectedEnemy);
    if (!enemyTemplate) return;

    setStagedEnemies(prev => {
      // If already staged, just increase the count
      const existing = prev.find(e => e.id === selectedEnemy);
      if (existing) {
        return prev.map(e => e.id === selectedEnemy ? { ...e, count: e.count + 1 } : e);
      }
      // Otherwise, add new to staging
      return [...prev, { ...enemyTemplate, count: 1 }];
    });
  };

  const handleRemoveStaged = (id) => {
    setStagedEnemies(prev => prev.filter(e => e.id !== id));
  };

  const updateStagedCount = (id, newCount) => {
    if (newCount <= 0) {
      handleRemoveStaged(id);
      return;
    }
    setStagedEnemies(prev => prev.map(e => e.id === id ? { ...e, count: newCount } : e));
  };

  const deployEncounter = async () => {
    if (stagedEnemies.length === 0) return;

    const enemiesRef = collection(db, 'active_enemies');
    
    // Deploy all staged enemies based on their counts
    for (const staged of stagedEnemies) {
      for (let i = 0; i < staged.count; i++) {
        // We append a number to their name if there's more than one (e.g., "Goblin Sneak 2")
        const nameSuffix = staged.count > 1 ? ` ${i + 1}` : '';
        await addDoc(enemiesRef, {
          ...staged,
          name: `${staged.name}${nameSuffix}`,
          maxHp: staged.hp,
          currentHp: staged.hp
        });
      }
    }

    // Clear the staging area after deploying
    setStagedEnemies([]);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl mb-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-red-400" /> Encounter Builder
      </h3>
      
      {/* Spawner Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <select 
          value={selectedEnemy}
          onChange={(e) => setSelectedEnemy(e.target.value)}
          className="bg-slate-900 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 w-full sm:flex-1"
        >
          {PREMADE_ENEMIES.map(enemy => (
            <option key={enemy.id} value={enemy.id}>
              {enemy.name} (CR est. HP: {enemy.hp})
            </option>
          ))}
        </select>
        <button 
          onClick={handleStageEnemy}
          className="w-full sm:w-auto flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add to Draft
        </button>
      </div>

      {/* Staging Area */}
      {stagedEnemies.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="space-y-2 mb-4">
            {stagedEnemies.map(staged => (
              <div key={staged.id} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-600">
                <span className="font-bold text-red-400">{staged.name}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                    <button onClick={() => updateStagedCount(staged.id, staged.count - 1)} className="px-2 text-slate-400 hover:text-white">-</button>
                    <span className="text-white font-bold w-6 text-center">{staged.count}</span>
                    <button onClick={() => updateStagedCount(staged.id, staged.count + 1)} className="px-2 text-slate-400 hover:text-white">+</button>
                  </div>
                  <button onClick={() => handleRemoveStaged(staged.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={deployEncounter}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
          >
            <Zap className="w-5 h-5" /> Deploy Encounter
          </button>
        </div>
      )}
    </div>
  );
}