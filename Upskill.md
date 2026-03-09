# Phase 6: Life Skills Expansion — Skill Leveling, Farming & Cooking

> **DO NOT BUILD UNTIL PHASE 5 PASSES ALL SUCCESS CRITERIA.** Phase 5 systems (new zones, new mobs, World Boss) must all be working correctly before implementing anything below.

---

## Phase 6 Overview

This phase transforms life skills from passive side-activities into a co-equal progression system alongside combat. Three interconnected systems create a full life-skill ecosystem that gives non-combat-focused players their own goals, milestones, and rewards — while also giving combat players a reason to engage with life skills for powerful consumable buffs.

**Design philosophy:** Life skills should feel as rewarding and progression-rich as leveling up and getting gear. A player who spends their session farming and cooking should feel the same sense of accomplishment as one who spent it hunting mobs.

### New Systems

1. **Skill Leveling** — XP and levels (1–10) for Fishing, Mining, Cooking, and Farming. Levels unlock new content, improve yield rates, and provide milestone rewards.
2. **Farming** — New town plot. Plant seeds, wait for growth, harvest crops. Fully passive/idle like fishing and mining.
3. **Cooking** — New town building (Kitchen). Combine fish, crops, and materials into consumable items that provide temporary stat buffs, healing, and life-skill boosts. Instant crafting (same pattern as the Forge).

### The Life Skill Loop

```
Farm crops ──→ Cook meals ──→ Eat for buffs ──→ Hunt better / Skill faster
 ↑              ↑
Fish catches ───────┘
Mine ores ──→ Forge gear (existing)
 ↑
Cook meals ──→ Mining speed buffs (eat before mining)
```

Every life skill feeds into at least one other system. Nothing is a dead end.

### NOT in this phase (Phase 7+):

- ❌ Multiple agents
- ❌ Life skill gear/tools (fishing rods, pickaxes)
- ❌ Animal husbandry or ranching
- ❌ Player housing decoration
- ❌ Trading or marketplace
- ❌ Life skill leaderboards or achievements

---

## New Files

```
src/
├── config/
│   ├── skillData.js        # Skill XP tables, level thresholds, unlock definitions
│   ├── farmData.js         # Seed definitions, growth times, crop yields
│   └── cookingData.js      # Cooking recipes (ingredients → consumable output)
├── systems/
│   ├── SkillSystem.js      # Tracks XP/levels for all skills, handles level-ups
│   ├── FarmingSystem.js    # Plot state, planting, growth timers, harvesting
│   └── CookingSystem.js    # Recipe validation, consumable creation
├── entities/
│   └── FarmPlot.js         # Visual farm plot tiles with growth stage rendering
├── ui/
│   ├── SkillsPanel.js      # Full skills overview screen (all skills + progress)
│   ├── FarmingPanel.js     # Farm interaction panel (plant/harvest/status)
│   ├── CookingPanel.js     # Cooking interface (recipe list, cook button)
│   └── BuffBar.js          # Active buff icons displayed on the main HUD
```

### Modified Existing Files

| File | Changes |
|------|---------|
| `BootScene.js` | Generate textures for farm plots (4 growth stages), crop icons, seed icons, kitchen building, cooked item icons, skill icons, buff icons |
| `mapGenerator.js` | Add farm plot area (3×3 grid of soil tiles) and Kitchen building in town |
| `constants.js` | Farm plot positions, kitchen position, skill constants |
| `itemData.js` | Add seeds, crops, and cooked consumable items |
| `FishingSystem.js` | Integrate skill XP gain on each catch. Apply skill level bonuses to catch rate and cycle speed. |
| `MiningSystem.js` | Integrate skill XP gain on each extraction. Apply skill level bonuses to extract rate and cycle speed. |
| `HUDScene.js` | Add 📊 Skills button to UI. Integrate BuffBar for active consumable effects. Show skill XP gain toasts. |
| `GameScene.js` | Instantiate SkillSystem, FarmingSystem, CookingSystem. Handle Kitchen and Farm interactions. Apply active buff effects. |
| `CombatSystem.js` | Check for active food buffs on attacker/defender and apply stat modifications. |
| `StatCalculator.js` | Factor in active buff bonuses alongside gear bonuses. |
| `ShopScene.js` | Seeds, crops, and cooked items are sellable in Materials tab. |
| `InventoryPanel.js` | New category filters: Materials / Gear / Seeds & Crops / Food |

---

## 1. Skill Leveling System (`SkillSystem.js`)

### Skill Definitions (`skillData.js`)

Four skills, each leveling from 1 to 10:

```js
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
  // XP required to reach each level (cumulative thresholds)
  1: 0,
  2: 30,
  3: 80,
  4: 160,
  5: 300,
  6: 500,
  7: 780,
  8: 1150,
  9: 1650,
  10: 2300,  // Max level
};
```

### XP Sources

| Skill | XP Gain Events |
|-------|---------------|
| Fishing | +3 XP per successful catch. +1 XP per miss (you still tried). +5 bonus XP for rare catches (Pearl Fragment, Sea Gem, Sunken Ring, Ancient Coin). |
| Mining | +4 XP per successful extraction. +1 XP per miss. +6 bonus XP for rare extractions (Gemstone Shard, Void Crystal, Ancient Coin). |
| Farming | +5 XP per crop harvested. +8 XP for rare crops. +2 XP per seed planted. |
| Cooking | +6 XP per dish cooked. +10 XP for advanced recipes (Lv.5+ requirement). |

### Skill Level Bonuses

Each skill level provides tangible, stacking bonuses that make the activity noticeably better:

