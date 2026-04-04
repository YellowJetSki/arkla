import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';

export const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export default function useCharacterVitals(char, charId, isDM) {
  
  const updateField = async (field, value) => {
    await updateDoc(doc(db, 'characters', charId), { [field]: value });
  };

  const updateDeathSaves = async (type, value) => { 
    let updates = { [`deathSaves.${type}`]: value };

    // 5e Rule: Stabilizing instantly clears all death save failures.
    if (type === 'successes' && value >= 3) {
      updates['deathSaves.failures'] = 0;
    }
    
    // 5e Rule: Taking damage (a failure) while stable immediately puts you back into dying state.
    if (type === 'failures' && value > 0 && (char.deathSaves?.successes || 0) >= 3) {
      updates['deathSaves.successes'] = 0;
    }

    await updateDoc(doc(db, 'characters', charId), updates);
  };

  const toggleInspiration = async (e) => { 
    if (e) e.stopPropagation();
    if (!isDM) return; 
    await updateField('inspiration', !char.inspiration); 
  };

  const adjustXp = async (amount) => {
    const charRef = doc(db, 'characters', charId);
    try {
      const currentXp = char.exp || 0;
      await updateDoc(charRef, { exp: Math.max(0, currentXp + amount) });
    } catch (err) {
      console.error("XP Update Failed:", err);
    }
  };

  const submitHpUpdate = async (newHpVal, newTempVal = null) => {
    const boundedHp = Math.max(0, Math.min(parseInt(newHpVal, 10) || 0, char.maxHp || 10));
    let updates = { hp: boundedHp };
    if (newTempVal !== null) updates.tempHp = Math.max(0, parseInt(newTempVal, 10) || 0);
    
    let updatedConditions = [...(char.conditions || [])];

    // Wake Up Logic: Healed above 0 HP
    if (boundedHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
      updatedConditions = updatedConditions.filter(c => c !== 'Unconscious');
      updates.conditions = updatedConditions;
    }
    
    // Knock Out Logic: Dropped to 0 HP
    if (boundedHp === 0 && char.hp > 0) {
       if (!updatedConditions.includes('Unconscious')) updatedConditions.push('Unconscious');
       if (!updatedConditions.includes('Prone')) updatedConditions.push('Prone');
       updates.conditions = updatedConditions;
    }
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'characters', charId), updates);
      
      const mapUpdates = { [`tokens.${charId}.hp`]: boundedHp };
      if (newTempVal !== null) mapUpdates[`tokens.${charId}.tempHp`] = updates.tempHp;
      if (updates.conditions) mapUpdates[`tokens.${charId}.conditions`] = updates.conditions;
      batch.update(doc(db, 'campaign', 'battlemap'), mapUpdates);
      
      await batch.commit();
    } catch (err) {
       console.log("Could not sync HP.", err);
    }
  };

  const adjustHp = async (amount) => {
    if (amount < 0 && char.isConcentrating) {
      const damageTaken = Math.abs(amount);
      const dc = Math.max(10, Math.floor(damageTaken / 2));
      alert(`⚠️ CONCENTRATION CHECK!\nYou took ${damageTaken} damage. Roll a Constitution Saving Throw (DC ${dc}) to maintain your spell!`);
    }

    let currentHp = char.hp || 0;
    let currentTemp = char.tempHp || 0;
    const maxHp = char.maxHp || 10;
    let updatedConditions = [...(char.conditions || [])];

    if (amount < 0) {
      const damage = Math.abs(amount);
      if (currentTemp >= damage) {
        currentTemp -= damage; 
      } else {
        const rolloverDamage = damage - currentTemp;
        currentTemp = 0;
        currentHp = Math.max(0, currentHp - rolloverDamage);
      }
    } else { 
      currentHp = Math.min(maxHp, currentHp + amount);
    }

    let updates = { hp: currentHp, tempHp: currentTemp };
    
    // Wake Up Logic
    if (currentHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
      updatedConditions = updatedConditions.filter(c => c !== 'Unconscious');
      updates.conditions = updatedConditions;
    }

    // Knock Out Logic
    if (currentHp === 0 && char.hp > 0) {
       if (!updatedConditions.includes('Unconscious')) updatedConditions.push('Unconscious');
       if (!updatedConditions.includes('Prone')) updatedConditions.push('Prone');
       updates.conditions = updatedConditions;
    }
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'characters', charId), updates);
      
      const mapUpdates = { 
         [`tokens.${charId}.hp`]: currentHp,
         [`tokens.${charId}.tempHp`]: currentTemp
      };
      if (updates.conditions) mapUpdates[`tokens.${charId}.conditions`] = updates.conditions;

      batch.update(doc(db, 'campaign', 'battlemap'), mapUpdates);
      
      await batch.commit();
    } catch (err) {
      console.error("HP Update Failed:", err);
    }
  };

  const handleSpendHitDie = async () => {
    const currentHD = char.hitDice?.current ?? char.level;
    const maxHD = char.hitDice?.max ?? char.level;
    
    if (currentHD > 0) {
      const amount = window.prompt(`Spending 1 Hit Die (${currentHD}/${maxHD} remaining).\nHow much HP did you heal?`);
      const healAmt = parseInt(amount, 10);
      if (!isNaN(healAmt) && healAmt > 0) {
        await adjustHp(healAmt);
        await updateField('hitDice', { current: currentHD - 1, max: maxHD });
      }
    } else {
      alert("You have no Hit Dice remaining! Take a Long Rest to recover them.");
    }
  };

  const activeConditions = char.conditions || [];
  const isUnconscious = (char.hp || 0) <= 0;
  
  // Death State Derivations
  const isDead = (char.deathSaves?.failures || 0) >= 3;
  const isStable = (char.deathSaves?.successes || 0) >= 3;

  const isPoisoned = activeConditions.includes('Poisoned');
  const isFrightened = activeConditions.includes('Frightened');

  const hpPercent = Math.max(0, Math.min(100, ((char.hp || 0) / (char.maxHp || 1)) * 100));
  const tempHpPercent = Math.max(0, Math.min(100, ((char.tempHp || 0) / (char.maxHp || 1)) * 100));
  const hpColor = isPoisoned ? 'bg-lime-500/40' : hpPercent > 50 ? 'bg-emerald-500/20' : hpPercent > 20 ? 'bg-yellow-500/20' : 'bg-red-500/30';

  const currentXp = char.exp || 0;
  const nextLevelXp = XP_THRESHOLDS[char.level] || 355000;
  const prevLevelXp = XP_THRESHOLDS[char.level - 1] || 0;
  const xpPercent = Math.max(0, Math.min(100, ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
  const canLevelUp = currentXp >= nextLevelXp;

  return {
    updateField,
    updateDeathSaves,
    toggleInspiration,
    adjustXp,
    submitHpUpdate,
    adjustHp,
    handleSpendHitDie,
    activeConditions,
    isUnconscious,
    isDead,
    isStable,
    isPoisoned,
    isFrightened,
    hpPercent,
    tempHpPercent,
    hpColor,
    currentXp,
    nextLevelXp,
    prevLevelXp,
    xpPercent,
    canLevelUp
  };
}