Add the following Phase 3 specification to the end of the existing README.md, directly after the Phase 2 Success Criteria section. Do not modify any Phase 1 or Phase 2 content. Phase 2 must be fully functional and passing all its success criteria before any Phase 3 code is written.

---

## Phase 3: Fishing & Mining (Passive Activities)

> **DO NOT BUILD UNTIL PHASE 2 PASSES ALL SUCCESS CRITERIA.**
> Phase 2 systems (gear drops, equipment panel, stat calculator, rarity system, shop gear tab) must all be working correctly before implementing anything below.

### Phase 3 Overview

This phase adds two passive/idle activities — **Fishing** and **Mining** — that the player can assign themselves to, then walk away (or go watch their agent) while resources accumulate. Both produce new material types that sell for gold or feed into crafting (Phase 4).

The design philosophy: the player is an **orchestrator**. Your agent hunts. You fish. Mining nodes get worked. Gold flows in from multiple streams. The game rewards setting things up and checking back, not grinding one activity manually.

**New systems:**
1. Fishing Spot (town building, passive idle loop with catch timer)
2. Mining Nodes (map locations in Forest/Caves, passive extraction)
3. Fish & Ore item data (new material categories)
4. Activity HUD (persistent status bars showing active idle tasks)
5. Activity Results panel (collect screen when tasks complete)

**NOT in this phase (Phase 4+):**
- ❌ Crafting bench (uses fish/ore as ingredients — Phase 4)
- ❌ Active minigames or timing mechanics
- ❌ Fishing rod / pickaxe gear (equipment that boosts activity speed)
- ❌ Agent performing activities (agents only hunt for now)
- ❌ Fishing or mining skill levels / XP
- ❌ Bait system or mine upgrades
- ❌ New zones or mobs

---

### New Files

```
src/
├── config/
│   ├── fishData.js          # Fish definitions, catch rates, pool assignments
│   └── oreData.js           # Ore definitions, extraction rates, node assignments
├── systems/
│   ├── FishingSystem.js     # Manages fishing state, timers, catch rolls
│   └── MiningSystem.js      # Manages mining state, timers, extraction rolls
├── ui/
│   ├── ActivityHUD.js       # Persistent idle task status bars on main HUD
│   ├── FishingPanel.js      # Fishing spot interaction panel (start/collect)
│   └── MiningPanel.js       # Mining node interaction panel (start/collect)
```

Modified existing files:

| File | Changes |
|------|---------|
| `BootScene.js` | Generate textures for fishing spot, mining nodes, fish icons, ore icons, activity bar UI |
| `mapGenerator.js` | Add fishing spot tile in town, mining node tiles in Forest and Caves |
| `constants.js` | Add activity-related constants (timers, max queue, node positions) |
| `itemData.js` | Add fish and ore items to the master item registry |
| `HUDScene.js` | Integrate ActivityHUD showing active fishing/mining status |
| `GameScene.js` | Handle interaction with fishing spot and mining nodes, launch panels |
| `ShopScene.js` | Fish and ore appear in Materials tab and are sellable |
| `InventoryPanel.js` | Fish and ore display in Materials tab with new category icons |

---

### Design Principle: Passive/Idle

Both activities follow the same core pattern:

```
Player walks to activity location
  → Taps action button to interact
  → Panel opens: shows what can be caught/mined, expected time, rewards
  → Player taps "Start" to begin the idle task
  → Panel closes, player is FREE TO MOVE AND DO ANYTHING ELSE
  → Activity runs in the background on a timer (no player proximity required)
  → Activity HUD shows progress bar + estimated time remaining
  → When timer completes, a catch/extraction is rolled and added to a results queue
  → Activity auto-loops: starts the next cycle immediately
  → Player can collect results anytime by returning to the location and interacting
  → Player can also stop the activity from the Activity HUD (tap the status bar → confirm stop)
```

**Key rule**: The player does NOT need to stand at the fishing spot or mining node. They start the activity, then go fight mobs, explore, manage their agent, equip gear — whatever they want. The activity ticks in the background. This is what makes it idle.