```js
export const SKILL_BONUSES = {
  fishing: {
    // Per-level bonuses (multiply by current level - 1, so level 1 = no bonus)
    cycleSpeedBonus: 0.05,    // 5% faster cycle per level (level 10 = 45% faster)
    catchChanceBonus: 0.02,   // +2% catch chance per level (level 10 = +18%)
    doubleCatchChance: 0.03,  // 3% chance of double catch per level (level 10 = 27%)
    // Level-gated unlocks
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
    growthSpeedBonus: 0.06,     // 6% faster growth per level
    harvestBonusChance: 0.04,   // 4% chance of bonus crop per level
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
    // Cooking bonuses affect the OUTPUT quality, not speed (cooking is instant)
    buffDurationBonus: 0.05,  // 5% longer buff duration per level
    buffPotencyBonus: 0.03,   // 3% stronger buff effects per level
    unlocks: {
      2: { type: 'recipe_tier', tier: 2, description: 'Tier 2 recipes unlocked' },
      4: { type: 'recipe_tier', tier: 3, description: 'Tier 3 recipes unlocked' },
      6: { type: 'recipe_tier', tier: 4, description: 'Tier 4 recipes unlocked' },
      8: { type: 'perk', id: 'double_portion', description: '20% chance to cook 2 portions from 1 recipe' },
      10: { type: 'perk', id: 'master_chef', description: 'All food buffs last 50% longer (stacks)' },
    },
  },
};
```

### Fishing & Mining Unlock Migration

**IMPORTANT:** Phase 3 fishing pools and mining nodes were gated by player combat level. Phase 6 changes this — pools and nodes are now gated by **skill level** instead. Update the existing systems:

- **Fishing pool access:** Shallow = Fishing Lv.1, Deep = Fishing Lv.3, Abyssal = Fishing Lv.5
- **Mining node access:** Copper = Mining Lv.1, Iron = Mining Lv.2, Crystal = Mining Lv.4

Remove the old `requiredLevel` (combat level) checks from `FISHING_POOLS` and `MINING_NODES` and replace with `requiredSkillLevel` that references the skill system. This is a cleaner design — combat level gates combat zones, skill level gates skill content.

### `SkillSystem.js`

```js
export class SkillSystem {
  constructor(scene) {
    this.scene = scene;
    this.skills = {
      fishing: { xp: 0, level: 1 },
      mining: { xp: 0, level: 1 },
      farming: { xp: 0, level: 1 },
      cooking: { xp: 0, level: 1 },
    };
  }

  addXP(skillId, amount) {
    const skill = this.skills[skillId];
    if (!skill || skill.level >= 10) return; // Max level, no more XP

    skill.xp += amount;

    // Check for level up
    const nextLevelXP = SKILL_XP_TABLE[skill.level + 1];
    if (nextLevelXP && skill.xp >= nextLevelXP) {
      skill.level++;
      this.scene.events.emit('skillLevelUp', {
        skillId,
        newLevel: skill.level,
        unlock: SKILL_BONUSES[skillId].unlocks[skill.level] || null,
      });
      // Check for further level ups (in case of large XP gains)
      this.addXP(skillId, 0);
    }

    this.scene.events.emit('skillXPGained', {
      skillId,
      amount,
      currentXP: skill.xp,
      level: skill.level,
      nextLevelXP: SKILL_XP_TABLE[skill.level + 1] || null,
    });
  }

  getLevel(skillId) {
    return this.skills[skillId]?.level || 1;
  }

  getBonus(skillId, bonusKey) {
    const level = this.getLevel(skillId);
    const bonusDef = SKILL_BONUSES[skillId];
    const perLevelValue = bonusDef[bonusKey];
    if (perLevelValue === undefined) return 0;
    return perLevelValue * (level - 1); // Level 1 = 0 bonus
  }

  hasUnlock(skillId, unlockId) {
    const level = this.getLevel(skillId);
    const unlocks = SKILL_BONUSES[skillId].unlocks;
    for (const [lvl, unlock] of Object.entries(unlocks)) {
      if (parseInt(lvl) <= level && unlock.id === unlockId) return true;
    }
    return false;
  }

  hasPerk(skillId, perkId) {
    return this.hasUnlock(skillId, perkId);
  }

  getSkillProgress(skillId) {
    const skill = this.skills[skillId];
    const currentThreshold = SKILL_XP_TABLE[skill.level];
    const nextThreshold = SKILL_XP_TABLE[skill.level + 1];
    if (!nextThreshold) return { level: skill.level, progress: 1.0, isMax: true };

    const progressXP = skill.xp - currentThreshold;
    const neededXP = nextThreshold - currentThreshold;

    return {
      level: skill.level,
      xp: skill.xp,
      progress: progressXP / neededXP,
      progressXP,
      neededXP,
      isMax: false,
    };
  }
}
```

### Integrating Bonuses into `FishingSystem.js`

```js
// In scheduleCycle(), apply speed bonus:
const speedBonus = this.scene.skillSystem.getBonus('fishing', 'cycleSpeedBonus');
const adjustedDuration = Math.floor(this.selectedPool.cycleDuration * (1 - speedBonus));

// In completeCycle(), apply catch chance bonus:
const catchBonus = this.scene.skillSystem.getBonus('fishing', 'catchChanceBonus');
const adjustedChance = Math.min(0.99, this.selectedPool.catchChance + catchBonus);

// After catching, check for double catch:
const doubleChance = this.scene.skillSystem.getBonus('fishing', 'doubleCatchChance');
if (Math.random() < doubleChance) {
  this.addToPending(catchItem.id); // Add a second copy
  this.scene.events.emit('fishingDoubleCatch', { itemId: catchItem.id });
}

// After catching, add skill XP:
const isRare = ['pearl_fragment', 'sea_gem', 'sunken_ring', 'ancient_coin'].includes(catchItem.id);
this.scene.skillSystem.addXP('fishing', isRare ? 8 : 3);

// On miss:
this.scene.skillSystem.addXP('fishing', 1);

// Master Angler perk (Lv.10):
if (this.scene.skillSystem.hasPerk('fishing', 'master_angler')) {
  // Double the weight of rare items in the catch table for this roll
}

// Auto-collect perk (Lv.7):
// When pendingCatches fills, instead of pausing, auto-transfer to inventory
if (this.scene.skillSystem.hasPerk('fishing', 'auto_collect_fish')) {
  this.autoCollect(gameState);
}
```

