Add the following Phase 2 specification to the end of the existing README.md, directly after the Phase 1 Success Criteria section. Do not modify any Phase 1 content. Phase 1 must be fully functional and passing all its success criteria before any Phase 2 code is written.

---

## Phase 2: Equipment & Gear System

> **DO NOT BUILD UNTIL PHASE 1 PASSES ALL SUCCESS CRITERIA.**
> Phase 1 systems (player movement, agent FSM, mob spawning, combat, loot drops, inventory, shop, leveling) must all be working correctly before implementing anything below.

### Phase 2 Overview

This phase adds a complete equipment system — gear drops from mobs, players and agents equip items into slots, and equipped gear modifies combat stats. This transforms loot from sell fodder into meaningful progression choices.

**New systems:**
1. Equipment data model (slots, stats, rarity)
2. Gear drop tables integrated into existing loot system
3. Equipment UI (equip screen for player + agent)
4. Stat calculation pipeline (base stats + gear bonuses)
5. Visual feedback for equipped gear on entities
6. Inventory upgrade (distinguish materials vs equipment)

**NOT in this phase (Phase 3+):**
- ❌ Crafting, fishing, mining
- ❌ Set bonuses or gear synergies
- ❌ Enchanting or upgrading gear
- ❌ Multiple agents
- ❌ New mobs or zones
- ❌ Gear sockets or gems

### New Files

```
src/
├── config/
│   └── gearData.js          # All gear definitions, rarity tiers, stat ranges
├── systems/
│   └── StatCalculator.js    # Computes effective stats from base + gear
├── ui/
│   ├── EquipmentPanel.js    # Full equip screen (player or agent)
│   └── LootToast.js         # Enhanced drop notification with rarity color
```

### Modified Existing Files

| File | Changes |
|------|---------|
| `BootScene.js` | Add texture generation for gear icons, rarity borders, UI elements |
| `Player.js` | Add `this.equipment = {}`, `updateVisuals()`, `equip(slot, item)` / `unequip(slot)` methods |
| `Agent.js` | Same equipment additions as Player |
| `CombatSystem.js` | Import `getEffectiveStats`, replace all direct `entity.stats.atk` / `.def` reads with effective stat lookups |
| `LootSystem.js` | Add `rollGearDrop()`, modify `rollLoot()` to return both material and gear drops as typed array |
| `mobData.js` | Add `gearDropChance` field to each mob definition |
| `HUDScene.js` | Add 🛡️ equip button to button cluster, update stat bars to show base+bonus, handle `equipmentChanged` events |
| `InventoryPanel.js` | Add tabs for Materials / Gear, gear grid with rarity indicators |
| `ShopScene.js` | Add Gear tab, sell gear functionality, "Sell All Common" button |
| `GameScene.js` | Launch EquipmentPanel scene on equip button press, pass gameState reference |

---

### Equipment Slots

Every entity (Player and Agent) has 5 equip slots:

```js
export const EQUIP_SLOTS = {
  WEAPON: 'weapon',       // Modifies ATK
  HELMET: 'helmet',       // Modifies DEF, sometimes HP
  CHEST: 'chest',         // Modifies DEF, HP
  BOOTS: 'boots',         // Modifies DEF, move speed bonus (future)
  ACCESSORY: 'accessory', // Wildcard — can modify any stat
};
```

Each entity stores equipment as:
```js
this.equipment = {
  weapon: null,
  helmet: null,
  chest: null,
  boots: null,
  accessory: null,
};
```

### Rarity Tiers

```js
export const RARITY = {
  COMMON:    { name: 'Common',    color: 0xAAAAAA, weight: 60, statMultiplier: 1.0 },
  UNCOMMON:  { name: 'Uncommon',  color: 0x4CAF50, weight: 25, statMultiplier: 1.3 },
  RARE:      { name: 'Rare',      color: 0x2196F3, weight: 12, statMultiplier: 1.7 },
  EPIC:      { name: 'Epic',      color: 0x9C27B0, weight: 3,  statMultiplier: 2.2 },
};
```

- `weight` is used for the rarity roll when gear drops (weighted random).
- `statMultiplier` scales the base stat values of the gear piece.
- Color is used for item name text, inventory slot border glow, and loot toast.

### Gear Definitions (`gearData.js`)

Each gear piece has a base definition. When a piece drops, the rarity roll scales its stats.

