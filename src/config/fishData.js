export const FISHING_POOLS = {
  shallow: {
    name: 'Shallow Waters',
    requiredSkillLevel: 1,
    cycleDuration: 8000,
    catchChance: 0.85,
    catches: [
      { id: 'small_fish', weight: 50 },
      { id: 'river_crab', weight: 30 },
      { id: 'old_boot', weight: 15 },
      { id: 'pearl_fragment', weight: 5 },
    ],
  },
  deep: {
    name: 'Deep Waters',
    requiredSkillLevel: 3,
    cycleDuration: 12000,
    catchChance: 0.75,
    catches: [
      { id: 'large_fish', weight: 40 },
      { id: 'golden_carp', weight: 25 },
      { id: 'river_crab', weight: 20 },
      { id: 'sunken_ring', weight: 10 },
      { id: 'pearl_fragment', weight: 5 },
    ],
  },
  abyssal: {
    name: 'Abyssal Depths',
    requiredSkillLevel: 5,
    cycleDuration: 18000,
    catchChance: 0.65,
    catches: [
      { id: 'abyssal_eel', weight: 35 },
      { id: 'golden_carp', weight: 25 },
      { id: 'crystal_shell', weight: 20 },
      { id: 'sea_gem', weight: 12 },
      { id: 'ancient_coin', weight: 8 },
    ],
  },
};
