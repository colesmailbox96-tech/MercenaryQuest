export const SKILLS = {
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    icon: '🎣',
    description: 'Cast your line and reel in the bounty of the waters.',
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    icon: '⛏',
    description: 'Extract precious ores and gems from the earth.',
  },
  farming: {
    id: 'farming',
    name: 'Farming',
    icon: '🌾',
    description: 'Cultivate the land and grow crops for cooking.',
  },
  cooking: {
    id: 'cooking',
    name: 'Cooking',
    icon: '🍳',
    description: 'Combine ingredients into meals that empower you.',
  },
};

export const SKILL_XP_TABLE = {
  1: 0,
  2: 30,
  3: 80,
  4: 160,
  5: 300,
  6: 500,
  7: 780,
  8: 1150,
  9: 1650,
  10: 2300,
};

export const SKILL_BONUSES = {
  fishing: {
    cycleSpeedBonus: 0.05,
    catchChanceBonus: 0.02,
    doubleCatchChance: 0.03,
    unlocks: {
      3: { type: 'pool', id: 'deep', description: 'Deep Waters pool unlocked' },
      5: { type: 'pool', id: 'abyssal', description: 'Abyssal Depths pool unlocked' },
      7: { type: 'perk', id: 'auto_collect_fish', description: 'Fish auto-collect (no need to claim)' },
      10: { type: 'perk', id: 'master_angler', description: 'Rare catch rates doubled' },
    },
  },
  mining: {
    cycleSpeedBonus: 0.05,
    extractChanceBonus: 0.02,
    doubleYieldChance: 0.03,
    unlocks: {
      2: { type: 'node', id: 'iron_node', description: 'Iron Deposits unlocked' },
      4: { type: 'node', id: 'crystal_node', description: 'Crystal Formations unlocked' },
      7: { type: 'perk', id: 'auto_collect_ore', description: 'Ores auto-collect (no need to claim)' },
      10: { type: 'perk', id: 'master_miner', description: 'Nodes take 50% longer to deplete' },
    },
  },
  farming: {
    growthSpeedBonus: 0.06,
    harvestBonusChance: 0.04,
    unlocks: {
      2: { type: 'seed', id: 'tomato_seed', description: 'Tomato seeds available' },
      3: { type: 'plots', count: 6, description: 'Farm expands to 6 plots' },
      4: { type: 'seed', id: 'golden_wheat_seed', description: 'Golden Wheat seeds available' },
      5: { type: 'plots', count: 9, description: 'Farm expands to 9 plots (3×3)' },
      6: { type: 'seed', id: 'moonberry_seed', description: 'Moonberry seeds available' },
      8: { type: 'seed', id: 'starfruit_seed', description: 'Starfruit seeds available' },
      10: { type: 'perk', id: 'master_farmer', description: 'All crops grow 25% faster (stacks)' },
    },
  },
  cooking: {
    buffDurationBonus: 0.05,
    buffPotencyBonus: 0.03,
    unlocks: {
      2: { type: 'recipe_tier', tier: 2, description: 'Tier 2 recipes unlocked' },
      4: { type: 'recipe_tier', tier: 3, description: 'Tier 3 recipes unlocked' },
      6: { type: 'recipe_tier', tier: 4, description: 'Tier 4 recipes unlocked' },
      8: { type: 'perk', id: 'double_portion', description: '20% chance to cook 2 portions from 1 recipe' },
      10: { type: 'perk', id: 'master_chef', description: 'All food buffs last 50% longer (stacks)' },
    },
  },
};
