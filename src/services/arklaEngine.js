// ==========================================
// ⚙️ THE ARKLA ENGINE (LITE VERSION)
// Handles purely mathematical calculations, stat derivations, 
// Sanctuary terminology filters, and attack scaling.
// No external API dependencies.
// ==========================================

export const ALL_SKILLS = [
  'Acrobatics (DEX)', 'Animal Handling (WIS)', 'Arcana (INT)', 'Athletics (STR)',
  'Deception (CHA)', 'History (INT)', 'Insight (WIS)', 'Intimidation (CHA)',
  'Investigation (INT)', 'Medicine (WIS)', 'Nature (INT)', 'Perception (WIS)',
  'Performance (CHA)', 'Persuasion (CHA)', 'Religion (INT)', 'Sleight of Hand (DEX)',
  'Stealth (DEX)', 'Survival (WIS)'
];

export const SPELLCASTING_STATS = {
  'bard': 'CHA', 'cleric': 'WIS', 'druid': 'WIS', 'paladin': 'CHA',
  'ranger': 'WIS', 'sorcerer': 'CHA', 'warlock': 'CHA', 'wizard': 'INT',
  'monk': 'WIS', 'dealt': 'CHA', 'mage': 'CHA', 'pirate': 'CHA', 'artificer': 'INT'
};

// --- CORE MATH & DERIVATIONS ---
export const getProficiencyBonus = (totalLevel) => Math.floor((totalLevel - 1) / 4) + 2;
export const getModifier = (score) => Math.floor((score - 10) / 2);

