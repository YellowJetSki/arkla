// ==========================================
// 🎲 CONSTANTS & RULES
// ==========================================

export const STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const CONDITIONS_LIST = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'
];

export const CONDITION_EFFECTS = {
  'Blinded': "Can't see. Disadvantage on attacks. Enemy attacks have Advantage.",
  'Charmed': "Can't attack the charmer. Charmer has Advantage on social checks.",
  'Deafened': "Can't hear. Fails checks requiring hearing.",
  'Frightened': "Disadvantage on attacks/checks while source is visible. Can't willingly move closer.",
  'Grappled': "Speed becomes 0.",
  'Incapacitated': "Can't take Actions or Reactions.",
  'Invisible': "Impossible to see. Attacks have Advantage. Enemy attacks have Disadvantage.",
  'Paralyzed': "Incapacitated. Can't move/speak. Auto-fail STR/DEX saves. Attacks against you have Advantage. Melee hits are automatic criticals.",
  'Petrified': "Turned to stone. Incapacitated. Auto-fail STR/DEX saves. Resistance to all damage.",
  'Poisoned': "Disadvantage on attack rolls and ability checks.",
  'Prone': "Only crawl. Disadvantage on attacks. Melee attacks against you have Advantage. Ranged have Disadvantage.",
  'Restrained': "Speed is 0. Disadvantage on attacks/DEX saves. Enemy attacks have Advantage.",
  'Stunned': "Incapacitated. Auto-fail STR/DEX saves. Enemy attacks have Advantage.",
  'Unconscious': "Incapacitated. Drop what you're holding. Auto-fail STR/DEX saves. Melee hits are automatic criticals."
};