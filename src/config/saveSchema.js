export const SAVE_VERSION = 2;
// NOTE: SAVE_KEY intentionally keeps the original 'agentquest_save_v1' name
// for backward compatibility with existing saves. Changing this key would
// prevent older save data from being loaded.
export const SAVE_KEY = 'agentquest_save_v1';

export const DEFAULT_SAVE_STATE = {
  version: SAVE_VERSION,
  timestamp: null,
  player: {
    level: 1, xp: 0, gold: 0,
    stats: { maxHp: 20, atk: 3, def: 1 },
    currentHp: 20,
    position: { tileX: null, tileY: null },
    equipment: { weapon: null, helmet: null, chest: null, boots: null, accessory: null },
  },
  agent: {
    hired: false, level: 1, xp: 0,
    stats: { maxHp: 15, atk: 2, def: 1 },
    currentHp: 15,
    equipment: { weapon: null, helmet: null, chest: null, boots: null, accessory: null },
  },
  agentConfig: {
    zonePreference: 'auto',
    retreatThreshold: 0.25,
  },
  inventory: { materials: [], gear: [] },
  fishing: { active: false, selectedPoolId: null, pendingCatches: [], cycleStartedAt: null },
  mining: { active: false, selectedNodeId: null, pendingExtracts: [], cycleStartedAt: null },
  skills: { fishing: { xp: 0, level: 1 }, mining: { xp: 0, level: 1 }, farming: { xp: 0, level: 1 }, cooking: { xp: 0, level: 1 } },
  farmPlots: [],
  activeBuff: null,
  worldBoss: { lastDefeatTimestamp: null, killCount: 0 },
  totalPlayTime: 0,
  sessionCount: 0,
  createdAt: null,
  tutorialComplete: false,
  tutorialStep: 0,
};

export const SCHEMA_MIGRATIONS = {
  1: (data) => {
    data.agentConfig = data.agentConfig || { zonePreference: 'auto', retreatThreshold: 0.25 };
    data.version = 2;
    return data;
  },
};

export function migrateSave(save) {
  let current = save.version || 1;
  while (SCHEMA_MIGRATIONS[current]) {
    save = SCHEMA_MIGRATIONS[current](save);
    current = save.version;
  }
  return save;
}