export const calculateInitiative = (dexScore) => {
  const mod = getModifier(dexScore || 10);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// NEW: Automated Smart AC Calculation
export const calculateAC = (char) => {
  if (!char) return 10;
  
  const dexMod = getModifier(char.stats?.DEX || 10);
  const conMod = getModifier(char.stats?.CON || 10);
  const wisMod = getModifier(char.stats?.WIS || 10);
  
  const armors = (char.inventory || []).filter(i => i.category === 'Armor');
  
  let baseArmor = null;
  let shieldBonus = 0;

  // Distinguish between wearable armor and shields based on AC value
  armors.forEach(armor => {
    const acVal = Number(armor.ac) || 0;
    if (acVal > 0 && acVal <= 5) {
      shieldBonus += acVal; // It's a shield or additive item
    } else if (acVal > 5) {
      if (!baseArmor || acVal > baseArmor.acVal) {
        baseArmor = { acVal, name: (armor.name || '').toLowerCase() }; // Highest AC body armor
      }
    }
  });

  const classStr = (char.class || '').toLowerCase();
  let unarmoredAc = 10 + dexMod;

  // Unarmored Defense calculations
  if (!baseArmor) {
    if (classStr.includes('barbarian')) {
      unarmoredAc = 10 + dexMod + conMod;
    } else if (classStr.includes('monk')) {
      unarmoredAc = 10 + dexMod + wisMod;
    }
  }

  let finalAc = unarmoredAc;

  // Apply 5e DEX caps based on armor weight
  if (baseArmor) {
    const name = baseArmor.name;
    const isHeavy = name.includes('ring') || name.includes('chain mail') || name.includes('splint') || name.includes('plate');
    const isMedium = name.includes('hide') || name.includes('chain shirt') || name.includes('scale') || name.includes('breastplate') || name.includes('half plate');
    
    if (isHeavy) {
      finalAc = baseArmor.acVal; // No Dex
    } else if (isMedium) {
      finalAc = baseArmor.acVal + Math.min(2, dexMod); // Max 2 Dex
    } else {
      finalAc = baseArmor.acVal + dexMod; // Full Dex (Light Armor)
    }
  }

  // 5e Rule: Monks lose unarmored defense if using a shield
  if (!baseArmor && shieldBonus > 0 && classStr.includes('monk')) {
    finalAc = 10 + dexMod; 
  }

  return finalAc + shieldBonus;
};

export const calculateSpellcastingStats = (classesArray, stats) => {
  let primaryCastingStat = 'CHA'; 
  let highestCasterLevel = 0;

  let parsedClasses = classesArray;
  if (typeof classesArray === 'string') {
     parsedClasses = classesArray.split('/').map(c => ({
        name: c.trim().split(' ')[0],
        level: parseInt(c.trim().split(' ')[1]) || 1
     }));
  }

  (parsedClasses || []).forEach(cls => {
    const cleanName = cls.name.toLowerCase();
    const castingStat = SPELLCASTING_STATS[cleanName];
    if (castingStat && cls.level > highestCasterLevel) {
      highestCasterLevel = cls.level;
      primaryCastingStat = castingStat;
    }
  });

  const totalLevel = (parsedClasses || []).reduce((sum, cls) => sum + cls.level, 0) || 1;
  const pb = getProficiencyBonus(totalLevel);
  const mod = getModifier(stats[primaryCastingStat] || 10);

  return {
    spellSave: 8 + pb + mod,
    spellAttack: `+${pb + mod}`,
    primaryStat: primaryCastingStat
  };
};

export const parseAndScaleAttack = (attack, stats, totalLevel, className = '') => {
  if (!attack.notes && attack.notes !== '') return attack;

  const mods = {
    STR: getModifier(stats?.STR || 10),
    DEX: getModifier(stats?.DEX || 10),
    CON: getModifier(stats?.CON || 10),
    INT: getModifier(stats?.INT || 10),
    WIS: getModifier(stats?.WIS || 10),
    CHA: getModifier(stats?.CHA || 10)
  };

  const pb = getProficiencyBonus(totalLevel || 1);
  const properties = (attack.notes || '').toLowerCase();
  const attackName = (attack.name || '').toLowerCase();
  
  const isFinesse = properties.includes('finesse');
  const isRanged = properties.includes('ammunition') || properties.includes('thrown') || properties.includes('range');
  const isHeavy = properties.includes('heavy');
  const isTwoHanded = properties.includes('two-handed');

  let activeStat = isRanged ? 'DEX' : 'STR';
  if (isFinesse && mods.DEX > mods.STR) activeStat = 'DEX';

  const isMonk = className.toLowerCase().includes('monk');
  const isMonkWeapon = isMonk && !isHeavy && !isTwoHanded && (properties.includes('simple') || attackName.includes('shortsword') || attackName.includes('unarmed') || attackName.includes('quarterstaff') || attackName.includes('shuriken') || attackName.includes('dart'));
  
  if (isMonkWeapon && mods.DEX > mods[activeStat]) {
    activeStat = 'DEX';
  }

  const overrideMatch = properties.match(/use:\s*([a-z]{3})/i);
  if (overrideMatch) {
    const forcedStat = overrideMatch[1].toUpperCase();
    if (mods[forcedStat] !== undefined) {
      activeStat = forcedStat;
    }
  }

  const useStatMod = mods[activeStat];
  const toHit = pb + useStatMod;
  const formattedHit = toHit >= 0 ? `+${toHit}` : `${toHit}`;

  let formattedDamage = attack.damage || ''; 

  if (formattedDamage) {
    formattedDamage = formattedDamage.replace(/(\d+d\d+)(?:\s*([+-])\s*(\d+))?/, (match, dice, sign, flat) => {
      let baseFlat = 0;
      if (sign && flat) {
        baseFlat = sign === '-' ? -parseInt(flat) : parseInt(flat);
      }
      const totalMod = baseFlat + useStatMod;
      if (totalMod === 0) return dice;
      return totalMod > 0 ? `${dice} + ${totalMod}` : `${dice} - ${Math.abs(totalMod)}`;
    });
    
    if (formattedDamage.includes('(')) {
      formattedDamage = formattedDamage.replace(/\((\d+d\d+)(?:\s*([+-])\s*(\d+))?\)/, (match, dice, sign, flat) => {
        let baseFlat = 0;
        if (sign && flat) {
          baseFlat = sign === '-' ? -parseInt(flat) : parseInt(flat);
        }
        const totalMod = baseFlat + useStatMod;
        if (totalMod === 0) return `(${dice})`;
        return totalMod > 0 ? `(${dice} + ${totalMod})` : `(${dice} - ${Math.abs(totalMod)})`;
      });
    }
  }

  return { ...attack, hit: formattedHit, damage: formattedDamage };
};

export const getConditionMechanics = (activeConditions) => {
  let mechanics = {
    speedMultiplier: 1,
    speedOverride: null,
    attackDisadvantage: false,
    attackAdvantage: false,
    autoFailStrDex: false
  };

  if (!activeConditions || activeConditions.length === 0) return mechanics;

  if (activeConditions.includes('Grappled') || activeConditions.includes('Restrained')) {
    mechanics.speedOverride = 0;
  }
  if (activeConditions.includes('Paralyzed') || activeConditions.includes('Stunned') || activeConditions.includes('Unconscious') || activeConditions.includes('Petrified')) {
    mechanics.speedOverride = 0;
    mechanics.autoFailStrDex = true;
  }
  if (activeConditions.includes('Poisoned') || activeConditions.includes('Frightened') || activeConditions.includes('Prone')) {
    mechanics.attackDisadvantage = true;
  }
  if (activeConditions.includes('Invisible')) {
    mechanics.attackAdvantage = true;
  }

  return mechanics;
};

const SANCTUARY_REPLACEMENTS = {
  'fiend': 'powerful fey',
  'fiends': 'fey',
  'fiendish': 'fey-touched',
  'demon': 'giant',
  'demons': 'giants',
  'demonic': 'ancient',
  'devil': 'dragon',
  'devils': 'dragons',
  'undead': 'construct',
  'necromancy': 'ancient magic',
  'blood': 'vitality',
  'soul': 'spirit-essence',
  'pact': 'bond',
  'warlock': 'dealt',
  'sorcerer': 'mage'
};

export const applySanctuaryFilter = (text) => {
  if (!text) return '';
  let safeText = text;
  Object.entries(SANCTUARY_REPLACEMENTS).forEach(([bad, good]) => {
    const regex = new RegExp(`\\b${bad}\\b`, 'gi');
    safeText = safeText.replace(regex, (match) => {
      if (match === match.toUpperCase()) return good.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return good.charAt(0).toUpperCase() + good.slice(1);
      return good;
    });
  });
  return safeText;
};