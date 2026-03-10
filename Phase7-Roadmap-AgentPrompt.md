# AgentQuest — Post-Phase 6 Roadmap

## Execution Order

Complete these in strict sequential order. Each section gates the next. Do not skip ahead.

```
Phase 7:  Save/Load Persistence     ← makes the game playable for real
Phase 7b: Tier 4 Crafting Recipes   ← fixes dead-end Phase 5 materials
Phase 7c: Sound & Juice Pass        ← makes the game feel good
Phase 7d: New Player Tutorial Flow  ← makes the game approachable
Phase 8:  32×32 Visual Rebuild      ← makes the game look good (separate doc provided)
Phase 9:  Phase 6 Life Skills       ← adds depth (separate doc provided)
```

Phase 8 and Phase 9 have their own dedicated spec documents (`32x32-Visual-Rebuild-AgentPrompt.md` and `Phase6-AgentPrompt.md`). This document covers Phases 7, 7b, 7c, and 7d.

---

# Phase 7: Save/Load Persistence

**DO NOT BUILD UNTIL PHASE 5 PASSES ALL SUCCESS CRITERIA.**

## Overview

Every feature built so far is throwaway — progress resets on page refresh. This phase adds localStorage-based persistence with auto-save, manual save/load, and a forward-compatible versioned schema. After this phase, player sessions carry over across browser reloads, tab closures, and device restarts.

**Design philosophy:** Persistence should be invisible. The player never thinks about saving — it just happens. But manual export/import exists as a safety net for players who want to back up or transfer progress.

## NOT in this phase:

- ❌ Server-side save (backend, database, accounts)
- ❌ Cloud sync across devices
- ❌ Multiple save slots
- ❌ Save file encryption or anti-cheat
- ❌ Leaderboards or shared state

## New Files

```
src/
├── systems/
│   └── SaveSystem.js       # Core save/load logic, schema, auto-save timer
├── config/
│   └── saveSchema.js        # Schema version, default state shape, migration functions
└── ui/
    └── SettingsPanel.js     # Settings overlay with save/load/reset/export/import buttons
```

## Modified Existing Files

| File | Changes |
|------|---------|
| `GameScene.js` | Instantiate SaveSystem. Load state on create(). Wire auto-save timer. Emit save events on key actions. |
| `HUDScene.js` | Add ⚙️ Settings button to the bottom-right button cluster. |
| `constants.js` | Add `SAVE_KEY`, `SAVE_VERSION`, `AUTO_SAVE_INTERVAL` constants. |

---

## 1. Save Schema (`saveSchema.js`)

The schema defines the full shape of a save file. Every piece of game state that matters across sessions must be captured here.

```js
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'agentquest_save_v1';

export const DEFAULT_SAVE_STATE = {
  version: SAVE_VERSION,
  timestamp: null,            // ISO string of last save

  // --- Player ---
  player: {
    level: 1,
    xp: 0,
    gold: 0,
    stats: { maxHp: 20, atk: 3, def: 1 },
    currentHp: 20,
    position: { tileX: null, tileY: null },  // null = default spawn
    equipment: {
      weapon: null,
      helmet: null,
      chest: null,
      boots: null,
      accessory: null,
    },
  },

  // --- Agent ---
  agent: {
    hired: false,
    level: 1,
    xp: 0,
    stats: { maxHp: 15, atk: 2, def: 1 },
    currentHp: 15,
    equipment: {
      weapon: null,
      helmet: null,
      chest: null,
      boots: null,
      accessory: null,
    },
  },

  // --- Inventory ---
  inventory: {
    materials: [],    // Array of { id, name, icon, quantity, sellValue, category }
    gear: [],         // Array of unique gear instances (full gear object with stats, rarity, enhancement)
  },

  // --- Activities ---
  fishing: {
    active: false,
    selectedPoolId: null,
    pendingCatches: [],
    cycleStartedAt: null,
  },
  mining: {
    active: false,
    selectedNodeId: null,
    pendingExtracts: [],
    cycleStartedAt: null,
  },

  // --- Skills (Phase 6 ready — store even if Phase 6 not yet built) ---
  skills: {
    fishing: { xp: 0, level: 1 },
    mining: { xp: 0, level: 1 },
    farming: { xp: 0, level: 1 },
    cooking: { xp: 0, level: 1 },
  },

  // --- Farm Plots (Phase 6 ready) ---
  farmPlots: [],  // Array of { index, state, seedId, plantedAt, growthDuration }

  // --- Active Buff (Phase 6 ready) ---
  activeBuff: null,  // { id, name, icon, stats, skillEffects, expiresAt, duration } or null

  // --- World Boss ---
  worldBoss: {
    lastDefeatTimestamp: null,
    killCount: 0,
  },

  // --- Meta ---
  totalPlayTime: 0,           // Seconds
  sessionCount: 0,
  createdAt: null,            // ISO string
};
```

