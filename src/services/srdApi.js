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

    const result = {
      name: data.name,
      category,
      damageDice: dDice,
      damageType: data.damage?.damage_type?.name || '',
      properties: data.properties?.map(p => p.name).join(', ') || '',
      ac: data.armor_class?.base || 14,
      desc: data.desc?.join('\n') || ''
    };
    equipmentDetailsCache.set(urlOrIndex, result);
    return result;
  } catch (e) { return null; }
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