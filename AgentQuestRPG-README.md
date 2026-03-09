# AgentQuest — Fantasy Pixel RPG

## Concept

A mobile-first browser RPG where the player starts in a small town and hires AI "agents" to venture into the world, fight mobs, and bring back loot. The player can also explore and fight manually. The core hook: **toggle between controlling yourself and spectating your agent in real-time**.

Think idle-RPG meets classic pixel MMORPG — you're the guild master AND the adventurer.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Engine | **Phaser 3** (latest stable) |
| Build | **Vite** with vanilla JS/ES modules |
| Language | **JavaScript (ES2022+)** — no TypeScript for MVP |
| Package manager | **npm** |
| Target | **Mobile-first, portrait (vertical) orientation** — must feel native on iOS Safari |
| Desktop | Playable but portrait layout is the primary design target |

### Vite Project Structure

```
agentquest/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── (empty — no external assets, all generated at runtime)
└── src/
    ├── main.js              # Phaser game config & boot
    ├── config/
    │   ├── constants.js     # Tile sizes, speeds, zone definitions, colors
    │   ├── mobData.js       # Mob stat tables, loot tables, spawn rules
    │   └── itemData.js      # Item definitions, sell values, icons
    ├── scenes/
    │   ├── BootScene.js     # Preload, generate sprite textures at runtime
    │   ├── GameScene.js     # Main gameplay scene (world, entities, combat)
    │   ├── HUDScene.js      # Parallel scene overlaying GameScene (all UI)
    │   └── ShopScene.js     # Shop overlay scene (sell interface)
    ├── entities/
    │   ├── Player.js        # Player class extending Phaser.GameObjects.Container
    │   ├── Agent.js         # Agent class with FSM AI
    │   └── Mob.js           # Mob class with wander/aggro behavior
    ├── systems/
    │   ├── CombatSystem.js  # Turn-based auto-combat manager
    │   ├── LootSystem.js    # Drop rolls, inventory management
    │   ├── Pathfinding.js   # A* on tile grid (used by Agent + Mobs)
    │   └── Spawner.js       # Mob spawn/respawn logic per zone
    ├── ui/
    │   ├── HUDComponents.js # HP bars, gold counter, XP bar, context prompts
    │   ├── InventoryPanel.js# Full inventory grid overlay
    │   ├── Joystick.js      # Virtual joystick for mobile touch input
    │   └── MiniNotifications.js # Loot pop-ups, level-up banners
    └── utils/
        ├── mapGenerator.js  # Fixed map layout builder (tilemap from array)
        ├── textureGen.js    # Runtime texture/sprite generation via Graphics
        └── helpers.js       # Lerp, distance, random weighted pick, etc.
```

Every file uses **ES module `import`/`export`** syntax. No CommonJS, no global scripts.

---

## Mobile-First Design (Portrait / iOS)

This is the most critical design constraint. Every decision flows from: **the game must feel great held one-handed on an iPhone in portrait mode.**

### Viewport & Scaling

- **Design resolution**: **390 × 844** (iPhone 14/15 logical size, portrait)
- **Phaser scale config**:
  ```js
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: 390,
    height: 844,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
  ```
