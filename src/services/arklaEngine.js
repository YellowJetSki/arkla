// ==========================================
// ⚙️ THE ARKLA ENGINE (FULL 5E INTEGRATION & MATH)
// Connects to D&D 5e API, applies Sanctuary Filters, maps mechanics, and handles multi-classing.
// ==========================================

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

  (classesArray || []).forEach(cls => {
    const cleanName = cls.name.split(' ')[0].toLowerCase();
    const castingStat = SPELLCASTING_STATS[cleanName];
    if (castingStat && cls.level > highestCasterLevel) {
      highestCasterLevel = cls.level;
      primaryCastingStat = castingStat;
    }
  });

  const totalLevel = (classesArray || []).reduce((sum, cls) => sum + cls.level, 0) || 1;
  const pb = getProficiencyBonus(totalLevel);
  const mod = getModifier(stats[primaryCastingStat] || 10);

  return {
    spellSave: 8 + pb + mod,
    spellAttack: `+${pb + mod}`,
    primaryStat: primaryCastingStat
  };
};

export const parseAndScaleAttack = (attack, stats, totalLevel, classesArray = []) => {
  // Pure homebrew attacks without notes are bypassed to preserve DM intent
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
  
  // 1. Determine Base Weapon Stat
  const isFinesse = properties.includes('finesse');
  const isRanged = properties.includes('ammunition') || properties.includes('thrown') || properties.includes('range');
  const isHeavy = properties.includes('heavy');
  const isTwoHanded = properties.includes('two-handed');

  let activeStat = isRanged ? 'DEX' : 'STR';
  if (isFinesse && mods.DEX > mods.STR) activeStat = 'DEX';

  // 2. Class Specific Overrides (Monk Martial Arts)
  const isMonk = classesArray.some(c => c.name.toLowerCase().includes('monk') && c.level >= 1);
  const isMonkWeapon = isMonk && !isHeavy && !isTwoHanded && (properties.includes('simple') || attackName.includes('shortsword') || attackName.includes('unarmed') || attackName.includes('quarterstaff') || attackName.includes('shuriken') || attackName.includes('dart'));
  
  if (isMonkWeapon && mods.DEX > mods[activeStat]) {
    activeStat = 'DEX';
  }

  // 3. Homebrew / Subclass / Spell Override (e.g. "Use: CHA" for Hexblades)
  // Regex looks for "Use: XXX" where XXX is a 3-letter stat code
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

  // Extract base dice from the stored damage string (e.g. "1d8" or "1d8 + 3" -> "1d8")
  const baseDiceMatch = (attack.damage || '').match(/(\d+d\d+)/);
  const baseDice = baseDiceMatch ? baseDiceMatch[0] : '';
  
  let formattedDamage = attack.damage; 
  if (baseDice) {
     formattedDamage = useStatMod === 0 ? baseDice : 
                       useStatMod > 0 ? `${baseDice} + ${useStatMod}` : 
                       `${baseDice} - ${Math.abs(useStatMod)}`;
  }

  return { ...attack, hit: formattedHit, damage: formattedDamage };
};

// --- MULTI-CLASS SPELL SLOT CALCULATOR ---
const FULL_CASTERS = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
const HALF_CASTERS = ['paladin', 'ranger'];
const ARTIFICER = ['artificer']; 

const MULTICLASS_SLOT_TABLE = [
  [], // 0
  [2], // 1
  [3], // 2
  [4, 2], // 3
  [4, 3], // 4
  [4, 3, 2], // 5
  [4, 3, 3], // 6
  [4, 3, 3, 1], // 7
  [4, 3, 3, 2], // 8
  [4, 3, 3, 3, 1], // 9
  [4, 3, 3, 3, 2], // 10
  [4, 3, 3, 3, 2, 1], // 11
  [4, 3, 3, 3, 2, 1], // 12
  [4, 3, 3, 3, 2, 1, 1], // 13
  [4, 3, 3, 3, 2, 1, 1], // 14
  [4, 3, 3, 3, 2, 1, 1, 1], // 15
  [4, 3, 3, 3, 2, 1, 1, 1], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1]  // 20
];