### Schema Versioning

Every save file has a `version` field. When the game loads a save, it checks the version:

```js
export const SCHEMA_MIGRATIONS = {
  // Example: when version 2 is created
  // 1: (save) => {
  //   save.newField = defaultValue;
  //   save.version = 2;
  //   return save;
  // },
};

export function migrateSave(save) {
  let current = save.version || 1;
  while (SCHEMA_MIGRATIONS[current]) {
    save = SCHEMA_MIGRATIONS[current](save);
    current = save.version;
  }
  return save;
}
```

This allows future phases to add new fields without breaking old saves. When Phase 6 adds skill data, a migration function fills in defaults for existing saves.

---

## 2. SaveSystem.js

```js
import { SAVE_KEY, SAVE_VERSION, DEFAULT_SAVE_STATE, migrateSave } from '../config/saveSchema.js';

export class SaveSystem {
  constructor(scene) {
    this.scene = scene;
    this.autoSaveTimer = null;
    this.dirty = false;  // Track if state changed since last save
  }

  // --- SAVE ---
  save(gameState) {
    try {
      const saveData = this.serializeState(gameState);
      saveData.timestamp = new Date().toISOString();
      saveData.version = SAVE_VERSION;

      const json = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, json);

      this.dirty = false;
      this.scene.events.emit('gameSaved', { timestamp: saveData.timestamp });
      return { success: true };
    } catch (e) {
      console.error('Save failed:', e);
      return { success: false, error: e.message };
    }
  }

  // --- LOAD ---
  load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return { success: false, reason: 'no_save' };

      let saveData = JSON.parse(json);

      // Version migration
      if (saveData.version !== SAVE_VERSION) {
        saveData = migrateSave(saveData);
      }

      return { success: true, data: saveData };
    } catch (e) {
      console.error('Load failed:', e);
      return { success: false, error: e.message };
    }
  }

  // --- CHECK IF SAVE EXISTS ---
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  // --- DELETE SAVE ---
  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    this.scene.events.emit('saveDeleted');
  }

  // --- EXPORT (download as JSON file) ---
  exportSave(gameState) {
    const saveData = this.serializeState(gameState);
    saveData.timestamp = new Date().toISOString();
    saveData.version = SAVE_VERSION;

    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `agentquest-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- IMPORT (from uploaded JSON file) ---
  importSave(jsonString) {
    try {
      let saveData = JSON.parse(jsonString);

      // Validate basic structure
      if (!saveData.version || !saveData.player) {
        return { success: false, reason: 'Invalid save file' };
      }

      // Migrate if needed
      if (saveData.version !== SAVE_VERSION) {
        saveData = migrateSave(saveData);
      }

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return { success: true, data: saveData };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // --- AUTO-SAVE ---
  startAutoSave(gameState, intervalMs = 30000) {
    this.stopAutoSave();
    this.autoSaveTimer = this.scene.time.addEvent({
      delay: intervalMs,
      callback: () => {
        if (this.dirty) {
          this.save(gameState);
        }
      },
      loop: true,
    });
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove();
      this.autoSaveTimer = null;
    }
  }

  markDirty() {
    this.dirty = true;
  }

  // --- SERIALIZE CURRENT GAME STATE ---
  // This method reads from the live game objects and produces a plain JSON-safe object.
  // It must be updated whenever new persistent state is added to the game.
  serializeState(gameState) {
    // Deep clone DEFAULT_SAVE_STATE as base, then fill from live game
    const save = JSON.parse(JSON.stringify(DEFAULT_SAVE_STATE));

    // Player
    const player = gameState.player;
    save.player.level = player.level;
    save.player.xp = player.xp;
    save.player.gold = gameState.gold;
    save.player.stats = { ...player.stats };
    save.player.currentHp = player.currentHp;
    save.player.position = {
      tileX: player.tileX,
      tileY: player.tileY,
    };
    save.player.equipment = this.serializeEquipment(player.equipment);

    // Agent
    if (gameState.agent) {
      const agent = gameState.agent;
      save.agent.hired = true;
      save.agent.level = agent.level;
      save.agent.xp = agent.xp;
      save.agent.stats = { ...agent.stats };
      save.agent.currentHp = agent.currentHp;
      save.agent.equipment = this.serializeEquipment(agent.equipment);
    }

    // Inventory
    save.inventory.materials = JSON.parse(JSON.stringify(gameState.materials || []));
    save.inventory.gear = JSON.parse(JSON.stringify(gameState.gear || []));

    // Activities
    if (gameState.fishingSystem) {
      save.fishing.active = gameState.fishingSystem.isActive;
      save.fishing.selectedPoolId = gameState.fishingSystem.selectedPool?.id || null;
      save.fishing.pendingCatches = [...(gameState.fishingSystem.pendingCatches || [])];
    }
    if (gameState.miningSystem) {
      save.mining.active = gameState.miningSystem.isActive;
      save.mining.selectedNodeId = gameState.miningSystem.selectedNode?.id || null;
      save.mining.pendingExtracts = [...(gameState.miningSystem.pendingExtracts || [])];
    }

    // Skills (Phase 6)
    if (gameState.skillSystem) {
      save.skills = JSON.parse(JSON.stringify(gameState.skillSystem.skills));
    }

    // Farm plots (Phase 6)
    if (gameState.farmingSystem) {
      save.farmPlots = gameState.farmingSystem.plots.map(plot => ({
        index: plot.index,
        state: plot.state,
        seedId: plot.seedId,
        plantedAt: plot.plantedAt,
        growthDuration: plot.growthDuration,
      }));
    }

    // Active buff (Phase 6)
    if (gameState.activeBuff) {
      save.activeBuff = JSON.parse(JSON.stringify(gameState.activeBuff));
    }

    // World Boss
    if (gameState.worldBossSystem) {
      save.worldBoss.lastDefeatTimestamp = gameState.worldBossSystem.lastDefeatTimestamp;
      save.worldBoss.killCount = gameState.worldBossSystem.killCount || 0;
    }

    // Meta
    save.totalPlayTime = gameState.totalPlayTime || 0;
    save.sessionCount = (gameState.sessionCount || 0);
    save.createdAt = gameState.createdAt || new Date().toISOString();

    return save;
  }

  serializeEquipment(equipment) {
    const result = {};
    for (const [slot, item] of Object.entries(equipment)) {
      result[slot] = item ? JSON.parse(JSON.stringify(item)) : null;
    }
    return result;
  }
}
```

---

## 3. GameScene.js Integration

On `create()`:

```js
// Initialize SaveSystem
this.saveSystem = new SaveSystem(this);

