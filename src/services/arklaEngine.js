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

export const calculateSpellcastingStats = (classesArray, stats) => {
  let primaryCastingStat = 'CHA'; 
  let highestCasterLevel = 0;

  // Fallback for single-string class names (e.g. "Fighter 3 / Rogue 1")
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

  // Allow custom override via properties box (e.g. "use: cha" for Hexblades)
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
  const modString = useStatMod === 0 ? '' : useStatMod > 0 ? ` + ${useStatMod}` : ` - ${Math.abs(useStatMod)}`;

  if (formattedDamage) {
     // 1. Safely inject modifier to the first dice (Base Damage)
     formattedDamage = formattedDamage.replace(/(\d+d\d+)/, `$1${modString}`);
     
     // 2. If there are parentheses (Versatile Damage), safely inject the modifier in there too!
     if (formattedDamage.includes('(')) {
       formattedDamage = formattedDamage.replace(/\((\d+d\d+)\)/, `($1${modString})`);
     }
  }

  return { ...attack, hit: formattedHit, damage: formattedDamage };
};

// --- CONDITION AUTOMATION HOOKS ---
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

// --- SANCTUARY TERMINOLOGY FILTER ---
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