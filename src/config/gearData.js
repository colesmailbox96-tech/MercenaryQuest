export const EQUIP_SLOTS = {
  WEAPON: 'weapon',
  HELMET: 'helmet',
  CHEST: 'chest',
  BOOTS: 'boots',
  ACCESSORY: 'accessory',
};

export const RARITY = {
  COMMON:   { name: 'Common',   color: 0xAAAAAA, weight: 60, statMultiplier: 1.0 },
  UNCOMMON: { name: 'Uncommon', color: 0x4CAF50, weight: 25, statMultiplier: 1.3 },
  RARE:     { name: 'Rare',     color: 0x2196F3, weight: 12, statMultiplier: 1.7 },
  EPIC:     { name: 'Epic',     color: 0x9C27B0, weight: 3,  statMultiplier: 2.2 },
};

export const GEAR_DEFS = {
  // ===== WEAPONS =====
  wooden_sword: {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    slot: 'weapon',
    icon: '🗡️',
    textureKey: 'gear_wooden_sword',
    baseStats: { atk: 2 },
    dropLevel: 1,
    dropSources: ['slime', 'wolf'],
  },
  iron_dagger: {
    id: 'iron_dagger',
    name: 'Iron Dagger',
    slot: 'weapon',
    icon: '🔪',
    textureKey: 'gear_iron_dagger',
    baseStats: { atk: 4 },
    dropLevel: 2,
    dropSources: ['wolf', 'caveBat'],
  },
  shadow_blade: {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    slot: 'weapon',
    icon: '⚔️',
    textureKey: 'gear_shadow_blade',
    baseStats: { atk: 7 },
    dropLevel: 3,
    dropSources: ['caveBat'],
  },

  // ===== HELMETS =====
  leather_cap: {
    id: 'leather_cap',
    name: 'Leather Cap',
    slot: 'helmet',
    icon: '🧢',
    textureKey: 'gear_leather_cap',
    baseStats: { def: 1, maxHp: 3 },
    dropLevel: 1,
    dropSources: ['slime', 'wolf'],
  },
  iron_helm: {
    id: 'iron_helm',
    name: 'Iron Helm',
    slot: 'helmet',
    icon: '⛑️',
    textureKey: 'gear_iron_helm',
    baseStats: { def: 3, maxHp: 5 },
    dropLevel: 2,
    dropSources: ['wolf', 'caveBat'],
  },

  // ===== CHEST =====
  cloth_tunic: {
    id: 'cloth_tunic',
    name: 'Cloth Tunic',
    slot: 'chest',
    icon: '👕',
    textureKey: 'gear_cloth_tunic',
    baseStats: { def: 2, maxHp: 5 },
    dropLevel: 1,
    dropSources: ['slime', 'wolf'],
  },
  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    slot: 'chest',
    icon: '🛡️',
    textureKey: 'gear_chainmail',
    baseStats: { def: 4, maxHp: 10 },
    dropLevel: 2,
    dropSources: ['wolf', 'caveBat'],
  },

  // ===== BOOTS =====
  sandals: {
    id: 'sandals',
    name: 'Worn Sandals',
    slot: 'boots',
    icon: '👡',
    textureKey: 'gear_sandals',
    baseStats: { def: 1 },
    dropLevel: 1,
    dropSources: ['slime'],
  },
  iron_greaves: {
    id: 'iron_greaves',
    name: 'Iron Greaves',
    slot: 'boots',
    icon: '🥾',
    textureKey: 'gear_iron_greaves',
    baseStats: { def: 3 },
    dropLevel: 2,
    dropSources: ['wolf', 'caveBat'],
  },

  // ===== ACCESSORIES =====
  bone_ring: {
    id: 'bone_ring',
    name: 'Bone Ring',
    slot: 'accessory',
    icon: '💍',
    textureKey: 'gear_bone_ring',
    baseStats: { atk: 1, def: 1 },
    dropLevel: 1,
    dropSources: ['slime', 'wolf'],
  },
  echo_pendant: {
    id: 'echo_pendant',
    name: 'Echo Pendant',
    slot: 'accessory',
    icon: '📿',
    textureKey: 'gear_echo_pendant',
    baseStats: { maxHp: 8, atk: 2 },
    dropLevel: 3,
    dropSources: ['caveBat'],
  },
  moonstone_ring: {
    id: 'moonstone_ring',
    name: 'Moonstone Ring',
    slot: 'accessory',
    icon: '💍',
    textureKey: 'gear_moonstone_ring',
    baseStats: { atk: 5, def: 5 },
    dropLevel: 1,
    dropSources: [],
    nightOnly: true,
  },
  agent_lantern: {
    id: 'agent_lantern',
    name: 'Lantern',
    slot: 'accessory',
    icon: '🏮',
    textureKey: 'gear_lantern',
    baseStats: { def: 2 },
    dropLevel: 1,
    dropSources: [],
    perk: 'night_vision',
  },
};

function weightedRandomRarity() {
  const entries = Object.entries(RARITY);
  const total = entries.reduce((s, [, r]) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const [key, r] of entries) {
    roll -= r.weight;
    if (roll <= 0) return { key, ...r };
  }
  return { key: 'COMMON', ...RARITY.COMMON };
}

export function rollGearInstance(defId) {
  const def = GEAR_DEFS[defId];
  const rarity = weightedRandomRarity();
  const stats = {};
  for (const [stat, baseVal] of Object.entries(def.baseStats)) {
    stats[stat] = Math.floor(baseVal * rarity.statMultiplier);
  }
  const baseSellValue = Object.values(stats).reduce((sum, v) => sum + v, 0) * 2;
  return {
    uid: `gear_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    defId,
    name: rarity.name === 'Common' ? def.name : `${rarity.name} ${def.name}`,
    slot: def.slot,
    rarity: rarity.key,
    rarityColor: rarity.color,
    stats,
    icon: def.icon,
    textureKey: def.textureKey,
    sellValue: Math.max(1, Math.floor(baseSellValue * rarity.statMultiplier)),
    equippedBy: null,
    type: 'gear',
  };
}