**One activity at a time per type**: The player can have one fishing session AND one mining session running simultaneously, but not two fishing sessions or two mining sessions.

---

### 1. Fishing System

#### Fishing Spot (Map)

- **Location**: A new tile cluster in town — a small pond (3×3 water tiles with a 1-tile wooden dock adjacent). Place it in an unused corner of the town zone.
- **Tile type**: `fishing_spot` — the dock tile is interactive (same interaction system as Shop/Tavern). Water tiles are impassable and decorative.
- **Visual**: Water tiles use the existing animated water texture. The dock tile is a brown wooden platform (generate a 16×16 texture: horizontal brown planks pattern). A small sign post or fishing rod prop on the dock.

#### Fish Data (`fishData.js`)

Three fishing pools with different catch tables. The pool is determined by player level:

```js
export const FISHING_POOLS = {
  shallow: {
    name: 'Shallow Waters',
    requiredLevel: 1,
    cycleDuration: 8000,   // 8 seconds per catch attempt
    catchChance: 0.85,     // 85% chance to catch something (vs nothing)
    catches: [
      { id: 'small_fish',    weight: 50 },
      { id: 'river_crab',    weight: 30 },
      { id: 'old_boot',      weight: 15 },
      { id: 'pearl_fragment', weight: 5 },
    ],
  },
  deep: {
    name: 'Deep Waters',
    requiredLevel: 3,
    cycleDuration: 12000,  // 12 seconds
    catchChance: 0.75,
    catches: [
      { id: 'large_fish',     weight: 40 },
      { id: 'golden_carp',    weight: 25 },
      { id: 'river_crab',     weight: 20 },
      { id: 'sunken_ring',    weight: 10 },
      { id: 'pearl_fragment',  weight: 5 },
    ],
  },
  abyssal: {
    name: 'Abyssal Depths',
    requiredLevel: 5,
    cycleDuration: 18000,  // 18 seconds
    catchChance: 0.65,
    catches: [
      { id: 'abyssal_eel',    weight: 35 },
      { id: 'golden_carp',    weight: 25 },
      { id: 'crystal_shell',  weight: 20 },
      { id: 'sea_gem',        weight: 12 },
      { id: 'ancient_coin',   weight: 8 },
    ],
  },
};
```

#### Fish & Fishing Item Definitions (add to `itemData.js`)

| Item | Icon | Sell Value | Category | Notes |
|------|------|------------|----------|-------|
| Small Fish | 🐟 | 3g | fish | Common catch |
| Large Fish | 🐠 | 7g | fish | Decent catch |
| River Crab | 🦀 | 5g | fish | Catch + crafting ingredient (Phase 4) |
| Golden Carp | ✨ | 15g | fish | Rare, high sell value |
| Abyssal Eel | 🐍 | 12g | fish | Deep water only |
| Old Boot | 👢 | 1g | junk | Trash catch |
| Pearl Fragment | 🤍 | 8g | gem | Crafting ingredient (Phase 4) |
| Crystal Shell | 🐚 | 10g | gem | Crafting ingredient (Phase 4) |
| Sea Gem | 💠 | 20g | gem | Rare crafting ingredient (Phase 4) |
| Ancient Coin | 🪙 | 0g | special | Auto-converts to 25 gold (like Gold Coin drops) |
| Sunken Ring | 💍 | 18g | gem | Rare find, high sell value |

All fish/gem items stack in the Materials inventory like existing loot.

#### Fishing Panel (`FishingPanel.js`)

Opens when the player interacts with the dock tile. Overlay scene, same pattern as ShopScene.

**Layout:**