- The game MUST fill the full viewport with no scrolling. Use `window.innerHeight` and listen for resize events (handles iOS Safari address bar collapse).
- Add to `index.html`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  ```
- Account for **safe areas** on notched iPhones: pad top UI by `env(safe-area-inset-top)` and bottom controls by `env(safe-area-inset-bottom)`. Read these values in JS via `getComputedStyle` and pass to Phaser's HUD scene as offsets.

### Screen Layout (Portrait Split)

The screen is divided into **three vertical zones**:

```
┌─────────────────────┐
│   TOP HUD BAR       │  ~60px - Stats, gold, view toggle
├─────────────────────┤
│                     │
│                     │
│   GAME VIEWPORT     │  ~65% of screen - Tilemap + entities
│   (camera view)     │
│                     │
│                     │
├─────────────────────┤
│  BOTTOM CONTROLS    │  ~25% of screen - Joystick, buttons,
│  + CONTEXT UI       │  mini-inventory, interaction prompts
└─────────────────────┘
```

- **Game viewport**: Camera follows the active entity. The viewport shows roughly 13×14 tiles at a time (each tile = 30×30px at 1x, but rendered at 2x pixel density → 15px logical tiles scaled up). Tune tile size so the world feels explorable but not cramped.
- **Bottom controls area**: This is sacred mobile real estate. It contains the virtual joystick (left side), action buttons (right side), and a collapsible mini-inventory bar.

### Touch Controls

- **Virtual Joystick** (bottom-left quadrant):
  - Rendered as a translucent outer ring (80px diameter) with an inner nub (30px)
  - Fixed position — does NOT float to where the user touches (fixed position is more reliable for one-handed play)
  - 8-directional input snapped to cardinal + diagonal
  - Implement with Phaser pointer events (`pointerdown`, `pointermove`, `pointerup`) — do NOT use DOM overlays for the joystick
  - Nub returns to center on release with a quick elastic tween
  - Subtle haptic hint: pulse the nub opacity when the player hits a wall (visual only — no Haptics API needed for MVP)

- **Action Buttons** (bottom-right quadrant):
  - **`⚔️` Attack / Interact button** (large, 60px circle): Context-sensitive.
    - Near a building → "Enter" action (icon changes to 🏠)
    - Adjacent to mob → initiates combat (icon stays ⚔️)
    - Default → no action, button dims
  - **`📦` Inventory button** (smaller, 44px circle): Opens full inventory overlay
  - **`👁️` Toggle View button** (smaller, 44px circle): Switches camera between Player and Agent (replaces TAB key)
  - All buttons: Generous touch targets (minimum 44×44pt per Apple HIG), clear active/pressed states, slight scale-down on press

- **Tap to interact**: As a secondary option, tapping directly on a nearby building or mob in the game viewport also triggers interaction (if within 2 tiles of the player). This requires converting screen coordinates to tile coordinates accounting for camera offset.

### Desktop Fallback

- WASD/arrow keys for movement (detected via `this.input.keyboard`)
- `E` key for interact, `I` for inventory, `TAB` for agent view toggle
- Hide virtual joystick and on-screen buttons if no touch support detected (`'ontouchstart' in window`)
- Game viewport expands to fill the larger screen (still portrait-centric layout, just more tiles visible)

---

## MVP Scope — Phase 1: Core Loop

Build ONLY these systems. Do not add anything beyond this list.

### 1. Game World (Tilemap)

- **Map size**: 40×40 tile grid
- **Tile size**: 16×16px art, rendered at 2x scale (32×32 display pixels). Set `this.cameras.main.setZoom(2)` or bake scale into the tilemap layer.
- **Three zones**, visually distinct:
  - **Town** (safe zone, ~10×10 area, center-bottom of map): Stone path tiles, building tiles (shop, home, tavern). No mobs spawn here. Warm lighting feel.
  - **Forest** (ring around town, ~60% of map): Green ground tiles with scattered tree obstacles. Low-level mobs.
  - **Caves** (top region + corners, ~25% of map): Dark stone tiles, crystal decorations. Higher-level mobs.
- **Tile types**: `ground`, `wall` (impassable), `tree` (impassable), `building` (impassable, interactive), `path`, `water` (impassable, decorative), `zone_border` (visual transition tiles)
- **Map data**: Define as a 2D array in `mapGenerator.js`. Each cell is an object: `{ type, zone, spawnPoint?, buildingType?, decoration? }`. This is a fixed hand-designed map, NOT procedurally generated.
- **Phaser tilemap**: Use `this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 })` with runtime-generated tileset textures. Set collision on impassable tile indices.
- **Zone boundaries**: Defined in `constants.js` as rectangular regions with `{ x, y, width, height, zone }`. Used by the spawner and mob AI to enforce zone containment.

### 2. Runtime Texture Generation (BootScene)

Since we have NO external sprite assets, generate all textures programmatically in `BootScene` using `this.make.graphics()` and `generateTexture()`:

- **Tiles**: 16×16 pixel art textures for each tile type. Use `fillRect` and `fillPoint` to create pixel patterns:
  - Town ground: Warm gray cobblestone pattern (alternating #8B7355 and #7A6548 pixels in a grid)
  - Forest ground: Earthy green (#2D5A27) with darker pixel noise
  - Cave ground: Dark charcoal (#36393F) with occasional crystal-blue (#5B8FA8) pixels
  - Trees: Dark green trunk (2px wide, 6px tall) with leafy top (6×4 cluster of green shades)
  - Buildings: Simple structures — 12×14px colored rectangles with a darker roof triangle and a 4×6 door. Different colors per building type (tavern = warm brown with amber window, shop = gray stone with sign)
  - Water: Blue (#2856A6) with animated lighter pixel that shifts position each frame

- **Entities**: All 16×16:
  - Player: Blue character silhouette — simple humanoid shape (head circle + body rect + legs). 4 directional frames (just shift the legs/facing indicator).
  - Agent: Green character silhouette — similar shape but with a small backpack rectangle on back.
  - Slime: Green blob (🟢 shape — rounded rectangle that squishes on an idle animation)
  - Wolf: Gray quadruped silhouette (simple 4-legged shape)
  - Cave Bat: Dark purple with wing shapes that alternate between two frames

- **UI elements**: Generate textures for HP bar frames, button backgrounds, joystick ring/nub, inventory slot backgrounds.

Cache all textures with descriptive keys: `'tile_town_ground'`, `'entity_player_down'`, `'mob_slime_idle_0'`, `'ui_btn_circle'`, etc.

### 3. Player Entity (`Player.js`)

- **Class**: Extends `Phaser.GameObjects.Container` containing the player sprite and an HP bar sprite positioned above.
- **Movement**:
  - Input source: Virtual joystick (mobile) or WASD keys (desktop)
  - Grid-based with smooth interpolation: Player moves tile-to-tile. When a direction is pressed, check if the target tile is passable. If yes, tween the player to that tile position over ~170ms (6 tiles/sec). Queue the next move if input is held.
  - Use `this.scene.tweens.add()` for smooth movement between tiles. Block new movement input until the current tween completes.
  - Update the sprite texture based on facing direction.
- **Stats object**:
  ```js
  { hp: 50, maxHp: 50, atk: 5, def: 2, level: 1, xp: 0, xpToNext: 25, gold: 20 }
  ```
- **Collision**: Before moving, check the tilemap collision layer. Also check against other entity positions.
- **Interaction**: When the action button is pressed and the player is adjacent to (within 1 tile of) a building, trigger the building's interaction:
  - Tavern → Hire agent (if gold ≥ 10 and no agent exists yet)
  - Shop → Open ShopScene as overlay

### 4. Agent System (`Agent.js`)

- **Class**: Same Container structure as Player (sprite + HP bar)
- **Finite State Machine** with these states:

  ```
  IDLE → HUNTING → COMBAT → RETURNING → DEPOSITING → HUNTING (loop)
                                   ↑                        |
                                   └── (inventory full) ────┘
  ```

  - **IDLE**: Agent stands in town. Activated when first hired. Transitions to HUNTING immediately.
  - **HUNTING**: Uses A* pathfinding to locate the nearest mob. Moves toward it at 4 tiles/sec (250ms per tile tween). Recalculates path every 2 seconds or when target mob dies. If no mobs exist, wait 1 second and re-check.
  - **COMBAT**: Engaged with a mob (see Combat System). Cannot move. On mob death, roll loot, add to agent's personal inventory (max 10 items), transition to HUNTING. If agent inventory is full (10 items), transition to RETURNING.
  - **RETURNING**: A* pathfind to the town center tile. Move at 4 tiles/sec.
  - **DEPOSITING**: On reaching town, transfer items one-by-one to the shared stash (with a slight 200ms delay between each for visual feedback in the HUD). Then transition to HUNTING.

- **Agent death**: If HP ≤ 0 in combat, agent state becomes `RETREATING`. Agent becomes semi-transparent (alpha 0.5), ignores collision with mobs, pathfinds to town at 8 tiles/sec. On arrival, heal to full over 3 seconds (HP ticks up visually), then resume HUNTING.
- **Toggle**: The `👁️` button (or TAB) switches `cameraTarget` between player and agent. The camera smoothly pans (lerp) to the new target. Both entities always continue their behavior regardless of who is being viewed.

### 5. Mobs (`Mob.js`)

- **Mob type definitions** (in `mobData.js`):

  | Name | Zone | HP | ATK | DEF | XP | Speed | Aggro Range |
  |------|------|----|-----|-----|----|-------|-------------|
  | Slime | Forest | 15 | 3 | 1 | 5 | 1 tile/2s | 3 tiles |
  | Wolf | Forest | 25 | 5 | 2 | 10 | 1 tile/1s | 5 tiles |
  | Cave Bat | Caves | 20 | 6 | 1 | 12 | 1 tile/0.8s | 4 tiles |

- **Loot tables** (in `mobData.js`):

  | Mob | Drop 1 | Drop 2 | Drop 3 | Nothing |
  |-----|--------|--------|--------|---------|
  | Slime | Slime Gel (60%) | Gold Coin (30%) | — | 10% |
  | Wolf | Wolf Pelt (50%) | Fang (25%) | Gold Coin (20%) | 5% |
  | Cave Bat | Bat Wing (55%) | Echo Stone (15%) | Gold Coin (25%) | 5% |

- **Mob AI** (per-mob `update` method):
  - **Wander**: Every `wanderInterval` (randomized 2–4 seconds), pick a random adjacent passable tile within the mob's zone. Tween to it.
  - **Aggro**: Each tick, check distance to Player and Agent. If either is within `aggroRange` tiles, switch to pursuit mode — pathfind toward the closest target, moving at mob speed. Mobs NEVER leave their assigned zone (clamp target tile to zone bounds).
  - **Combat**: When mob occupies the same tile as player/agent, CombatSystem takes over.
  - **Death**: On HP ≤ 0, play a quick death animation (shrink to 0 scale over 200ms + fade), destroy the game object, notify Spawner to queue respawn.

- **Spawner** (`Spawner.js`):
  - Maintains a count of active mobs per zone. Max: Forest = 8, Caves = 5.
  - When a mob dies, queue a respawn for that zone after 5 seconds. Pick a random valid (passable, unoccupied) tile within the zone and create a new mob there.
  - On scene start, spawn all zones to capacity immediately.

### 6. Combat System (`CombatSystem.js`)

- **Manager pattern**: The CombatSystem is a singleton-style class instantiated by GameScene. It tracks all active combats as an array of `{ attacker, defender, timer }` objects.
- **Engagement**: When two entities occupy the same tile (detected in GameScene update), register a combat. Lock both entities in place (pause their movement/AI).
- **Combat tick** (every 800ms, using a Phaser `TimerEvent`):
  1. Attacker hits defender: `damage = Math.max(1, attacker.stats.atk - defender.stats.def)`
  2. Defender hits attacker: `damage = Math.max(1, defender.stats.atk - attacker.stats.def)`
  3. Apply damage to both. Trigger visual feedback (see below).
  4. Check HP: If defender (mob) ≤ 0 → attacker wins, grant XP, call LootSystem.rollDrop(). If attacker ≤ 0 → handle defeat.
- **Visual feedback**:
  - On hit: Tint the damaged entity red (`setTint(0xff0000)`) for 150ms, then clear tint.
  - Floating damage numbers: Create a `Phaser.GameObjects.Text` at the entity position, style: bold, white with dark outline, 12px. Tween it upward by 20px and fade alpha to 0 over 600ms, then destroy.
  - On death: Entity flashes white, shrinks, fades (combined tween).

### 7. Loot System (`LootSystem.js`)

- **`rollDrop(mobType)`**: Takes a mob type key, reads its loot table from `mobData.js`, does a weighted random pick, returns an item object or null.
- **Item data** (in `itemData.js`):

  | Item | Emoji | Sell Value |
  |------|-------|------------|
  | Slime Gel | 💚 | 2g |
  | Wolf Pelt | 🟤 | 5g |
  | Fang | 🦷 | 3g |
  | Bat Wing | 🖤 | 4g |
  | Echo Stone | 💎 | 10g |
  | Gold Coin | 🪙 | — (auto-adds to gold) |

- **Inventory structure**: Shared stash is an array of `{ id, name, emoji, quantity, sellValue }`. Max 30 unique stacks. Gold Coins bypass inventory and add directly to the gold counter.
- **Agent inventory**: Separate temporary array (max 10 items). Transferred to shared stash during DEPOSITING state.
- **Loot pickup visual**: When loot drops from a mob, briefly show the item emoji floating at the mob's death position, then tween it toward the bottom of the screen (toward the mini-inventory area) and fade. Use `scene.add.text()` with the emoji.

### 8. HUD Scene (`HUDScene.js`)

Run as a **parallel scene** on top of GameScene (`this.scene.launch('HUDScene')`). This scene renders ALL UI and receives data from GameScene via the Phaser event system (`this.scene.get('GameScene').events`).

**Layout (portrait, top to bottom):**

#### Top HUD Bar (~60px, fixed to top + safe area inset)

```
┌──────────────────────────────────┐
│ 👁️ You  ·  🏘️ Town   ·   🪙 20  │
└──────────────────────────────────┘
```

- **Left**: View indicator icon + label ("You" or "Agent") — tappable to toggle
- **Center**: Current zone name of the viewed entity
- **Right**: Gold amount with coin icon

Style: Dark panel background (#1A1A2E, 85% opacity), parchment-colored text (#F5E6C8), pixel-style font (use Phaser's built-in bitmap text or generate a simple bitmap font texture).

#### Entity Stats (below top bar, ~40px)

- HP bar: Red background, green fill proportional to HP/maxHP. Text overlay: `"HP 45/50"`
- XP bar: Thin bar below HP. Dark purple background, gold fill. Text: `"Lv.1 — 3/25 XP"`
- Show stats of **whichever entity is currently being viewed**.

#### Bottom Controls (~200px, fixed to bottom + safe area inset)

```
┌──────────────────────────────────┐
│                                  │
│  [ Joystick ]        [⚔️] [📦]  │
│      area            [👁️]       │
│                                  │
│  ┌─ Mini Inventory Tray ──────┐ │
│  │ 💚×3  🟤×1  🦷×2           │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

