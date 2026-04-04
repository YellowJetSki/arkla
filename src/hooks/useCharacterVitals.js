import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';

export const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export default function useCharacterVitals(char, charId, isDM, triggerAlert = console.log) {
  
  const updateField = async (field, value) => {
    await updateDoc(doc(db, 'characters', charId), { [field]: value });
  };

  const updateDeathSaves = async (type, value) => { 
    let updates = { [`deathSaves.${type}`]: value };

    if (type === 'successes' && value >= 3) {
      updates['deathSaves.failures'] = 0;
    }
    
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

    if (boundedHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
      updatedConditions = updatedConditions.filter(c => c !== 'Unconscious');
      updates.conditions = updatedConditions;
    }
    
    if (boundedHp === 0 && char.hp > 0) {
       if (!updatedConditions.includes('Unconscious')) updatedConditions.push('Unconscious');
       if (!updatedConditions.includes('Prone')) updatedConditions.push('Prone');
       updates.conditions = updatedConditions;
       // 5e Rule: Incapacitated instantly drops concentration
       updates.isConcentrating = false; 
    }
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'characters', charId), updates);
      
      const mapUpdates = { [`tokens.${charId}.hp`]: boundedHp };
      if (newTempVal !== null) mapUpdates[`tokens.${charId}.tempHp`] = updates.tempHp;
      if (updates.conditions) mapUpdates[`tokens.${charId}.conditions`] = updates.conditions;
      if (updates.isConcentrating === false) mapUpdates[`tokens.${charId}.isConcentrating`] = false;

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
      triggerAlert(`You took ${damageTaken} damage while concentrating. Roll a Constitution Saving Throw (DC ${dc}) to maintain your spell!`, 'Concentration Check');
    }

    let currentHp = char.hp || 0;
    let currentTemp = char.tempHp || 0;
    const maxHp = char.maxHp || 10;
    let updatedConditions = [...(char.conditions || [])];
    let newFailures = char.deathSaves?.failures || 0;

    if (amount < 0) {
      const damage = Math.abs(amount);
      
      const rolloverDamage = damage - currentTemp;
      if (rolloverDamage >= currentHp + maxHp) {
          newFailures = 3;
          triggerAlert("You took single-hit damage equal to or exceeding your max HP. You are instantly killed.", "Massive Damage");
      }

      if (currentHp === 0 && newFailures < 3) {
          newFailures += 1;
          triggerAlert("You suffered a Death Save Failure for taking damage while at 0 HP. (Note: If this was a melee attack from 5ft, manually add a 2nd failure for the auto-crit).", "Damage While Dying");
      }

      if (currentTemp >= damage) {
        currentTemp -= damage; 
      } else {
        currentTemp = 0;
        currentHp = Math.max(0, currentHp - rolloverDamage);
      }
    } else { 
      currentHp = Math.min(maxHp, currentHp + amount);
    }

    let updates = { hp: currentHp, tempHp: currentTemp };
    
    if (newFailures !== (char.deathSaves?.failures || 0)) {
        updates['deathSaves.failures'] = newFailures;
        updates['deathSaves.successes'] = 0; 
    }

    if (currentHp > 0 && char.hp === 0) {
      updates['deathSaves.successes'] = 0;
      updates['deathSaves.failures'] = 0;
      updatedConditions = updatedConditions.filter(c => c !== 'Unconscious');
      updates.conditions = updatedConditions;
    }

    if (currentHp === 0 && char.hp > 0) {
       if (!updatedConditions.includes('Unconscious')) updatedConditions.push('Unconscious');
       if (!updatedConditions.includes('Prone')) updatedConditions.push('Prone');
       updates.conditions = updatedConditions;
       // 5e Rule: Incapacitated instantly drops concentration
       updates.isConcentrating = false;
    }
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'characters', charId), updates);
      
      const mapUpdates = { 
         [`tokens.${charId}.hp`]: currentHp,
         [`tokens.${charId}.tempHp`]: currentTemp
      };
      if (updates.conditions) mapUpdates[`tokens.${charId}.conditions`] = updates.conditions;
      if (updates.isConcentrating === false) mapUpdates[`tokens.${charId}.isConcentrating`] = false;

      batch.update(doc(db, 'campaign', 'battlemap'), mapUpdates);
      await batch.commit();
    } catch (err) {
      console.error("HP Update Failed:", err);
    }
  };

  const spendHitDie = async (healAmt) => {
    const currentHD = char.hitDice?.current ?? char.level;
    const maxHD = char.hitDice?.max ?? char.level;
    if (currentHD > 0 && healAmt > 0) {
      await adjustHp(healAmt);
      await updateField('hitDice', { current: currentHD - 1, max: maxHD });
    }
  };

  const activeConditions = char.conditions || [];
  const isUnconscious = (char.hp || 0) <= 0;
  
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
    spendHitDie,
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