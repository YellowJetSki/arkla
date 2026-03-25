export const getProficiencyBonus = (level) => Math.floor((level - 1) / 4) + 2;
export const getModifier = (score) => Math.floor((score - 10) / 2);

// Structural Engine for Automating Level Ups
export const CLASS_MECHANICS = {
  'Pirate': {
    hitDie: 10,
    spellcasting: null,
    levels: {
      1: {
        features: [
          { name: 'Pirate\'s Bounty', desc: '(Bonus Action). Mark a target within 60ft for 1 minute. You have advantage on Intimidation/Persuasion against them. They subtract 1d4 from attacks against you, and you deal an extra 1d6 damage to them.' }
        ],
        resources: [
          { name: 'Pirate\'s Bounty', maxType: 'PB', recharge: 'long' } // Scales with Proficiency Bonus
        ]
      },
      3: {
        features: [
          { name: 'Flint Lock', desc: '(Action). Blast highly pressurized water at a target within 30ft. Ranged Spell Attack. Hit: 2d10 bludgeoning. Target must make a CON save or be Stunned until the start of your next turn.' }
        ],
        resources: [
          { name: 'Flint Lock', maxType: 'CHA', recharge: 'long' } // Scales with Charisma Modifier
        ]
      },
      7: {
        features: [
          { name: 'Tsunami', desc: '(Action). 15ft cone of water. STR save. Fail: 4d6 bludgeoning, pushed 15ft away, knocked Prone. Success: Half damage, not pushed.' }
        ],
        resources: [
          { name: 'Tsunami', maxType: 1, recharge: 'short' } // 1 per Short Rest
        ]
      },
      11: {
        features: [
          { name: 'Ocean\'s Rage', desc: '(Action). Summon a spectral sea beast on a target within 60ft. Roll 1d6 to determine the beast! (1-2: Giant Turtle, 3-4: Megalodon, 5-6: The Kraken).' }
        ],
        resources: [
          { name: 'Ocean\'s Rage', maxType: 1, recharge: 'long' }
        ]
      }
    }
  },
  'Monk': {
    hitDie: 8,
    spellcasting: 'WIS',
    levels: {
      1: {
        features: [
          { name: 'Unarmored Defense', desc: 'While not wearing armor, your AC equals 10 + DEX + WIS.' },
          { name: 'Martial Arts', desc: 'Use DEX for unarmed strikes. You can make one unarmed strike as a bonus action after attacking.' }
        ]
      },
      2: {
        features: [
          { name: 'Ki', desc: 'You can spend Ki points to fuel various special features (Flurry of Blows, Patient Defense, Step of the Wind).' },
          { name: 'Unarmored Movement', desc: 'Your speed increases by 10 feet while not wearing armor.' }
        ],
        resources: [
          { name: 'Ki Points', maxType: 'LEVEL', recharge: 'short' } // Scales exactly 1:1 with Monk Level
        ]
      },
      3: {
        features: [
          { name: 'Deflect Missiles', desc: 'Use your reaction to reduce the damage of a ranged weapon attack by 1d10 + DEX + Monk Level.' }
        ]
      },
      4: {
        features: [
          { name: 'Slow Fall', desc: 'Use your reaction to reduce falling damage by an amount equal to five times your monk level.' }
        ]
      },
      5: {
        features: [
          { name: 'Extra Attack', desc: 'You can attack twice, instead of once, whenever you take the Attack action.' },
          { name: 'Stunning Strike', desc: 'When you hit with a melee weapon attack, spend 1 ki point to attempt a stunning strike (CON Save).' }
        ]
      }
    }
  },
  'Bard': {
    hitDie: 8,
    spellcasting: 'CHA',
    levels: {
      1: {
        features: [
          { name: 'Bardic Inspiration', desc: 'Use a Bonus Action to give a creature a 1d6 inspiration die. Recharges on a Long Rest.' }
        ],
        resources: [
          { name: 'Bardic Inspiration', maxType: 'CHA', recharge: 'long' }
        ]
      },
      2: {
        features: [
          { name: 'Jack of All Trades', desc: 'Add half your proficiency bonus to any ability check you make that doesn\'t already include it.' },
          { name: 'Song of Rest', desc: 'During a short rest, allies who spend Hit Dice regain an extra 1d6 hit points.' }
        ]
      },
      3: {
        features: [
          { name: 'Expertise', desc: 'Choose two skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses them.' }
        ]
      },
      5: {
        features: [
          { name: 'Font of Inspiration', desc: 'You now regain all of your expended uses of Bardic Inspiration when you finish a short or long rest.' }
        ],
        resourceUpgrades: [
          { name: 'Bardic Inspiration', recharge: 'short' } // Upgrades the existing resource automatically!
        ]
      }
    }
  },
  'Fighter': {
    hitDie: 10,
    spellcasting: null,
    levels: {
      1: {
        features: [{ name: 'Second Wind', desc: 'On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.' }],
        resources: [{ name: 'Second Wind', maxType: 1, recharge: 'short' }]
      },
      2: {
        features: [{ name: 'Action Surge', desc: 'Take one additional action on top of your regular action and a possible bonus action.' }],
        resources: [{ name: 'Action Surge', maxType: 1, recharge: 'short' }]
      },
      5: {
        features: [{ name: 'Extra Attack', desc: 'You can attack twice, instead of once, whenever you take the Attack action.' }]
      }
    }
  },
  'Rogue': {
    hitDie: 8,
    spellcasting: null,
    levels: {
      1: {
        features: [{ name: 'Sneak Attack', desc: 'Once per turn, deal extra damage to one creature you hit with an attack if you have advantage.' }]
      },
      2: {
        features: [{ name: 'Cunning Action', desc: 'You can take a bonus action on each of your turns in combat to take the Dash, Disengage, or Hide action.' }]
      },
      5: {
        features: [{ name: 'Uncanny Dodge', desc: 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage.' }]
      }
    }
  }
};