Apply equivalent integration to `MiningSystem.js` for mining bonuses.

---

## 2. Farming System

### Farm Plot (Map)

- **Location:** A 3×3 area of **soil tiles** in town, adjacent to the player's home building. Starting size: **4 plots** (2×2 grid). Expands to 6 plots (2×3) at Farming Lv.3, and 9 plots (3×3) at Farming Lv.5.
- **Tile type:** `farm_plot` — interactive tiles. Each plot is an independent unit.
- **Visual per plot (16×16 each):**
  - **Empty:** Dark brown tilled soil (#5A3A1A) with furrow lines (darker horizontal stripes every 4px)
  - **Planted:** Same soil but with a tiny green dot (2×2px) in the center — a seedling
  - **Growing:** Small green sprout (4×6px stem with 2 tiny leaves)
  - **Ready:** Full crop visual specific to the seed type (see below). Subtle bounce animation (±1px Y oscillation, 1.5s cycle) to signal "harvest me!"
- **Position:** Suggest `tileX: 14`, `tileY: 36` as top-left of the 3×3 area — adjust to fit in town near the home building.

### Seed & Crop Data (`farmData.js`)

```js
export const SEEDS = {
  wheat_seed: {
    id: 'wheat_seed',
    name: 'Wheat Seed',
    icon: '🌾',
    textureKey: 'seed_wheat',
    cost: 5,                    // Buy from shop
    requiredFarmingLevel: 1,
    growthTime: 30000,          // 30 seconds
    crop: 'wheat',
    cropYield: { min: 1, max: 2 },
  },
  carrot_seed: {
    id: 'carrot_seed',
    name: 'Carrot Seed',
    icon: '🥕',
    textureKey: 'seed_carrot',
    cost: 5,
    requiredFarmingLevel: 1,
    growthTime: 25000,
    crop: 'carrot',
    cropYield: { min: 1, max: 2 },
  },
  tomato_seed: {
    id: 'tomato_seed',
    name: 'Tomato Seed',
    icon: '🍅',
    textureKey: 'seed_tomato',
    cost: 10,
    requiredFarmingLevel: 2,
    growthTime: 45000,
    crop: 'tomato',
    cropYield: { min: 1, max: 3 },
  },
  golden_wheat_seed: {
    id: 'golden_wheat_seed',
    name: 'Golden Wheat Seed',
    icon: '✨',
    textureKey: 'seed_golden_wheat',
    cost: 25,
    requiredFarmingLevel: 4,
    growthTime: 60000,
    crop: 'golden_wheat',
    cropYield: { min: 1, max: 2 },
  },
  moonberry_seed: {
    id: 'moonberry_seed',
    name: 'Moonberry Seed',
    icon: '🫐',
    textureKey: 'seed_moonberry',
    cost: 40,
    requiredFarmingLevel: 6,
    growthTime: 90000,
    crop: 'moonberry',
    cropYield: { min: 1, max: 2 },
  },
  starfruit_seed: {
    id: 'starfruit_seed',
    name: 'Starfruit Seed',
    icon: '⭐',
    textureKey: 'seed_starfruit',
    cost: 60,
    requiredFarmingLevel: 8,
    growthTime: 120000,
    crop: 'starfruit',
    cropYield: { min: 1, max: 1 },  // Always exactly 1, but very valuable
  },
};

export const CROPS = {
  wheat:        { id: 'wheat',        name: 'Wheat',        icon: '🌾', sellValue: 4,  category: 'crop' },
  carrot:       { id: 'carrot',       name: 'Carrot',       icon: '🥕', sellValue: 4,  category: 'crop' },
  tomato:       { id: 'tomato',       name: 'Tomato',       icon: '🍅', sellValue: 7,  category: 'crop' },
  golden_wheat: { id: 'golden_wheat', name: 'Golden Wheat', icon: '✨', sellValue: 15, category: 'crop' },
  moonberry:    { id: 'moonberry',    name: 'Moonberry',    icon: '🫐', sellValue: 22, category: 'crop' },
  starfruit:    { id: 'starfruit',    name: 'Starfruit',    icon: '⭐', sellValue: 40, category: 'crop' },
};
```

Add all seeds and crops to `itemData.js`. Seeds are categorized as `'seed'` and crops as `'crop'`.

### Seed Purchasing

Seeds are bought from the **existing Shop** (add a new "Seeds" tab to ShopScene):

```
┌────────────────────────────────────────────┐
│  [Materials]  [Gear]  [Seeds]              │
├────────────────────────────────────────────┤
│  🌾 Wheat Seed       5g   [Buy ×1] [×5]   │
│  🥕 Carrot Seed      5g   [Buy ×1] [×5]   │
│  🍅 Tomato Seed     10g   [Buy ×1] [×5]   │  Locked seeds
│  🔒 Golden Wheat    25g   Farm Lv.4       │  show requirement
│  🔒 Moonberry       40g   Farm Lv.6       │
│  🔒 Starfruit       60g   Farm Lv.8       │
└────────────────────────────────────────────┘
```

- Buy ×1 and ×5 buttons for convenience
- Locked seeds show the required Farming level and are not purchasable

### `FarmingSystem.js`

```js
export class FarmingSystem {
  constructor(scene, skillSystem) {
    this.scene = scene;
    this.skillSystem = skillSystem;
    this.plots = [];  // Array of plot state objects
    this.maxPlots = 4; // Starting plots, increases with Farming level
    this.initPlots();
  }

  initPlots() {
    // Create starting plots based on farm level
    const farmLevel = this.skillSystem.getLevel('farming');
    if (farmLevel >= 5) this.maxPlots = 9;
    else if (farmLevel >= 3) this.maxPlots = 6;
    else this.maxPlots = 4;

    for (let i = 0; i < this.maxPlots; i++) {
      if (!this.plots[i]) {
        this.plots.push({
          index: i,
          state: 'empty',  // 'empty' | 'planted' | 'growing' | 'ready'
          seedId: null,
          plantedAt: null,
          growthDuration: null,
          timer: null,
        });
      }
    }
  }

  plant(plotIndex, seedId, gameState) {
    const plot = this.plots[plotIndex];
    if (!plot || plot.state !== 'empty') return { success: false, reason: 'Plot not empty' };

    const seedDef = SEEDS[seedId];
    if (!seedDef) return { success: false, reason: 'Invalid seed' };

    // Check farming level
    if (this.skillSystem.getLevel('farming') < seedDef.requiredFarmingLevel) {
      return { success: false, reason: `Requires Farming Lv.${seedDef.requiredFarmingLevel}` };
    }

    // Check seed in inventory
    const ownedSeeds = getOwnedQuantity(gameState.materials, seedId);
    if (ownedSeeds < 1) return { success: false, reason: 'No seeds available' };

    // Consume seed
    removeFromMaterials(gameState.materials, seedId, 1);

    // Apply growth speed bonus
    const speedBonus = this.skillSystem.getBonus('farming', 'growthSpeedBonus');
    const masterBonus = this.skillSystem.hasPerk('farming', 'master_farmer') ? 0.25 : 0;
    const totalSpeedReduction = Math.min(0.70, speedBonus + masterBonus); // Cap at 70% reduction
    const adjustedGrowth = Math.floor(seedDef.growthTime * (1 - totalSpeedReduction));

    plot.state = 'planted';
    plot.seedId = seedId;
    plot.plantedAt = Date.now();
    plot.growthDuration = adjustedGrowth;

    // Transition to growing after 20% of growth time
    this.scene.time.delayedCall(adjustedGrowth * 0.2, () => {
      if (plot.state === 'planted') plot.state = 'growing';
      this.scene.events.emit('plotStateChanged', { plotIndex, state: 'growing' });
    });

    // Transition to ready when fully grown
    plot.timer = this.scene.time.delayedCall(adjustedGrowth, () => {
      plot.state = 'ready';
      this.scene.events.emit('plotStateChanged', { plotIndex, state: 'ready' });
      this.scene.events.emit('cropReady', { plotIndex, seedId });
    });

    // Farming XP for planting
    this.skillSystem.addXP('farming', 2);

    this.scene.events.emit('plotStateChanged', { plotIndex, state: 'planted' });
    return { success: true };
  }

  harvest(plotIndex, gameState) {
    const plot = this.plots[plotIndex];
    if (!plot || plot.state !== 'ready') return { success: false, reason: 'Not ready' };

    const seedDef = SEEDS[plot.seedId];
    const cropDef = CROPS[seedDef.crop];

    // Calculate yield
    let quantity = randomBetween(seedDef.cropYield.min, seedDef.cropYield.max);

    // Bonus crop chance from farming level
    const bonusChance = this.skillSystem.getBonus('farming', 'harvestBonusChance');
    if (Math.random() < bonusChance) {
      quantity += 1;
      this.scene.events.emit('farmingBonusCrop', { crop: cropDef.name });
    }

    // Add crops to inventory
    addToMaterials(gameState.materials, {
      id: cropDef.id,
      name: cropDef.name,
      icon: cropDef.icon,
      quantity: quantity,
      sellValue: cropDef.sellValue,
      category: cropDef.category,
    });

    // Farming XP
    const isRare = ['golden_wheat', 'moonberry', 'starfruit'].includes(cropDef.id);
    this.skillSystem.addXP('farming', isRare ? 8 : 5);

    // Reset plot
    plot.state = 'empty';
    plot.seedId = null;
    plot.plantedAt = null;
    plot.growthDuration = null;
    plot.timer = null;

    this.scene.events.emit('plotStateChanged', { plotIndex, state: 'empty' });
    return { success: true, crop: cropDef, quantity };
  }

  harvestAll(gameState) {
    const results = [];
    for (let i = 0; i < this.plots.length; i++) {
      if (this.plots[i].state === 'ready') {
        results.push(this.harvest(i, gameState));
      }
    }
    return results;
  }

  getPlotStatus(plotIndex) {
    const plot = this.plots[plotIndex];
    if (plot.state === 'empty') return { state: 'empty' };
    if (plot.state === 'ready') return { state: 'ready', crop: SEEDS[plot.seedId].crop };

    // Growing/planted — calculate progress
    const elapsed = Date.now() - plot.plantedAt;
    const progress = Math.min(1.0, elapsed / plot.growthDuration);

    return {
      state: plot.state,
      seedId: plot.seedId,
      progress,
      timeRemaining: Math.max(0, plot.growthDuration - elapsed),
    };
  }
}
```

### Farming Panel (`FarmingPanel.js`)

Opens when the player interacts with any farm plot tile. Overlay scene.

```
┌─────────────────────────────────────┐
│  ✕                   🌾 Farm        │
├─────────────────────────────────────┤
│                                     │
│  Farm Level: 3   (80/160 XP)       │
│  ████████░░░░░░░░   Plots: 6/6     │
│                                     │
│  ┌────┐  ┌────┐  ┌────┐            │
│  │ 🌾 │  │ 🥕 │  │ 🌱 │     Plot grid
│  │DONE│  │ 72%│  │ 15%│     showing state
│  └────┘  └────┘  └────┘            │
│  ┌────┐  ┌────┐  ┌────┐            │
│  │    │  │ 🍅 │  │    │            │
│  │EMPT│  │ 43%│  │EMPT│            │
│  └────┘  └────┘  └────┘            │
│                                     │
│  [🌾 Harvest All Ready (1)]   Only shows if any
│                               plots are ready
│  ── Plant a Seed ──                 │
│  Select an empty plot, then:        │
│  🌱 Wheat   (×12)     [Plant]      │
│  🥕 Carrot  (×8)      [Plant]      │
│  🍅 Tomato  (×3)      [Plant]      │
│  🔒 Golden Wheat   Farm Lv.4       │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**

- Tap a plot that is `ready` → harvests that single plot, crop added to inventory, loot toast, plot returns to empty
- Tap **Harvest All** → harvests all ready plots at once
- Tap an `empty` plot to select it (highlight border), then tap a seed from the list to plant. If only one empty plot, auto-select it.
- Growing plots show a progress percentage and a mini progress bar inside the plot cell
- Planted/growing plots are not interactive (cannot uproot — seeds are committed)

---

## 3. Cooking System

### Kitchen Building (Map)

- **Location:** New building in town, near the farm. Suggest `tileX: 16`, `tileY: 37`.
- **Tile type:** `building` with `buildingType: 'kitchen'`
- **Visual:** 16×16 texture — warm-toned stone building (#7A6548) with a large window showing orange firelight. A small chimney with white smoke (1px white pixel that drifts upward, similar to Forge chimney but white instead of orange). A sign or pot icon near the door.
- **Interaction:** Player walks adjacent, action button becomes 🍳. Opens CookingPanel.

### Cooking Recipe Data (`cookingData.js`)

Recipes are organized into tiers unlocked by Cooking skill level:

```js
export const COOKING_RECIPES = {
  // ===== TIER 1 (Cooking Lv.1) =====
  basic_stew: {
    id: 'basic_stew',
    name: 'Basic Stew',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'small_fish', quantity: 2 },
      { id: 'wheat',      quantity: 1 },
    ],
    output: {
      id: 'basic_stew',
      quantity: 1,
    },
  },
  carrot_soup: {
    id: 'carrot_soup',
    name: 'Carrot Soup',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'carrot', quantity: 2 },
      { id: 'wheat',  quantity: 1 },
    ],
    output: {
      id: 'carrot_soup',
      quantity: 1,
    },
  },
  grilled_fish: {
    id: 'grilled_fish',
    name: 'Grilled Fish',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'small_fish', quantity: 3 },
    ],
    output: {
      id: 'grilled_fish',
      quantity: 1,
    },
  },

  // ===== TIER 2 (Cooking Lv.2) =====
  hearty_chowder: {
    id: 'hearty_chowder',
    name: 'Hearty Chowder',
    tier: 2,
    requiredCookingLevel: 2,
    ingredients: [
      { id: 'large_fish', quantity: 1 },
      { id: 'carrot',     quantity: 2 },
      { id: 'wheat',      quantity: 2 },
    ],
    output: {
      id: 'hearty_chowder',
      quantity: 1,
    },
  },
  miners_meal: {
    id: 'miners_meal',
    name: "Miner's Meal",
    tier: 2,
    requiredCookingLevel: 2,
    ingredients: [
      { id: 'tomato',     quantity: 2 },
      { id: 'wheat',      quantity: 2 },
      { id: 'river_crab', quantity: 1 },
    ],
    output: {
      id: 'miners_meal',
      quantity: 1,
    },
  },

  // ===== TIER 3 (Cooking Lv.4) =====
  golden_bread: {
    id: 'golden_bread',
    name: 'Golden Bread',
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'golden_wheat', quantity: 2 },
      { id: 'carrot',       quantity: 1 },
    ],
    output: {
      id: 'golden_bread',
      quantity: 1,
    },
  },
  anglers_feast: {
    id: 'anglers_feast',
    name: "Angler's Feast",
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'golden_carp', quantity: 1 },
      { id: 'tomato',      quantity: 2 },
      { id: 'wheat',       quantity: 3 },
    ],
    output: {
      id: 'anglers_feast',
      quantity: 1,
    },
  },

  // ===== TIER 4 (Cooking Lv.6) =====
  moonberry_tart: {
    id: 'moonberry_tart',
    name: 'Moonberry Tart',
    tier: 4,
    requiredCookingLevel: 6,
    ingredients: [
      { id: 'moonberry',    quantity: 2 },
      { id: 'golden_wheat', quantity: 1 },
      { id: 'wheat',        quantity: 2 },
    ],
    output: {
      id: 'moonberry_tart',
      quantity: 1,
    },
  },
  abyssal_broth: {
    id: 'abyssal_broth',
    name: 'Abyssal Broth',
    tier: 4,
    requiredCookingLevel: 6,
    ingredients: [
      { id: 'abyssal_eel', quantity: 2 },
      { id: 'moonberry',   quantity: 1 },
      { id: 'tomato',      quantity: 2 },
    ],
    output: {
      id: 'abyssal_broth',
      quantity: 1,
    },
  },

  // ===== TIER 5 (Cooking Lv.8) =====
  starfruit_elixir: {
    id: 'starfruit_elixir',
    name: 'Starfruit Elixir',
    tier: 5,
    requiredCookingLevel: 8,
    ingredients: [
      { id: 'starfruit',    quantity: 1 },
      { id: 'moonberry',    quantity: 2 },
      { id: 'golden_wheat', quantity: 2 },
      { id: 'sea_gem',      quantity: 1 },
    ],
    output: {
      id: 'starfruit_elixir',
      quantity: 1,
    },
  },
};
```

### Consumable Items (add to `itemData.js`)

Each cooked item is a **consumable** that grants a temporary buff when used:

| Item | Icon | Sell Value | Buff Effect | Base Duration |
|------|------|-----------|-------------|---------------|
| Basic Stew | 🍲 | 8g | +3 ATK | 60s |
| Carrot Soup | 🥣 | 8g | +3 DEF | 60s |
| Grilled Fish | 🐟 | 10g | +15 Max HP (and heal 15) | 60s |
| Hearty Chowder | 🍲 | 15g | +4 ATK, +4 DEF | 90s |
| Miner's Meal | 🍽 | 15g | +30% Mining speed, +30% Mining extract chance | 90s |
| Golden Bread | 🍞 | 22g | +6 ATK, +3 DEF, +10 Max HP | 120s |
| Angler's Feast | 🐟 | 22g | +30% Fishing speed, +30% Fishing catch chance, double catch chance +15% | 120s |
| Moonberry Tart | 🥧 | 30g | +8 ATK, +5 DEF, +20 Max HP | 120s |
| Abyssal Broth | 🍵 | 30g | +25% Farming growth speed, +10 ATK | 120s |
| Starfruit Elixir | 🧪 | 50g | +12 ATK, +8 DEF, +30 Max HP, +15% all skill speed | 180s |

All cooked items are categorized as `'food'` in the inventory and stack.

**Key design notes:**

- Tier 1-2 foods give combat buffs OR skill buffs — the player chooses what to prioritize
- Tier 3-4 foods give both combat and skill buffs, or stronger versions
- Tier 5 (Starfruit Elixir) is the ultimate buff food — expensive to make, incredible effect
- Miner's Meal and Angler's Feast are dedicated life-skill buff foods — this is critical for making life skills feel valued. A fishing-focused player cooks Angler's Feast to improve their fishing output.
- Duration is the BASE duration. Cooking skill level increases duration via `buffDurationBonus`.

### Buff System

### `StatCalculator.js` Changes

Add buff support alongside gear:

```js
export function getEffectiveStats(entity, activeBuffs = []) {
  const base = {
    maxHp: entity.stats.maxHp,
    atk: entity.stats.atk,
    def: entity.stats.def,
  };

  // Gear bonuses (existing Phase 2/4 logic)
  const gearBonus = { maxHp: 0, atk: 0, def: 0 };
  for (const slot of Object.values(entity.equipment)) {
    if (slot !== null) {
      const gearStats = getEnhancedStats(slot);
      for (const [stat, value] of Object.entries(gearStats)) {
        if (gearBonus[stat] !== undefined) gearBonus[stat] += value;
      }
    }
  }

  // Food buff bonuses (NEW)
  const buffBonus = { maxHp: 0, atk: 0, def: 0 };
  for (const buff of activeBuffs) {
    if (buff.stats) {
      for (const [stat, value] of Object.entries(buff.stats)) {
        if (buffBonus[stat] !== undefined) buffBonus[stat] += value;
      }
    }
  }

  return {
    maxHp: base.maxHp + gearBonus.maxHp + buffBonus.maxHp,
    atk: base.atk + gearBonus.atk + buffBonus.atk,
    def: base.def + gearBonus.def + buffBonus.def,
    baseAtk: base.atk,
    baseDef: base.def,
    baseMaxHp: base.maxHp,
    bonusAtk: gearBonus.atk + buffBonus.atk,
    bonusDef: gearBonus.def + buffBonus.def,
    bonusMaxHp: gearBonus.maxHp + buffBonus.maxHp,
  };
}
```

### Active Buffs State

Managed on GameScene (since buffs are global, not per-entity for MVP):

```js
this.activeBuffs = []; // Array of { id, name, icon, stats, skillEffects, expiresAt, duration }

