# Phase 7: Living World — Night Cycle, Wandering Merchant & Creature Companions

> **DO NOT BUILD UNTIL PHASE 6 PASSES ALL SUCCESS CRITERIA.** Phase 6 systems (skill leveling, farming, cooking, food buffs) must all be working correctly before implementing anything below.

---

## Phase 7 Overview

This phase makes the world feel alive and dynamic. Three interconnected systems turn the static map into a place with rhythm, surprise, and personal attachment.

**Design philosophy:** The player should feel like the world moves whether they're paying attention or not — and that paying attention is always rewarded. Night changes the rules. A merchant appears and vanishes. A creature follows you loyally. These systems don't add new progression treadmills — they add *texture* to the ones that already exist.

### New Systems

1. **Night Cycle** — A day/night timer that shifts the world visually, spawns nocturnal mobs with exclusive loot, modifies life skill rates, and adds a strategic "when do I do what?" layer.
2. **Wandering Merchant** — A rare NPC who appears in a random zone for 60 seconds selling unique items unavailable anywhere else. Player-only interaction (agent can't buy). Creates urgency in an idle game.
3. **Creature Companion** — A small pet that follows the player and provides a passive perk. Found as rare drops. One active at a time. Gives the player a personal bond separate from agent management.

### How They Interlock

```
Night falls ──→ Nocturnal mobs spawn (exclusive loot includes companion eggs)
           ──→ Crops grow faster (moonlight bonus)
           ──→ Agent gets morale debuff (needs Lantern accessory from Wandering Merchant)
           ──→ Wandering Merchant has higher spawn chance at night

Companion ──→ Fox increases rare loot from nocturnal mobs
          ──→ Owl gives night vision (reduced fog radius)
          ──→ Toad boosts moonlight crop bonus

Merchant  ──→ Sells Lantern (agent night buff)
          ──→ Sells rare seeds not in the shop
          ──→ Sells companion treats (temporary companion buff)
```

### NOT in this phase (Phase 8+):

- ❌ Companion leveling or evolution
- ❌ Companion combat abilities
- ❌ Weather system (rain, wind, etc.)
- ❌ Seasonal events
- ❌ Merchant reputation or loyalty system
- ❌ Multiple active companions
- ❌ Companion breeding

---

## New Files

```
src/
├── config/
│   ├── nightData.js          # Day/night timing, nocturnal mob definitions, night modifiers
│   ├── merchantData.js       # Merchant inventory pool, spawn rules, pricing
│   └── companionData.js      # Companion definitions, perks, acquisition sources
├── systems/
│   ├── DayNightSystem.js     # Cycle timer, world tint, modifier application
│   ├── WanderingMerchant.js  # Spawn logic, movement, despawn timer, inventory
│   └── CompanionSystem.js    # Active companion state, perk application, following AI
├── entities/
│   ├── NocturnalMob.js       # Extends Mob with night-only spawn rules and flee-at-dawn
│   ├── MerchantNPC.js        # Merchant entity with interaction zone and wander path
│   └── Companion.js          # Companion entity that follows player with simple AI
├── ui/
│   ├── DayNightHUD.js        # Sun/moon icon + time-of-day indicator on main HUD
│   ├── MerchantPanel.js      # Merchant shop overlay (buy-only, unique layout)
│   ├── MerchantAlert.js      # "Merchant spotted!" notification with zone indicator
│   ├── CompanionPanel.js     # Companion management (view owned, set active, inspect)
│   └── CompanionHUD.js       # Small active companion icon + perk display on HUD
```

### Modified Existing Files

| File | Changes |
|------|---------|
| `BootScene.js` | Generate textures for moon/sun icons, nocturnal mob sprites (4 new), merchant NPC sprite, 6 companion sprites, night fog overlay, lantern glow effect, companion egg item icons |
| `mapGenerator.js` | No structural changes — nocturnal mobs use existing spawn zones. Merchant uses existing walkable tiles. |
| `constants.js` | Day/night cycle duration, fog opacity values, merchant spawn intervals, companion follow distance |
| `GameScene.js` | Instantiate DayNightSystem, WanderingMerchant, CompanionSystem. Apply night tint to camera. Handle merchant interactions. Update companion position each frame. |
| `HUDScene.js` | Add DayNightHUD (top bar), CompanionHUD (near player stats), MerchantAlert (notification area) |
| `Spawner.js` | Check DayNightSystem state before spawning — nocturnal mobs only at night, some daytime mobs reduced at night |
| `CombatSystem.js` | Apply companion combat perks (Fox rare loot bonus, Wolf damage bonus) to combat results |
| `LootSystem.js` | Nocturnal mob loot tables. Companion egg drop rolls. Night-exclusive material drops. |
| `FishingSystem.js` | Apply night fishing bonus (certain rare fish only catchable at night). Companion perk (Frog) integration. |
| `MiningSystem.js` | Apply night mining modifier. Companion perk (Mole) integration. |
| `FarmingSystem.js` | Apply moonlight growth bonus to active crops during night phase. Companion perk (Toad) integration. |
| `Agent.js` | Add morale state. At night without Lantern: agent hunts 25% slower and avoids Volcanic Rift. With Lantern: normal behavior. |
| `itemData.js` | Add nocturnal loot items, companion eggs, Lantern accessory, companion treats, merchant-exclusive items |
| `gearData.js` | Add Lantern accessory (agent equippable, new item), Moonstone Ring (night combat bonus) |
| `StatCalculator.js` | Factor in companion combat perks alongside gear and food buffs |

---

## 1. Day/Night Cycle

### Timing

```js
// nightData.js
export const DAY_NIGHT_CONFIG = {
  cycleDuration: 300000,      // 5 minutes total cycle
  dayDuration: 180000,        // 3 minutes of day (60% of cycle)
  nightDuration: 120000,      // 2 minutes of night (40% of cycle)
  transitionDuration: 10000,  // 10-second dawn/dusk transition

  // Phases within the cycle (milliseconds from cycle start)
  phases: {
    dawn:      { start: 0,      duration: 10000,  label: 'Dawn' },
    day:       { start: 10000,  duration: 160000, label: 'Day' },
    dusk:      { start: 170000, duration: 10000,  label: 'Dusk' },
    night:     { start: 180000, duration: 110000, label: 'Night' },
    lateDusk:  { start: 290000, duration: 10000,  label: 'Late Night' },
    // Cycle repeats at 300000
  },
};
```

**Why 5 minutes?** It matches the World Boss's 3-minute spawn cycle rhythm. A player experiences roughly 2 full day/night cycles per 10-minute session. Night is shorter than day so it feels urgent — you need to decide quickly what to do with it.

### Visual Changes (`DayNightSystem.js`)

The system applies a tinted overlay to the entire game camera, NOT individual sprites. This is simpler and more performant.

```js
export class DayNightSystem {
  constructor(scene) {
    this.scene = scene;
    this.cycleTime = 0;
    this.currentPhase = 'day';
    this.isNight = false;

    // Full-screen tint overlay (rendered above tilemap, below HUD)
    this.overlay = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width * 2,
      scene.cameras.main.height * 2,
      0x000033, 0  // Deep blue-black, starts fully transparent
    );
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(999); // Above game, below HUD scene

    // Fog particles (night only)
    this.fogParticles = [];
  }

  update(delta) {
    this.cycleTime = (this.cycleTime + delta) % DAY_NIGHT_CONFIG.cycleDuration;
    const prevPhase = this.currentPhase;

    // Determine current phase
    for (const [phase, config] of Object.entries(DAY_NIGHT_CONFIG.phases)) {
      if (this.cycleTime >= config.start &&
          this.cycleTime < config.start + config.duration) {
        this.currentPhase = phase;
        break;
      }
    }

    // Update overlay opacity
    this.updateOverlay();

    // Phase transition events
    if (prevPhase !== this.currentPhase) {
      const wasNight = this.isNight;
      this.isNight = (this.currentPhase === 'night' || this.currentPhase === 'lateDusk');

      if (this.isNight && !wasNight) {
        this.scene.events.emit('nightFall');
        this.spawnFog();
      } else if (!this.isNight && wasNight) {
        this.scene.events.emit('dawnBreak');
        this.clearFog();
      }

      this.scene.events.emit('phaseChanged', {
        phase: this.currentPhase,
        isNight: this.isNight,
      });
    }
  }

  updateOverlay() {
    let targetAlpha = 0;

    switch (this.currentPhase) {
      case 'dawn':
        // Fade from dark to light
        const dawnProgress = (this.cycleTime - 0) / 10000;
        targetAlpha = 0.45 * (1 - dawnProgress);
        break;
      case 'day':
        targetAlpha = 0; // No overlay during day
        break;
      case 'dusk':
        // Fade from light to dark
        const duskProgress = (this.cycleTime - 170000) / 10000;
        targetAlpha = 0.45 * duskProgress;
        break;
      case 'night':
      case 'lateDusk':
        targetAlpha = 0.45; // Dark overlay at night
        break;
    }

    this.overlay.setAlpha(targetAlpha);
  }

  spawnFog() {
    // Create drifting fog particles (white/gray, low opacity, slow movement)
    // 15-20 particles that drift horizontally across the visible area
    // Each is a small (8x4px) semi-transparent white rectangle
    for (let i = 0; i < 18; i++) {
      const fog = this.scene.add.rectangle(
        Phaser.Math.Between(-100, this.scene.cameras.main.width + 100),
        Phaser.Math.Between(0, this.scene.cameras.main.height),
        Phaser.Math.Between(40, 80),
        Phaser.Math.Between(8, 16),
        0xCCCCCC,
        Phaser.Math.FloatBetween(0.05, 0.15)
      );
      fog.setScrollFactor(Phaser.Math.FloatBetween(0.1, 0.3)); // Parallax drift
      fog.setDepth(998);
      fog.speedX = Phaser.Math.FloatBetween(0.2, 0.6);
      this.fogParticles.push(fog);
    }
  }

  clearFog() {
    // Fade out and destroy fog over 3 seconds
    for (const fog of this.fogParticles) {
      this.scene.tweens.add({
        targets: fog,
        alpha: 0,
        duration: 3000,
        onComplete: () => fog.destroy(),
      });
    }
    this.fogParticles = [];
  }

  // Helper for other systems to check state
  getTimeOfDay() {
    return {
      phase: this.currentPhase,
      isNight: this.isNight,
      cycleProgress: this.cycleTime / DAY_NIGHT_CONFIG.cycleDuration,
      timeUntilToggle: this.isNight
        ? DAY_NIGHT_CONFIG.cycleDuration - this.cycleTime  // Time until dawn
        : DAY_NIGHT_CONFIG.phases.dusk.start - this.cycleTime, // Time until dusk
    };
  }
}
```

### Zone-Specific Night Visuals

Each zone tints slightly differently at night:

| Zone | Day Tint | Night Tint Modifier | Night Feel |
|------|----------|-------------------|------------|
| Town | None | Warm orange glow near buildings (lantern circles) | Cozy, safe haven |
| Forest | None | Deep blue-green, dense fog | Eerie, things moving in shadows |
| Caves | Already dark | Slightly MORE purple, crystal nodes glow brighter | Crystals are the only light |
| Swamp | None | Sickly green-black, toxic fog wisps | Genuinely threatening |
| Volcanic Rift | None | Lava glow intensifies, sky turns blood-red | Dramatic, hellish |

Town lantern glow is achieved by placing 3-4 small additive-blend circles (0xDAA520, alpha 0.15, radius ~48px) around building positions during night phase. These fade in at dusk and out at dawn.

### Nocturnal Mobs (`nightData.js`)

Four new mob types that ONLY spawn during night phase. They despawn (fade out over 2 seconds) at dawn if still alive.

```js
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
    behavior: 'wander_fast',  // Faster wander speed than daytime mobs, erratic pathing
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
    ],
    behavior: 'ambush',  // Sits still until player is within 3 tiles, then charges
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
    behavior: 'wander_slow',  // Slow but very tanky — a defensive fight
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
    ],
    behavior: 'aggressive',  // Actively seeks player within 5-tile range
    description: 'A spirit of fire and shadow. The most dangerous nocturnal creature.',
  },
};
```

### Nocturnal Loot Items (add to `itemData.js`)

| Item | Icon | Sell Value | Category | Use |
|------|------|-----------|----------|-----|
| Shadow Essence | 🌑 | 6g | material | Crafting ingredient (future recipes), sellable |
| Wisp Core | 💠 | 14g | material | Crafting ingredient for Moonstone Ring |
| Stalker Fang | 🦷 | 12g | material | Crafting ingredient for Shadow Blade |
| Midnight Dew | 💧 | 8g | material | Cooking ingredient (night-exclusive recipes below) |
| Moonshell Fragment | 🐚 | 10g | material | Crafting ingredient for Moonstone Ring |
| Luminous Chitin | ✨ | 16g | material | Crafting ingredient for Lantern |
| Wraith Ember | 🔥 | 18g | material | Crafting ingredient for Shadow Blade |
| Infernal Dust | 💨 | 14g | material | Crafting ingredient |
| Companion Egg (×4 types) | 🥚 | N/A | companion_egg | Cannot be sold. Used to hatch companion. |

### Night-Exclusive Crafting Recipes (add to `recipeData.js`)

| Recipe | Ingredients | Output | Notes |
|--------|------------|--------|-------|
| Moonstone Ring | 2× Moonshell Fragment, 1× Wisp Core, 2× Gemstone Shard | Moonstone Ring (accessory) | +5 ATK, +5 DEF at night only. Stacks with normal gear. |
| Shadow Blade | 2× Stalker Fang, 1× Wraith Ember, 3× Iron Ore | Shadow Blade (weapon) | High ATK, bonus crit-equivalent (+15% damage) at night |
| Lantern | 2× Luminous Chitin, 1× Wisp Core, 1× Forge Ember | Lantern (agent accessory) | Equip on agent to remove night morale debuff |

### Night-Exclusive Cooking Recipes (add to `cookingData.js`)

| Recipe | Tier | Required Level | Ingredients | Buff |
|--------|------|---------------|-------------|------|
| Midnight Broth | 3 | Cooking Lv.4 | 2× Midnight Dew, 1× Carrot, 1× Wheat | +20% night mob XP, +5 ATK for 120s |
| Shadow Stew | 4 | Cooking Lv.6 | 1× Shadow Essence, 2× Tomato, 1× Moonberry | +8 ATK, +8 DEF for 90s (only works at night — double the normal value for those stats) |

### Night Modifiers to Existing Systems

| System | Night Effect |
|--------|-------------|
| Farming | Crops grow **15% faster** at night (moonlight bonus). Stacks with skill bonuses. |
| Fishing | **Night Fish** pool available — contains 2 exclusive catches: Moonfish (15g sell, +6 Fishing XP) and Shadowfin (25g sell, +8 Fishing XP, used in Shadow Stew recipe). Requires Fishing Lv.4. |
| Mining | Crystal nodes glow **brighter** at night (visual only). No mechanical change — mining is underground, night doesn't matter thematically. |
| Agent | Without Lantern accessory: agent attack speed -25%, avoids Volcanic Rift zone, returns to town if HP < 40% (instead of 25%). With Lantern: normal behavior. |
| Mob spawns | Daytime mob count reduced by 30% at night. Nocturnal mobs fill the gap with better loot. Net mob density stays similar. |
| World Boss | No change — the Infernal Guardian doesn't care about day or night. |

### Day/Night HUD (`DayNightHUD.js`)

A small indicator in the top HUD bar showing current time of day.

```
Day:    ☀ Day          (golden text, sun icon)
Dusk:   🌅 Dusk         (orange text, fades to purple)
Night:  🌙 Night 1:42   (blue-silver text, moon icon, countdown to dawn)
Dawn:   🌅 Dawn         (warm gold text, fades in)
```

- **Night countdown** shows time until dawn in `M:SS` — creates urgency for night activities
- Dusk phase shows a 10-second warning: `🌅 Night in 0:08` with pulsing text
- Positioned at the right end of the top HUD bar, after zone name

---

## 2. Wandering Merchant

### Spawn Rules (`merchantData.js`)

```js
export const MERCHANT_CONFIG = {
  // Spawn timing
  spawnInterval: {
    min: 180000,    // Minimum 3 minutes between appearances
    max: 360000,    // Maximum 6 minutes between appearances
  },
  stayDuration: 60000,  // Stays for 60 seconds
  despawnWarning: 15000, // "Merchant leaving soon!" at 15 seconds remaining

  // Spawn zones (weighted — merchant prefers town-adjacent zones)
  spawnZones: [
    { zone: 'town',     weight: 10 },
    { zone: 'forest',   weight: 30 },
    { zone: 'caves',    weight: 20 },
    { zone: 'swamp',    weight: 25 },
    { zone: 'volcanic', weight: 15 },
  ],

  // Night bonus: merchant spawn chance checked every 60s during night
  // During day, checked every 120s
  nightSpawnMultiplier: 1.5,  // 50% more likely to appear at night

  // Visual
  textureKey: 'npc_merchant',
  nameColor: '#DAA520',  // Gold text for the merchant's name
  speechBubble: true,     // Shows a small "..." bubble when idle
};
```

### Merchant Entity (`MerchantNPC.js`)

- Spawns at a random walkable tile within the chosen zone
- **Wanders slowly** in a small area (3-tile radius from spawn point) — does NOT stand still
- Has a **golden name tag** floating above: "Wandering Merchant"
- **Interaction radius:** 2 tiles (larger than normal buildings — easier to catch on mobile)
- When the player enters interaction radius, action button shows 🛒
- Agent **cannot** interact with the merchant. This is intentional — it rewards active play.

### Merchant Arrival Notification (`MerchantAlert.js`)

When the merchant spawns:

```
┌─────────────────────────────────────────────┐
│  🛒 A Wandering Merchant has appeared!      │
│     Spotted in the Forest  ·  0:58          │
└─────────────────────────────────────────────┘
```

- Gold-bordered notification banner, holds for 5 seconds then shrinks to a persistent mini-bar
- Mini-bar stays until merchant despawns: `🛒 Forest 0:42`
- Countdown in real-time
- At 15 seconds remaining: mini-bar text turns red and pulses: `🛒 Forest 0:12 — Leaving soon!`
- When merchant despawns: brief toast `"The merchant has departed."` and mini-bar fades

### Merchant Inventory System

The merchant does NOT have a fixed inventory. Each spawn, they roll **4-6 items** from a weighted pool. This means every visit is different — you never know what they'll have.

```js
export const MERCHANT_INVENTORY_POOL = {
  // ── ALWAYS IN STOCK (1 guaranteed per visit) ──
  guaranteed: [
    {
      id: 'merchant_mystery_seed',
      name: 'Mystery Seed',
      icon: '🌱',
      cost: 30,
      description: 'Plant it and see what grows. Could be any crop, including rare ones.',
      category: 'seed',
      maxQuantity: 3,  // Max 3 per visit
    },
  ],

  // ── ROTATING STOCK (3-5 rolled from this pool) ──
  rotating: [
    // Rare seeds (not in normal shop)
    {
      id: 'ember_pepper_seed',
      name: 'Ember Pepper Seed',
      icon: '🌶️',
      cost: 45,
      weight: 15,
      description: 'A volcanic crop. Grows in 60s. Used in fire-themed cooking recipes.',
      category: 'seed',
      maxQuantity: 5,
    },
    {
      id: 'frost_lily_seed',
      name: 'Frost Lily Seed',
      icon: '❄️',
      cost: 50,
      weight: 12,
      description: 'A delicate cave flower. Grows in 90s. Cooking ingredient for powerful frost buffs.',
      category: 'seed',
      maxQuantity: 3,
    },

    // Companion treats (temporary companion buff)
    {
      id: 'golden_treat',
      name: 'Golden Treat',
      icon: '🦴',
      cost: 40,
      weight: 20,
      description: 'Feed to your companion. Doubles their perk effect for 3 minutes.',
      category: 'companion',
      maxQuantity: 2,
    },

    // Unique consumables
    {
      id: 'merchants_tonic',
      name: "Merchant's Tonic",
      icon: '🧴',
      cost: 35,
      weight: 25,
      description: '+50% sell value on all items for 2 minutes.',
      category: 'food',
      maxQuantity: 2,
      buff: {
        id: 'merchants_tonic',
        name: "Merchant's Tonic",
        stats: {},
        skillEffects: { sellValueBonus: 0.50 },
        duration: 120000,
      },
    },
    {
      id: 'wanderers_brew',
      name: "Wanderer's Brew",
      icon: '🍶',
      cost: 50,
      weight: 15,
      description: '+20% movement speed for 3 minutes.',
      category: 'food',
      maxQuantity: 1,
      buff: {
        id: 'wanderers_brew',
        name: "Wanderer's Brew",
        stats: {},
        skillEffects: { moveSpeedBonus: 0.20 },
        duration: 180000,
      },
    },
    {
      id: 'scouts_map',
      name: "Scout's Map",
      icon: '🗺️',
      cost: 60,
      weight: 10,
      description: 'Reveals all mob positions on the minimap for 2 minutes.',
      category: 'consumable',
      maxQuantity: 1,
    },

    // Agent items
    {
      id: 'agent_lantern',
      name: 'Lantern',
      icon: '🏮',
      cost: 75,
      weight: 8,
      description: 'Equip on agent to remove night morale debuff. Permanent until unequipped.',
      category: 'gear',
      slot: 'accessory',
      maxQuantity: 1,
      stats: { atk: 0, def: 2 },
      rarity: 'uncommon',
      perk: 'night_vision',  // Special flag checked by Agent.js
    },
    {
      id: 'agent_morale_scroll',
      name: 'Morale Scroll',
      icon: '📜',
      cost: 25,
      weight: 20,
      description: 'Removes agent night debuff for 5 minutes. Consumed on use.',
      category: 'consumable',
      maxQuantity: 3,
    },

    // Crafting materials (rare)
    {
      id: 'stardust',
      name: 'Stardust',
      icon: '✨',
      cost: 100,
      weight: 5,
      description: 'Guarantees a rarity upgrade when used in gear enhancement. Very rare.',
      category: 'material',
      maxQuantity: 1,
    },

    // Exclusive food (pre-cooked, no recipe needed)
    {
      id: 'exotic_feast',
      name: 'Exotic Feast',
      icon: '🍱',
      cost: 80,
      weight: 8,
      description: '+10 ATK, +10 DEF, +25 Max HP for 180s. A meal from distant lands.',
      category: 'food',
      maxQuantity: 1,
      buff: {
        id: 'exotic_feast',
        name: 'Exotic Feast',
        stats: { atk: 10, def: 10, maxHp: 25 },
        skillEffects: {},
        duration: 180000,
      },
    },
  ],
};
```

### Merchant Exclusive Crops (add to `farmData.js`)

```js
// Mystery Seed — when planted, randomly selects any crop (including rare ones)
mystery_seed: {
  id: 'mystery_seed',
  name: 'Mystery Seed',
  icon: '🌱',
  textureKey: 'seed_mystery',
  cost: 30,  // Only from merchant
  requiredFarmingLevel: 1,
  growthTime: 45000,
  crop: 'mystery',  // Resolved at harvest time — random from all crops
  cropYield: { min: 1, max: 3 },
  shopAvailable: false,  // Not in normal shop
},

// Ember Pepper
ember_pepper_seed: {
  id: 'ember_pepper_seed',
  name: 'Ember Pepper Seed',
  icon: '🌶️',
  textureKey: 'seed_ember_pepper',
  cost: 45,
  requiredFarmingLevel: 3,
  growthTime: 60000,
  crop: 'ember_pepper',
  cropYield: { min: 1, max: 2 },
  shopAvailable: false,
},

// Frost Lily
frost_lily_seed: {
  id: 'frost_lily_seed',
  name: 'Frost Lily Seed',
  icon: '❄️',
  textureKey: 'seed_frost_lily',
  cost: 50,
  requiredFarmingLevel: 4,
  growthTime: 90000,
  crop: 'frost_lily',
  cropYield: { min: 1, max: 1 },
  shopAvailable: false,
},
```

| Crop | Sell Value | Cooking Use |
|------|-----------|-------------|
| Ember Pepper | 28g | Ingredient for Inferno Stew (+15 ATK, +0 DEF for 90s — glass cannon buff) |
| Frost Lily | 35g | Ingredient for Frostguard Soup (+0 ATK, +15 DEF for 90s — pure tank buff) |

These merchant-exclusive crops create recipes that offer extreme specialization — pure ATK or pure DEF — that you can't get from normal cooking. Gives the merchant visits lasting value beyond the 60-second window.

### Merchant Panel (`MerchantPanel.js`)

```
┌─────────────────────────────────────┐
│  ✕         🛒 Wandering Merchant    │
│            Departing in 0:42        │
├─────────────────────────────────────┤
│                                     │
│  "Rare goods from distant lands..." │
│                                     │
│  🌱 Mystery Seed ×3        30g     │
│     Plant for a random crop         │
│                        [Buy ×1]     │
│                                     │
│  🌶️ Ember Pepper Seed ×5   45g     │
│     Volcanic crop for cooking       │
│                        [Buy ×1]     │
│                                     │
│  🦴 Golden Treat ×2        40g     │
│     Doubles companion perk (3m)     │
│                        [Buy ×1]     │
│                                     │
│  🍱 Exotic Feast ×1        80g     │
│     +10 ATK/DEF, +25 HP (180s)     │
│                        [Buy ×1]     │
│                                     │
│  🏮 Lantern ×1             75g     │
│     Agent night morale fix          │
│                        [Buy ×1]     │
│                                     │
│  ── Your Gold: 342g ──             │
└─────────────────────────────────────┘
```

- Countdown timer at top turns red and pulses under 15 seconds
- Items show remaining stock (×3, ×2, etc.) — once bought, count decreases
- Sold-out items show "SOLD OUT" in gray
- Panel auto-closes when merchant despawns (with toast: "The merchant has departed")
- Buy buttons are large (44×44pt minimum) for easy thumb tapping

### `WanderingMerchant.js`

```js
export class WanderingMerchant {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.entity = null;
    this.inventory = [];
    this.spawnTimer = null;
    this.despawnTimer = null;
    this.nextSpawnTime = this.rollNextSpawn();

    this.scheduleNextSpawn();
  }

  rollNextSpawn() {
    const { min, max } = MERCHANT_CONFIG.spawnInterval;
    return Phaser.Math.Between(min, max);
  }

  scheduleNextSpawn() {
    this.spawnTimer = this.scene.time.delayedCall(this.nextSpawnTime, () => {
      this.spawn();
    });
  }

  spawn() {
    if (this.isActive) return;

    // Pick zone (weighted random)
    const zone = this.pickSpawnZone();
    const position = this.getRandomWalkableTile(zone);

    // Roll inventory
    this.inventory = this.rollInventory();

    // Create entity
    this.entity = new MerchantNPC(this.scene, position.x, position.y);
    this.isActive = true;

    // Notify
    this.scene.events.emit('merchantSpawned', {
      zone: zone,
      position: position,
      stayDuration: MERCHANT_CONFIG.stayDuration,
    });

    // Schedule warning
    this.scene.time.delayedCall(
      MERCHANT_CONFIG.stayDuration - MERCHANT_CONFIG.despawnWarning,
      () => {
        this.scene.events.emit('merchantLeavingSoon', {
          timeRemaining: MERCHANT_CONFIG.despawnWarning,
        });
      }
    );

    // Schedule despawn
    this.despawnTimer = this.scene.time.delayedCall(
      MERCHANT_CONFIG.stayDuration,
      () => { this.despawn(); }
    );
  }

  despawn() {
    if (!this.isActive) return;

    // Fade out entity
    this.scene.tweens.add({
      targets: this.entity,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        this.entity.destroy();
        this.entity = null;
      },
    });

    this.isActive = false;
    this.inventory = [];
    this.scene.events.emit('merchantDespawned');

    // Schedule next appearance
    this.nextSpawnTime = this.rollNextSpawn();
    this.scheduleNextSpawn();
  }

  rollInventory() {
    const items = [];

    // Add guaranteed items
    for (const item of MERCHANT_INVENTORY_POOL.guaranteed) {
      items.push({ ...item, remaining: item.maxQuantity });
    }

    // Roll 3-5 rotating items (no duplicates)
    const count = Phaser.Math.Between(3, 5);
    const pool = [...MERCHANT_INVENTORY_POOL.rotating];
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

    for (let i = 0; i < count && pool.length > 0; i++) {
      let roll = Math.random() * totalWeight;
      for (let j = 0; j < pool.length; j++) {
        roll -= pool[j].weight;
        if (roll <= 0) {
          items.push({ ...pool[j], remaining: pool[j].maxQuantity });
          pool.splice(j, 1);
          break;
        }
      }
    }

    return items;
  }

  buyItem(itemIndex, gameState) {
    const item = this.inventory[itemIndex];
    if (!item || item.remaining <= 0) return { success: false, reason: 'Sold out' };
    if (gameState.gold < item.cost) return { success: false, reason: 'Not enough gold' };

    gameState.gold -= item.cost;
    item.remaining -= 1;

    // Add item to appropriate inventory location
    addItemToInventory(gameState, item);

    this.scene.events.emit('merchantPurchase', {
      item: item,
      goldSpent: item.cost,
      remainingStock: item.remaining,
    });

    return { success: true };
  }
}
```

---

## 3. Creature Companions

### Companion Definitions (`companionData.js`)

Six companions, each found in a different way and providing a distinct passive perk:

```js
export const COMPANIONS = {
  fox: {
    id: 'fox',
    name: 'Shadow Fox',
    icon: '🦊',
    textureKey: 'companion_fox',
    description: 'A sleek fox drawn to valuable loot.',
    perk: {
      id: 'lucky_hunter',
      name: 'Lucky Hunter',
      description: '+15% rare loot drop chance from all mobs.',
      effect: { rareLootBonus: 0.15 },
    },
    acquisition: {
      source: 'nocturnal_mob_drop',
      mob: 'ember_wraith',
      dropRate: 0.02,  // 2% per kill
      egg: 'companion_egg_fox',
    },
    followDistance: 1.5,  // Tiles behind player
    idleAnimation: 'sit',  // Sits when player is idle for 3+ seconds
    moveSpeed: 1.1,  // Slightly faster than player to keep up
    size: { w: 12, h: 10 }, // Sprite dimensions within 16x16 texture
  },

  owl: {
    id: 'owl',
    name: 'Moon Owl',
    icon: '🦉',
    textureKey: 'companion_owl',
    description: 'A silent owl that sees through the night.',
    perk: {
      id: 'night_sight',
      name: 'Night Sight',
      description: 'Night fog opacity reduced by 40%. Night mob positions visible on approach.',
      effect: { nightFogReduction: 0.40, nightMobRevealRange: 5 },
    },
    acquisition: {
      source: 'nocturnal_mob_drop',
      mob: 'shadow_wisp',
      dropRate: 0.02,
      egg: 'companion_egg_owl',
    },
    followDistance: 0,  // Flies overhead (rendered above player)
    idleAnimation: 'perch',  // Perches on player's shoulder when idle
    moveSpeed: 1.3,
    size: { w: 10, h: 10 },
  },

  frog: {
    id: 'frog',
    name: 'Tidecaller Frog',
    icon: '🐸',
    textureKey: 'companion_frog',
    description: 'A plump frog that brings luck to anglers.',
    perk: {
      id: 'anglers_luck',
      name: "Angler's Luck",
      description: '+20% fishing catch chance. +10% double catch chance.',
      effect: { fishingCatchBonus: 0.20, fishingDoubleBonus: 0.10 },
    },
    acquisition: {
      source: 'fishing_rare_catch',
      pool: 'abyssal',
      catchRate: 0.03,  // 3% chance on any Abyssal catch
      egg: 'companion_egg_frog',
    },
    followDistance: 1.2,
    idleAnimation: 'hop',  // Small hops every few seconds when idle
    moveSpeed: 0.9,
    size: { w: 10, h: 8 },
  },

  mole: {
    id: 'mole',
    name: 'Gemclaw Mole',
    icon: '🐹',
    textureKey: 'companion_mole',
    description: 'A burrowing mole with a nose for precious ores.',
    perk: {
      id: 'ore_sense',
      name: 'Ore Sense',
      description: '+25% mining extract chance. Depleted nodes respawn 20% faster.',
      effect: { miningExtractBonus: 0.25, nodeRespawnBonus: 0.20 },
    },
    acquisition: {
      source: 'nocturnal_mob_drop',
      mob: 'moon_beetle',
      dropRate: 0.02,
      egg: 'companion_egg_mole',
    },
    followDistance: 1.0,
    idleAnimation: 'dig',  // Small digging motion when idle
    moveSpeed: 0.8,
    size: { w: 10, h: 8 },
  },

  wolf: {
    id: 'wolf',
    name: 'Dusk Wolf',
    icon: '🐺',
    textureKey: 'companion_wolf',
    description: 'A fierce wolf that fights alongside you in spirit.',
    perk: {
      id: 'pack_hunter',
      name: 'Pack Hunter',
      description: '+10% damage dealt. -5% damage taken.',
      effect: { damageBonus: 0.10, damageReduction: 0.05 },
    },
    acquisition: {
      source: 'nocturnal_mob_drop',
      mob: 'night_stalker',
      dropRate: 0.02,
      egg: 'companion_egg_wolf',
    },
    followDistance: 1.8,
    idleAnimation: 'sit_alert',  // Sits but ears perked, watching surroundings
    moveSpeed: 1.2,
    size: { w: 14, h: 12 },
  },

  toad: {
    id: 'toad',
    name: 'Grove Toad',
    icon: '🐊',  // Using croc as closest — would be custom sprite
    textureKey: 'companion_toad',
    description: 'A plump toad that makes gardens flourish.',
    perk: {
      id: 'green_thumb',
      name: 'Green Thumb',
      description: '+20% crop growth speed. +15% bonus crop harvest chance.',
      effect: { farmGrowthBonus: 0.20, farmBonusCropBonus: 0.15 },
    },
    acquisition: {
      source: 'farming_rare_harvest',
      crop: 'moonberry',
      harvestRate: 0.04,  // 4% chance when harvesting moonberry
      egg: 'companion_egg_toad',
    },
    followDistance: 1.0,
    idleAnimation: 'croak',  // Puffs up throat every few seconds
    moveSpeed: 0.7,
    size: { w: 10, h: 8 },
  },
};
```

### Acquisition — Companion Eggs

Companions are NOT directly obtained. Instead, the player gets a **Companion Egg** as a rare drop. Eggs are items in the inventory that can be "hatched" by interacting with a new **Nest** object in town (a small 1×1 tile near the player's home).

```js
export const EGG_HATCH_CONFIG = {
  hatchDuration: 60000,  // 60 seconds to hatch
  nestPosition: { tileX: 12, tileY: 35 },  // In town, near home
  textureKey: 'tile_companion_nest',
  maxEggsAtOnce: 1,  // Only 1 egg incubating at a time
};
```

**Hatching flow:**
1. Player finds a Companion Egg (rare drop notification with unique sound/animation)
2. Player walks to the Nest in town
3. Places the egg → 60-second hatch timer starts (shown on the Nest tile as a progress indicator)
4. When done, the companion is added to the player's companion roster
5. Player can then set it as active from the Companion Panel

This adds anticipation — finding the egg is exciting, but there's a small ritual to actually getting the companion. The 60-second timer matches the game's idle-friendly philosophy.

### `CompanionSystem.js`

```js
export class CompanionSystem {
  constructor(scene) {
    this.scene = scene;
    this.ownedCompanions = [];  // Array of companion IDs the player has obtained
    this.activeCompanion = null;  // Currently following companion (Companion entity or null)
    this.activeCompanionId = null;
    this.incubatingEgg = null;  // { eggId, companionId, startedAt, duration }
  }

  hatchEgg(eggItemId, gameState) {
    if (this.incubatingEgg) return { success: false, reason: 'Nest is occupied' };

    // Find which companion this egg produces
    const companionId = this.getCompanionFromEgg(eggItemId);
    if (!companionId) return { success: false, reason: 'Unknown egg' };

    // Check if already owned
    if (this.ownedCompanions.includes(companionId)) {
      return { success: false, reason: 'You already have this companion' };
    }

    // Remove egg from inventory
    removeFromMaterials(gameState.materials, eggItemId, 1);

    this.incubatingEgg = {
      eggId: eggItemId,
      companionId: companionId,
      startedAt: Date.now(),
      duration: EGG_HATCH_CONFIG.hatchDuration,
    };

    // Schedule hatch
    this.scene.time.delayedCall(EGG_HATCH_CONFIG.hatchDuration, () => {
      this.completeHatch();
    });

    this.scene.events.emit('eggPlaced', { companionId, duration: EGG_HATCH_CONFIG.hatchDuration });
    return { success: true };
  }

  completeHatch() {
    if (!this.incubatingEgg) return;

    const companionId = this.incubatingEgg.companionId;
    this.ownedCompanions.push(companionId);
    this.incubatingEgg = null;

    const def = COMPANIONS[companionId];
    this.scene.events.emit('companionHatched', {
      companion: def,
    });

    // Auto-set as active if no companion is active
    if (!this.activeCompanionId) {
      this.setActive(companionId);
    }
  }

  setActive(companionId) {
    if (!this.ownedCompanions.includes(companionId)) return;

    // Remove current companion entity
    if (this.activeCompanion) {
      this.activeCompanion.destroy();
      this.activeCompanion = null;
    }

    this.activeCompanionId = companionId;
    const def = COMPANIONS[companionId];

    // Create companion entity that follows the player
    const player = this.scene.player;
    this.activeCompanion = new Companion(
      this.scene,
      player.x,
      player.y,
      def
    );

    this.scene.events.emit('companionActivated', { companion: def });
  }

  dismiss() {
    if (this.activeCompanion) {
      this.activeCompanion.destroy();
      this.activeCompanion = null;
    }
    this.activeCompanionId = null;
    this.scene.events.emit('companionDismissed');
  }

  // Called every frame from GameScene.update()
  update(delta) {
    if (this.activeCompanion) {
      this.activeCompanion.follow(this.scene.player, delta);
    }
  }

  // Get the active perk effect values (used by other systems)
  getPerkEffect(effectKey) {
    if (!this.activeCompanionId) return 0;
    const def = COMPANIONS[this.activeCompanionId];
    return def.perk.effect[effectKey] || 0;
  }

  hasPerk(perkId) {
    if (!this.activeCompanionId) return false;
    return COMPANIONS[this.activeCompanionId].perk.id === perkId;
  }

  applyTreat(gameState) {
    if (!this.activeCompanionId) return { success: false, reason: 'No active companion' };
    const owned = getOwnedQuantity(gameState.materials, 'golden_treat');
    if (owned < 1) return { success: false, reason: 'No Golden Treats' };

    removeFromMaterials(gameState.materials, 'golden_treat', 1);

    // Double perk effect for 3 minutes
    this.treatActive = true;
    this.treatExpiresAt = Date.now() + 180000;

    this.scene.time.delayedCall(180000, () => {
      this.treatActive = false;
      this.scene.events.emit('companionTreatExpired');
    });

    this.scene.events.emit('companionTreatUsed', {
      companion: COMPANIONS[this.activeCompanionId],
      duration: 180000,
    });
    return { success: true };
  }

  // Modified getPerkEffect that accounts for treat buff
  getEffectivePerkValue(effectKey) {
    let base = this.getPerkEffect(effectKey);
    if (this.treatActive) base *= 2;
    return base;
  }
}
```

### Companion Entity (`Companion.js`)

```js
export class Companion extends Phaser.GameObjects.Container {
  constructor(scene, x, y, definition) {
    super(scene, x, y);
    this.def = definition;
    this.followTarget = null;
    this.idleTime = 0;
    this.isIdle = false;

    // Sprite
    this.sprite = scene.add.sprite(0, 0, definition.textureKey);
    this.add(this.sprite);

    // Name tag (tiny, only shows on tap)
    this.nameTag = scene.add.text(0, -12, definition.name, {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.nameTag.setAlpha(0);
    this.add(this.nameTag);

    this.setDepth(50); // Above ground, below player
    scene.add.existing(this);
  }

  follow(player, delta) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const followDist = this.def.followDistance * 16; // Convert tiles to pixels

    if (dist > followDist + 4) {
      // Move toward player
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.def.moveSpeed * 60; // Pixels per second base
      this.x += Math.cos(angle) * speed * (delta / 1000);
      this.y += Math.sin(angle) * speed * (delta / 1000);
      this.idleTime = 0;
      this.isIdle = false;
    } else if (dist > followDist) {
      // In follow zone — slow approach
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.def.moveSpeed * 20;
      this.x += Math.cos(angle) * speed * (delta / 1000);
      this.y += Math.sin(angle) * speed * (delta / 1000);
      this.idleTime = 0;
    } else {
      // Close enough — idle behavior
      this.idleTime += delta;
      if (this.idleTime > 3000 && !this.isIdle) {
        this.isIdle = true;
        this.playIdleAnimation();
      }
    }

    // Teleport if too far (player used tap-to-move across the map)
    if (dist > 8 * 16) {
      this.x = player.x - followDist;
      this.y = player.y;
    }

    // Face direction of movement
    if (player.x < this.x) this.sprite.setFlipX(true);
    else if (player.x > this.x) this.sprite.setFlipX(false);
  }

  playIdleAnimation() {
    switch (this.def.idleAnimation) {
      case 'sit':
        // Small scale-down to suggest sitting
        this.scene.tweens.add({
          targets: this.sprite, scaleY: 0.85, duration: 300, yoyo: false,
        });
        break;
      case 'hop':
        // Periodic small hop
        this.hopLoop = this.scene.time.addEvent({
          delay: 2500,
          loop: true,
          callback: () => {
            this.scene.tweens.add({
              targets: this, y: this.y - 4, duration: 200,
              yoyo: true, ease: 'Quad.easeOut',
            });
          },
        });
        break;
      case 'perch':
        // Move to directly above player (owl on shoulder)
        break;
      // ... other idle types
    }
  }

  showName() {
    this.scene.tweens.add({
      targets: this.nameTag, alpha: 1, duration: 200,
      hold: 2000, yoyo: true,
    });
  }
}
```

### Companion Panel (`CompanionPanel.js`)

Accessed from a new 🐾 button in the HUD (bottom button cluster), or by tapping the companion in the world.

```
┌─────────────────────────────────────┐
│  ✕                  🐾 Companions   │
├─────────────────────────────────────┤
│                                     │
│  ── Active ──                       │
│  ┌─────────────────────────────────┐│
│  │ 🦊 Shadow Fox         [Dismiss]││
│  │ Lucky Hunter                    ││
│  │ +15% rare loot from all mobs   ││
│  │ 🦴 Golden Treat active (2:14)  ││
│  │         [Feed Treat (×1)]       ││
│  └─────────────────────────────────┘│
│                                     │
│  ── Owned ──                        │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ 🦊   │  │ 🦉   │  │ 🐸   │     │
│  │Active│  │      │  │      │     │
│  └──────┘  └──────┘  └──────┘     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ 🔒   │  │ 🔒   │  │ 🔒   │     │
│  │ ???  │  │ ???  │  │ ???  │     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  ── Nest ──                         │
│  🥚 Fox Egg incubating... 0:34     │
│  ██████████████░░░░░░░             │
│                                     │
│  Tap an owned companion to set      │
│  it as your active companion.       │
│                                     │
└─────────────────────────────────────┘
```

- **Active section:** Shows current companion with perk details and treat status
- **Owned grid:** Shows all 6 slots. Owned companions are tappable (tap to set active). Unowned show locked with "???"
- **Nest section:** Shows incubation progress if an egg is hatching
- Tapping an owned companion shows a confirmation: "Set Shadow Fox as active companion?"
- The Dismiss button removes the active companion (no companion following). Useful if the player wants a clean screen.

### Companion HUD (`CompanionHUD.js`)

Small persistent display near player stats:

```
🦊 Lucky Hunter
```

- Just the icon and perk name — minimal space usage
- If a treat is active, adds a small golden sparkle animation around the icon
- Tapping the HUD element opens the Companion Panel
- When no companion is active: hidden (takes no space)

### Companion Hatched Notification

When an egg finishes hatching:

```
┌──────────────────────────────────────────┐
│     🥚 → 🦊 Shadow Fox hatched!         │
│     Perk: +15% rare loot                 │
└──────────────────────────────────────────┘
```

- Green-gold banner, distinct from skill level-up (teal) and combat level-up (gold)
- Holds for 4 seconds with a pulse + scale animation
- Egg-crack visual effect: small white pixel particles burst outward

### Integrating Companion Perks into Existing Systems

**CombatSystem.js / LootSystem.js:**
```js
// Fox — rare loot bonus
const foxBonus = scene.companionSystem.getEffectivePerkValue('rareLootBonus');
// Apply to rare item weights in loot roll

// Wolf — damage bonus
const wolfDmgBonus = scene.companionSystem.getEffectivePerkValue('damageBonus');
const wolfDefBonus = scene.companionSystem.getEffectivePerkValue('damageReduction');
// Apply to combat calculation
```

**FishingSystem.js:**
```js
// Frog — fishing bonuses
const frogCatchBonus = scene.companionSystem.getEffectivePerkValue('fishingCatchBonus');
const frogDoubleBonus = scene.companionSystem.getEffectivePerkValue('fishingDoubleBonus');
// Add to existing catch chance and double catch calculations
```

**MiningSystem.js:**
```js
// Mole — mining bonuses
const moleExtractBonus = scene.companionSystem.getEffectivePerkValue('miningExtractBonus');
const moleRespawnBonus = scene.companionSystem.getEffectivePerkValue('nodeRespawnBonus');
```

**FarmingSystem.js:**
```js
// Toad — farming bonuses
const toadGrowthBonus = scene.companionSystem.getEffectivePerkValue('farmGrowthBonus');
const toadCropBonus = scene.companionSystem.getEffectivePerkValue('farmBonusCropBonus');
```

**DayNightSystem.js:**
```js
// Owl — night fog reduction
const owlFogReduction = scene.companionSystem.getEffectivePerkValue('nightFogReduction');
// Reduce overlay alpha: targetAlpha *= (1 - owlFogReduction)
```

---

## 4. Runtime Texture Additions (`BootScene.js`)

### Day/Night UI (16×16 each):
- `ui_sun_icon`: Golden circle with 4 ray lines extending outward
- `ui_moon_icon`: Silver crescent moon shape, pale blue (#B0C4DE)
- `ui_fog_particle`: 8×4 soft white-gray rectangle, used for night fog

### Nocturnal Mob Sprites (16×16 each):
- `mob_shadow_wisp`: Flickering dark purple-blue orb with a trailing wisp tail. Core is bright (#8866CC), edges dissolve into transparency. 2-frame idle animation (pulse).
- `mob_night_stalker`: Low crouching dark shape. Black body (#1A1A1A) with two bright yellow eyes (#FFCC00) that glow. Sharp triangular ears. Hunched predatory silhouette.
- `mob_moon_beetle`: Round armored bug shape. Dark blue shell (#2A3A5A) with glowing white-blue spots (#88BBFF) arranged symmetrically. 2 small antennae.
- `mob_ember_wraith`: Ghostly humanoid silhouette in dark orange-red (#CC4400) with a flickering core of bright fire (#FFAA00). No defined legs — dissolves at the bottom into flame wisps.

### Merchant NPC Sprite (16×16):
- `npc_merchant`: Hooded figure in deep brown traveling cloak (#5A4020). Gold trim on hood edge. Visible pack/satchel on back. Small golden lantern in hand (1-2 bright yellow pixels). Face in shadow — only a hint of a nose/chin visible.

### Companion Sprites (16×16 each):
- `companion_fox`: Small orange-red fox (#CC5500) with white belly, pointed ears, bushy tail. Dark nose. Quick, sleek body shape. Ears are 2px triangles.
- `companion_owl`: Small round owl shape. Warm brown body (#7A5A30), lighter chest, two large round eyes (yellow #FFD700 with black pupils). Small pointed beak. Feather tufts on head.
- `companion_frog`: Plump green frog (#3A7A3A). Lighter belly. Two bulging eyes on top. Slightly open mouth. Sitting pose with visible back legs tucked under body.
- `companion_mole`: Small round brown body (#5A4030). Tiny beady eyes. Large front claws (2px each, pink-ish). Small pink nose. Stubby tail. Low-to-ground shape.
- `companion_wolf`: Dark gray wolf (#4A4A5A) with lighter muzzle. Pointed ears, alert posture. Visible fur texture (darker pixel accents). Yellow eyes. Bushy tail.
- `companion_toad`: Larger than frog, warty green-brown (#4A5A2A). Bumpy texture. Wide mouth. Yellow eyes. Broader, flatter body shape than the frog.

### Companion Eggs (16×16 each):
- 6 egg sprites: Oval egg shape with a subtle color tint matching the companion — orange for fox, brown for owl, green for frog, tan for mole, gray for wolf, olive for toad. Each has a small crack line and a faint glow.

### Nest Tile (16×16):
- `tile_companion_nest`: Circular nest of brown twigs (#6B4226) with a soft white interior (straw/feathers). Warm, cozy feel. When occupied, the egg sprite sits inside it.

### Merchant-Exclusive Item Icons (16×16):
- `item_mystery_seed`: Swirling green-purple seed shape with a small question mark pattern
- `item_ember_pepper`: Bright red-orange pepper shape with tiny flame wisps at the tip
- `item_frost_lily`: Pale blue-white flower with crystalline petals
- `item_golden_treat`: Golden bone shape with sparkle pixels
- `item_merchants_tonic`: Small green bottle with gold stopper
- `item_wanderers_brew`: Brown ceramic jug with steam wisps
- `item_scouts_map`: Rolled parchment with red X mark
- `item_stardust`: Small pouch with white sparkle particles escaping
- `item_morale_scroll`: Rolled paper with golden seal

### Night-Exclusive Item Icons (16×16):
- `item_shadow_essence`: Dark purple-black sphere with faint glow
- `item_wisp_core`: Bright blue-white diamond shape with inner glow
- `item_stalker_fang`: Curved white fang with dark root
- `item_midnight_dew`: Small blue droplet with dark shimmer
- `item_moonshell_fragment`: Curved white shell piece with blue iridescence
- `item_luminous_chitin`: Curved green-blue armored piece that glows
- `item_wraith_ember`: Small orange-red ember with smoke wisps
- `item_infernal_dust`: Small gray-red pile with heat shimmer

### Night Gear Icons (16×16):
- `gear_moonstone_ring`: Silver ring with pale blue gemstone center
- `gear_shadow_blade`: Dark black-red sword with shadowy aura
- `gear_lantern`: Small warm-glow lantern, golden frame, orange light

---

## 5. Economy Impact

### Night Cycle Income Adjustment

Night mobs drop better loot than daytime equivalents, making active night play rewarding:

| Activity | Day Income | Night Income | Delta |
|----------|-----------|-------------|-------|
| Player hunting (Forest) | ~35-50g/min | ~45-60g/min | +25% from nocturnal mob loot |
| Agent hunting (geared) | ~25-35g/min | ~20-28g/min (without Lantern) | -25% from morale debuff |
| Agent hunting (Lantern) | ~25-35g/min | ~25-35g/min | Unchanged |
| Farming | ~12-18g/min | ~14-21g/min | +15% from moonlight growth |
| Fishing (night pool) | ~18-24g/min | ~22-30g/min | Night-exclusive catches worth more |

**Design intent:** Night slightly rewards active play and slightly punishes purely idle (agent) play unless the player has invested in the Lantern. This nudges players toward engaging with the night cycle rather than ignoring it.

### Merchant Economy

The merchant is a deliberate gold sink — items are priced above normal shop values because they're unique. A player who visits every merchant appearance and buys heavily will spend 100-200g per visit, offsetting the increased night income and preventing gold inflation.

### Companion Economic Value

Companions don't generate gold directly, but their perks increase the *rate* of all other income sources by 10-25% depending on the companion and activity. The Fox's rare loot bonus is roughly +15% combat income. The Frog's fishing bonus is roughly +20% fishing income. These are powerful but not game-breaking.

---

## Phase 7 Success Criteria

### Day/Night Cycle
1. A 5-minute day/night cycle runs continuously with dawn → day → dusk → night → dawn transitions
2. Night phase applies a dark blue overlay to the game viewport that fades in during dusk and out during dawn
3. Fog particles drift across the screen during night and clear at dawn
4. Town buildings have warm lantern glow circles during night
5. The DayNightHUD shows current phase with icon (☀/🌙) and night countdown
6. Dusk displays a 10-second "night incoming" warning
7. Four nocturnal mob types spawn during night only and despawn (fade out) at dawn
8. Nocturnal mobs have correct loot tables including night-exclusive materials and companion eggs
9. Farming crops grow 15% faster during night (moonlight bonus)
10. Night-exclusive fish (Moonfish, Shadowfin) are catchable only at night with Fishing Lv.4+
11. Agent hunts 25% slower at night without Lantern. Normal behavior with Lantern equipped.
12. Night-exclusive crafting recipes (Moonstone Ring, Shadow Blade, Lantern) are craftable at the Forge
13. Night-exclusive cooking recipes (Midnight Broth, Shadow Stew) work correctly

### Wandering Merchant
14. Merchant spawns every 3-6 minutes at a random zone, stays 60 seconds, then despawns
15. Merchant has 50% higher spawn chance during night
16. Arrival notification shows zone name and countdown timer
17. 15-second departure warning with pulsing red text
18. Merchant inventory rolls 4-6 items from the pool (1 guaranteed + 3-5 rotating), different each visit
19. Player can buy items; stock decreases; sold-out items show correctly
20. Agent cannot interact with merchant
21. Merchant panel auto-closes on despawn
22. Mystery Seed plants and resolves to a random crop at harvest
23. Ember Pepper and Frost Lily grow correctly and are usable in their exclusive recipes
24. Golden Treat doubles active companion's perk for 3 minutes
25. Merchant's Tonic, Wanderer's Brew, Scout's Map, and Exotic Feast all function correctly

### Creature Companions
26. All 6 companion eggs can drop from their designated sources at correct rates
27. Eggs can be placed in the Nest for 60-second incubation
28. Hatching adds companion to roster with celebration notification
29. Player can set any owned companion as active; it follows the player with smooth movement
30. Companion teleports if more than 8 tiles behind (tap-to-move accommodation)
31. Idle animations play after 3 seconds of player stillness
32. Only one companion active at a time; switching replaces the current one
33. Companion Panel (🐾 button) shows active companion, owned roster, locked slots, and nest status
34. Fox perk (+15% rare loot) is applied in LootSystem
35. Owl perk (night fog -40%) reduces night overlay opacity
36. Frog perk (+20% catch, +10% double) is applied in FishingSystem
37. Mole perk (+25% extract, +20% node respawn) is applied in MiningSystem
38. Wolf perk (+10% damage, -5% damage taken) is applied in CombatSystem
39. Toad perk (+20% growth, +15% bonus crop) is applied in FarmingSystem
40. Golden Treat doubles the active perk for 3 minutes with visible timer
41. Dismiss button removes active companion correctly

### Integration
42. All three systems coexist without performance issues on mobile
43. Night cycle, merchant spawns, and companion perks interact correctly (e.g., Fox perk boosts nocturnal mob loot)
44. New items (night materials, companion eggs, merchant items) appear correctly in inventory with proper categories
45. All new items are sellable in the shop where applicable (companion eggs are NOT sellable)