```
┌─────────────────────────────────────┐
│  ✕                   🎣 Fishing     │
├─────────────────────────────────────┤
│                                     │
│  Available Pool:                    │
│  ┌─────────────────────────────┐   │
│  │ 🌊 Shallow Waters           │   │  Highlighted if
│  │ ~8s per catch · 85% chance  │   │  meets level req
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌊 Deep Waters (Lv.3+)     │   │  Grayed out if
│  │ ~12s per catch · 75% chance │   │  under-leveled
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🌊 Abyssal Depths (Lv.5+)  │   │
│  │ ~18s per catch · 65% chance │   │
│  └─────────────────────────────┘   │
│                                     │
│  Possible catches:                  │
│  🐟 Small Fish · 🦀 River Crab     │  Shows catches for
│  👢 Old Boot · 🤍 Pearl Fragment    │  selected pool
│                                     │
│         [ 🎣 Start Fishing ]        │  Main action button
│                                     │
│  ── Uncollected Catches ──          │  Only shows if
│  🐟×3  🦀×1  🤍×1                  │  results pending
│       [ Collect All ]               │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Tap a pool to select it (if level requirement met). Selected pool highlights with a border.
- Tap **Start Fishing** to begin the idle loop. Panel closes. Player is free to move.
- If fishing is already active, the panel instead shows current status + uncollected catches + a **Stop Fishing** button.
- Tap **Collect All** to move all pending catches to the shared Materials inventory. Show loot toasts for each item.

#### FishingSystem.js

```js
export class FishingSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.selectedPool = null;
    this.timer = null;
    this.pendingCatches = [];   // Array of { id, name, icon, quantity, sellValue }
    this.maxPending = 20;       // Auto-stops if 20 uncollected catches
    this.cycleCount = 0;
  }

  start(poolKey) {
    this.selectedPool = FISHING_POOLS[poolKey];
    this.active = true;
    this.cycleCount = 0;
    this.scheduleCycle();
  }

  scheduleCycle() {
    if (!this.active) return;
    if (this.pendingCatches.length >= this.maxPending) {
      // Auto-pause: too many uncollected catches
      this.active = false;
      this.scene.events.emit('fishingPaused', 'Catch bag full! Collect your catches.');
      return;
    }
    this.timer = this.scene.time.delayedCall(
      this.selectedPool.cycleDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('fishingCycleStarted', {
      pool: this.selectedPool.name,
      duration: this.selectedPool.cycleDuration,
    });
  }

  completeCycle() {
    this.cycleCount++;
    // Roll catch
    if (Math.random() <= this.selectedPool.catchChance) {
      const catchItem = weightedRandomPick(this.selectedPool.catches);
      this.addToPending(catchItem.id);
      this.scene.events.emit('fishingCatch', { itemId: catchItem.id, cycleNum: this.cycleCount });
    } else {
      this.scene.events.emit('fishingMiss', { cycleNum: this.cycleCount });
    }
    // Auto-loop
    this.scheduleCycle();
  }

  addToPending(itemId) {
    const existing = this.pendingCatches.find(c => c.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      const itemDef = ITEM_DATA[itemId];
      this.pendingCatches.push({
        id: itemId,
        name: itemDef.name,
        icon: itemDef.icon,
        quantity: 1,
        sellValue: itemDef.sellValue,
        category: itemDef.category,
      });
    }
  }

  collectAll(gameState) {
    // Transfer all pending catches to shared Materials inventory
    for (const catch of this.pendingCatches) {
      if (catch.id === 'ancient_coin') {
        gameState.gold += 25 * catch.quantity;
      } else {
        addToMaterials(gameState.materials, catch);
      }
    }
    const collected = [...this.pendingCatches];
    this.pendingCatches = [];
    return collected; // For loot toast display
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.timer = null;
    this.scene.events.emit('fishingStopped');
  }

  getStatus() {
    return {
      active: this.active,
      pool: this.selectedPool?.name || null,
      pendingCount: this.pendingCatches.length,
      cycleCount: this.cycleCount,
      // Timer progress for HUD bar
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / this.selectedPool.cycleDuration)
        : 0,
    };
  }
}
```

---

### 2. Mining System

#### Mining Nodes (Map)

Mining nodes are **new interactive tiles placed in the Forest and Cave zones** — NOT in town. The player must walk to a node to start mining, but once started, they can leave and mining continues in the background.

- **Forest nodes**: 3 fixed locations. Placed near the town border for easy access. Yield basic ores.
- **Cave nodes**: 2 fixed locations. Deeper in the map, higher risk (mobs nearby). Yield rare ores.
- **Visual**: Mining nodes are 1-tile objects. Generate a 16×16 texture: a rocky outcrop shape (gray/brown irregular polygon with colored crystal/ore flecks matching the node type).
  - Copper node: Gray rock with orange-brown flecks
  - Iron node: Gray rock with silver-white flecks
  - Crystal node: Dark rock with blue-purple flecks
- **Node states**: 
  - `available` — Full visual, interactive
  - `active` — Player is mining this node (even remotely). Show a subtle pickaxe animation overlay or pulsing glow.
  - `depleted` — After a set number of extractions (see below), node becomes dark/cracked. Respawns after a cooldown.

#### Ore Data (`oreData.js`)

```js
export const MINING_NODES = {
  copper_node: {
    id: 'copper_node',
    name: 'Copper Vein',
    zone: 'forest',
    requiredLevel: 1,
    cycleDuration: 10000,    // 10 seconds per extraction
    extractChance: 0.90,     // 90% success per cycle
    maxExtractions: 10,      // Depletes after 10 successful extractions
    respawnTime: 60000,      // 60 seconds to respawn after depletion
    yields: [
      { id: 'copper_ore',     weight: 60 },
      { id: 'rough_stone',    weight: 30 },
      { id: 'copper_nugget',  weight: 10 },
    ],
  },
  iron_node: {
    id: 'iron_node',
    name: 'Iron Deposit',
    zone: 'forest',
    requiredLevel: 2,
    cycleDuration: 14000,
    extractChance: 0.80,
    maxExtractions: 8,
    respawnTime: 90000,
    yields: [
      { id: 'iron_ore',       weight: 55 },
      { id: 'rough_stone',    weight: 25 },
      { id: 'iron_nugget',    weight: 15 },
      { id: 'gemstone_shard', weight: 5 },
    ],
  },
  crystal_node: {
    id: 'crystal_node',
    name: 'Crystal Formation',
    zone: 'caves',
    requiredLevel: 3,
    cycleDuration: 18000,
    extractChance: 0.70,
    maxExtractions: 6,
    respawnTime: 120000,
    yields: [
      { id: 'crystal_ore',    weight: 45 },
      { id: 'iron_ore',       weight: 20 },
      { id: 'gemstone_shard', weight: 20 },
      { id: 'void_crystal',   weight: 10 },
      { id: 'ancient_coin',   weight: 5 },
    ],
  },
};
```

#### Node Placement (in `mapGenerator.js`)

Add mining node positions to the map data. Each node has fixed coordinates:

```js
export const MINING_NODE_PLACEMENTS = [
  // Forest — 3 copper, 2 iron (near town border)
  { nodeType: 'copper_node', tileX: 12, tileY: 22 },
  { nodeType: 'copper_node', tileX: 28, tileY: 24 },
  { nodeType: 'copper_node', tileX: 8,  tileY: 18 },
  { nodeType: 'iron_node',   tileX: 6,  tileY: 14 },
  { nodeType: 'iron_node',   tileX: 32, tileY: 16 },
  // Caves — 2 crystal
  { nodeType: 'crystal_node', tileX: 10, tileY: 5 },
  { nodeType: 'crystal_node', tileX: 30, tileY: 3 },
];
```

Adjust exact coordinates to avoid collision with existing map features. Nodes are impassable tiles that are also interactable.

#### Ore & Mining Item Definitions (add to `itemData.js`)

| Item | Icon | Sell Value | Category | Notes |
|------|------|------------|----------|-------|
| Copper Ore | 🟠 | 4g | ore | Basic ore |
| Iron Ore | ⬜ | 8g | ore | Mid-tier ore |
| Crystal Ore | 🔷 | 14g | ore | Rare ore |
| Rough Stone | 🪨 | 2g | ore | Common byproduct |
| Copper Nugget | 🟤 | 10g | ore | Refined drop, crafting ingredient (Phase 4) |
| Iron Nugget | ⚪ | 16g | ore | Refined drop, crafting ingredient (Phase 4) |
| Gemstone Shard | 💎 | 12g | gem | Crafting ingredient (Phase 4) |
| Void Crystal | 🟣 | 25g | gem | Rare, high value |
| Ancient Coin | 🪙 | 0g | special | Auto-converts to 25 gold (shared with fishing) |

#### Mining Panel (`MiningPanel.js`)

Opens when the player interacts with a mining node tile. Layout is simpler than fishing since each node is a specific type (no pool selection needed):

```
┌─────────────────────────────────────┐
│  ✕                   ⛏️ Mining      │
├─────────────────────────────────────┤
│                                     │
│  ⛰️ Copper Vein                     │
│  Zone: Forest                       │
│  Extractions remaining: 7/10       │
│  ~10s per extraction · 90% chance  │
│                                     │
│  Possible yields:                   │
│  🟠 Copper Ore · 🪨 Rough Stone    │
│  🟤 Copper Nugget                   │
│                                     │
│         [ ⛏️ Start Mining ]         │
│                                     │
│  ── Uncollected Ores ──             │
│  🟠×4  🪨×2                         │
│       [ Collect All ]               │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- If node is `available`, show the Start Mining button. Tapping starts the idle loop. Panel closes. Player is free to move.
- If mining is already active on this node, show progress + uncollected ores + Stop Mining button.
- If node is `depleted`, show: "Depleted — Respawns in [time]". No start button.
- If the player is already mining a DIFFERENT node, show: "Already mining [node name]. Stop current mining first?"
- **Collect All**: Transfers pending ores to Materials inventory. Loot toasts.

