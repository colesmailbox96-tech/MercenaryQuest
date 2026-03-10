export const DAY_NIGHT_CONFIG = {
  cycleDuration: 300000,      // 5 minutes total cycle
  dayDuration: 180000,        // 3 minutes of day (60% of cycle)
  nightDuration: 120000,      // 2 minutes of night (40% of cycle)
  transitionDuration: 10000,  // 10-second dawn/dusk transition
  phases: {
    dawn:      { start: 0,      duration: 10000,  label: 'Dawn' },
    day:       { start: 10000,  duration: 160000, label: 'Day' },
    dusk:      { start: 170000, duration: 10000,  label: 'Dusk' },
    night:     { start: 180000, duration: 110000, label: 'Night' },
    lateDusk:  { start: 290000, duration: 10000,  label: 'Late Night' },
  },
};

export const NOCTURNAL_MOBS = {
  shadow_wisp: {
    id: 'shadow_wisp',
    name: 'Shadow Wisp',
    zone: 'forest',
    stats: { hp: 35, atk: 12, def: 4, speed: 700 },
    xpReward: 18,
    goldDrop: { min: 4, max: 8 },
    textureKey: 'mob_shadow_wisp',
    spawnCount: 3,
    lootTable: [
      { id: 'shadow_essence', weight: 40, quantity: { min: 1, max: 2 } },
      { id: 'wisp_core',     weight: 15, quantity: { min: 1, max: 1 } },
      { id: 'companion_egg_owl', weight: 2, quantity: { min: 1, max: 1 } },
    ],
    behavior: 'wander_fast',
    description: 'A flickering orb of dark energy. Quick but fragile.',
  },
  night_stalker: {
    id: 'night_stalker',
    name: 'Night Stalker',
    zone: 'swamp',
    stats: { hp: 65, atk: 18, def: 8, speed: 900 },
    xpReward: 28,
    goldDrop: { min: 6, max: 12 },
    textureKey: 'mob_night_stalker',
    spawnCount: 2,
    lootTable: [
      { id: 'shadow_essence',    weight: 35, quantity: { min: 1, max: 3 } },
      { id: 'stalker_fang',      weight: 20, quantity: { min: 1, max: 1 } },
      { id: 'midnight_dew',      weight: 15, quantity: { min: 1, max: 2 } },
      { id: 'companion_egg_wolf', weight: 2, quantity: { min: 1, max: 1 } },
      { id: 'bog_moss',            weight: 25, quantity: { min: 1, max: 3 } },
      { id: 'witch_eye',           weight: 12, quantity: { min: 1, max: 1 } },
    ],
    behavior: 'ambush',
    description: 'Perfectly still until you get too close.',
  },
  moon_beetle: {
    id: 'moon_beetle',
    name: 'Moon Beetle',
    zone: 'caves',
    stats: { hp: 50, atk: 10, def: 14, speed: 1000 },
    xpReward: 22,
    goldDrop: { min: 5, max: 10 },
    textureKey: 'mob_moon_beetle',
    spawnCount: 3,
    lootTable: [
      { id: 'moonshell_fragment', weight: 40, quantity: { min: 1, max: 2 } },
      { id: 'luminous_chitin',    weight: 18, quantity: { min: 1, max: 1 } },
      { id: 'companion_egg_mole', weight: 2, quantity: { min: 1, max: 1 } },
    ],
    behavior: 'wander_slow',
    description: 'A heavily armored beetle that glows with inner moonlight.',
  },
  ember_wraith: {
    id: 'ember_wraith',
    name: 'Ember Wraith',
    zone: 'volcanic',
    stats: { hp: 80, atk: 24, def: 10, speed: 750 },
    xpReward: 40,
    goldDrop: { min: 10, max: 18 },
    textureKey: 'mob_ember_wraith',
    spawnCount: 2,
    lootTable: [
      { id: 'shadow_essence',    weight: 25, quantity: { min: 2, max: 3 } },
      { id: 'wraith_ember',      weight: 20, quantity: { min: 1, max: 1 } },
      { id: 'infernal_dust',     weight: 12, quantity: { min: 1, max: 2 } },
      { id: 'companion_egg_fox', weight: 2, quantity: { min: 1, max: 1 } },
      { id: 'lava_rock',           weight: 22, quantity: { min: 1, max: 2 } },
      { id: 'ash_dust',            weight: 20, quantity: { min: 1, max: 3 } },
      { id: 'forge_ember',         weight: 5,  quantity: { min: 1, max: 1 } },
    ],
    behavior: 'aggressive',
    description: 'A spirit of fire and shadow. The most dangerous nocturnal creature.',
  },
};

export const NIGHT_MODIFIERS = {
  farmingGrowthBonus: 0.15,
  daytimeMobReduction: 0.30,
  agentSpeedPenalty: 0.25,
  agentRetreatThreshold: 0.40,
};