const baseDuration = foodDef.duration;
const durationBonus = skillSystem.getBonus('cooking', 'buffDurationBonus');
const masterBonus = skillSystem.hasPerk('cooking', 'master_chef') ? 0.50 : 0;
const actualDuration = Math.floor(baseDuration * (1 + durationBonus + masterBonus));
```

Only **one food buff** can be active at a time. Eating a new food replaces the current buff (with a confirmation prompt if a buff is already active: "Replace Basic Stew with Moonberry Tart?").

Buffs apply to the **player only** (not the agent). This is intentional — it makes the player's personal activity matter. The agent benefits from gear, the player benefits from gear AND food.

### Using Food

From the inventory panel, tapping a food item shows two options: **[Eat]** and **[Sell]**.

- **Eat:** Applies the buff. Consumes 1 item. Buff timer starts. Buff icon appears in BuffBar.
- **Sell:** Normal sell behavior.

The player can also eat food directly from the CookingPanel after crafting.

### Buff Duration with Cooking Skill

At Cooking Lv.10 with Master Chef: duration bonus = 0.05 × 9 + 0.50 = 0.95 → buffs last nearly 2× as long.

### `CookingPanel.js`

Same layout pattern as ForgePanel's recipe tab:

```
┌─────────────────────────────────────┐
│  ✕                  🍳 Kitchen      │
├─────────────────────────────────────┤
│  Cooking Level: 4   (210/300 XP)   │
│  ████████████░░░░░░                 │
│                                     │
│  ── Tier 1 ──                       │
│  ┌─────────────────────────────────┐│
│  │ 🍲 Basic Stew                   ││
│  │ Buff: +3 ATK for 60s           ││
│  │ 🐟 Small Fish ×2  ✓            ││
│  │ 🌾 Wheat ×1       ✓            ││
│  │         [ 🍳 Cook ]            ││
│  └─────────────────────────────────┘│
│                                     │
│  ── Tier 2 ──                       │
│  ┌─────────────────────────────────┐│
│  │ 🍲 Hearty Chowder              ││
│  │ Buff: +4 ATK, +4 DEF for 90s   ││
│  │ 🐟 Large Fish ×1  ✗ (0/1)      ││
│  │ 🥕 Carrot ×2      ✓            ││
│  │ 🌾 Wheat ×2       ✓            ││
│  │         [ 🍳 Cook ]     Disabled││
│  └─────────────────────────────────┘│
│                                     │
│  ── Tier 3 (🔒 Cooking Lv.4) ──    │
│  ...                                │
│                                     │
│  ── Active Buff ──                  │
│  🍲 Basic Stew · +3 ATK · 0:42    │  Shows current
│                                     │  active buff
└─────────────────────────────────────┘
```

---

## 4. Buff Bar (`BuffBar.js`)

A small persistent UI element on the main HUD showing active food buff.

### Position

Directly below the entity stat bars (HP/XP), above the Activity HUD bars. Takes up minimal space — only one row since only one food buff can be active.

### Layout

```
┌──────────────────────────────────┐
│ 🍲 Hearty Chowder  +4⚔ +4🛡  0:52 │
└──────────────────────────────────┘
```

- Food icon + name + abbreviated stat bonuses + remaining time in `M:SS`
- Background: Dark panel same style as activity bars
- Timer counts down in real-time
- When buff has <15 seconds remaining: timer text turns orange and pulses
- When buff expires: bar flashes once and fades out with a toast: "Hearty Chowder buff expired"
- Skill-only buffs (Miner's Meal, Angler's Feast) show the skill icons instead of combat stats: ⛏+30% or 🎣+30%

---

## 5. Skills Panel (`SkillsPanel.js`)

A comprehensive overview of all skills. Opened from a new 📊 button in the bottom-right button cluster on HUDScene.

### Layout

```
┌─────────────────────────────────────┐
│  ✕                  📊 Skills       │
├─────────────────────────────────────┤
│                                     │
│  🎣 Fishing           Lv. 5        │
│  ███████████░░░░░   320/500 XP     │
│  Cycle speed: +20%                  │
│  Catch chance: +8%                  │
│  Double catch: 12%                  │
│  ✓ Deep Waters unlocked             │
│  ✓ Abyssal Depths unlocked          │
│  Next: Lv.7 — Auto-collect          │
│                                     │
│  ⛏ Mining              Lv. 3       │
│  ██████░░░░░░░░░░   110/160 XP     │
│  Cycle speed: +10%                  │
│  Extract chance: +4%                │
│  Double yield: 6%                   │
│  ✓ Iron Deposits unlocked           │
│  Next: Lv.4 — Crystal Formations    │
│                                     │
│  🌾 Farming             Lv. 2      │
│  ████░░░░░░░░░░░░    45/80 XP      │
│  Growth speed: +6%                  │
│  Bonus crop: 4%                     │
│  Plots: 4                           │
│  ✓ Tomato Seeds unlocked            │
│  Next: Lv.3 — Farm expands to 6     │
│                                     │
│  🍳 Cooking             Lv. 2      │
│  ███░░░░░░░░░░░░░    38/80 XP      │
│  Buff duration: +5%                 │
│  Buff potency: +3%                  │
│  ✓ Tier 2 recipes unlocked          │
│  Next: Lv.4 — Tier 3 recipes        │
│                                     │
└─────────────────────────────────────┘
```

Each skill section shows:

- Skill icon + name + current level
- XP progress bar with exact numbers
- All active per-level bonuses with current values
- Completed unlocks (green ✓)
- Next upcoming unlock and the level required
- At Lv.10: Gold "MAX LEVEL" badge, all bonuses listed, all unlocks checked

### Skill Level-Up Notification

When a skill levels up, show a celebration banner (similar to combat level-up but themed differently):

```
┌──────────────────────────────────────────┐
│     🎣 Fishing Level 5!                 │
│     Abyssal Depths pool unlocked!        │
└──────────────────────────────────────────┘
```

- Teal/aqua colored banner (to differentiate from gold combat level-up banners)
- Shows the skill icon, new level, and the unlock (if any) at that level
- Holds for 3 seconds with pulse animation
- Stacks below combat level-up banners if both happen simultaneously

---

## 6. Inventory Panel Updates

Add new category tabs to the inventory panel. The tab bar becomes scrollable on mobile if needed:

```
┌──────────────────────────────────────────┐
│  [All] [Materials] [Gear] [Seeds] [Food] │
├──────────────────────────────────────────┤
```

- **Seeds:** Shows all owned seeds with quantities
- **Food:** Shows all cooked consumables with quantities. Each has [Eat] and [Sell] options on tap.
- **Materials:** Existing behavior, now also includes crops alongside mob drops, fish, and ore
- **All:** Shows everything (default view)

---

## 7. Shop Updates (`ShopScene.js`)

The shop now has four tabs:

```
┌──────────────────────────────────────────────────┐
│  [Materials]  [Gear]  [Seeds (BUY)]  [Food]      │
├──────────────────────────────────────────────────┤
```

- **Seeds tab:** This is the only BUY tab (all others are sell-only). Lists all seeds with their cost and level requirement. Buy ×1 and Buy ×5 buttons.
- **Food tab:** Lists cooked food for selling. Each row shows the buff description so the player knows what they're selling.
- **Materials tab:** Now includes crops alongside existing materials.

---

## 8. Runtime Texture Additions (`BootScene.js`)

### Farm tiles (16×16 each):

- `tile_farm_empty`: Dark brown tilled soil with furrow lines
- `tile_farm_planted`: Soil + tiny 2×2 green dot (seedling)
- `tile_farm_growing`: Soil + small sprout (4×6px, green stem + 2 leaf pixels)
- `tile_farm_ready_wheat`: Soil + golden wheat stalks (3 stalks, 8px tall, golden yellow tops)
- `tile_farm_ready_carrot`: Soil + orange carrot top visible (green leaves peeking out, 4px)
- `tile_farm_ready_tomato`: Soil + red circles (2-3 small tomato shapes on a green vine)
- `tile_farm_ready_golden_wheat`: Same as wheat but bright gold with sparkle pixels
- `tile_farm_ready_moonberry`: Soil + purple-blue berry clusters on dark vine
- `tile_farm_ready_starfruit`: Soil + bright yellow star shape on green stem

### Building:

- `tile_kitchen_building`: 16×16, warm stone (#7A6548), large orange-lit window, white chimney smoke, small pot/sign icon

### Item icons (16×16 each):

- 6 seed icons: Small seed shapes in appropriate colors with a small green sprout hint
- 6 crop icons: Matching their "ready" texture but as standalone inventory icons
- 10 cooked food icons: Bowl/plate shapes with colored contents matching the food type
  - **Basic Stew:** Brown bowl with steam lines
  - **Carrot Soup:** Orange bowl with steam
  - **Grilled Fish:** Brown fish shape on plate
  - **Hearty Chowder:** Large bowl, yellow contents, steam
  - **Miner's Meal:** Brown plate with orange/red contents
  - **Golden Bread:** Golden loaf shape
  - **Angler's Feast:** Fancy plate with fish shape, garnish dots
  - **Moonberry Tart:** Purple pie shape with crust edge
  - **Abyssal Broth:** Dark bowl with blue-green steam
  - **Starfruit Elixir:** Yellow potion bottle shape with star

### Skill icons (16×16 each, used in Skills Panel):

- **Fishing skill:** Blue circle with hook line
- **Mining skill:** Gray pickaxe shape
- **Farming skill:** Green plant/wheat shape
- **Cooking skill:** Orange flame under pot

### UI elements:

- `ui_buff_bar_bg`: Thin horizontal bar (same style as activity bars)
- `ui_skill_xp_bar`: Progress bar for skill panel (teal-colored fill to differentiate from combat XP gold)
- `ui_skill_levelup_banner`: Teal/aqua banner background

---

## 9. Economy Balance Notes

### Life Skill Income vs Combat Income

Phase 6 should elevate life skill income to be competitive with combat for dedicated life-skill players:

| Activity | Gold per minute (approximate) |
|----------|------------------------------|
| Hunting (agent, geared) | ~25-35g/min |
| Hunting (player, endgear) | ~35-50g/min |
| Fishing (Abyssal, Lv.7+) | ~18-24g/min |
| Mining (Crystal, Lv.7+) | ~16-22g/min |
| Farming → Selling crops | ~12-18g/min |
| Farming → Cooking → Selling food | ~25-35g/min |
| **Combined life skills** | **~45-60g/min** |

A player running fishing + mining + farming + cooking simultaneously can match or exceed a pure combat player's income. This is intentional — it validates the life-skill playstyle.

### Buff Value for Combat Players

The food buff system gives combat players a strong incentive to engage with life skills:

- A Moonberry Tart (+8 ATK, +5 DEF, +20 Max HP for 120s) is roughly equivalent to equipping an additional Rare-quality accessory. That's a meaningful power boost for boss fights.
- Starfruit Elixir is balanced to be the difference between barely surviving the World Boss and comfortably beating it. This makes it feel essential for endgame combat while requiring deep life-skill investment to produce.

### Crop-to-Cooking Value Chain

Raw crops sell for modest amounts (4-40g). Cooking them into food roughly **doubles their value** — a Moonberry Tart (2 moonberries worth 44g raw) sells for 30g, but its BUFF value far exceeds the sell price. This encourages eating food over selling it, which drives engagement with the buff system.

---

## Phase 6 Success Criteria

1. All four skills (Fishing, Mining, Farming, Cooking) have working XP gain and level progression from 1 to 10
2. Skill level-up shows a distinct teal-colored celebration banner with the unlock revealed
3. The Skills Panel (📊 button) shows all four skills with accurate XP bars, bonuses, completed unlocks, and next unlock preview
4. Fishing and mining pool/node access is now gated by skill level instead of combat level. Existing saves (if any) are unaffected since there's no persistence.
5. Per-level bonuses for fishing and mining are applied correctly — higher skill = faster cycles, better catch rates, double catch/yield chances
6. Auto-collect perk (Lv.7) works for both fishing and mining
7. Master perks (Lv.10) work correctly for all four skills
8. Farm plots exist in town. Starting with 4 plots, expanding to 6 at Farming Lv.3 and 9 at Farming Lv.5
9. Seeds can be purchased from the Shop's new Seeds tab
10. Planting a seed in an empty plot starts a growth timer. The plot visually transitions through planted → growing → ready stages.
11. Growth speed reflects Farming skill bonuses. Ready crops have a subtle bounce animation.
12. Harvesting crops adds them to inventory with correct yields and farming XP. Bonus crop chance works.
13. Harvest All button collects all ready crops at once
14. Kitchen building exists in town. Interacting opens the Cooking Panel.
15. All 10 cooking recipes are visible with correct ingredient checks and tier/level gating
16. Cooking consumes ingredients and produces the correct food item instantly. Cooking XP is granted.
17. Eating food from inventory or after cooking applies a buff. Only one buff active at a time with replacement confirmation.
18. Active buff appears in the BuffBar on the main HUD with countdown timer
19. Combat stat buffs (ATK, DEF, Max HP) from food are reflected in StatCalculator and affect combat damage
20. Skill-specific buffs (Miner's Meal mining speed, Angler's Feast fishing speed) are applied to the respective systems
21. Buff duration scales with Cooking skill level
22. Inventory panel has new category tabs: Seeds, Food
23. All new items (seeds, crops, food) are sellable in the shop
24. A player who focuses entirely on life skills (farming, fishing, cooking, selling) can earn gold at a rate competitive with combat hunting
25. The life-skill loop feels complete and self-reinforcing: grow crops → cook meals → eat for skill buffs → skill faster → grow better crops