#### Mining System (`MiningSystem.js`)

Nearly identical architecture to FishingSystem, with these differences:

```js
export class MiningSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.activeNode = null;        // Reference to the node being mined
    this.activeNodeDef = null;     // Node definition from oreData
    this.timer = null;
    this.pendingOres = [];
    this.maxPending = 15;          // Smaller bag than fishing
    this.extractionCount = 0;      // Tracks depletion
  }

  start(nodeRef, nodeDef) {
    this.activeNode = nodeRef;
    this.activeNodeDef = nodeDef;
    this.active = true;
    this.extractionCount = 0;
    nodeRef.setState('active');     // Visual update on the map tile
    this.scheduleCycle();
  }

  scheduleCycle() {
    if (!this.active) return;
    if (this.pendingOres.length >= this.maxPending) {
      this.active = false;
      this.scene.events.emit('miningPaused', 'Ore bag full! Collect your ores.');
      return;
    }
    this.timer = this.scene.time.delayedCall(
      this.activeNodeDef.cycleDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('miningCycleStarted', {
      node: this.activeNodeDef.name,
      duration: this.activeNodeDef.cycleDuration,
    });
  }

  completeCycle() {
    if (Math.random() <= this.activeNodeDef.extractChance) {
      const yield = weightedRandomPick(this.activeNodeDef.yields);
      this.addToPending(yield.id);
      this.extractionCount++;
      this.scene.events.emit('miningExtract', { itemId: yield.id });

      // Check depletion
      if (this.extractionCount >= this.activeNodeDef.maxExtractions) {
        this.depleteNode();
        return;
      }
    } else {
      this.scene.events.emit('miningMiss');
    }
    this.scheduleCycle();
  }

  depleteNode() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.activeNode.setState('depleted');
    this.scene.events.emit('miningNodeDepleted', {
      node: this.activeNodeDef.name,
      respawnTime: this.activeNodeDef.respawnTime,
    });
    // Schedule respawn
    this.scene.time.delayedCall(this.activeNodeDef.respawnTime, () => {
      this.activeNode.setState('available');
      this.activeNode.resetExtractions();
      this.scene.events.emit('miningNodeRespawned', { node: this.activeNodeDef.name });
    });
  }

  collectAll(gameState) {
    for (const ore of this.pendingOres) {
      if (ore.id === 'ancient_coin') {
        gameState.gold += 25 * ore.quantity;
      } else {
        addToMaterials(gameState.materials, ore);
      }
    }
    const collected = [...this.pendingOres];
    this.pendingOres = [];
    return collected;
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.timer = null;
    if (this.activeNode) this.activeNode.setState('available');
    this.scene.events.emit('miningStopped');
  }

  getStatus() {
    return {
      active: this.active,
      node: this.activeNodeDef?.name || null,
      pendingCount: this.pendingOres.length,
      extractionsLeft: this.activeNodeDef
        ? this.activeNodeDef.maxExtractions - this.extractionCount
        : 0,
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / this.activeNodeDef.cycleDuration)
        : 0,
    };
  }
}
```

