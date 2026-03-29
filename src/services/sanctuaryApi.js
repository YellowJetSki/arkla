// The rules of the Sanctuary Filter - 'blood' removed to prevent banning Potions of Healing
const FORBIDDEN_WORDS = /\b(soul|demon|demons|demonic|fiend|fiends|fiendish|devil|devils|undead|spirit|spirits|necromancy|pact)\b/i;
const FORBIDDEN_TYPES = ['fiend', 'undead', 'aberration'];

export const fetchSafeSpells = async (query) => {
  try {
    const res = await fetch(`https://www.dnd5eapi.co/api/spells/?name=${query}`);
    const data = await res.json();

    if (data.count === 0) {
      return { results: [], error: 'No spells found matching that name in the ancient archives.' };
    }

    const safeSpells = [];
    
    // Limit to 5 API calls to prevent rate-limiting/lag
    for (let i = 0; i < Math.min(data.results.length, 5); i++) {
      const detailRes = await fetch(`https://www.dnd5eapi.co${data.results[i].url}`);
      const spellDetail = await detailRes.json();

      const isNecromancy = spellDetail.school?.name === 'Necromancy';
      const hasForbiddenWords = FORBIDDEN_WORDS.test(spellDetail.desc?.join(' '));

      if (!isNecromancy && !hasForbiddenWords) {
        safeSpells.push(spellDetail);
      }
    }

    if (safeSpells.length === 0) {
      return { results: [], error: 'No safe spells found. The Sanctuary Filter blocked the dark magic.' };
    }

    return { results: safeSpells, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to commune with the magical archives. Try again.' };
  }
};

export const fetchSafeMonsters = async (query) => {
  try {
    const res = await fetch(`https://www.dnd5eapi.co/api/monsters/?name=${query}`);
    const data = await res.json();

    if (data.count === 0) {
      return { results: [], error: 'No monsters found in the official archives.' };
    }

    const safeMonsters = [];

    for (let i = 0; i < Math.min(data.results.length, 5); i++) {
      const detailRes = await fetch(`https://www.dnd5eapi.co${data.results[i].url}`);
      const monDetail = await detailRes.json();

      if (!FORBIDDEN_TYPES.includes(monDetail.type?.toLowerCase())) {
        safeMonsters.push(monDetail);
      }
    }

    if (safeMonsters.length === 0) {
      return { results: [], error: 'No safe monsters found. The Sanctuary Filter blocked demonic/undead entities.' };
    }

    return { results: safeMonsters, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to consult the Bestiary archives.' };
  }
};

export const fetchSafeEquipment = async (query) => {
  try {
    // Fetch from both equipment and magic item endpoints concurrently
    const [eqRes, miRes] = await Promise.all([
      fetch(`https://www.dnd5eapi.co/api/equipment/?name=${query}`),
      fetch(`https://www.dnd5eapi.co/api/magic-items/?name=${query}`)
    ]);

    const eqData = await eqRes.json();
    const miData = await miRes.json();

    const combinedResults = [...(eqData.results || []), ...(miData.results || [])];

    if (combinedResults.length === 0) {
      return { results: [], error: 'No items found matching that name in the vaults.' };
    }

    const safeItems = [];

    for (let i = 0; i < Math.min(combinedResults.length, 5); i++) {
      const detailRes = await fetch(`https://www.dnd5eapi.co${combinedResults[i].url}`);
      const itemDetail = await detailRes.json();

      const descText = Array.isArray(itemDetail.desc) ? itemDetail.desc.join(' ') : (itemDetail.desc || '');
      const hasForbiddenWords = FORBIDDEN_WORDS.test(descText) || FORBIDDEN_WORDS.test(itemDetail.name);

      if (!hasForbiddenWords) {
        safeItems.push(itemDetail);
      }
    }

    if (safeItems.length === 0) {
      return { results: [], error: 'No safe items found. The Sanctuary Filter blocked corrupted artifacts.' };
    }

    return { results: safeItems, error: null };
  } catch (err) {
    console.error(err);
    return { results: [], error: 'Failed to search the vaults. Try again.' };
  }
};