- **Joystick**: Drawn in the HUD scene at fixed screen position (bottom-left). See Touch Controls spec above.
- **Action buttons**: Bottom-right cluster. Use generated circular button textures with emoji overlays.
- **Mini-inventory tray**: A horizontal scrollable row showing the last 5 distinct items received, with quantity badges. When a new item arrives, it slides in from the right with a pop animation (scale from 0 → 1.1 → 1.0).

#### Context Prompt

- When the player is adjacent to an interactive building, show a banner above the bottom controls: `"Tap ⚔️ to enter Tavern"`. Fade in/out with 200ms tween.

#### Notifications

- **Loot received**: `"+1 Wolf Pelt 🟤"` slides in from the right edge, holds for 1.5s, slides out. Stack up to 3 notifications.
- **Level up**: Full-width gold banner: `"⭐ Level 2! ATK +1, HP +5"` with a pulse animation. Holds for 3 seconds.
- **Agent status**: Small persistent indicator in the top HUD when viewing player: `"🤖 Agent: Hunting 🌲"` or `"🤖 Agent: Returning 🏘️"`.

### 9. Shop Scene (`ShopScene.js`)

- Launched as an overlay scene when the player interacts with the Shop building.
- **Layout**: Semi-transparent dark backdrop. Centered panel (80% width, 70% height) showing inventory grid.
- Each item row: `[emoji] [name] × [qty] — [sell value]g [SELL button]`
- Tapping SELL removes 1 from quantity, adds gold. If quantity hits 0, remove the item row with a fade.
- **Close button**: Top-right `✕` or tap outside the panel. Resumes GameScene input.
- Animate panel in: slide up from bottom + fade. Animate out: slide down + fade.