```js
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
    dropSources: ['wolf', 'cave_bat'],
  },
  shadow_blade: {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    slot: 'weapon',
    icon: '⚔️',
    textureKey: 'gear_shadow_blade',
    baseStats: { atk: 7 },
    dropLevel: 3,
    dropSources: ['cave_bat'],
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
    dropSources: ['wolf', 'cave_bat'],
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
    dropSources: ['wolf', 'cave_bat'],
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
    dropSources: ['wolf', 'cave_bat'],
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
    dropSources: ['cave_bat'],
  },
};
```

Total: 12 gear pieces across 5 slots.

### Gear Instance (Dropped Item)

When gear drops, create an instance with rolled rarity and computed stats:

```js
{
  uid: 'gear_1710234567890',   // Unique ID (timestamp-based)
  defId: 'iron_dagger',        // Reference to GEAR_DEFS key
  name: 'Iron Dagger',         // Prepend rarity name for non-Common
  slot: 'weapon',
  rarity: 'UNCOMMON',
  stats: { atk: 5 },           // baseStats * rarity multiplier, rounded down
  icon: '🔪',
  textureKey: 'gear_iron_dagger',
  sellValue: 8,                // base sell * rarity multiplier
  equippedBy: null,            // null | 'player' | 'agent'
}
```

Stat computation on drop:
```js
function rollGearInstance(defId) {
  const def = GEAR_DEFS[defId];
  const rarity = weightedRandomPick(RARITY);
  const stats = {};
  for (const [stat, baseVal] of Object.entries(def.baseStats)) {
    stats[stat] = Math.floor(baseVal * rarity.statMultiplier);
  }
  const baseSellValue = Object.values(stats).reduce((sum, v) => sum + v, 0) * 2;
  return {
    uid: `gear_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    defId: defId,
    name: rarity.name === 'Common' ? def.name : `${rarity.name} ${def.name}`,
    slot: def.slot,
    rarity: rarity.name.toUpperCase(),
    stats,
    icon: def.icon,
    textureKey: def.textureKey,
    sellValue: Math.max(1, Math.floor(baseSellValue * rarity.statMultiplier)),
    equippedBy: null,
  };
}
```

---

### Loot System Changes (`LootSystem.js`)

#### Dual Drop Roll

When a mob dies, make two independent rolls:

1. **Material roll** (existing, unchanged): Roll against the mob's material loot table.
2. **Gear roll** (new): Chance to drop equipment.

```js
export function rollLoot(mobType, killerLevel) {
  const drops = [];
  const materialDrop = rollMaterialDrop(mobType);
  if (materialDrop) drops.push({ type: 'material', item: materialDrop });
  const gearDrop = rollGearDrop(mobType, killerLevel);
  if (gearDrop) drops.push({ type: 'gear', item: gearDrop });
  return drops;
}
```

#### Gear Drop Logic

```js
function rollGearDrop(mobType, killerLevel) {
  const GEAR_DROP_CHANCE = {
    slime: 0.08,
    wolf: 0.12,
    cave_bat: 0.15,
  };
  if (Math.random() > GEAR_DROP_CHANCE[mobType]) return null;
  const eligible = Object.keys(GEAR_DEFS).filter(id => {
    const def = GEAR_DEFS[id];
    return def.dropSources.includes(mobType) && killerLevel >= def.dropLevel;
  });
  if (eligible.length === 0) return null;
  const defId = eligible[Math.floor(Math.random() * eligible.length)];
  return rollGearInstance(defId);
}
```

#### Inventory Changes

The shared inventory now holds two separate collections:

```js
this.gameState = {
  gold: 20,
  materials: [],    // Existing: [{ id, name, emoji, quantity, sellValue }]
  gear: [],         // NEW: Array of gear instances (unique, not stackable)
  maxGear: 30,
};
```

Materials stack as before. Gear items never stack — each is unique with its own rolled stats and rarity.

When the gear stash is full (30 items), new gear drops are auto-compared: if the new piece is higher rarity than the lowest-rarity item in the stash, swap them (auto-sell the worse one). Otherwise the drop is auto-sold for gold. Show a notification either way.

---

### Stat Calculator (`StatCalculator.js`)

Centralizes all stat computation. Every time combat checks ATK or DEF, it goes through this system — never read `entity.stats.atk` directly in combat.

```js
export function getEffectiveStats(entity) {
  const base = {
    maxHp: entity.stats.maxHp,
    atk: entity.stats.atk,
    def: entity.stats.def,
  };
  const gear = entity.equipment;
  const bonus = { maxHp: 0, atk: 0, def: 0 };
  for (const slot of Object.values(gear)) {
    if (slot !== null) {
      for (const [stat, value] of Object.entries(slot.stats)) {
        if (bonus[stat] !== undefined) {
          bonus[stat] += value;
        }
      }
    }
  }
  return {
    maxHp: base.maxHp + bonus.maxHp,
    atk: base.atk + bonus.atk,
    def: base.def + bonus.def,
    baseAtk: base.atk,
    baseDef: base.def,
    baseMaxHp: base.maxHp,
    bonusAtk: bonus.atk,
    bonusDef: bonus.def,
    bonusMaxHp: bonus.maxHp,
  };
}
```

#### CombatSystem.js Changes

Replace all direct stat reads:
```js
// BEFORE (Phase 1):
const damage = Math.max(1, attacker.stats.atk - defender.stats.def);