---

### 3. Activity HUD (`ActivityHUD.js`)

A persistent UI element on the main game HUD that shows the status of all active idle tasks. Rendered in HUDScene, positioned just below the entity stat bars.

#### Layout

When no activities are running, nothing is shown (zero visual footprint).

When one or both activities are active:

```
┌──────────────────────────────────┐
│ 🎣 Shallow Waters    ████░░ 4🐟 │  Fishing status bar
│ ⛏️ Copper Vein (7)   ██████░ 3🟠│  Mining status bar
└──────────────────────────────────┘
```

Each activity bar shows:
- **Icon**: 🎣 or ⛏️
- **Name**: Pool or node name
- **Progress bar**: Fill representing current cycle progress (resets each cycle). Thin bar, 4px tall. Fishing = blue fill. Mining = orange fill.
- **Extraction count**: For mining, show remaining extractions in parentheses: `(7)` meaning 7 left before depletion.
- **Pending count**: Number of uncollected items + icon of the most recent catch/extract.
- **Tap interaction**: Tapping either bar opens a quick-action popup:
  ```
  ┌─────────────────────┐
  │ 🎣 Shallow Waters   │
  │ Catches: 4 pending  │
  │ [Collect] [Stop]    │
  └─────────────────────┘
  ```
  - **Collect**: Same as Collect All — transfers pending items to inventory without needing to walk back. Loot toasts appear.
  - **Stop**: Stops the activity. Pending items remain and must still be collected (either via the popup or by walking back).