### 10. Pathfinding (`Pathfinding.js`)

- **A\* implementation**: Takes a 2D grid (from the tilemap collision data), a start tile `{x,y}`, and an end tile `{x,y}`. Returns an array of tile coordinates representing the path.
- **Grid**: Build a walkability grid from the tilemap on scene create. Update it if/when entities occupy tiles (optional for MVP — mobs can overlap).
- **Optimizations**:
  - Manhattan distance heuristic (no diagonals — 4-directional movement only for MVP)
  - Cache the last computed path per agent. Only recalculate when the target tile changes.
  - Max path length of 60 tiles (abort search beyond this to prevent lag on large map)
- **Usage**: Agent uses this to navigate to mobs and back to town. Mobs use a simplified version (just pick the next tile toward the target using BFS for aggro chase, since they stay in-zone).

---

## Visual Style

### Color Palette

```js
// constants.js
export const COLORS = {
  // Town
  TOWN_GROUND: 0x8B7355,
  TOWN_PATH: 0x9C8A6E,
  TOWN_BUILDING: 0x6B4226,
  TOWN_ROOF: 0x8B0000,
  TOWN_LANTERN: 0xDAA520,

  // Forest
  FOREST_GROUND: 0x2D5A27,
  FOREST_GRASS: 0x4A7C3F,
  FOREST_DARK: 0x1A3A15,
  FOREST_TREE_TRUNK: 0x3E2723,
  FOREST_TREE_LEAVES: 0x388E3C,

  // Caves
  CAVE_GROUND: 0x36393F,
  CAVE_WALL: 0x1A1A2E,
  CAVE_CRYSTAL: 0x5B8FA8,
  CAVE_PURPLE: 0x4A4458,

  // UI
  UI_PANEL: 0x1A1A2E,
  UI_PANEL_ALPHA: 0.85,
  UI_TEXT: 0xF5E6C8,
  UI_GOLD: 0xDAA520,
  UI_HP_GREEN: 0x4CAF50,
  UI_HP_RED: 0xB71C1C,
  UI_XP_FILL: 0xDAA520,
  UI_XP_BG: 0x2C1A4A,
  UI_BUTTON_BG: 0x2A2A3E,
  UI_BUTTON_ACTIVE: 0x3A3A5E,
};
```

