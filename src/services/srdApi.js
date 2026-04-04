const BASE_URL = 'https://www.dnd5eapi.co/api';

// Memory Caches to prevent API spam
let equipmentListCache = null;
let featuresListCache = null;
let spellListCache = null;
let proficienciesListCache = null;
let languagesListCache = null;

const equipmentDetailsCache = new Map();
const speciesDataCache = new Map();
const classDataCache = new Map();
const spellDetailsCache = new Map();

// ==========================================
// CUSTOM KNOWLEDGE BASE INTERCEPTOR
// ==========================================
// This bypasses the OGL limitations of the public SRD API.
// Add any homebrew species or missing official sub-species here!
const CUSTOM_SPECIES = {
  "wood elf": {
    name: "Wood Elf",
    speed: 35,
    languages: "Common, Elvish",
    traits: [
      { name: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light." },
      { name: "Keen Senses", desc: "You have proficiency in the Perception skill." },
      { name: "Fey Ancestry", desc: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
      { name: "Elf Weapon Training", desc: "You have proficiency with the longsword, shortsword, shortbow, and longbow." },
      { name: "Fleet of Foot", desc: "Your base walking speed increases to 35 feet." },
      { name: "Mask of the Wild", desc: "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena." }
    ]
  },
  "drow": {
    name: "Drow",
    speed: 30,
    languages: "Common, Elvish, Undercommon",
    traits: [
      { name: "Superior Darkvision", desc: "Your darkvision has a radius of 120 feet." },
      { name: "Sunlight Sensitivity", desc: "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight." },
      { name: "Drow Magic", desc: "You know the Dancing Lights cantrip. When you reach 3rd level, you can cast Faerie Fire. When you reach 5th level, you can cast Darkness. Charisma is your spellcasting ability." },
      { name: "Drow Weapon Training", desc: "You have proficiency with rapiers, shortswords, and hand crossbows." }
    ]
  },
  "dark elf": {
    name: "Dark Elf",
    speed: 30,
    languages: "Common, Elvish, Undercommon",
    traits: [
      { name: "Superior Darkvision", desc: "Your darkvision has a radius of 120 feet." },
      { name: "Sunlight Sensitivity", desc: "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight." },
      { name: "Drow Magic", desc: "You know the Dancing Lights cantrip. When you reach 3rd level, you can cast Faerie Fire. When you reach 5th level, you can cast Darkness. Charisma is your spellcasting ability." },
      { name: "Drow Weapon Training", desc: "You have proficiency with rapiers, shortswords, and hand crossbows." }
    ]
  },
  "mountain dwarf": {
    name: "Mountain Dwarf",
    speed: 25,
    languages: "Common, Dwarvish",
    traits: [
      { name: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light." },
      { name: "Dwarven Resilience", desc: "You have advantage on saving throws against poison, and you have resistance against poison damage." },
      { name: "Dwarven Combat Training", desc: "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer." },
      { name: "Dwarven Armor Training", desc: "You have proficiency with light and medium armor." },
      { name: "Stonecunning", desc: "Whenever you make an Intelligence (History) check related to the origin of stonework, you add double your proficiency bonus to the check." }
    ]
  },
  "stout halfling": {
    name: "Stout Halfling",
    speed: 25,
    languages: "Common, Halfling",
    traits: [
      { name: "Lucky", desc: "When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll." },
      { name: "Brave", desc: "You have advantage on saving throws against being frightened." },
      { name: "Halfling Nimbleness", desc: "You can move through the space of any creature that is of a size larger than yours." },
      { name: "Stout Resilience", desc: "You have advantage on saving throws against poison, and you have resistance against poison damage." }
    ]
  },
  "forest gnome": {
    name: "Forest Gnome",
    speed: 25,
    languages: "Common, Gnomish",
    traits: [
      { name: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light." },
      { name: "Gnome Cunning", desc: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic." },
      { name: "Natural Illusionist", desc: "You know the minor illusion cantrip. Intelligence is your spellcasting ability for it." },
      { name: "Speak with Small Beasts", desc: "Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts." }
    ]
  },
  "half-elf": {
    name: "Half-Elf",
    speed: 30,
    languages: "Common, Elvish, and one extra language",
    traits: [
      { name: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light." },
      { name: "Fey Ancestry", desc: "You have advantage on saving throws against being charmed, and magic can't put you to sleep." },
      { name: "Skill Versatility", desc: "You gain proficiency in two skills of your choice." }
    ]
  }
};
// ==========================================


export const fetchAllEquipment = async () => {
  if (equipmentListCache) return equipmentListCache;
  try {
    // Fetch BOTH standard equipment and magic items
    const [equipRes, magicRes] = await Promise.all([
      fetch(`${BASE_URL}/equipment`),
      fetch(`${BASE_URL}/magic-items`)
    ]);
    const equipData = await equipRes.json();
    const magicData = await magicRes.json();
    
    // Combine and sort alphabetically
    equipmentListCache = [
      ...(equipData.results || []),
      ...(magicData.results || [])
    ].sort((a, b) => a.name.localeCompare(b.name));
    
    return equipmentListCache;
  } catch (e) { return []; }
};

export const fetchEquipmentDetails = async (urlOrIndex) => {
  if (equipmentDetailsCache.has(urlOrIndex)) return equipmentDetailsCache.get(urlOrIndex);
  try {
    // Check if we were passed a full URL (for magic items) or just an index
    const endpoint = urlOrIndex.startsWith('/api/') ? urlOrIndex : `/api/equipment/${urlOrIndex}`;
    const res = await fetch(`https://www.dnd5eapi.co${endpoint}`);
    const data = await res.json();
    
    let category = 'Adventuring Gear';
    if (data.equipment_category?.index === 'weapon') category = 'Weapon';
    if (data.equipment_category?.index === 'armor') category = 'Armor';
    if (data.equipment_category?.index === 'potion') category = 'Potion';
    
    // Magic Items use the name field instead of index
    if (data.equipment_category?.name?.includes('Wondrous')) category = 'Wondrous Item';
    if (data.equipment_category?.name?.includes('Weapon')) category = 'Weapon';
    if (data.equipment_category?.name?.includes('Armor')) category = 'Armor';
    if (data.equipment_category?.name?.includes('Potion')) category = 'Potion';

    let dDice = data.damage?.damage_dice || '';
    if (data.two_handed_damage?.damage_dice) {
       dDice += ` (${data.two_handed_damage.damage_dice})`;
    }

    let rangeStr = '';
    if (data.range) {
       rangeStr = data.range.normal ? `${data.range.normal} ft` : '';
       if (data.range.long) rangeStr += ` / ${data.range.long} ft`;
    }

    let descText = '';
    if (data.desc && Array.isArray(data.desc)) {
      // 1. Strip out pure Markdown table formatting if the API leaks it
      let cleanDesc = data.desc.filter(p => !p.includes('|---') && !p.startsWith('| '));
      
      // 2. Strip out literal book references
      cleanDesc = cleanDesc.filter(p => !/(refer to|see the|roll on).*table/i.test(p));

      descText = cleanDesc.join('\n\n').trim();
    }

    // 3. Smart Muting: Standard weapons/armor have useless descriptions ("See weapons table").
    // We already display their mechanics in the UI, so we wipe the text.
    // We ONLY keep descriptions for Magic Items (which have a URL rather than an index in this check) or Wondrous gear.
    if ((category === 'Weapon' || category === 'Armor') && !urlOrIndex.includes('magic-items')) {
       descText = '';
    }

    const result = {
      name: data.name,
      category,
      damageDice: dDice,
      damageType: data.damage?.damage_type?.name || '',
      properties: data.properties?.map(p => p.name).join(', ') || '',
      range: rangeStr,
      ac: data.armor_class?.base || 14,
      desc: descText
    };
    
    equipmentDetailsCache.set(urlOrIndex, result);
    return result;
  } catch (e) { return null; }
};

export const fetchSpeciesData = async (speciesInput) => {
  if (!speciesInput) return null;
  
  const lowerInput = speciesInput.toLowerCase().trim();
  
  // 1. Intercept with Custom Knowledge Base First
  if (CUSTOM_SPECIES[lowerInput]) {
    return CUSTOM_SPECIES[lowerInput];
  }

  // 2. Fallback to the Public SRD API
  const formattedInput = lowerInput.replace(/\s+/g, '-');
  const baseRaceFallback = lowerInput.split(' ').pop(); 
  if (speciesDataCache.has(formattedInput)) return speciesDataCache.get(formattedInput);

  try {
    let finalTraits = [];
    let baseRaceUrl = `${BASE_URL}/races/${baseRaceFallback}`;
    let finalName = '';
    let finalSpeed = 30;
    let finalLanguages = 'Common';

    const subRes = await fetch(`${BASE_URL}/subraces/${formattedInput}`);
    if (subRes.ok) {
      const subData = await subRes.json();
      finalName = subData.name;
      baseRaceUrl = `${BASE_URL.replace('/api', '')}${subData.race.url}`; 
      if (subData.racial_traits) {
        const subTraits = await Promise.all(
          subData.racial_traits.map(async (t) => {
            try {
              const tRes = await fetch(`${BASE_URL.replace('/api', '')}${t.url}`);
              const tData = await tRes.json();
              return { name: tData.name, desc: tData.desc?.join('\n\n') || '' };
            } catch (err) { return { name: t.name, desc: '' }; }
          })
        );
        finalTraits = [...finalTraits, ...subTraits];
      }
    }

    const baseRes = await fetch(baseRaceUrl);
    if (baseRes.ok) {
      const baseData = await baseRes.json();
      if (!finalName) finalName = baseData.name;
      finalSpeed = baseData.speed;
      finalLanguages = baseData.languages?.map(l => l.name).join(', ') || 'Common';

      if (baseData.traits) {
        const baseTraits = await Promise.all(
          baseData.traits.map(async (t) => {
            try {
              const tRes = await fetch(`${BASE_URL.replace('/api', '')}${t.url}`);
              const tData = await tRes.json();
              return { name: tData.name, desc: tData.desc?.join('\n\n') || '' };
            } catch (err) { return { name: t.name, desc: '' }; }
          })
        );
        finalTraits = [...baseTraits, ...finalTraits]; 
      }
    } else if (!subRes.ok) { return null; }

    const result = { name: finalName, speed: finalSpeed, languages: finalLanguages, traits: finalTraits };
    speciesDataCache.set(formattedInput, result);
    return result;
  } catch (e) { return null; }
};

export const fetchClassData = async (classInput) => {
  if (!classInput) return null;
  const normalized = classInput.toLowerCase().replace(/\s+/g, '-');
  if (classDataCache.has(normalized)) return classDataCache.get(normalized);

  try {
    const res = await fetch(`${BASE_URL}/classes/${normalized}`);
    if (!res.ok) return null;
    const data = await res.json();
    let armorProfs = [], weaponProfs = [], savingThrows = [], toolProfs = [], skillChoices = '';

    data.proficiencies?.forEach(p => {
      const idx = p.index || '';
      if (idx.includes('armor') || idx.includes('shield')) {
        armorProfs.push(p.name);
      }
      else if (
        idx.includes('weapon') || idx.includes('sword') || idx.includes('crossbow') || 
        idx.includes('blowgun') || idx.includes('dart') || idx.includes('sling') || 
        idx.includes('net') || idx.includes('axe') || idx.includes('club') || 
        idx.includes('dagger') || idx.includes('javelin') || idx.includes('mace') || 
        idx.includes('staff') || idx.includes('sickle') || idx.includes('spear') || 
        idx.includes('hammer') || idx.includes('flail') || idx.includes('glaive') || 
        idx.includes('halberd') || idx.includes('lance') || idx.includes('morningstar') || 
        idx.includes('pike') || idx.includes('trident') || idx.includes('whip') || 
        idx.includes('rapier') || idx.includes('scimitar') || idx.includes('bow')
      ) {
        weaponProfs.push(p.name);
      }
      else if (idx.includes('saving-throw')) {
        savingThrows.push(p.name.replace('Saving Throw: ', ''));
      }
      else {
        toolProfs.push(p.name);
      }
    });

    if (data.proficiency_choices && data.proficiency_choices.length > 0) {
       const skillChoiceBlock = data.proficiency_choices.find(c => c.desc && c.desc.includes('Skill'));
       if (skillChoiceBlock) skillChoices = skillChoiceBlock.desc.replace(/Skill: /g, '');
    }

    const result = {
      name: data.name, hitDie: `d${data.hit_die}`, armor: armorProfs.join(', '),
      weapons: weaponProfs.join(', '), savingThrows: savingThrows.join(', '),
      tools: toolProfs.join(', '), skills: skillChoices
    };

    classDataCache.set(normalized, result);
    return result;
  } catch (e) { return null; }
};

export const fetchClassProgression = async (classInput, targetLevel) => {
  if (!classInput) return null;
  const normalized = classInput.toLowerCase().replace(/\s+/g, '-');
  try {
    let featureUrls = new Map();
    let spellcasting = null;

    for (let i = 1; i <= targetLevel; i++) {
      const res = await fetch(`${BASE_URL}/classes/${normalized}/levels/${i}`);
      if (res.ok) {
        const data = await res.json();
        if (data.features) {
          data.features.forEach(f => featureUrls.set(f.index, { name: f.name, url: f.url }));
        }
        if (i === Number(targetLevel) && data.spellcasting) {
          spellcasting = data.spellcasting; 
        }
      }
    }

    const features = await Promise.all(
      Array.from(featureUrls.values()).map(async (f) => {
        try {
          const res = await fetch(`${BASE_URL.replace('/api', '')}${f.url}`);
          const data = await res.json();
          return { name: data.name, desc: data.desc?.join('\n\n') || '' };
        } catch (e) { return { name: f.name, desc: '' }; }
      })
    );

    return { features, spellcasting };
  } catch(e) { return null; }
};

export const fetchAllTraitsAndFeatures = async () => {
  if (featuresListCache) return featuresListCache;
  try {
    const [traitsRes, featuresRes] = await Promise.all([fetch(`${BASE_URL}/traits`), fetch(`${BASE_URL}/features`)]);
    const traits = await traitsRes.json();
    const features = await featuresRes.json();
    featuresListCache = [...(traits.results || []), ...(features.results || [])].sort((a, b) => a.name.localeCompare(b.name));
    return featuresListCache;
  } catch (e) { return []; }
};

export const fetchTraitOrFeatureDetails = async (url) => {
  try {
    const res = await fetch(`https://www.dnd5eapi.co${url}`);
    const data = await res.json();
    return { name: data.name, desc: data.desc?.join('\n\n') || '' };
  } catch (e) { return null; }
};

export const fetchAllSpells = async () => {
  if (spellListCache) return spellListCache;
  try {
    const res = await fetch(`${BASE_URL}/spells`);
    const data = await res.json();
    spellListCache = data.results;
    return spellListCache;
  } catch (e) { return []; }
};

export const fetchSpellDetails = async (index) => {
  if (spellDetailsCache.has(index)) return spellDetailsCache.get(index);
  try {
    const res = await fetch(`${BASE_URL}/spells/${index}`);
    const data = await res.json();
    const result = {
      name: data.name, level: data.level, school: data.school?.name,
      castingTime: data.casting_time, range: data.range, duration: data.duration,
      components: data.components?.join(', '), concentration: data.concentration,
      desc: data.desc?.join('\n') + (data.higher_level ? `\n\nAt Higher Levels: ${data.higher_level.join('\n')}` : '')
    };
    spellDetailsCache.set(index, result);
    return result;
  } catch (e) { return null; }
};

export const fetchAllProficiencies = async () => {
  if (proficienciesListCache) return proficienciesListCache;
  try {
    const res = await fetch(`${BASE_URL}/proficiencies`);
    const data = await res.json();
    proficienciesListCache = data.results;
    return proficienciesListCache;
  } catch (e) { return []; }
};

export const fetchAllLanguages = async () => {
  if (languagesListCache) return languagesListCache;
  try {
    const res = await fetch(`${BASE_URL}/languages`);
    const data = await res.json();
    languagesListCache = data.results;
    return languagesListCache;
  } catch (e) { return []; }
};