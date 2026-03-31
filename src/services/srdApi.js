const BASE_URL = 'https://www.dnd5eapi.co/api';

// Memory Caches to prevent API spam
let equipmentListCache = null;
const equipmentDetailsCache = new Map();
const speciesDataCache = new Map();

export const fetchAllEquipment = async () => {
  if (equipmentListCache) return equipmentListCache; // Return cached list if available

  try {
    const res = await fetch(`${BASE_URL}/equipment`);
    const data = await res.json();
    equipmentListCache = data.results; // Save to cache
    return equipmentListCache;
  } catch (e) {
    console.error("Failed to fetch SRD equipment list", e);
    return [];
  }
};

export const fetchEquipmentDetails = async (index) => {
  if (equipmentDetailsCache.has(index)) return equipmentDetailsCache.get(index); // Return cached details

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

    equipmentDetailsCache.set(index, result); // Save to cache
    return result;
  } catch (e) {
    console.error("Failed to fetch SRD equipment details", e);
    return null;
  }
};

export const fetchSpeciesData = async (speciesInput) => {
  if (!speciesInput) return null;
  
  const normalized = speciesInput.toLowerCase().split(' ').pop(); 
  
  if (speciesDataCache.has(normalized)) return speciesDataCache.get(normalized); // Return cached traits

  try {
    const res = await fetch(`${BASE_URL}/races/${normalized}`);
    if (!res.ok) return null; 
    
    const data = await res.json();

    const traits = await Promise.all(
      (data.traits || []).map(async (t) => {
         try {
           const tRes = await fetch(`${BASE_URL.replace('/api', '')}${t.url}`);
           const tData = await tRes.json();
           return { name: tData.name, desc: tData.desc?.join('\n\n') || '' };
         } catch (err) {
           return { name: t.name, desc: '' };
         }
      })
    );

    const result = {
      name: data.name,
      speed: data.speed,
      languages: data.languages?.map(l => l.name).join(', ') || 'Common',
      traits
    };

    speciesDataCache.set(normalized, result); // Save to cache
    return result;
  } catch (e) {
    return null;
  }
};