### Aesthetic Direction

- **Chunky pixel art**: All textures are 16×16. Camera zoom ensures pixels are visible and crisp. `pixelArt: true` in game config disables antialiasing.
- **Dark fantasy, muted palette**: This is NOT a bright/cartoony game. Think dark forest at dusk, flickering lanterns, cold caves. Contrast comes from UI elements (warm gold on dark panels).
- **Ambient animations**:
  - Trees: Subtle Y-offset oscillation (±1px, 2s cycle) via sine wave in update
  - Town lanterns: Alternate between two gold shades every 500ms
  - Water tiles: Shift a highlight pixel position each frame
  - Mob idle: Gentle scale pulse (1.0 → 1.05 → 1.0 over 1.5s, looped tween)

---

## Phaser Game Config (`main.js`)

```js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { ShopScene } from './scenes/ShopScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 390,
    height: 844,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, HUDScene, ShopScene],
  backgroundColor: '#0a0a14',
};

new Phaser.Game(config);
```

**Note**: Arcade physics is included in the config for convenience (overlap detection), but movement is handled via tween-based grid movement, NOT velocity-based physics. Use `physics.add.overlap()` only for detecting when entities share a tile.

---

## Architecture Guidelines

### Scene Communication

- **GameScene → HUDScene**: Use Phaser's event emitter.
  ```js
  // GameScene emits:
  this.events.emit('playerStatsChanged', player.stats);
  this.events.emit('lootReceived', { item, source: 'player' });
  this.events.emit('goldChanged', totalGold);
  this.events.emit('agentStateChanged', agent.currentState);
  this.events.emit('viewTargetChanged', 'player' | 'agent');
  this.events.emit('contextAction', { type: 'building', name: 'Tavern' });

  // HUDScene listens:
  const gameScene = this.scene.get('GameScene');
  gameScene.events.on('playerStatsChanged', this.updateHP, this);
  ```