This lets the player manage their idle tasks from anywhere on the map without returning to the activity location.

#### Activity HUD Events

HUDScene listens for these events from FishingSystem and MiningSystem:

```js
// Fishing
'fishingCycleStarted'  → Start/reset fishing progress bar animation
'fishingCatch'         → Flash the fishing bar, increment pending count
'fishingMiss'          → Brief dim flash on the fishing bar
'fishingPaused'        → Show warning icon (⚠️) on fishing bar
'fishingStopped'       → Remove fishing bar with slide-out animation

// Mining
'miningCycleStarted'   → Start/reset mining progress bar animation
'miningExtract'        → Flash the mining bar, increment pending count
'miningMiss'           → Brief dim flash
'miningNodeDepleted'   → Replace progress bar with "Depleted" text + respawn timer
'miningNodeRespawned'  → Show notification, update node visual on map
'miningPaused'         → Show warning icon
'miningStopped'        → Remove mining bar with slide-out animation
```

---

### 4. Map & Interaction Changes

#### New Tiles in `mapGenerator.js`

- **Fishing dock** (`fishing_dock`): Interactive tile in town. Placed adjacent to a 3×3 cluster of `water` tiles forming a small pond. Coordinates: suggest `tileX: 22, tileY: 32` (bottom-right area of town) — adjust to avoid existing buildings.
- **Mining nodes** (`mining_node`): Impassable + interactive tiles at the coordinates defined in `MINING_NODE_PLACEMENTS`. Each stores its node type, state, and extraction count.

#### Interaction System Update (`GameScene.js`)

The existing interaction system (action button near buildings) must now also detect:
- Player adjacent to `fishing_dock` tile → action button becomes 🎣, opens FishingPanel
- Player adjacent to `mining_node` tile → action button becomes ⛏️, opens MiningPanel