// AFTER (Phase 2):
const attackerStats = getEffectiveStats(attacker);
const defenderStats = getEffectiveStats(defender);
const damage = Math.max(1, attackerStats.atk - defenderStats.def);
```

#### MaxHP Sync

When gear with `maxHp` bonuses is equipped or unequipped:
- **Equipping**: Increase maxHp AND current HP by the bonus amount.
- **Unequipping**: Decrease maxHp. Clamp current HP if it exceeds new maxHp.

---

### Equipment UI (`EquipmentPanel.js`)

#### Trigger

New 🛡️ Equip button added to the bottom-right button cluster in HUDScene (next to existing 📦 and 👁️). Opens EquipmentPanel as an overlay scene (same pattern as ShopScene).

Panel has two tabs: `"You"` and `"Agent"`. Agent tab is grayed out with "No agent hired" if no agent exists.

#### Panel Layout (Mobile Portrait)

```
┌─────────────────────────────────────┐
│  ✕                    🛡️ Equipment  │
├──────────┬──────────────────────────┤
│  [You]   │  [Agent]                 │
├──────────┴──────────────────────────┤
│                                     │
│     ┌─────────┐                     │
│     │ HELMET  │     Entity Name     │
│     └─────────┘     Lv. 3           │
│  ┌────┐     ┌────┐                  │
│  │WEAP│     │ACCS│  ATK: 5 (+3)     │
│  └────┘     └────┘  DEF: 4 (+2)     │
│     ┌─────────┐     HP: 65 (+10)    │
│     │  CHEST  │                     │
│     └─────────┘                     │
│     ┌─────────┐                     │
│     │  BOOTS  │                     │
│     └─────────┘                     │
├─────────────────────────────────────┤
│  Gear Inventory (scrollable grid)   │
│  4 columns of 48×48 cells           │
│  Each cell: item icon + rarity dot  │
│  C = gray, U = green, R = blue,     │
│  E = purple                         │
└─────────────────────────────────────┘
```

#### Equip Slot Behavior

Each slot is a 48×48px bordered square:
- **Empty**: Dark background with faded slot label text
- **Filled**: Item icon centered, border color = rarity color, subtle glow for Rare+
- **Tap filled slot**: Tooltip with item name, rarity, stats, and `[Unequip]` button

#### Gear Item Tap (from grid)

Show comparison tooltip:
```
┌──────────────────────────┐
│  Uncommon Iron Dagger    │  Rarity-colored name
│  ─────────────────────── │
│  ATK: +5                 │
│                          │
│  Currently equipped:     │  (if slot filled)
│  Wooden Sword (Common)   │
│  ATK: +2                 │
│  ─────────────────────── │
│  [EQUIP]    [SELL 8g]    │
└──────────────────────────┘
```

- **EQUIP**: Equips item to viewed entity. If slot is filled, existing item returns to stash.
- **SELL**: Sells for `sellValue`, removes from stash, adds gold.
- If item is better in every stat, show green `▲` arrow.

---

### Entity Visual Changes

Equipped gear shows as color accents on the entity sprite (runtime-generated, not separate layers):

- **Weapon**: Small 3×3px colored rectangle to the right of entity. Color = rarity color.
- **Helmet**: 1px colored line across the top of entity head. Color = rarity color.
- **Chest**: Entity body rectangle tint blends 20% toward rarity color.
- **Boots**: 1px colored accents at entity bottom.
- **Accessory**: Tiny 2×2px pulsing dot near entity in rarity color.

In Player.js and Agent.js, add `updateVisuals()` called on equipment change. Redraws tints and overlays.

#### HUD Stat Bars

HP bar reflects gear bonuses:
- Base HP in standard green
- Bonus HP in lighter green / gold-tinted shade

---

### Agent Equipment Behavior

The agent does NOT auto-equip gear. All gear goes to shared stash when deposited. Player manually equips gear on the agent via the Equipment Panel Agent tab.

Agent combat effectiveness reflects equipment automatically because CombatSystem uses `getEffectiveStats()`.

---

### Shop Changes (`ShopScene.js`)

Two tabs:
```
┌────────────────────────────────────┐
│  [Materials]     [Gear]            │
├────────────────────────────────────┤
```

- **Materials tab**: Existing behavior unchanged.
- **Gear tab**: Lists unequipped gear. Each row: `[rarity border] [icon] [name] — [stats] — [sell value]g [SELL]`
- Equipped gear does NOT appear in sell list.
- **SELL ALL COMMON** button at bottom of gear tab. Shows total gold, tap to confirm.

---

### Loot Toast Upgrade (`LootToast.js`)

- **Material drops**: Existing white text, slides from right.
- **Gear drops**: Text color = rarity color. Format: `"⚔️ Uncommon Iron Dagger (ATK +5)"`
  - Rare and Epic: brief screen-edge flash in rarity color (200ms)
  - Epic: additional short camera shake (2px amplitude, 300ms)
- Max 4 visible toasts. New pushes older up. Auto-dismiss after 2.5 seconds.

---

### Runtime Texture Additions (`BootScene.js`)

Generate new textures:

- **Gear item icons** (16×16 each): Simple pixel art for all 12 gear pieces:
  - Wooden Sword: Brown handle (2×6px) + gray blade (2×8px triangle)
  - Iron Dagger: Gray handle (2×4px) + silver blade (2×6px, thinner)
  - Shadow Blade: Dark purple handle + black blade with blue edge pixels
  - Leather Cap: Brown dome shape (8×5px)
  - Iron Helm: Gray dome with darker visor line
  - Cloth Tunic: Brown rectangle (8×10px)
  - Chainmail: Gray rectangle with crosshatch pixel pattern
  - Sandals: Brown L-shapes (4×3px each)
  - Iron Greaves: Gray boot shapes with darker sole
  - Bone Ring: White circle (6×6px) with gap
  - Echo Pendant: Blue circle (4×4px) with chain line above
- **Gear slot backgrounds** (48×48): Dark bordered squares, one variant per rarity color for filled border glow.
- **Rarity border textures**: 1px inner borders for inventory cells per rarity color.
- **Tab/button textures**: Active/inactive tab backgrounds, equip/sell button backgrounds (60×28px) with pressed variants.

Cache with `'gear_[item_id]'` and `'ui_[element]'` keys.

---

### Event Flow: Gear Drop → Equip

```
Mob dies
  → CombatSystem calls LootSystem.rollLoot(mobType, killerLevel)
    → rollMaterialDrop() — existing
    → rollGearDrop() — NEW
      → Check drop chance per mob type
      → Filter eligible gear by mob source + killer level
      → Pick random gear def, roll rarity via weighted random
      → Create gear instance with scaled stats + unique ID
    → Return [{type:'material', item}, {type:'gear', item}]
  → If killer is Player:
      → Materials → gameState.materials (stack)
      → Gear → gameState.gear (unique entry)
      → HUDScene loot toasts (rarity-styled for gear)
  → If killer is Agent:
      → Items → agent.carryInventory
      → On DEPOSITING state:
        → Transfer materials → gameState.materials
        → Transfer gear → gameState.gear
        → HUDScene loot toasts per transferred item
  → Player opens EquipmentPanel:
      → Sees gear in grid
      → Taps item → comparison tooltip
      → Taps EQUIP → item.equippedBy set, moved from stash to slot
      → getEffectiveStats() includes new gear
      → CombatSystem uses boosted stats on next tick
```

---

### Phase 2 Success Criteria

1. Mobs drop gear alongside materials at defined rates
2. Gear drops have visible rarity (Common through Epic) with correct stat scaling
3. Loot toasts show gear with rarity-colored text; Epic drops trigger screen flash + camera shake
4. Equipment Panel opens from 🛡️ button with player/agent tabs
5. Tapping gear shows comparison tooltip with EQUIP and SELL options
6. Equipping gear modifies effective stats (visible in HUD with base+bonus breakdown)
7. Combat damage reflects equipped gear via StatCalculator
8. Equipped gear shows rarity-colored visual accents on entity sprites
9. Shop Gear tab lists unequipped gear with selling and bulk "Sell All Common"
10. Gear stash respects 30-item limit with auto-sell overflow
11. Agent-collected gear arrives in shared stash during deposit and can be equipped on either entity
12. Getting a Rare or Epic drop feels like a moment — visual feedback makes rarity satisfying
