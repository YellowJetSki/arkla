// ==========================================
// ⚙️ THE ARKLA ENGINE (FULL 5E INTEGRATION)
// Connects to D&D 5e API, applies Sanctuary Filters, and maps mechanics.
// ==========================================

export const getProficiencyBonus = (level) => Math.floor((level - 1) / 4) + 2;
export const getModifier = (score) => Math.floor((score - 10) / 2);

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
  'dragonborn': 'dragonborn', 'dwarf': 'dwarf', 'elf': 'elf', 'gnome': 'gnome',
  'half-elf': 'half-elf', 'half-orc': 'half-orc', 'halfling': 'halfling', 
  'human': 'human', 'tiefling': 'tiefling'
};

const HIT_DICE_MAP = {
  'barbarian': 12, 'fighter': 10, 'paladin': 10, 'ranger': 10, 'pirate': 10,
  'bard': 8, 'cleric': 8, 'druid': 8, 'monk': 8, 'rogue': 8, 'dealt': 8, 'warlock': 8,
  'mage': 6, 'sorcerer': 6, 'wizard': 6
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
  'Ki': { maxType: 'LEVEL', recharge: 'short' },
  'Lay on Hands': { maxType: 'PALADIN_HP', recharge: 'long' }, 
  'Divine Sense': { maxType: 'API_CD', recharge: 'long' }, 
  'Font of Magic': { maxType: 'LEVEL', recharge: 'long', rename: 'Sorcery Points' }, 
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

export const fetchSpeciesTraits = async (rawSpeciesName) => {
  const cleanName = rawSpeciesName.split(' ')[0].toLowerCase();
  const apiSpecies = SPECIES_API_MAP[cleanName];
  if (!apiSpecies) return { traits: [], error: 'Species not found in SRD.' };

  try {
    const res = await fetch(`https://www.dnd5eapi.co/api/races/${apiSpecies}`);
    const data = await res.json();
    
    if (!data.traits) return { traits: [] };

    const traitPromises = data.traits.map(async (traitStub) => {
      const traitRes = await fetch(`https://www.dnd5eapi.co${traitStub.url}`);
      const traitDetail = await traitRes.json();
      return {
        name: applySanctuaryFilter(traitDetail.name),
        desc: applySanctuaryFilter(Array.isArray(traitDetail.desc) ? traitDetail.desc.join('\n') : traitDetail.desc)
      };
    });

    const traits = await Promise.all(traitPromises);
    return { traits, error: null };
  } catch (error) {
    console.error("Species API Error:", error);
    return { traits: [], error: 'Failed to fetch species traits.' };
  }
};

export const fetchClassProgression = async (rawClassName, level) => {
  const cleanName = rawClassName.split(' ')[0].toLowerCase();
  
  if (HOMEBREW_CLASSES[cleanName]) {
    const hbData = HOMEBREW_CLASSES[cleanName];
    return {
      hitDie: hbData.hitDie,
      features: hbData.levels[level]?.features || [],
      resources: hbData.levels[level]?.resources || [],
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

    const levelRes = await fetch(`https://www.dnd5eapi.co/api/classes/${apiClass}/levels/${level}`);
    const levelData = await levelRes.json();

    const fetchedFeatures = [];
    const fetchedResources = [];
    let spellSlots = null;
    let spellcastingInfo = null;

    // Upgrades
    if (apiClass === 'bard' && level === 5) fetchedResources.push({ name: 'Bardic Inspiration', upgrade: true, recharge: 'short' });
    if (apiClass === 'fighter' && level === 17) fetchedResources.push({ name: 'Action Surge', upgrade: true, maxType: 2 });

    // Feature Processing
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
          else if (hook.maxType === 'PALADIN_HP') maxVal = level * 5;
          else maxVal = hook.maxType; 

          const resourceName = hook.rename || hook.filterRename || safeName;
          fetchedResources.push({ name: resourceName, maxType: maxVal, recharge: hook.recharge, isPool: hook.maxType === 'PALADIN_HP' });
        }
      });
    }

    // Spell Slot & Spells Known Processing
    if (levelData.spellcasting) {
      spellcastingInfo = {
        cantripsKnown: levelData.spellcasting.cantrips_known || 0,
        spellsKnown: levelData.spellcasting.spells_known || 0
      };
      
      spellSlots = {};
      for (let i = 1; i <= 9; i++) {
        const slotsForLevel = levelData.spellcasting[`spell_slots_level_${i}`];
        if (slotsForLevel > 0) {
          // Output Format matches our app's format
          spellSlots[i.toString()] = { max: slotsForLevel, current: slotsForLevel };
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