Update the context action detection:
```js
function getContextAction(playerTileX, playerTileY, mapData) {
  // Check all 4 adjacent tiles
  const adjacentTiles = getAdjacentTiles(playerTileX, playerTileY);
  for (const tile of adjacentTiles) {
    const mapTile = mapData[tile.y]?.[tile.x];
    if (!mapTile) continue;
    if (mapTile.buildingType === 'tavern') return { type: 'tavern', icon: '🍺' };
    if (mapTile.buildingType === 'shop')   return { type: 'shop',   icon: '🏪' };
    if (mapTile.type === 'fishing_dock')   return { type: 'fishing', icon: '🎣' };
    if (mapTile.type === 'mining_node')    return { type: 'mining',  icon: '⛏️', nodeRef: mapTile.nodeRef };
  }
  return null;
}
```

---

### 5. Runtime Texture Additions (`BootScene.js`)

Generate new textures:

**Map tiles:**
- `tile_fishing_dock`: 16×16, horizontal brown plank pattern (alternating #8B6914 and #6B4226 rows, 2px per plank)
- `tile_mining_node_copper`: 16×16, gray rock base (#7A7A7A irregular shape) with orange-brown flecks (#B87333, 3-4 scattered pixels)
- `tile_mining_node_iron`: Same rock base with silver-white flecks (#C0C0C0)
- `tile_mining_node_crystal`: Darker rock base (#4A4458) with blue-purple flecks (#5B8FA8, #9C27B0)
- `tile_mining_node_depleted`: Cracked dark rock, desaturated version of base

**Item icons** (16×16 each):
- Fish items: Simple side-view fish silhouettes in appropriate colors
- Ore items: Small rock/crystal shapes with appropriate coloring
- Use same generation pattern as Phase 2 gear icons

**UI elements:**
- `ui_activity_bar_bg`: Thin horizontal bar background (120×8px), dark
- `ui_activity_bar_fish`: Blue fill variant
- `ui_activity_bar_mine`: Orange fill variant
- `ui_activity_popup_bg`: Small popup background (160×80px), dark panel style

---

### 6. Economy Balance Notes

Fishing and mining should provide a **meaningful but not dominant** gold income compared to mob hunting + gear selling. Target ratios:

| Activity | Gold per minute (approximate) |
|----------|-------------------------------|
| Hunting (agent, base gear) | ~15-20g/min |
| Hunting (player, manual) | ~20-25g/min |
| Fishing (Shallow) | ~8-10g/min |
| Fishing (Abyssal) | ~12-15g/min |
| Mining (Copper) | ~6-8g/min |
| Mining (Crystal) | ~10-14g/min |

This means fishing and mining are **supplementary income** — they don't replace the core hunt loop, but they reward the player for engaging with multiple systems. The real value of fish/ore comes in Phase 4 (Crafting) where they become ingredients for powerful gear upgrades.

Sell values in the item tables above are tuned to these targets. Adjust cycle durations or sell values if playtesting shows income is too high or low.

---

### Phase 3 Success Criteria

1. A fishing dock exists in town. Walking to it and interacting opens the Fishing Panel.
2. Player can select an eligible fishing pool and start fishing. The panel closes and the player can freely move.
3. Fishing runs in the background on a timer. Each cycle rolls a catch from the pool's weighted table.
4. Catches accumulate in a pending queue (max 20). Auto-pauses when full.
5. Player can collect catches by returning to the dock OR via the Activity HUD popup from anywhere.
6. Mining nodes exist in Forest (copper, iron) and Caves (crystal) at fixed map positions.
7. Player can walk to a node, interact, and start mining. Mining runs in the background.
8. Mining nodes deplete after their max extractions and visually change to a depleted state. They respawn after the defined cooldown.
9. Only one fishing session and one mining session can run simultaneously.
10. The Activity HUD shows progress bars for active activities, with tap-to-collect and tap-to-stop functionality.
11. All fish, ore, and gem items appear in the Materials tab of the inventory and can be sold in the shop.
12. Ancient Coins auto-convert to 25 gold (same behavior as Gold Coin drops).
13. The new items use runtime-generated 16×16 textures consistent with the existing art style.
14. Activities running in the background do not noticeably impact game performance or frame rate on mobile.
