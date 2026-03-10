# Phase 8: 32×32 Visual Rebuild — Agent Execution Prompt

## Directive

You are implementing Phase 8 of AgentQuest: a complete visual rebuild from 16×16 to 32×32 pixel art. This phase touches **only** `BootScene.js` (full rewrite), `constants.js` (tile size + zoom), and any files with hardcoded tile-size math. **Zero gameplay logic changes.** The game must be functionally identical before and after — same mechanics, same balance, same interactions — just visually upgraded.

**Phase gate:** Phases 7, 7b, 7c, and 7d must all pass their success criteria before beginning this phase.

**Execution is split into two stages.** Complete Stage 1 fully and verify the game runs before beginning Stage 2. Do not skip ahead.

---

## Table of Contents

1. [Stage 1: Mechanical Migration](#stage-1-mechanical-migration)
2. [Stage 2: Texture Rebuild](#stage-2-texture-rebuild)
3. [Texture Specifications by Category](#texture-specifications-by-category)
4. [Art Direction Rules](#art-direction-rules)
5. [Code Patterns](#code-patterns)
6. [Modified Files](#modified-files)
7. [What NOT to Build](#what-not-to-build)
8. [Success Criteria](#success-criteria)

---

## Stage 1: Mechanical Migration

**Goal:** Update all tile-size references so the game renders at 32×32 scale. After this stage, the game should run with stretched/blurry 16×16 textures displayed at 32×32 — ugly but fully functional. This isolates rendering bugs from art bugs.

### Step 1.1: Update constants.js

```js
// BEFORE
export const TILE_SIZE = 16;

// AFTER
export const TILE_SIZE = 32;
```

If a `CAMERA_ZOOM` or `ZOOM` constant exists, change it from `2` to `1`. If zoom is set in `GameScene.js` or `main.js` directly, change it there:

```js
// BEFORE (wherever camera zoom is configured)
this.cameras.main.setZoom(2);

// AFTER
this.cameras.main.setZoom(1);
```

The visual math: 16px tiles × 2x zoom = 32px on screen. 32px tiles × 1x zoom = 32px on screen. Same result, but now we have 4× the pixel budget per texture.

### Step 1.2: Find and Replace All Hardcoded Tile-Size Math

Search the **entire `src/` directory** for these patterns and update them. This is the most critical step — missed references will cause positioning bugs.

**Search patterns (grep the full codebase):**

| Pattern | Replace With | Notes |
|---------|-------------|-------|
| `* 16` | `* TILE_SIZE` or `* 32` | Tile-to-pixel conversions |
| `/ 16` | `/ TILE_SIZE` or `/ 32` | Pixel-to-tile conversions |
| `+ 8` or `- 8` | `+ 16` or `- 16` (or `+ TILE_SIZE/2`) | Half-tile offsets for centering |
| `+ 4` or `- 4` | `+ 8` or `- 8` (or `+ TILE_SIZE/4`) | Quarter-tile offsets |
| `setDisplaySize(16` | `setDisplaySize(32` | Entity/sprite display sizing |
| `setSize(16` | `setSize(32` | Container/hitbox sizing |
| `new Phaser.Math.Vector2(16` | Update if tile-size dependent | Occasional vector math |
| Literal `16` in spawn/position calculations | Verify if tile-size dependent | Not all `16`s are tile sizes — only change the ones that are |

**Important:** Not every literal `16` in the codebase is a tile size. Some `16` values may be unrelated (font sizes, padding, UI offsets, etc.). For each match, verify it's actually a tile-size calculation before changing it. If it references tile coordinates, world positions, or grid math, update it. If it's a font size or UI pixel value, leave it alone.

**Prefer using the `TILE_SIZE` constant** over hardcoding `32` wherever possible. If a file doesn't already import from `constants.js`, add the import:

```js
import { TILE_SIZE } from '../config/constants.js';
```

### Step 1.3: Update World Dimensions

The map is 50×50 tiles. World pixel dimensions change:

```
BEFORE: 50 × 16 = 800px × 800px
AFTER:  50 × 32 = 1600px × 1600px
```

Find wherever world bounds are set (likely `GameScene.js` or `mapGenerator.js`) and update:

```js
// BEFORE
this.physics.world.setBounds(0, 0, 800, 800);
this.cameras.main.setBounds(0, 0, 800, 800);

// AFTER
this.physics.world.setBounds(0, 0, 1600, 1600);
this.cameras.main.setBounds(0, 0, 1600, 1600);
```

Or better, if the map dimensions are computed:

```js
const worldWidth = MAP_WIDTH * TILE_SIZE;   // 50 * 32 = 1600
const worldHeight = MAP_HEIGHT * TILE_SIZE; // 50 * 32 = 1600
```

### Step 1.4: Update Entity Display Sizes

All entity classes (Player, Agent, Mob, WorldBoss, FarmPlot) that call `setDisplaySize()` or set dimensions need updating:

```js
// Standard entities (Player, Agent, Mobs)
// BEFORE
this.sprite.setDisplaySize(16, 16);
// AFTER
this.sprite.setDisplaySize(32, 32);

// World Boss (2×2 tiles)
// BEFORE
this.sprite.setDisplaySize(32, 32);
// AFTER
this.sprite.setDisplaySize(64, 64);
```

### Step 1.5: Update Pathfinding and Tap-to-Move

`Pathfinding.js` and `TapMoveSystem.js` convert between pixel and tile coordinates. Verify all conversions use `TILE_SIZE` not hardcoded `16`. Path visualization (dotted line, destination marker) positioning must use the new tile size.

### Step 1.6: Update Spawner Positioning

`Spawner.js` converts zone tile boundaries to pixel positions for mob spawning. Ensure all spawn coordinate calculations use `TILE_SIZE`.

### Step 1.7: Update HUD and UI Positioning

`HUDScene.js`, `HUDComponents.js`, and all panel files position elements relative to the game viewport. Most UI uses screen coordinates (not world coordinates) and should be unaffected, but verify:

- HP bars above entities (world-space positioned)
- Floating damage/XP/gold numbers (world-space positioned)
- Context prompts near buildings (world-space positioned)
- Activity status indicators at node positions (world-space positioned)

Any UI element positioned in **world space** (not screen space) needs tile-size updates. Screen-space UI (panels, HUD bars, buttons) should not need changes.

### Stage 1 Verification

After completing all Step 1.x changes, run the game and verify:

- [ ] Game boots without errors
- [ ] Player spawns at correct position in town
- [ ] Player can move with joystick and tap-to-move (positions correct, not offset)
- [ ] Camera follows player correctly, world bounds feel right
- [ ] Mobs spawn in correct zones (not clustered at origin or offset)
- [ ] Agent pathfinds correctly (walks to mobs, returns to town)
- [ ] All buildings are interactable at correct positions
- [ ] Combat works (entities engage at correct range)
- [ ] All panels open and display correctly
- [ ] Textures appear stretched/blurry but everything is **functional**

**Do not proceed to Stage 2 until all checks pass.** If anything is broken, it's a missed hardcoded value — find and fix it before moving on.

---

## Stage 2: Texture Rebuild

**Goal:** Rewrite `BootScene.js` to generate all textures at 32×32 resolution (64×64 for World Boss). Texture keys remain **exactly the same** — the rest of the game references these keys and must not need any changes.

### Execution Order

Rebuild textures in this order. After each batch, run the game and visually verify before proceeding. This order prioritizes by gameplay visibility — you see terrain every frame, item icons only in menus.

| Batch | Category | Count | Priority Rationale |
|-------|----------|-------|--------------------|
| 1 | Terrain tiles | 22 | Foundation — sets the visual tone of the entire world |
| 2 | Entities (mobs, player, agent) | 10 | Always visible, sit on terrain — must look coherent together |
| 3 | World Boss | 1 (64×64) | Centerpiece encounter, most pixel budget, high wow factor |
| 4 | Buildings | 5 | Large landmarks, seen frequently in town |
| 5 | Activity nodes | 5 | Fishing/mining spots, moderate visibility |
| 6 | Farm plots | 9 | Farming area in town, less visible until Phase 9 |
| 7 | Item icons | 43 | Inventory/shop only — functional but seen less often |
| 8 | Gear & skill icons | 9 | Equipment/skills panels — seen in menus |
| 9 | UI elements | 17 | Buttons, bars, panel backgrounds — most formulaic to generate |

---

## Texture Specifications by Category

All textures are generated using `this.textures.createCanvas(key, width, height)` then drawn with the canvas 2D context. Every texture must use the project's color palette (specified below). Every texture key must match the existing key string exactly.

### Color Palette Reference

**Terrain:**

| Zone | Primary | Secondary | Accent |
|------|---------|-----------|--------|
| Town | `#8B7355` (warm stone) | `#6B4226` (wood brown) | `#DAA520` (lantern gold) |
| Forest | `#2D5A27` (deep green) | `#4A7C3F` (moss) | `#1A3A15` (shadow) |
| Caves | `#36393F` (charcoal) | `#4A4458` (purple-gray) | `#5B8FA8` (crystal blue) |
| Swamp | `#3A4A2A` (murky green) | `#2A3A1A` (mud) | `#4A6A2A` (toxic green) |
| Volcanic | `#1A1A1A` (black) | `#FF4400` (lava orange) | `#FFAA00` (lava hot) |
| Water | `#1A3A6A` (deep blue) | `#2A5A8A` (mid blue) | `#4A7AAA` (light blue) |

**UI:**

| Element | Color |
|---------|-------|
| Panel background | `#1A1A2E` at 85% opacity |
| Text (parchment) | `#F5E6C8` |
| Gold accent | `#DAA520` |
| HP bar fill | `#CC3333` |
| XP bar fill | `#33AA33` |

**Rarity:**

| Tier | Color | Glow/Border |
|------|-------|-------------|
| Common | `#AAAAAA` | None |
| Uncommon | `#4CAF50` | Subtle |
| Rare | `#2196F3` | Medium |
| Epic | `#9C27B0` | Strong |

**Entity palette:**

| Entity | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| Player | `#3A7EC8` (blue tunic) | `#F5D6A8` (skin) | `#DAA520` (belt/trim) |
| Agent | `#8B4513` (brown cloak) | `#F5D6A8` (skin) | `#CC3333` (sash) |
| Slime (Forest) | `#4CAF50` (green) | `#66BB6A` (highlight) | `#1B5E20` (shadow) |
| Goblin (Forest) | `#8D6E63` (brown skin) | `#4E342E` (dark) | `#FF6F00` (eyes) |
| Skeleton (Caves) | `#E0E0E0` (bone white) | `#BDBDBD` (shadow) | `#F44336` (eyes) |
| Bat (Caves) | `#4A4458` (purple-gray) | `#7E57C2` (wing) | `#FF5722` (eyes) |
| Bog Lurker (Swamp) | `#4A6A2A` (swamp green) | `#2E7D32` (mossy) | `#FFEB3B` (eyes) |
| Fungal Shambler (Swamp) | `#6D4C41` (mushroom) | `#8D6E63` (cap spots) | `#76FF03` (spore glow) |
| Lava Imp (Volcanic) | `#FF4400` (lava) | `#FF6D00` (bright) | `#FFAB00` (hot core) |
| Ember Wyrm (Volcanic) | `#B71C1C` (deep red) | `#FF4400` (scales) | `#FFAB00` (fire) |
| World Boss | `#B71C1C` (infernal red) | `#FF4400` (fire) | `#FFAB00` (core glow) |

---

### Batch 1: Terrain Tiles (22 textures, 32×32)

Terrain tiles must **tile seamlessly** — avoid detail or patterns that create obvious repetition when laid in a grid. Keep terrain as readable background; do not compete with entities for visual attention. Use 2–3 pixel variation for subtle texture (noise, speckle), not detailed features.

| Texture Key | Zone | Description |
|-------------|------|-------------|
| `tile_town_ground` | Town | Warm stone cobble — irregular stone shapes in `#8B7355` with `#7A6345` mortar lines |
| `tile_town_path` | Town | Lighter stone path — `#A08B6B` smooth stone with subtle `#8B7355` cracks |
| `tile_town_wall` | Town | Town border walls — `#6B4226` dark wood planks with `#5A3520` gaps |
| `tile_forest_grass` | Forest | Dense grass — `#2D5A27` base with `#4A7C3F` grass blade pixels scattered |
| `tile_forest_dense` | Forest | Thick undergrowth — darker `#1A3A15` with `#2D5A27` leaf clusters |
| `tile_forest_path` | Forest | Dirt trail — `#6B5A3A` packed earth with `#5A4A2A` pebble dots |
| `tile_cave_floor` | Caves | Rough stone floor — `#36393F` base with `#4A4458` speckle |
| `tile_cave_wall` | Caves | Impassable cave rock — `#2A2D33` dark with `#36393F` cracks |
| `tile_cave_crystal` | Caves | Crystal-veined floor — `#36393F` base with `#5B8FA8` crystal pixel clusters |
| `tile_swamp_ground` | Swamp | Boggy earth — `#3A4A2A` with `#2A3A1A` wet mud patches |
| `tile_swamp_water` | Swamp | Shallow murky water — `#2A3A1A` base with `#4A6A2A` algae pixels, slight transparency feel |
| `tile_swamp_reeds` | Swamp | Reed-filled ground — `#3A4A2A` base with `#5A6A3A` vertical reed strokes |
| `tile_volcanic_rock` | Volcanic | Scorched basalt — `#1A1A1A` with `#2A2A2A` cracks |
| `tile_volcanic_lava` | Volcanic | Lava flow — `#FF4400` base with `#FFAA00` hot veins, `#CC3300` cooling edges |
| `tile_volcanic_ash` | Volcanic | Ash-covered ground — `#2A2A2A` with `#3A3A3A` pale ash speckle |
| `tile_volcanic_edge` | Volcanic | Lava-rock boundary — half `#1A1A1A` rock, half `#FF4400` lava glow transition |
| `tile_water` | Global | Deep water (impassable) — `#1A3A6A` with `#2A5A8A` wave pixel highlights |
| `tile_water_shallow` | Global | Shallow water (walkable) — `#2A5A8A` with `#4A7AAA` light ripple pattern |
| `tile_bridge` | Global | Wooden bridge — `#6B4226` planks with `#5A3520` gaps, `#8B7355` rail posts |
| `tile_sand` | Global | Sandy shore — `#DAC090` base with `#C4AA78` grain dots |
| `tile_town_garden` | Town | Decorative garden tile — `#4A7C3F` hedged green with `#DAA520` flower pixels |
| `tile_cave_pit` | Caves | Dangerous pit edge — `#1A1D23` dark void center with `#36393F` crumbling rim |

### Batch 2: Entities (10 textures, 32×32)

Entities need **strong silhouette readability** at 32×32. Each entity must be instantly distinguishable from terrain and from each other. Use the full 32×32 canvas but keep the actual character within roughly 24×28 pixels centered, leaving 2–4px padding for visual breathing room. Entities should have at minimum: body shape, head/face, and one distinguishing feature (weapon, color accent, glowing eyes, etc.).

| Texture Key | Entity | Silhouette Notes |
|-------------|--------|-----------------|
| `entity_player` | Player | Humanoid, blue tunic, small sword at side, lighter skin face/hands |
| `entity_agent` | Agent | Humanoid, brown hooded cloak, red sash, slightly hunched/ready stance |
| `mob_slime` | Slime | Rounded blob, 2-pixel white eye highlights, 2–3 shade gradient for volume |
| `mob_goblin` | Goblin | Short humanoid, pointy ears, crude weapon, hunched posture |
| `mob_skeleton` | Skeleton | Thin humanoid, visible ribs, red eye dots, sword or bone weapon |
| `mob_bat` | Bat | Wide wing-spread shape, small body, glowing eyes, fills width more than height |
| `mob_bog_lurker` | Bog Lurker | Squat amphibian, wide body, yellow eye dots, dripping texture |
| `mob_fungal_shambler` | Fungal Shambler | Mushroom-shaped top, stubby legs, glowing spore dots around it |
| `mob_lava_imp` | Lava Imp | Small fiery humanoid, flame-like hair/horns, bright core, dark limbs |
| `mob_ember_wyrm` | Ember Wyrm | Serpentine/dragon shape, coiled body, fire accents along spine |

### Batch 3: World Boss (1 texture, 64×64)

| Texture Key | Entity | Notes |
|-------------|--------|-------|
| `mob_world_boss` | Infernal Guardian | 64×64 (2×2 tiles). This is the visual centerpiece. Large demonic/elemental figure, `#B71C1C` body, `#FF4400` fire wreathing, `#FFAB00` glowing core/eyes. Should feel massive and threatening. Use the full pixel budget — shading, highlights, asymmetric detail. Symmetry in the torso/face, asymmetry in pose/flames. |

### Batch 4: Buildings (5 textures, 32×32)

Buildings are 1×1 tile but should feel like landmarks. Use strong recognizable iconography per building. Roof at top, entrance suggestion at bottom.

| Texture Key | Building | Visual Identity |
|-------------|----------|----------------|
| `building_tavern` | Tavern | Wood frame, pitched roof, warm lantern glow from windows/door, ale mug sign |
| `building_shop` | Shop | Stone base, gold coin sign or market stall awning, open-front feel |
| `building_forge` | Forge | Dark stone, chimney with orange smoke/spark, anvil silhouette |
| `building_home` | Player Home | Small cozy cottage, thatched roof, single lit window |
| `building_kitchen` | Kitchen | Stone base, steam wisps from chimney, pot or food sign |

### Batch 5: Activity Nodes (5 textures, 32×32)

| Texture Key | Node | Description |
|-------------|------|-------------|
| `node_fishing` | Fishing spot | Wooden dock/pier extending into water tile, bobber or ripple |
| `node_mine_copper` | Copper node | Rocky outcrop with `#B87333` copper vein streaks |
| `node_mine_iron` | Iron node | Rocky outcrop with `#71797E` iron-gray vein streaks |
| `node_mine_crystal` | Crystal node | Rocky outcrop with `#5B8FA8` crystal shards protruding |
| `node_depleted` | Depleted node | Same rocky base but gray/muted, crumbled look, no vein color |

### Batch 6: Farm Plots (9 textures, 32×32)

| Texture Key | State | Description |
|-------------|-------|-------------|
| `farm_empty` | Empty plot | Dark tilled earth with visible furrow lines |
| `farm_planted` | Just planted | Tilled earth with small seed mound and tiny green dot |
| `farm_growing` | Growing | Tilled earth with small green sprout (3–5px tall) |
| `farm_ready_wheat` | Wheat ready | Golden wheat stalks filling upper half |
| `farm_ready_carrot` | Carrot ready | Green bushy tops with orange root peeking at soil |
| `farm_ready_potato` | Potato ready | Low green bush with brown mound at base |
| `farm_ready_tomato` | Tomato ready | Green vine with red fruit clusters |
| `farm_ready_pumpkin` | Pumpkin ready | Large orange pumpkin with green vine |
| `farm_ready_starfruit` | Starfruit ready | Exotic yellow star-shaped fruit on a tropical-looking plant |

### Batch 7: Item Icons (43 textures, 32×32)

Item icons are shown in inventory slots, shop lists, and loot toasts. They should read clearly at small sizes against the dark `#1A1A2E` panel background. Use a 2px internal margin — keep the item graphic within the center 28×28 area.

**Fish & fishing drops:**

| Key | Item |
|-----|------|
| `item_small_fish` | Simple fish shape, silver/blue |
| `item_medium_fish` | Larger fish, green-blue |
| `item_large_fish` | Big fish, gold tones |
| `item_rare_fish` | Glowing/magical fish, purple shimmer |

**Ores & mining drops:**

| Key | Item |
|-----|------|
| `item_copper_ore` | Orange-brown rough chunk |
| `item_iron_ore` | Gray metallic chunk |
| `item_crystal_shard` | Blue transparent crystal |
| `item_gem` | Cut gem, brilliant facets, purple/blue |

**Mob material drops:**

| Key | Item |
|-----|------|
| `item_slime_gel` | Green translucent blob |
| `item_goblin_tooth` | Off-white fang |
| `item_bone_fragment` | White bone shard |
| `item_bat_wing` | Dark purple-gray membrane |
| `item_bog_moss` | Clump of murky green moss |
| `item_fungal_spore` | Glowing green sphere with particles |
| `item_lava_shard` | Red-orange crystalline fragment with heat glow |
| `item_ember_scale` | Dark red curved scale |
| `item_boss_ember` | Boss drop — large fiery ember with intense glow |

**Crafting materials:**

| Key | Item |
|-----|------|
| `item_forge_ember` | Crafted material — small orange-red ember in a dark housing |

**Seeds:**

| Key | Item |
|-----|------|
| `item_seed_wheat` | Tiny golden grain seeds in pouch |
| `item_seed_carrot` | Small orange-tipped seed packet |
| `item_seed_potato` | Brown seed eyes |
| `item_seed_tomato` | Tiny red seeds |
| `item_seed_pumpkin` | Large pale seeds |
| `item_seed_starfruit` | Exotic golden star-shaped seeds |

**Harvested crops:**

| Key | Item |
|-----|------|
| `item_wheat` | Bundle of golden wheat |
| `item_carrot` | Orange carrot with green top |
| `item_potato` | Brown potato |
| `item_tomato` | Red tomato |
| `item_pumpkin` | Small orange pumpkin |
| `item_starfruit` | Yellow star-shaped fruit |

**Cooked food / consumables:**

| Key | Item |
|-----|------|
| `item_basic_stew` | Brown bowl with steam |
| `item_fish_soup` | Blue-tinted bowl with steam |
| `item_grilled_meat` | Brown meat on skewer |
| `item_veggie_wrap` | Green wrapped food |
| `item_miners_meal` | Hearty plate, pickaxe garnish |
| `item_anglers_feast` | Fish platter |
| `item_combat_ration` | Military-style wrapped food pack |
| `item_bossfight_brew` | Glowing red potion bottle |
| `item_starfruit_elixir` | Golden glowing potion, star motif |

**Currency / misc:**

| Key | Item |
|-----|------|
| `item_gold_coin` | Shiny gold coin, simple design |
| `item_health_potion` | Red potion bottle |

### Batch 8: Gear & Skill Icons (9 textures, 32×32)

**Gear slot icons** (shown in equipment panel as slot backgrounds):

| Key | Slot | Description |
|-----|------|-------------|
| `icon_slot_weapon` | Weapon | Sword silhouette |
| `icon_slot_helmet` | Helmet | Helmet silhouette |
| `icon_slot_chest` | Chest | Chestplate silhouette |
| `icon_slot_boots` | Boots | Boot pair silhouette |
| `icon_slot_accessory` | Accessory | Ring or amulet silhouette |

**Skill icons** (shown in skills panel):

| Key | Skill | Description |
|-----|-------|-------------|
| `icon_skill_fishing` | Fishing | Fish hook and line |
| `icon_skill_mining` | Mining | Pickaxe |
| `icon_skill_farming` | Farming | Sprout or hoe |
| `icon_skill_cooking` | Cooking | Pot with steam or chef hat |

### Batch 9: UI Elements (17 textures, 32×32 unless noted)

UI textures are functional — prioritize clarity and clean edges over artistic detail.

| Key | Element | Size | Description |
|-----|---------|------|-------------|
| `ui_panel_bg` | Panel background | 32×32 (9-slice) | Dark `#1A1A2E` with subtle border, designed for 9-slice stretching |
| `ui_button` | Default button | 32×16 | Dark rounded rect with `#DAA520` border |
| `ui_button_pressed` | Pressed button | 32×16 | Slightly darker/inset version |
| `ui_button_disabled` | Disabled button | 32×16 | Gray border, dimmed fill |
| `ui_close_button` | Close X button | 16×16 | Small square with X, dark bg, gold border |
| `ui_bar_bg` | Bar background | 32×8 | Dark track for HP/XP bars |
| `ui_bar_hp` | HP bar fill | 32×8 | Red `#CC3333` gradient fill |
| `ui_bar_xp` | XP bar fill | 32×8 | Green `#33AA33` gradient fill |
| `ui_bar_activity` | Activity bar fill | 32×8 | Blue `#3366CC` gradient fill |
| `ui_rarity_border_common` | Common border | 32×32 | Thin `#AAAAAA` border frame |
| `ui_rarity_border_uncommon` | Uncommon border | 32×32 | `#4CAF50` border frame |
| `ui_rarity_border_rare` | Rare border | 32×32 | `#2196F3` border frame with subtle glow |
| `ui_rarity_border_epic` | Epic border | 32×32 | `#9C27B0` border frame with strong glow |
| `ui_loot_burst` | Loot particle | 8×8 | Small bright square for loot burst particles |
| `ui_arrow_up` | Up arrow | 16×16 | Simple `#F5E6C8` arrow glyph |
| `ui_arrow_down` | Down arrow | 16×16 | Simple `#F5E6C8` arrow glyph |
| `ui_tab_active` | Active tab | 32×16 | Highlighted tab with gold top border |

---

## Art Direction Rules

Follow these rules for **every** texture generated. Violations of these rules will produce visual inconsistency.

### Mandatory Rules

1. **No anti-aliasing.** Hard pixel edges only. Do not use fractional coordinates, `ctx.globalAlpha` for edge softening, or any sub-pixel rendering tricks.
2. **No gradients for fills.** Use flat color fills with manual dithering or pixel-level shading. Canvas `createLinearGradient` is forbidden except for UI bar fills.
3. **Palette discipline.** Every pixel must come from the palette tables above or be a 1-step lighter/darker variation (manual hex shift, not computed). Maximum 8–12 unique colors per terrain tile, 12–20 per entity.
4. **Terrain reads as background.** Terrain tiles should be lower contrast and less saturated than entities. A player standing on forest grass should pop visually.
5. **Entity silhouette test.** If you fill an entity with solid black, can you still tell what it is? If not, the shape needs work.
6. **Consistent lighting.** Light comes from the top-left. Highlights (lighter pixels) on top-left edges of shapes, shadows (darker pixels) on bottom-right.
7. **1-pixel black outline** on all entities and buildings. Do NOT outline terrain tiles (they must tile seamlessly).
8. **Eyes are identity.** Every mob must have visible eyes. Eyes are the first thing the player reads. Use bright accent colors for mob eyes per the palette.
9. **2px internal margin** on item icons. The graphic sits within the center 28×28px of the 32×32 canvas.

### Style Notes

- Aesthetic is **dark fantasy** — muted, earthy, not bright or cartoony. Think torchlit dungeons, not Minecraft.
- Buildings should feel like **icons** — recognizable at a glance, not architectural blueprints.
- The World Boss should be the most detailed texture in the entire game. Use the full 64×64 budget with multi-layer shading.
- Farm plots in "ready" states should have **color-coded crops** instantly distinguishable from each other.
- Food items should look **appetizing** — warm tones, steam wisps where appropriate.

---

## Code Patterns

### Texture Generation Pattern

Every texture in `BootScene.js` follows this pattern:

```js
generateTerrainTile(key, drawFunction) {
    const canvasTexture = this.textures.createCanvas(key, 32, 32);
    const ctx = canvasTexture.context;
    ctx.imageSmoothingEnabled = false;
    
    drawFunction(ctx);
    
    canvasTexture.refresh();
}
```

### Example: Terrain Tile

```js
generateTownGround(ctx) {
    // Base fill
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, 32, 32);
    
    // Mortar lines (subtle grid for cobblestone feel)
    ctx.fillStyle = '#7A6345';
    for (let x = 0; x < 32; x += 8) {
        ctx.fillRect(x, 0, 1, 32);  // vertical mortar
    }
    for (let y = 0; y < 32; y += 6) {
        ctx.fillRect(0, y, 32, 1);  // horizontal mortar
        // Offset every other row for brick pattern
    }
    
    // Noise speckle for texture
    ctx.fillStyle = '#9A8265';
    // scatter 8-12 lighter pixels at pseudo-random positions
    const specks = [[3,5],[12,8],[22,14],[7,25],[28,3],[15,22],[5,18],[19,29]];
    specks.forEach(([x,y]) => ctx.fillRect(x, y, 1, 1));
}
```

### Example: Entity with Outline

```js
generatePlayerEntity(ctx) {
    // Black outline first (draw slightly larger shape)
    ctx.fillStyle = '#000000';
    ctx.fillRect(11, 3, 10, 26);  // body outline
    ctx.fillRect(9, 4, 14, 8);    // head outline area
    
    // Body fill (blue tunic)
    ctx.fillStyle = '#3A7EC8';
    ctx.fillRect(12, 12, 8, 14);  // torso
    
    // Head (skin)
    ctx.fillStyle = '#F5D6A8';
    ctx.fillRect(12, 4, 8, 8);    // head
    
    // Face detail
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(14, 6, 2, 2);    // left eye
    ctx.fillRect(18, 6, 2, 2);    // right eye
    
    // Belt accent
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(12, 17, 8, 2);   // gold belt
    
    // Weapon at side
    ctx.fillStyle = '#BDBDBD';
    ctx.fillRect(21, 10, 2, 12);  // sword blade
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(21, 22, 2, 3);   // sword hilt
}
```

### Example: World Boss (64×64)

```js
generateWorldBoss(ctx) {
    ctx.imageSmoothingEnabled = false;
    
    // This is 64×64 — use the full budget
    // Layer 1: Dark body mass
    ctx.fillStyle = '#B71C1C';
    // ... large central body shape (torso, limbs)
    
    // Layer 2: Fire wreathing
    ctx.fillStyle = '#FF4400';
    // ... flame shapes around shoulders, head
    
    // Layer 3: Hot core/eyes
    ctx.fillStyle = '#FFAB00';
    // ... glowing eye slits, chest core, flame tips
    
    // Layer 4: Shadow/depth
    ctx.fillStyle = '#4A0A0A';
    // ... underside shadows, depth on limbs
    
    // Layer 5: Highlight
    ctx.fillStyle = '#FF8A65';
    // ... top-left edge highlights on major shapes
}
```

### BootScene Structure

```js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate ALL textures, organized by category
        this.generateTerrainTiles();
        this.generateEntityTextures();
        this.generateBossTexture();
        this.generateBuildingTextures();
        this.generateActivityNodeTextures();
        this.generateFarmPlotTextures();
        this.generateItemIcons();
        this.generateGearSkillIcons();
        this.generateUITextures();

        // Boot to game
        this.scene.start('GameScene');
    }

    // --- Helper ---
    makeTexture(key, width, height, drawFn) {
        const tex = this.textures.createCanvas(key, width, height);
        const ctx = tex.context;
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx, width, height);
        tex.refresh();
    }

    // --- Category methods ---
    generateTerrainTiles() {
        this.makeTexture('tile_town_ground', 32, 32, (ctx) => { /* ... */ });
        this.makeTexture('tile_town_path', 32, 32, (ctx) => { /* ... */ });
        // ... all 22 terrain tiles
    }

    generateEntityTextures() {
        this.makeTexture('entity_player', 32, 32, (ctx) => { /* ... */ });
        this.makeTexture('entity_agent', 32, 32, (ctx) => { /* ... */ });
        // ... all 10 entities
    }

    generateBossTexture() {
        this.makeTexture('mob_world_boss', 64, 64, (ctx) => { /* ... */ });
    }

    // ... etc for each category
}
```

---

## Modified Files

### Full Rewrite

| File | Changes |
|------|---------|
| `src/scenes/BootScene.js` | Complete rewrite — all textures rebuilt at 32×32 (116 textures total). Structure as shown in Code Patterns section. |

### Constant Changes

| File | Changes |
|------|---------|
| `src/config/constants.js` | `TILE_SIZE` from `16` → `32`. Camera zoom from `2` → `1`. |

### Hardcoded Value Updates

These files **may** contain hardcoded tile-size references. Search each one and update as needed. Not all will need changes — verify before editing.

| File | What to Check |
|------|--------------|
| `src/scenes/GameScene.js` | World bounds, camera setup, tilemap rendering loop, building placement coordinates, zone boundary checks |
| `src/scenes/HUDScene.js` | Any world-space positioned UI elements |
| `src/entities/Player.js` | `setDisplaySize`, position offsets, HP bar position above sprite |
| `src/entities/Agent.js` | `setDisplaySize`, position offsets, HP bar position above sprite |
| `src/entities/Mob.js` | `setDisplaySize`, position offsets, HP bar position, aggro range calculations |
| `src/entities/WorldBoss.js` | `setDisplaySize(64, 64)`, position offsets (2×2 tile entity) |
| `src/entities/FarmPlot.js` | `setDisplaySize`, plot grid positioning |
| `src/systems/Pathfinding.js` | Tile↔pixel coordinate conversions |
| `src/systems/Spawner.js` | Spawn position calculations |
| `src/systems/TapMoveSystem.js` | Tap coordinate → tile conversion, path visualization positions |
| `src/systems/CombatSystem.js` | Attack range calculations (if pixel-based, not tile-based) |
| `src/systems/FishingSystem.js` | Node position checks |
| `src/systems/MiningSystem.js` | Node position checks |
| `src/systems/FarmingSystem.js` | Plot grid positions |
| `src/utils/mapGenerator.js` | World pixel dimensions, tile placement loops |
| `src/ui/HUDComponents.js` | HP bars above entities (world-space), floating text positions |
| `src/ui/MiniNotifications.js` | Floating damage/gold/XP number spawn positions |
| `src/ui/ActivityHUD.js` | Node indicator positions (if world-space) |
| `src/main.js` | Phaser config `width`/`height` if based on world size, zoom setting |

**Search command to find candidates:**

```bash
grep -rn '\b16\b' src/ --include="*.js" | grep -v 'node_modules' | grep -v '\.min\.'
```

Review each match. If it's tile-size math, update to `32` or `TILE_SIZE`. If it's unrelated (font size, UI pixel offset, array index, etc.), leave it.

---

## What NOT to Build

- **Do NOT change any game logic.** No balance changes, no new features, no new systems.
- **Do NOT change texture key strings.** Every key must match the existing key exactly. The rest of the codebase references these keys.
- **Do NOT add new textures** beyond the 116 specified (plus the 64×64 boss). If Phase 6 content (farming, cooking) doesn't have existing texture keys yet, generate the textures anyway using the keys specified in this document — they'll be ready when Phase 9 is implemented.
- **Do NOT add sprite sheet animations.** All textures remain static single-frame images. Animation comes from Phaser tweens (sway, pulse, etc.), not sprite sheets.
- **Do NOT use `this.load.image()` or external asset files.** All textures are generated at runtime via canvas. External sprites are a separate future phase (Phase 10).
- **Do NOT mix 16×16 and 32×32 textures.** After this phase, ALL textures must be 32×32 (or 64×64 for boss). No partial migrations.
- **Do NOT change the map layout, zone boundaries, mob stats, loot tables, or any data file** other than `constants.js`.
- **Do NOT use `ctx.globalAlpha` for entity rendering** (OK for UI panel backgrounds that need transparency).
- **Do NOT use canvas `createLinearGradient` / `createRadialGradient`** except for UI bar fills.

---

## Success Criteria

All criteria must pass for Phase 8 to be considered complete.

### Stage 1: Mechanical Migration

1. `TILE_SIZE` is `32` in `constants.js`
2. Camera zoom is `1` (not `2`)
3. All hardcoded `* 16`, `/ 16`, `+ 8` (half-tile) references updated across entire `src/`
4. World bounds are 1600×1600 (50 tiles × 32px)
5. Game boots, player moves, agent pathfinds, mobs spawn in correct zones, combat works, all panels open — with stretched 16×16 art

### Stage 2: Texture Rebuild

6. `BootScene.js` is fully rewritten with organized category methods
7. All 22 terrain tiles render at 32×32, tile seamlessly, and follow zone palettes
8. All 10 entity textures render at 32×32 with 1px outlines and readable silhouettes
9. World Boss renders at 64×64, appears visually impressive and distinct from regular mobs
10. All 5 buildings render at 32×32 and are recognizable at a glance
11. All 5 activity nodes render at 32×32 and are distinguishable by type
12. All 9 farm plot states render at 32×32 with distinct crop colors in ready states
13. All 43 item icons render at 32×32 with 2px margin and read against dark panels
14. All 9 gear/skill icons render at 32×32
15. All 17 UI elements render at correct sizes
16. No 16×16 textures remain anywhere — full migration, zero mixed sizes
17. All texture keys match existing key strings exactly (no new keys, no renamed keys)
18. `pixelArt: true` remains in Phaser config, `imageSmoothingEnabled = false` on all canvas contexts
19. Game is functionally identical to pre-Phase 8 — same mechanics, same balance, same interactions
20. Visual test on mobile viewport (390×844) confirms entities are readable and terrain doesn't overwhelm

---

## Appendix: Texture Key Checklist

Use this as a final verification. Every key below must exist and render correctly after Phase 8.

```
TERRAIN (22):
  tile_town_ground, tile_town_path, tile_town_wall, tile_town_garden
  tile_forest_grass, tile_forest_dense, tile_forest_path
  tile_cave_floor, tile_cave_wall, tile_cave_crystal, tile_cave_pit
  tile_swamp_ground, tile_swamp_water, tile_swamp_reeds
  tile_volcanic_rock, tile_volcanic_lava, tile_volcanic_ash, tile_volcanic_edge
  tile_water, tile_water_shallow, tile_bridge, tile_sand

ENTITIES (10):
  entity_player, entity_agent
  mob_slime, mob_goblin, mob_skeleton, mob_bat
  mob_bog_lurker, mob_fungal_shambler, mob_lava_imp, mob_ember_wyrm

WORLD BOSS (1, 64×64):
  mob_world_boss

BUILDINGS (5):
  building_tavern, building_shop, building_forge, building_home, building_kitchen

ACTIVITY NODES (5):
  node_fishing, node_mine_copper, node_mine_iron, node_mine_crystal, node_depleted

FARM PLOTS (9):
  farm_empty, farm_planted, farm_growing
  farm_ready_wheat, farm_ready_carrot, farm_ready_potato
  farm_ready_tomato, farm_ready_pumpkin, farm_ready_starfruit

ITEM ICONS (43):
  item_small_fish, item_medium_fish, item_large_fish, item_rare_fish
  item_copper_ore, item_iron_ore, item_crystal_shard, item_gem
  item_slime_gel, item_goblin_tooth, item_bone_fragment, item_bat_wing
  item_bog_moss, item_fungal_spore, item_lava_shard, item_ember_scale, item_boss_ember
  item_forge_ember
  item_seed_wheat, item_seed_carrot, item_seed_potato, item_seed_tomato, item_seed_pumpkin, item_seed_starfruit
  item_wheat, item_carrot, item_potato, item_tomato, item_pumpkin, item_starfruit
  item_basic_stew, item_fish_soup, item_grilled_meat, item_veggie_wrap
  item_miners_meal, item_anglers_feast, item_combat_ration, item_bossfight_brew, item_starfruit_elixir
  item_gold_coin, item_health_potion

GEAR SLOT ICONS (5):
  icon_slot_weapon, icon_slot_helmet, icon_slot_chest, icon_slot_boots, icon_slot_accessory

SKILL ICONS (4):
  icon_skill_fishing, icon_skill_mining, icon_skill_farming, icon_skill_cooking

UI ELEMENTS (17):
  ui_panel_bg, ui_button, ui_button_pressed, ui_button_disabled, ui_close_button
  ui_bar_bg, ui_bar_hp, ui_bar_xp, ui_bar_activity
  ui_rarity_border_common, ui_rarity_border_uncommon, ui_rarity_border_rare, ui_rarity_border_epic
  ui_loot_burst, ui_arrow_up, ui_arrow_down, ui_tab_active

TOTAL: 116 textures (115 at 32×32 + 1 at 64×64)
```

---

**End of Phase 8 spec. Do not begin Phase 9 until all 20 success criteria pass.**
