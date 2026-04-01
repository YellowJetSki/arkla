const BASE_URL = 'https://www.dnd5eapi.co/api';

// Memory Caches to prevent API spam
let equipmentListCache = null;
const equipmentDetailsCache = new Map();
const speciesDataCache = new Map();
const classDataCache = new Map();

export const fetchAllEquipment = async () => {
  if (equipmentListCache) return equipmentListCache;

  try {
    const res = await fetch(`${BASE_URL}/equipment`);
    const data = await res.json();
    equipmentListCache = data.results;
    return equipmentListCache;
  } catch (e) {
    console.error("Failed to fetch SRD equipment list", e);
    return [];
  }
};

export const fetchEquipmentDetails = async (index) => {
  if (equipmentDetailsCache.has(index)) return equipmentDetailsCache.get(index);

  try {
    const res = await fetch(`${BASE_URL}/equipment/${index}`);
    const data = await res.json();
    
    let category = 'Adventuring Gear';
    if (data.equipment_category?.index === 'weapon') category = 'Weapon';
    if (data.equipment_category?.index === 'armor') category = 'Armor';
    if (data.equipment_category?.index === 'potion') category = 'Potion';

    const result = {
      name: data.name,
      category,
      damageDice: data.damage?.damage_dice || '',
      damageType: data.damage?.damage_type?.name || '',
      properties: data.properties?.map(p => p.name).join(', ') || '',
      ac: data.armor_class?.base || 14,
      desc: data.desc?.join('\n') || ''
    };

    equipmentDetailsCache.set(index, result);
    return result;
  } catch (e) {
    console.error("Failed to fetch SRD equipment details", e);
    return null;
  }
};

export const fetchSpeciesData = async (speciesInput) => {
  if (!speciesInput) return null;
  
  const formattedInput = speciesInput.toLowerCase().trim().replace(/\s+/g, '-');
  const baseRaceFallback = speciesInput.toLowerCase().split(' ').pop(); 
  
  if (speciesDataCache.has(formattedInput)) return speciesDataCache.get(formattedInput);

  try {
    let finalTraits = [];
    let baseRaceUrl = `${BASE_URL}/races/${baseRaceFallback}`;
    let finalName = '';
    let finalSpeed = 30;
    let finalLanguages = 'Common';

    // 1. Try fetching as a Subrace first (e.g., "rock-gnome")
    const subRes = await fetch(`${BASE_URL}/subraces/${formattedInput}`);
    if (subRes.ok) {
      const subData = await subRes.json();
      finalName = subData.name;
      baseRaceUrl = `${BASE_URL.replace('/api', '')}${subData.race.url}`; // Redirect to its exact parent race
      
      // Grab subrace specific traits
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

    // 2. Fetch the Base Race (either standard or the parent of the subrace)
    const baseRes = await fetch(baseRaceUrl);
    if (baseRes.ok) {
      const baseData = await baseRes.json();
      if (!finalName) finalName = baseData.name;
      finalSpeed = baseData.speed;
      finalLanguages = baseData.languages?.map(l => l.name).join(', ') || 'Common';

      // Grab base race traits
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
        finalTraits = [...baseTraits, ...finalTraits]; // Put base traits first, subrace traits after
      }
    } else if (!subRes.ok) {
       // If both subrace and base race fail, return null
       return null;
    }

    const result = {
      name: finalName,
      speed: finalSpeed,
      languages: finalLanguages,
      traits: finalTraits
    };

    speciesDataCache.set(formattedInput, result);
    return result;
  } catch (e) {
    return null;
  }
};

export const fetchClassData = async (classInput) => {
  if (!classInput) return null;
  
  const normalized = classInput.toLowerCase().replace(/\s+/g, '-');
  
  if (classDataCache.has(normalized)) return classDataCache.get(normalized);

  try {
    const res = await fetch(`${BASE_URL}/classes/${normalized}`);
    if (!res.ok) return null;
    
    const data = await res.json();

    let armorProfs = [];
    let weaponProfs = [];
    let savingThrows = [];
    let toolProfs = [];
    let skillChoices = '';

    // Sort guaranteed proficiencies into their proper categories
    data.proficiencies?.forEach(p => {
      if (p.name.includes('armor') || p.name.includes('Shields')) armorProfs.push(p.name);
      else if (p.name.includes('weapons')) weaponProfs.push(p.name);
      else if (p.name.includes('Saving Throw:')) savingThrows.push(p.name.replace('Saving Throw: ', ''));
      else toolProfs.push(p.name);
    });

    // Parse out Skill choices (e.g. "Choose 2 from Acrobatics, Animal Handling...")
    if (data.proficiency_choices && data.proficiency_choices.length > 0) {
       const skillChoiceBlock = data.proficiency_choices.find(c => c.desc && c.desc.includes('Skill'));
       if (skillChoiceBlock) {
         skillChoices = skillChoiceBlock.desc.replace(/Skill: /g, '');
       }
    }

    const result = {
      name: data.name,
      hitDie: `d${data.hit_die}`, 
      armor: armorProfs.join(', '),
      weapons: weaponProfs.join(', '),
      savingThrows: savingThrows.join(', '),
      tools: toolProfs.join(', '),
      skills: skillChoices
    };

    classDataCache.set(normalized, result);
    return result;
  } catch (e) {
    return null;
  }
};