- **HUDScene → GameScene**: For button presses (interact, toggle view):
  ```js
  // HUDScene emits:
  this.scene.get('GameScene').events.emit('actionButtonPressed');
  this.scene.get('GameScene').events.emit('toggleView');
  ```

### Entity Architecture

All game entities (Player, Agent, Mob) follow this pattern:

```js
export class Player extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY) {
    super(scene, tileX * TILE_SIZE, tileY * TILE_SIZE);
    this.tileX = tileX;
    this.tileY = tileY;
    this.stats = { hp: 50, maxHp: 50, atk: 5, def: 2, level: 1, xp: 0, xpToNext: 25 };
    this.isMoving = false;
    this.facing = 'down';
    this.inCombat = false;

    // Create sprite from generated texture
    this.sprite = scene.add.image(0, 0, 'entity_player_down');
    this.add(this.sprite);

    // HP bar above entity
    this.hpBar = new HPBar(scene, 0, -12);
    this.add(this.hpBar);

    scene.add.existing(this);
  }

  moveTo(tileX, tileY) { /* tween-based grid move */ }
  takeDamage(amount) { /* reduce HP, flash red, check death */ }
  heal(amount) { /* restore HP, clamp to max */ }
  gainXP(amount) { /* add XP, check level up */ }
}
```