export const calculateCombinedSpellSlots = (classesArray) => {
  let casterLevel = 0;

  classesArray.forEach(cls => {
    const cleanName = cls.name.split(' ')[0].toLowerCase();
    if (FULL_CASTERS.includes(cleanName)) {
      casterLevel += cls.level;
    } else if (HALF_CASTERS.includes(cleanName)) {
      casterLevel += Math.floor(cls.level / 2);
    } else if (ARTIFICER.includes(cleanName)) {
      casterLevel += Math.ceil(cls.level / 2);
    } 
  });

  if (casterLevel === 0) return {};

  const slotArray = MULTICLASS_SLOT_TABLE[Math.min(casterLevel, 20)];
  let slots = {};
  
  slotArray.forEach((maxSlots, index) => {
    if (maxSlots > 0) {
      const levelString = (index + 1).toString();
      slots[levelString] = { max: maxSlots, current: maxSlots };
    }
  });

  return slots;
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

// --- API MAPS & CONSTANTS ---
const CLASS_API_MAP = {
  'dealt': 'warlock',     
  'mage': 'sorcerer',     
  'fighter': 'fighter',
  'monk': 'monk',
  'paladin': 'paladin',
  'rogue': 'rogue',
  'ranger': 'ranger',
  'cleric': 'cleric',
  'bard': 'bard',
  'druid': 'druid',
  'barbarian': 'barbarian',
  'wizard': 'wizard'
};

const SPECIES_API_MAP = {
  'dragonborn': { type: 'races', index: 'dragonborn' },
  'dwarf': { type: 'races', index: 'dwarf' },
  'elf': { type: 'races', index: 'elf' },
  'gnome': { type: 'races', index: 'gnome' },
  'half-elf': { type: 'races', index: 'half-elf' },
  'half-orc': { type: 'races', index: 'half-orc' },
  'halfling': { type: 'races', index: 'halfling' },
  'human': { type: 'races', index: 'human' },
  'tiefling': { type: 'races', index: 'tiefling' },
  'wood': { type: 'subraces', index: 'wood-elf', parent: 'elf' },
  'high': { type: 'subraces', index: 'high-elf', parent: 'elf' },
  'rock': { type: 'subraces', index: 'rock-gnome', parent: 'gnome' },
  'forest': { type: 'subraces', index: 'forest-gnome', parent: 'gnome' },
  'hill': { type: 'subraces', index: 'hill-dwarf', parent: 'dwarf' },
  'mountain': { type: 'subraces', index: 'mountain-dwarf', parent: 'dwarf' }
};

const HIT_DICE_MAP = {
  'barbarian': 12, 'fighter': 10, 'paladin': 10, 'ranger': 10, 'pirate': 10,
  'bard': 8, 'cleric': 8, 'druid': 8, 'monk': 8, 'rogue': 8, 'dealt': 8, 'warlock': 8,
  'mage': 6, 'sorcerer': 6, 'wizard': 6
};

export const SPELLCASTING_STATS = {
  'bard': 'CHA', 'cleric': 'WIS', 'druid': 'WIS', 'paladin': 'CHA',
  'ranger': 'WIS', 'sorcerer': 'CHA', 'warlock': 'CHA', 'wizard': 'INT',
  'monk': 'WIS', 'dealt': 'CHA', 'mage': 'CHA', 'pirate': 'CHA'
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

const RESOURCE_HOOKS = {
  'Rage': { maxType: 'API_RAGE', recharge: 'long' },
  'Bardic Inspiration': { maxType: 'CHA', recharge: 'long' }, 
  'Channel Divinity': { maxType: 'API_CD', recharge: 'short' },
  'Wild Shape': { maxType: 2, recharge: 'short' },
  'Action Surge': { maxType: 1, recharge: 'short' }, 
  'Second Wind': { maxType: 1, recharge: 'short' },
  'Indomitable': { maxType: 'API_INDOMITABLE', recharge: 'long' },
  'Ki': { maxType: 'CLASS_LEVEL', recharge: 'short' }, 
  'Lay on Hands': { maxType: 'PALADIN_HP', recharge: 'long' }, 
  'Divine Sense': { maxType: 'API_CD', recharge: 'long' }, 
  'Font of Magic': { maxType: 'CLASS_LEVEL', recharge: 'long', rename: 'Sorcery Points' }, 
  'Tides of Chaos': { maxType: 1, recharge: 'long' }, 
  'Hexblade\'s Curse': { maxType: 1, recharge: 'short', filterRename: 'Dealt\'s Curse' } 
};

const HOMEBREW_CLASSES = {
  'pirate': {
    hitDie: 10,
    levels: {
      1: {
        features: [{ name: "Pirate's Bounty", desc: "(Bonus Action). Mark a target within 60ft for 1 minute. Advantage on Intimidation/Persuasion against them. They subtract 1d4 from attacks against you, and you deal an extra 1d6 damage to them." }],
        resources: [{ name: "Pirate's Bounty", maxType: 'PB', recharge: 'long' }]
      },
      3: {
        features: [{ name: "Flint Lock", desc: "(Action). Ranged Spell Attack. Hit: 2d10 bludgeoning. Target must make a CON save or be Stunned until the start of your next turn." }],
        resources: [{ name: "Flint Lock", maxType: 'CHA', recharge: 'long' }]
      },
      7: {
        features: [{ name: "Tsunami", desc: "(Action). 15ft cone of water. STR save. Fail: 4d6 bludgeoning, pushed 15ft away, knocked Prone. Success: Half damage, not pushed." }],
        resources: [{ name: "Tsunami", maxType: 1, recharge: 'short' }]
      },
      11: {
        features: [{ name: "Ocean's Rage", desc: "(Action). Summon a spectral sea beast on a target within 60ft. Roll 1d6! (1-2: Giant Turtle, 3-4: Megalodon, 5-6: The Kraken)." }],
        resources: [{ name: "Ocean's Rage", maxType: 1, recharge: 'long' }]
      }
    }
  }
};

let cachedSpellStubs = null;
let cachedFeatStubs = null;
let cachedEquipmentStubs = null;

export const getSpellStubs = async () => {
  if (cachedSpellStubs) return cachedSpellStubs;
  const res = await fetch('https://www.dnd5eapi.co/api/spells');
  const data = await res.json();
  cachedSpellStubs = data.results;
  return cachedSpellStubs;
};

export const getFeatStubs = async () => {
  if (cachedFeatStubs) return cachedFeatStubs;
  const res = await fetch('https://www.dnd5eapi.co/api/feats');
  const data = await res.json();
  cachedFeatStubs = data.results;
  return cachedFeatStubs;
};

export const getEquipmentStubs = async () => {
  if (cachedEquipmentStubs) return cachedEquipmentStubs;
  const res = await fetch('https://www.dnd5eapi.co/api/equipment');
  const data = await res.json();
  cachedEquipmentStubs = data.results;
  return cachedEquipmentStubs;
};

export const fetchDetailedStubs = async (stubs) => {
  const promises = stubs.map(async (stub) => {
    try {
      const res = await fetch(`https://www.dnd5eapi.co${stub.url}`);
      const detail = await res.json();
      return {
        ...detail,
        name: applySanctuaryFilter(detail.name),
        desc: applySanctuaryFilter(Array.isArray(detail.desc) ? detail.desc.join('\n') : detail.desc)
      };
    } catch (e) {
      console.error(`Failed to fetch details for ${stub.url}`);
      return null;
    }
  });
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
};

export const fetchSpeciesTraits = async (rawSpeciesName) => {
  const words = rawSpeciesName.toLowerCase().split(' ');
  const firstWord = words[0];
  const secondWord = words.length > 1 ? words[1] : '';

  let apiPointer = SPECIES_API_MAP[firstWord];
  if (!apiPointer && secondWord) apiPointer = SPECIES_API_MAP[secondWord];

  if (!apiPointer) return { traits: [], error: 'Species not found in SRD.' };

  try {
    let baseData = null;
    let subData = null;

    if (apiPointer.type === 'subraces') {
      const parentRes = await fetch(`https://www.dnd5eapi.co/api/races/${apiPointer.parent}`);
      baseData = await parentRes.json();
      
      const subRes = await fetch(`https://www.dnd5eapi.co/api/subraces/${apiPointer.index}`);
      subData = await subRes.json();
    } else {
      const res = await fetch(`https://www.dnd5eapi.co/api/races/${apiPointer.index}`);
      baseData = await res.json();
    }
    
    let traitStubs = [...(baseData.traits || [])];
    if (subData && subData.racial_traits) {
      traitStubs = [...traitStubs, ...subData.racial_traits];
    }

    const traitPromises = traitStubs.map(async (traitStub) => {
      const traitRes = await fetch(`https://www.dnd5eapi.co${traitStub.url}`);
      const traitDetail = await traitRes.json();
      return {
        name: applySanctuaryFilter(traitDetail.name),
        desc: applySanctuaryFilter(Array.isArray(traitDetail.desc) ? traitDetail.desc.join('\n') : traitDetail.desc)
      };
    });

    const traits = await Promise.all(traitPromises);

    let mechanics = {
      speed: baseData.speed || 30,
      size: baseData.size || 'Medium',
      languages: (baseData.languages || []).map(l => l.name),
      abilityBonuses: []
    };

    if (baseData.ability_bonuses) mechanics.abilityBonuses.push(...baseData.ability_bonuses);
    if (subData && subData.ability_bonuses) mechanics.abilityBonuses.push(...subData.ability_bonuses);

    if (subData && subData.racial_traits) {
       const hasFleetOfFoot = subData.racial_traits.some(t => t.index === 'fleet-of-foot');
       if (hasFleetOfFoot) mechanics.speed = 35;
    }

    return { traits, mechanics, error: null };
  } catch (error) {
    console.error("Species API Error:", error);
    return { traits: [], mechanics: null, error: 'Failed to fetch species data.' };
  }
};

export const fetchClassProgression = async (rawClassName, classLevel) => {
  const cleanName = rawClassName.split(' ')[0].toLowerCase();
  
  if (HOMEBREW_CLASSES[cleanName]) {
    const hbData = HOMEBREW_CLASSES[cleanName];
    return {
      hitDie: hbData.hitDie,
      features: hbData.levels[classLevel]?.features || [],
      resources: hbData.levels[classLevel]?.resources || [],
      spellSlots: null,
      spellcastingInfo: null
    };
  }

  const apiClass = CLASS_API_MAP[cleanName];
  if (!apiClass) {
    return { hitDie: 8, features: [], resources: [], spellSlots: null, spellcastingInfo: null, error: 'Class not found in archives.' };
  }

  try {
    const classRes = await fetch(`https://www.dnd5eapi.co/api/classes/${apiClass}`);
    const classData = await classRes.json();
    const hitDie = classData.hit_die || HIT_DICE_MAP[apiClass] || 8;

    const levelRes = await fetch(`https://www.dnd5eapi.co/api/classes/${apiClass}/levels/${classLevel}`);
    const levelData = await levelRes.json();

    const fetchedFeatures = [];
    const fetchedResources = [];
    let spellSlots = null;
    let spellcastingInfo = null;

    if (apiClass === 'bard' && classLevel === 5) fetchedResources.push({ name: 'Bardic Inspiration', upgrade: true, recharge: 'short' });
    if (apiClass === 'fighter' && classLevel === 17) fetchedResources.push({ name: 'Action Surge', upgrade: true, maxType: 2 });

    if (levelData.features && levelData.features.length > 0) {
      const featurePromises = levelData.features.map(async (featStub) => {
        const featRes = await fetch(`https://www.dnd5eapi.co${featStub.url}`);
        return await featRes.json();
      });
      
      const featureDetails = await Promise.all(featurePromises);

      featureDetails.forEach(feat => {
        const rawDesc = Array.isArray(feat.desc) ? feat.desc.join('\n') : (feat.desc || '');
        const safeDesc = applySanctuaryFilter(rawDesc);
        
        let originalName = feat.name;
        if (originalName.includes('Hexblade')) originalName = originalName.replace('Hexblade', 'Dealt');
        
        const safeName = applySanctuaryFilter(originalName);
        fetchedFeatures.push({ name: safeName, desc: safeDesc });

        const hookKey = Object.keys(RESOURCE_HOOKS).find(k => feat.name.includes(k));
        if (hookKey) {
          const hook = RESOURCE_HOOKS[hookKey];
          let maxVal = 1;
          
          if (hook.maxType === 'API_RAGE') maxVal = levelData.class_specific?.rage_count || 2;
          else if (hook.maxType === 'API_CD') maxVal = levelData.class_specific?.channel_divinity_charges || 1;
          else if (hook.maxType === 'API_INDOMITABLE') maxVal = levelData.class_specific?.indomitable_uses || 1;
          else if (hook.maxType === 'PALADIN_HP') maxVal = classLevel * 5; 
          else if (hook.maxType === 'CLASS_LEVEL') maxVal = classLevel;
          else maxVal = hook.maxType; 

          const resourceName = hook.rename || hook.filterRename || safeName;
          fetchedResources.push({ name: resourceName, maxType: maxVal, recharge: hook.recharge, isPool: hook.maxType === 'PALADIN_HP' });
        }
      });
    }

    if (levelData.spellcasting) {
      spellcastingInfo = {
        cantripsKnown: levelData.spellcasting.cantrips_known || 0,
        spellsKnown: levelData.spellcasting.spells_known || 0
      };
      
      if (apiClass === 'warlock') {
        spellSlots = {};
        for (let i = 1; i <= 9; i++) {
          const slotsForLevel = levelData.spellcasting[`spell_slots_level_${i}`];
          if (slotsForLevel > 0) {
            spellSlots[i.toString()] = { max: slotsForLevel, current: slotsForLevel };
          }
        }
      }
    }

    return {
      hitDie,
      features: fetchedFeatures,
      resources: fetchedResources,
      spellSlots, 
      spellcastingInfo
    };

  } catch (error) {
    console.error("Engine API Error:", error);
    return { hitDie: HIT_DICE_MAP[apiClass] || 8, features: [], resources: [], spellSlots: null, spellcastingInfo: null, error: 'Failed to commune with the D&D API.' };
  }
};