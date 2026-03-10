export const FORGE_RECIPES = {
  swamp_fang_blade: {
    id: 'swamp_fang_blade',
    name: 'Swamp Fang Blade',
    tier: 4,
    slot: 'weapon',
    ingredients: [
      { id: 'bog_moss', quantity: 8 },
      { id: 'witch_eye', quantity: 3 },
      { id: 'forge_ember', quantity: 2 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { atk: 12 },
      statRanges: { atk: [10, 16] },
    },
  },
  volcanic_helm: {
    id: 'volcanic_helm',
    name: 'Volcanic Helm',
    tier: 4,
    slot: 'helmet',
    ingredients: [
      { id: 'lava_rock', quantity: 6 },
      { id: 'ash_dust', quantity: 8 },
      { id: 'forge_ember', quantity: 2 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { def: 8, maxHp: 10 },
      statRanges: { def: [6, 12], maxHp: [8, 15] },
    },
  },
  miasma_mail: {
    id: 'miasma_mail',
    name: 'Miasma Mail',
    tier: 4,
    slot: 'chest',
    ingredients: [
      { id: 'bog_moss', quantity: 10 },
      { id: 'lava_rock', quantity: 4 },
      { id: 'witch_eye', quantity: 2 },
      { id: 'forge_ember', quantity: 3 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { def: 10, maxHp: 15 },
      statRanges: { def: [8, 14], maxHp: [12, 20] },
    },
  },
  ashwalker_boots: {
    id: 'ashwalker_boots',
    name: 'Ashwalker Boots',
    tier: 4,
    slot: 'boots',
    ingredients: [
      { id: 'ash_dust', quantity: 10 },
      { id: 'lava_rock', quantity: 3 },
      { id: 'forge_ember', quantity: 2 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { def: 6, maxHp: 8 },
      statRanges: { def: [4, 9], maxHp: [6, 12] },
    },
  },
  hexed_amulet: {
    id: 'hexed_amulet',
    name: 'Hexed Amulet',
    tier: 4,
    slot: 'accessory',
    ingredients: [
      { id: 'witch_eye', quantity: 5 },
      { id: 'gemstone_shard', quantity: 3 },
      { id: 'forge_ember', quantity: 2 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { atk: 5, def: 5, maxHp: 5 },
      statRanges: { atk: [3, 8], def: [3, 8], maxHp: [3, 10] },
    },
  },
  infernal_greatsword: {
    id: 'infernal_greatsword',
    name: 'Infernal Greatsword',
    tier: 4,
    slot: 'weapon',
    ingredients: [
      { id: 'lava_rock', quantity: 10 },
      { id: 'ash_dust', quantity: 6 },
      { id: 'void_crystal', quantity: 2 },
      { id: 'forge_ember', quantity: 4 },
    ],
    minRarity: 'rare',
    output: {
      baseStats: { atk: 16 },
      statRanges: { atk: [14, 22] },
    },
  },
};