### Performance Considerations

- **Object pooling**: Use Phaser's `Group` with `maxSize` for mobs and floating damage numbers. Recycle dead objects instead of creating new ones.
- **Camera culling**: Phaser handles this for sprites by default, but ensure off-screen mobs still run their AI timer (just skip rendering).
- **Pathfinding throttle**: Run A* at most once per second per entity. Cache results.
- **Mobile frame rate**: Target 60fps. If performance drops on mobile, reduce ambient animations first (tree sway, water shimmer).
- **Touch event handling**: Use Phaser's input system exclusively. Do NOT attach DOM touch listeners (they conflict with Phaser's pointer handling on mobile).

---

## Vite Config (`vite.config.js`)

```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    host: true, // Allow LAN access for mobile testing
    port: 5173,
  },
});
```

---

## What NOT to Build (Yet)

These are planned for future phases. Do not implement any of these:

- ❌ Equipment / gear system
- ❌ Multiple agents
- ❌ Crafting
- ❌ Fishing, mining, or secondary skills
- ❌ Boss mobs
- ❌ Abilities or skill trees
- ❌ NPCs with dialogue
- ❌ Sound or music
- ❌ Save/load (localStorage or otherwise)
- ❌ Procedural map generation
- ❌ Multiplayer
- ❌ Diagonal movement (4-directional only for Phase 1)

---

## Success Criteria

The game is complete when:

1. `npm run dev` launches cleanly, game fills the mobile viewport in portrait orientation
2. Virtual joystick works smoothly on iOS Safari — player moves tile-to-tile with no jank
3. Tapping the action button near the Tavern hires an agent for 10 gold
4. Agent autonomously hunts mobs with visible A* pathing, fights them, and returns loot to town
5. The view toggle button smoothly pans the camera between player and agent
6. Mobs spawn in correct zones, wander, aggro toward nearby entities, and drop loot on death
7. Combat shows floating damage numbers and entity flash effects
8. Loot appears in the shared inventory; Gold Coins auto-convert to gold
9. The shop allows selling items for gold
10. Leveling works: XP accumulates, level-up banner appears, stats increase
11. All runtime-generated pixel art is visually consistent — the game looks and feels like a cohesive dark fantasy pixel RPG
12. The game runs at 60fps on a modern iPhone with no input lag on the joystick

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