// Attempt to load existing save
const loadResult = this.saveSystem.load();
if (loadResult.success) {
  this.applyLoadedState(loadResult.data);
  this.showToast('Game loaded');
} else {
  this.initFreshState();
}

// Start auto-save (every 30 seconds)
this.saveSystem.startAutoSave(this.gameState, 30000);
```

Save triggers — call `this.saveSystem.markDirty()` on:

- Player or agent levels up
- Gear equipped/unequipped
- Gear enhanced (success or failure)
- Item crafted
- Materials gained or sold
- Gold amount changes
- Fishing/mining catches collected
- Skill XP gained or level up
- Crop planted or harvested
- Food cooked or eaten
- World Boss defeated
- Player moves to a new zone (not every tile, just zone transitions)

Immediate save (not just dirty mark) on:

- World Boss kill
- Gear enhancement success at +3 or higher
- Player manually presses save button

`applyLoadedState(saveData)` method must:

1. Set player stats, level, XP, gold, position, equipment, HP
2. Set agent hired state, stats, level, XP, equipment, HP
3. Restore inventory (materials + gear)
4. Restore fishing/mining active state (restart cycle timers from current time)
5. Restore skill levels and XP
6. Restore farm plot states (recalculate growth progress from `plantedAt` + elapsed time)
7. Restore active buff (check if `expiresAt` is still in the future; if expired, discard)
8. Restore World Boss state
9. Restore meta (play time, session count)

### Handling Time-Based State on Load

When loading a save, time has passed. Handle these cases:

- **Farm plots:** If a plot was `planted` or `growing` and enough time has passed, advance it to `ready`. Calculate: `elapsed = Date.now() - plot.plantedAt`. If `elapsed >= plot.growthDuration`, set state to `ready`.
- **Active buff:** If `Date.now() >= buff.expiresAt`, the buff has expired. Discard it.
- **Mining node depletion:** If nodes have depletion timers, recalculate remaining cooldown.
- **Fishing/mining cycles:** Do NOT grant offline catches/extracts. Simply restart the activity cycle from the current time. This is intentional — idle progress only happens while the game is open.

---

## 4. Settings Panel (`SettingsPanel.js`)

Opened from a new ⚙️ button in the bottom-right button cluster on HUDScene.

```
┌─────────────────────────────────────┐
│  ✕                  ⚙️ Settings     │
├─────────────────────────────────────┤
│                                     │
│  ── Save & Load ──                  │
│                                     │
│  Last saved: 2 minutes ago          │
│                                     │
│  [ 💾 Save Now ]                    │
│                                     │
│  [ 📤 Export Save File ]            │
│                                     │
│  [ 📥 Import Save File ]            │
│                                     │
│  ── Danger Zone ──                  │
│                                     │
│  [ 🗑️ Reset All Progress ]          │
│  Start completely fresh.            │
│  This cannot be undone.             │
│                                     │
│  ── Info ──                         │
│                                     │
│  Play time: 2h 14m                  │
│  Sessions: 12                       │
│  Save version: 1                    │
│                                     │
└─────────────────────────────────────┘
```

**Save Now:** Immediate save. Shows toast: "Game saved ✓"

**Export Save File:** Downloads a `.json` file to the device. Shows toast: "Save exported"

**Import Save File:** Opens a hidden `<input type="file">` element. On file selected, reads JSON, validates, confirms with player ("This will replace your current progress. Continue?"), then imports and reloads the game.

**Reset All Progress:** Double confirmation. First tap shows "Are you sure? This deletes ALL progress." with [Cancel] and [Yes, Reset] buttons. On confirm, deletes localStorage save and reloads the page.

---

## 5. HUD Integration

Add ⚙️ button to the bottom-right button cluster alongside the existing buttons (Inventory, Equipment, etc.). Same size and style as other buttons.

Add a subtle auto-save indicator: when auto-save fires, briefly flash a small 💾 icon near the top-right of the HUD for 1 second, then fade out. This gives passive confidence that the game is saving without being intrusive.

---

## Phase 7 Success Criteria

1. Game state persists across page refresh — reload the page and everything is where you left it
2. Player position, level, XP, gold, HP, and equipment are all restored correctly
3. Agent hired state, level, XP, HP, and equipment are restored correctly
4. Full inventory (materials + gear with unique stats/rarity/enhancement) is restored
5. Fishing and mining restart their cycles on load (no offline catch accumulation)
6. Farm plots recalculate growth progress from elapsed real time on load
7. Active buff is restored if not expired; discarded if expired
8. World Boss kill count and last defeat timestamp persist
9. Auto-save fires every 30 seconds when state has changed (dirty flag)
10. Manual save button works immediately and shows confirmation toast
11. Export produces a valid downloadable `.json` file
12. Import accepts a previously exported file and restores state after confirmation
13. Reset deletes all progress with double confirmation and reloads to fresh state
14. Settings panel shows play time and session count
15. Schema version is stored in save. Migration pipeline exists and runs on load if versions mismatch.
16. No errors on first-ever load (no save exists yet — game starts fresh with defaults)

---
---

# Phase 7b: Tier 4 Crafting Recipes (Phase 5 Material Sink)

**DO NOT BUILD UNTIL PHASE 7 PASSES ALL SUCCESS CRITERIA.**

## Overview

Phase 5 added two new zones (Swamp, Volcanic Rift) with 4 new mob types that drop unique materials. Currently, these materials have no crafting use — they can only be sold. This violates the core design principle: **no dead-end resources**. This phase adds 6 new Tier 4 crafting recipes to the Forge that consume Phase 5 drops, creating powerful gear that bridges the gap between Phase 4 Tier 3 crafted gear and World Boss exclusive drops.

## NOT in this phase:

- ❌ New zones or mobs
- ❌ New resource types
- ❌ Changes to existing recipes
- ❌ New crafting stations
- ❌ Gear set bonuses

## Modified Existing Files

| File | Changes |
|------|---------|
| `recipeData.js` | Add 6 new Tier 4 recipes using Phase 5 materials |
| `itemData.js` | Ensure all Phase 5 mob drops have `category: 'material'` if not already set |
| `ForgePanel.js` | No structural changes — new recipes auto-populate from recipeData. May need scroll accommodation for the longer list. |
| `BootScene.js` | Add 6 new gear item textures (32×32) for the Tier 4 crafted items |

---

## New Recipes (`recipeData.js`)

All Tier 4 recipes require a Forge Ember (the Phase 4 crafted bottleneck material) plus Phase 5 drops. Crafted gear has a **guaranteed minimum rarity of Rare** (can roll Epic).

```js
// ===== TIER 4 RECIPES (Phase 5 materials) =====

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
```

### Power Budget

| Tier | Example ATK (weapon) | Example DEF (chest) | Min Rarity |
|------|---------------------|---------------------|------------|
| Tier 2 (Phase 4) | 5–8 | 4–6 | Uncommon |
| Tier 3 (Phase 4) | 8–12 | 6–10 | Uncommon |
| **Tier 4 (this phase)** | **10–22** | **8–14** | **Rare** |
| Boss Exclusive (Phase 5) | 18–25 | 14–18 | Epic |

Tier 4 overlaps with the low end of boss gear when it rolls Epic with good stats. This is intentional — it gives players a realistic path to endgame power without requiring World Boss kills, while boss exclusives remain best-in-slot.

### Texture Additions (BootScene.js)

Add 6 new 32×32 gear icons for the Tier 4 items. Use the existing gear icon style but with zone-themed color palettes:

- **Swamp Fang Blade:** Weapon shape with murky green (#3A4A2A) blade, toxic green (#4A6A2A) edge glow
- **Volcanic Helm:** Helmet shape in dark red-brown (#5A2500) with orange (#FF4400) lava crack accents
- **Miasma Mail:** Chest armor in swamp green-brown (#3A4A2A) with purple (#4A4458) trim from witch materials
- **Ashwalker Boots:** Boot shape in charcoal (#2A2A2A) with faint ember orange (#FF4400) sole glow
- **Hexed Amulet:** Accessory ring shape in purple (#9C27B0) with green (#44FF44) eye center
- **Infernal Greatsword:** Large weapon in dark metal (#3A3A3A) with prominent lava (#FF4400) blade cracks and orange (#FFAA00) edge glow

---

## Phase 7b Success Criteria

1. All 6 Tier 4 recipes appear in the Forge's Recipes tab
2. Each recipe correctly requires Phase 5 materials and Forge Embers
3. Crafted Tier 4 gear has guaranteed Rare minimum rarity
4. Stat rolls fall within the defined ranges
5. All 6 new gear items have distinct 32×32 textures
6. Tier 4 gear can be equipped, shows correct stats in Equipment Panel, and factors into StatCalculator
7. Tier 4 gear can be enhanced at the Forge (+0 to +5) using the existing enhancement system
8. Every Phase 5 mob drop material now has at least one crafting recipe that uses it
9. Power level feels correct — Tier 4 Epic rolls approach but don't exceed World Boss drops
10. New gear is saved/loaded correctly by the persistence system

---
---

# Phase 7c: Sound & Juice Pass

**DO NOT BUILD UNTIL PHASE 7b PASSES ALL SUCCESS CRITERIA.**

## Overview

The game is completely silent and lacks the micro-feedback that makes actions feel impactful. This phase adds procedurally generated sound effects, ambient audio, and visual juice (screen shake, particles, floating numbers) to transform the game feel without any external audio assets.

**Design philosophy:** Every player action should have immediate audio-visual feedback. The player should never wonder "did that work?" — they should hear it and see it. Sound and juice are not polish — they are core game feel.

## NOT in this phase:

- ❌ Music tracks or background music
- ❌ Voice acting or speech
- ❌ External audio file assets
- ❌ Audio settings UI (mute/volume — add in a future pass)
- ❌ Accessibility audio descriptions

## New Files

```
src/
├── systems/
│   └── AudioSystem.js       # Procedural sound generation using Web Audio API
├── systems/
│   └── JuiceSystem.js       # Screen shake, particles, floating numbers
```

## Modified Existing Files

| File | Changes |
|------|---------|
| `GameScene.js` | Instantiate AudioSystem and JuiceSystem. Wire to existing events. |
| `CombatSystem.js` | Emit events for hit, miss, kill, player death. Trigger screen shake on boss hits. |
| `LootSystem.js` | Trigger loot chime on drop, rarity-scaled. |
| `HUDScene.js` | Show floating damage numbers. Flash HP bar on damage taken. |
| `FishingSystem.js` | Play catch/miss sounds. Splash on start. |
| `MiningSystem.js` | Play extract/miss sounds. Pickaxe clink on start. |
| `CraftingSystem.js` | Anvil strike on craft. Enhancement success/fail sounds. |
| `ShopScene.js` | Coin clink on buy/sell. |
| `MiniNotifications.js` | Level-up fanfare sound. Skill level-up sound (different tone). |
| `SaveSystem.js` | Subtle save confirmation sound. |

---

## 1. AudioSystem.js

Use the Web Audio API directly (no Tone.js dependency needed for this scope). Generate all sounds procedurally using oscillators, noise, and envelopes.

```js
export class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;       // AudioContext, created on first user interaction
    this.enabled = true;
    this.masterVolume = 0.3;
  }

  // Must be called after a user gesture (tap/click) due to browser autoplay policy
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Ensure AudioContext is initialized before any sound plays
  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
}
```

### Sound Definitions

Each sound is a method on AudioSystem that creates oscillators/noise with specific parameters. Keep sounds very short (50–300ms) and low-fi to match the pixel art aesthetic.

| Sound | Method | Description |
|-------|--------|-------------|
| **Combat hit** | `playHit()` | Short percussive thump. Square wave 80Hz, 60ms, fast decay. |
| **Combat miss** | `playMiss()` | Soft whoosh. White noise, 100ms, bandpass filter at 2000Hz. |
| **Combat kill** | `playKill()` | Two-note descending. Square 200Hz→100Hz, 150ms. |
| **Player death** | `playDeath()` | Low rumble + descending tone. 60Hz square, 400ms, slow decay. |
| **Loot drop (common)** | `playLootCommon()` | Soft click. Triangle 800Hz, 30ms. |
| **Loot drop (uncommon)** | `playLootUncommon()` | Two-tone ascending. Triangle 600→900Hz, 80ms. |
| **Loot drop (rare)** | `playLootRare()` | Three-tone ascending chord. Triangle 500→700→1000Hz, 150ms. |
| **Loot drop (epic)** | `playLootEpic()` | Sparkle sweep. Sine 800→2000Hz sweep, 200ms, with shimmer. |
| **Level up** | `playLevelUp()` | Major chord arpeggio. Sine 400→500→600→800Hz, 400ms total. |
| **Skill level up** | `playSkillLevelUp()` | Similar to level up but in minor key, teal-themed feel. Sine 350→440→525Hz, 300ms. |
| **Gold gained** | `playGold()` | Coin clink. Triangle 2000Hz, 20ms, two quick hits 40ms apart. |
| **Fish catch** | `playFishCatch()` | Splash + pluck. Noise burst 30ms + sine 600Hz 50ms. |
| **Fish miss** | `playFishMiss()` | Bubble. Sine 300→200Hz descending, 80ms. |
| **Mining extract** | `playMineExtract()` | Pickaxe clink. Square 1200Hz, 30ms, sharp attack. |
| **Mining miss** | `playMineMiss()` | Dull thud. Square 100Hz, 40ms. |
| **Craft success** | `playCraft()` | Anvil ring. Triangle 1000Hz, 200ms, with resonance. |
| **Enhance success** | `playEnhanceSuccess()` | Ascending shimmer. Sine sweep 600→1600Hz, 300ms. |
| **Enhance fail** | `playEnhanceFail()` | Descending buzz. Sawtooth 400→100Hz, 200ms. |
| **Button tap** | `playTap()` | Micro click. Square 1000Hz, 10ms. |
| **Panel open** | `playPanelOpen()` | Soft sweep up. Sine 300→500Hz, 80ms, quiet. |
| **Panel close** | `playPanelClose()` | Soft sweep down. Sine 500→300Hz, 80ms, quiet. |
| **Save** | `playSave()` | Gentle chime. Sine 800Hz, 100ms, very quiet. |
| **Harvest crop** | `playHarvest()` | Soft pop + rustle. Noise 20ms + sine 500Hz 40ms. |
| **Eat food** | `playEat()` | Munch. Noise burst filtered low, 60ms. |
| **Boss warning** | `playBossWarning()` | Deep horn. Sawtooth 80Hz, 600ms, slow attack, pulsing. |
| **Boss spawn** | `playBossSpawn()` | Earthquake rumble. Low noise + 40Hz sine, 1000ms. |

### AudioContext Initialization

The first user tap on the game must call `audioSystem.init()`. Add this to the first pointer-down handler in GameScene or HUDScene:

```js
this.input.once('pointerdown', () => {
  this.audioSystem.init();
});
```

---

## 2. JuiceSystem.js

Visual feedback effects layered on top of existing gameplay.

```js
export class JuiceSystem {
  constructor(scene) {
    this.scene = scene;
  }
}
```

### Floating Damage Numbers

When combat damage is dealt, spawn a text object at the entity's position that floats upward and fades out.

```js
showDamageNumber(x, y, amount, isCrit = false) {
  const text = this.scene.add.text(x, y, `-${amount}`, {
    fontFamily: 'monospace',
    fontSize: isCrit ? '18px' : '14px',
    color: isCrit ? '#FF4444' : '#FFFFFF',
    stroke: '#000000',
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(1000);

  this.scene.tweens.add({
    targets: text,
    y: y - 40,
    alpha: 0,
    duration: 800,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });
}
```

When healing or gaining HP from food: same thing but green text, `+${amount}`.

### Floating XP/Gold Numbers

On XP gain, show `+${xp} XP` in gold color floating up from the entity. On gold gain from selling, show `+${gold}g` in gold. Keep these smaller than damage numbers to avoid clutter.

### Screen Shake

On heavy hits (boss attacks, player taking >25% HP damage):

```js
screenShake(intensity = 0.005, duration = 100) {
  this.scene.cameras.main.shake(duration, intensity);
}
```

Boss hits: `intensity = 0.008, duration = 150`
Boss death: `intensity = 0.015, duration = 300`
Enhancement failure at +4/+5: `intensity = 0.005, duration = 100`

### Loot Burst Particles

When loot drops from a mob kill, emit a small burst of colored particles matching the rarity:

- Common: 3 gray particles
- Uncommon: 5 green particles
- Rare: 8 blue particles with slight glow
- Epic: 12 purple particles with longer lifespan

Use Phaser's particle emitter system. Create one emitter per rarity color on scene start, then trigger bursts as needed.

### Entity Flash on Hit

When a mob or player takes damage, tint the sprite white for 100ms then restore. Use `sprite.setTint(0xFFFFFF)` then `scene.time.delayedCall(100, () => sprite.clearTint())`.

### HP Bar Flash

When the player takes damage, the HP bar in the HUD briefly flashes bright red (100ms) before returning to normal fill color. On heal, briefly flash bright green.

### Level-Up Burst

On level up (combat or skill), emit a ring of particles outward from the entity. Gold particles for combat level, teal particles for skill level.

---

## Phase 7c Success Criteria

1. All listed sounds play at the correct moments — combat, loot, crafting, activities, UI
2. AudioContext initializes on first user tap (no autoplay errors in console)
3. Sounds are procedurally generated — no external audio files loaded
4. Sounds are short, low-fi, and match the pixel art aesthetic
5. Floating damage numbers appear on every combat hit and float upward
6. Floating XP/gold numbers appear on gain events
7. Screen shake triggers on boss hits, boss death, and high-damage attacks
8. Loot particles burst from killed mobs with rarity-appropriate colors
9. Entities flash white when taking damage
10. HP bar flashes on damage and heal
11. Level-up particle burst plays for combat and skill level-ups
12. Enhancement failure has screen shake and descending sound
13. Enhancement success has ascending shimmer sound
14. Boss warning horn sound plays during the 30-second pre-spawn warning
15. All sounds play at reasonable volume (not startling, not inaudible)
16. Game performs smoothly with all juice effects active (no frame drops on mobile)

---
---

# Phase 7d: New Player Tutorial Flow

**DO NOT BUILD UNTIL PHASE 7c PASSES ALL SUCCESS CRITERIA.**

## Overview

A new player currently loads into the game with zero guidance. They must discover the agent system, navigation, combat, crafting, fishing, mining, and the shop entirely on their own. This phase adds a lightweight, non-intrusive tutorial that guides first-time players through the core loop in 6 contextual steps. The tutorial is a one-time experience — once completed (or dismissed), it never appears again.

**Design philosophy:** Show, don't lecture. Each tutorial step is a single short sentence with an arrow pointing at the relevant thing. The player learns by doing, not by reading walls of text.

## NOT in this phase:

- ❌ Video tutorials or animated sequences
- ❌ Tutorial replay option
- ❌ Tutorial for advanced features (crafting, enhancement, boss)
- ❌ NPC dialogue system
- ❌ Quest/objective tracker

## New Files

```
src/
├── systems/
│   └── TutorialSystem.js    # Tutorial state machine, step definitions, progression logic
└── ui/
    └── TutorialTooltip.js   # Floating tooltip UI with text + arrow + dismiss button
```

## Modified Existing Files

| File | Changes |
|------|---------|
| `GameScene.js` | Instantiate TutorialSystem. Check if tutorial is complete on load. |
| `SaveSystem.js` / `saveSchema.js` | Add `tutorialComplete: false` and `tutorialStep: 0` to save schema. |
| `HUDScene.js` | TutorialTooltip renders in HUD layer. |

---

## Tutorial Steps

The tutorial is a linear sequence of 6 steps. Each step has a trigger condition, a tooltip message, a position/arrow target, and a completion condition.

| Step | Trigger | Tooltip Text | Points At | Completes When |
|------|---------|-------------|-----------|---------------|
| 1 | Game loads for first time | "Welcome to AgentQuest! Tap anywhere to move." | Center of screen, arrow pointing down at game world | Player moves 3+ tiles |
| 2 | Step 1 complete | "Head to the Tavern to hire your first agent." | Tavern building (arrow pointing at it on map) | Player enters tile adjacent to Tavern |
| 3 | Player is adjacent to Tavern | "Tap the action button to enter and hire an agent for 10 gold." | Action button (bottom right) | Agent is hired |
| 4 | Agent is hired | "Your agent hunts on their own! Tap 👁️ to watch them, or explore freely." | View toggle button | Player taps view toggle at least once |
| 5 | Step 4 complete | "Tap a mob to auto-walk and fight, or let your agent handle it." | Nearest visible mob (or general game world) | Player or agent kills 1 mob |
| 6 | First mob killed | "Collect your loot and sell at the Shop. The world is yours — go explore!" | No specific target, centered | Auto-dismisses after 4 seconds |

After step 6, `tutorialComplete = true` is saved. Tutorial never appears again.

---

## TutorialTooltip.js

A floating tooltip with:

- **Background:** Dark panel (#1A1A2E at 90% opacity) with gold (#DAA520) border, same style as other panels but smaller
- **Text:** Parchment color (#F5E6C8), 14px, max width 260px, word-wrapped
- **Arrow:** A small triangular arrow (CSS-style triangle made of a rotated square) pointing toward the target element
- **Dismiss:** Small "✕" button in top-right corner. Tapping it skips the current step (advances to next). Holding for 2 seconds shows "Skip all?" option that marks tutorial complete.
- **Pulse animation:** Tooltip gently pulses (scale 1.0 → 1.02 → 1.0, 2s cycle) to draw attention

Position the tooltip dynamically based on the target's screen position. If the target is near the top of the screen, tooltip appears below it. If near the bottom, tooltip appears above. Default to center-screen if no specific target.

---

## TutorialSystem.js

```js
export class TutorialSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentStep = 0;
    this.complete = false;
    this.tooltip = null;       // TutorialTooltip instance
    this.steps = TUTORIAL_STEPS; // Array of step definitions
  }

  // Called on game load
  init(saveData) {
    this.complete = saveData.tutorialComplete || false;
    this.currentStep = saveData.tutorialStep || 0;

    if (!this.complete) {
      this.showCurrentStep();
    }
  }

  showCurrentStep() {
    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
      return;
    }

    const step = this.steps[this.currentStep];
    // Show tooltip with step.text, targeting step.target
    // Register completion listener for step.completesWhen
  }

  advanceStep() {
    this.currentStep++;
    // Save current step to persistence
    this.scene.saveSystem.markDirty();

    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
    } else {
      this.showCurrentStep();
    }
  }

  completeTutorial() {
    this.complete = true;
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    // Save completion to persistence
    this.scene.saveSystem.markDirty();
  }

  skipAll() {
    this.completeTutorial();
  }
}
```

---

## Phase 7d Success Criteria

1. First-time players see the tutorial starting from step 1 on game load
2. Each tooltip appears at the correct moment with the correct text
3. Tooltips point toward (or near) the relevant game element
4. Tutorial advances when the player performs the required action
5. Dismissing a step (✕) skips to the next step
6. Long-press dismiss shows "Skip all?" and completes the tutorial on confirm
7. Tutorial state (step + completion) persists across page refreshes
8. Returning players who completed the tutorial never see it again
9. Returning players who partially completed the tutorial resume from their current step
10. Tutorial does not block any game functionality — all buttons and interactions work normally while tooltips are showing
11. Tutorial tooltips render in the HUD layer (above game world, below panels)
12. Step 6 auto-dismisses after 4 seconds and marks tutorial complete
13. No tutorial appears if the player imports a save file that has `tutorialComplete: true`

---
---

# Execution Summary

After completing all four sections in this document:

| Phase | What it adds | Core metric |
|-------|-------------|-------------|
| 7 | Save/Load persistence | Player can close and reopen the game without losing progress |
| 7b | Tier 4 crafting recipes | All Phase 5 mob drops now have crafting uses |
| 7c | Sound & juice | Every action has audio-visual feedback |
| 7d | Tutorial flow | New players understand the core loop within 2 minutes |

Then proceed to:

- **Phase 8:** 32×32 Visual Rebuild (see `32x32-Visual-Rebuild-AgentPrompt.md`)
- **Phase 9:** Phase 6 Life Skills (see `Phase6-AgentPrompt.md`)
