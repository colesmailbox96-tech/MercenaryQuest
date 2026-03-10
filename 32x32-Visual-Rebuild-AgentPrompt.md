# 32×32 Visual Rebuild — Complete Texture Upgrade

## Directive

Replace the entire `BootScene.js` file with the new version provided below. Then update all files that reference the old 16×16 tile size to use the new 32×32 tile size. Do NOT modify any game logic, systems, or features — this is a visual-only migration.

---

## Overview

Every runtime-generated texture is being upgraded from 16×16 to 32×32 pixels, with doubled pixel detail across all 6 phases. The World Boss texture increases from 32×32 to 64×64 (2×2 tiles). The map stays the same tile count (50×50) but doubles in pixel dimensions. Camera zoom is halved to compensate, so the game looks the same on screen but with crisper art.

---

## Step 1: Update `src/config/constants.js`

Find and replace the tile size constant:

```js
// OLD
export const TILE_SIZE = 16;

// NEW
export const TILE_SIZE = 32;
```

If there are any other hardcoded references to `16` as a tile size in this file, update them to `32`.

---

## Step 2: Update `src/main.js` — Phaser Config

The old setup rendered 16px tiles at 2× zoom (= 32px per tile on screen). To keep the same visual scale with 32px tiles, change zoom to 1×:

```js
// In the Phaser game config object:

// If zoom is set to 2, change it to 1:
// zoom: 2,    ← REMOVE or change to 1

// Keep pixelArt: true — this is still pixel art
// Keep scale mode as Phaser.Scale.RESIZE
```

If the config uses `Phaser.Scale.RESIZE`, no width/height changes are needed. If it uses fixed dimensions, double them.

**Optional:** Use `zoom: 1.5` if tiles look too small on phone screens. Test on a real device.

---

## Step 3: Update `src/utils/mapGenerator.js`

The map grid stays **50×50 tiles**. No tile count changes needed. However:

- Search for any hardcoded `* 16` or `/ 16` pixel calculations and replace with `* TILE_SIZE` or `/ TILE_SIZE` (importing the constant).
- World pixel dimensions change from `800×800` to `1600×1600` automatically if using `MAP_WIDTH * TILE_SIZE`.

---

## Step 4: Update `src/scenes/GameScene.js`

Update camera bounds and any hardcoded pixel references:

```js
// Camera bounds should use the constant:
this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

// If camera zoom is set manually, halve it:
// this.cameras.main.setZoom(2);  →  this.cameras.main.setZoom(1);
```

---

## Step 5: Update Entity Classes

In `src/entities/Player.js`, `Agent.js`, `Mob.js`, `WorldBoss.js`, `FarmPlot.js`:

- If sprites use `setDisplaySize(16, 16)`, change to `setDisplaySize(32, 32)` (or use `TILE_SIZE`).
- World Boss: `setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2)` for its 64×64 texture.
- If entity positions are calculated with hardcoded `* 16` or `/ 16`, replace with `* TILE_SIZE` / `/ TILE_SIZE`.

---

## Step 6: Update UI Files

In `src/scenes/HUDScene.js`, `src/ui/*.js`:

- UI elements that reference tile-relative pixel positions may need adjustment.
- The HUD scene runs at screen resolution (not world resolution), so most HUD code should be unaffected.
- Any world-to-screen coordinate conversions that use hardcoded `16` must be updated.

---

## Step 7: Global Search & Replace

Run these searches across the entire `src/` directory to catch any remaining hardcoded references:

```bash
grep -rn "* 16" src/ --include="*.js"
grep -rn "/ 16" src/ --include="*.js"
grep -rn "16, 16" src/ --include="*.js"
grep -rn "setDisplaySize(16" src/ --include="*.js"
```

Replace matches that refer to tile/sprite size with `TILE_SIZE` or `32`. Ignore matches that are unrelated to tile size (e.g., array indices, timer values, UI padding).

---

## Step 8: Replace `src/scenes/BootScene.js`

Delete the entire contents of the existing `BootScene.js` and replace with the following complete file. This contains **every texture** across all 6 phases, rebuilt at 32×32:

```js
// ============================================================================
// BootScene.js — Complete 32×32 Texture Rebuild (All Phases 1–6)
// ============================================================================
// All textures upgraded from 16×16 → 32×32
// World Boss texture is 64×64 (2×2 tiles at 32px each)
// Texture keys are UNCHANGED — drop-in replacement
// ============================================================================

const T = 32; // Tile/texture size

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No external assets — everything generated at runtime
  }

  create() {
    this.generateAllTextures();
    this.scene.start('GameScene');
  }

  // ==========================================================================
  // MASTER GENERATOR
  // ==========================================================================
  generateAllTextures() {
    // --- Terrain ---
    this.generateTownTerrain();
    this.generateForestTerrain();
    this.generateCaveTerrain();
    this.generateSwampTerrain();
    this.generateVolcanicTerrain();
    this.generateWaterTiles();

    // --- Buildings ---
    this.generateBuildings();

    // --- Entities ---
    this.generatePlayerSprite();
    this.generateAgentSprite();
    this.generateMobSprites();
    this.generateWorldBoss();

    // --- Activity locations ---
    this.generateFishingSpots();
    this.generateMiningNodes();

    // --- Farm (Phase 6) ---
    this.generateFarmPlots();

    // --- Item icons ---
    this.generateMaterialIcons();
    this.generateGearIcons();
    this.generateSeedIcons();
    this.generateCropIcons();
    this.generateFoodIcons();
    this.generateSkillIcons();

    // --- UI elements ---
    this.generateUITextures();
  }

  // ==========================================================================
  // HELPER: Create a graphics context, draw, generate texture, destroy
  // ==========================================================================
  makeTexture(key, width, height, drawFn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    drawFn(g, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  tex(key, drawFn) {
    this.makeTexture(key, T, T, drawFn);
  }

  // Helper: fill entire tile with a color
  fillTile(g, color) {
    g.fillStyle(color, 1);
    g.fillRect(0, 0, T, T);
  }

  // Helper: random int between min and max (inclusive)
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Helper: subtle noise dithering on a base color
  dither(g, baseColor, noiseColor, density = 0.15) {
    for (let x = 0; x < T; x += 2) {
      for (let y = 0; y < T; y += 2) {
        if (Math.random() < density) {
          g.fillStyle(noiseColor, 1);
          g.fillRect(x, y, 2, 2);
        }
      }
    }
  }

  // ==========================================================================
  // TERRAIN: TOWN
  // ==========================================================================
  generateTownTerrain() {
    // Town grass — warm green with subtle variation
    this.tex('tile_grass', (g) => {
      this.fillTile(g, 0x4A7C3F);
      this.dither(g, 0x4A7C3F, 0x3D6B34, 0.2);
      this.dither(g, 0x4A7C3F, 0x5A8C4F, 0.1);
      // Occasional grass blade detail
      for (let i = 0; i < 3; i++) {
        const bx = this.randInt(2, 28);
        const by = this.randInt(2, 28);
        g.fillStyle(0x5A9C4F, 1);
        g.fillRect(bx, by, 2, 4);
      }
    });

    // Stone path — cobblestone pattern
    this.tex('tile_path', (g) => {
      this.fillTile(g, 0x8B8878);
      // Cobblestone grid pattern
      g.fillStyle(0x7A7768, 1);
      for (let x = 0; x < T; x += 8) {
        g.fillRect(x, 0, 1, T);
      }
      for (let y = 0; y < T; y += 8) {
        g.fillRect(0, y, T, 1);
      }
      // Offset every other row
      g.fillStyle(0x6A6758, 1);
      for (let y = 0; y < T; y += 16) {
        g.fillRect(4, y + 8, 1, 8);
        g.fillRect(12, y + 8, 1, 8);
        g.fillRect(20, y + 8, 1, 8);
        g.fillRect(28, y + 8, 1, 8);
      }
      this.dither(g, 0x8B8878, 0x9A9888, 0.08);
    });

    // Town wall / boundary
    this.tex('tile_wall', (g) => {
      this.fillTile(g, 0x6B5A4A);
      // Brick pattern
      g.fillStyle(0x5A4A3A, 1);
      for (let y = 0; y < T; y += 8) {
        g.fillRect(0, y, T, 1);
        const offset = (y % 16 === 0) ? 0 : 8;
        for (let x = offset; x < T; x += 16) {
          g.fillRect(x, y, 1, 8);
        }
      }
      this.dither(g, 0x6B5A4A, 0x7B6A5A, 0.06);
    });

    // Town door / entrance marker
    this.tex('tile_door', (g) => {
      this.fillTile(g, 0x4A3520);
      // Wooden door planks
      g.fillStyle(0x5A4530, 1);
      g.fillRect(4, 2, 10, 28);
      g.fillRect(18, 2, 10, 28);
      // Handle
      g.fillStyle(0xDAA520, 1);
      g.fillRect(14, 14, 4, 4);
      // Frame
      g.fillStyle(0x3A2510, 1);
      g.fillRect(0, 0, T, 2);
      g.fillRect(0, 30, T, 2);
      g.fillRect(0, 0, 2, T);
      g.fillRect(30, 0, 2, T);
      g.fillRect(14, 0, 4, T);
    });
  }

  // ==========================================================================
  // TERRAIN: FOREST
  // ==========================================================================
  generateForestTerrain() {
    // Forest grass — deep green, darker than town
    this.tex('tile_forest_grass', (g) => {
      this.fillTile(g, 0x2D5A27);
      this.dither(g, 0x2D5A27, 0x1A3A15, 0.25);
      this.dither(g, 0x2D5A27, 0x3A6A34, 0.12);
      // Fallen leaf details
      for (let i = 0; i < 2; i++) {
        g.fillStyle(0x4A3A20, 0.6);
        g.fillRect(this.randInt(2, 26), this.randInt(2, 26), 4, 2);
      }
    });

    // Forest tree — trunk with full canopy
    this.tex('tile_tree', (g) => {
      this.fillTile(g, 0x1A3A15);
      // Trunk
      g.fillStyle(0x4A3220, 1);
      g.fillRect(12, 18, 8, 14);
      g.fillStyle(0x3A2210, 1);
      g.fillRect(12, 18, 2, 14);
      // Canopy — layered
      g.fillStyle(0x1D4A17, 1);
      g.fillRect(2, 2, 28, 20);
      g.fillStyle(0x2D5A27, 1);
      g.fillRect(4, 4, 24, 16);
      g.fillStyle(0x3A6A34, 1);
      g.fillRect(8, 6, 16, 10);
      // Canopy highlights
      g.fillStyle(0x4A7C3F, 1);
      g.fillRect(10, 8, 4, 4);
      g.fillRect(18, 6, 4, 4);
      g.fillRect(14, 10, 4, 2);
      // Dark shadow spots
      g.fillStyle(0x1A3A15, 1);
      g.fillRect(6, 10, 4, 4);
      g.fillRect(22, 12, 4, 4);
    });

    // Forest dark grass (shadow areas)
    this.tex('tile_dark_grass', (g) => {
      this.fillTile(g, 0x1A3A15);
      this.dither(g, 0x1A3A15, 0x2D5A27, 0.15);
      this.dither(g, 0x1A3A15, 0x0D2A0A, 0.1);
    });

    // Forest path (dirt trail)
    this.tex('tile_forest_path', (g) => {
      this.fillTile(g, 0x5A4A30);
      this.dither(g, 0x5A4A30, 0x4A3A20, 0.2);
      this.dither(g, 0x5A4A30, 0x6A5A40, 0.1);
      g.fillStyle(0x7A6A50, 1);
      g.fillRect(8, 12, 2, 2);
      g.fillRect(20, 6, 2, 2);
      g.fillRect(14, 24, 2, 2);
    });
  }

  // ==========================================================================
  // TERRAIN: CAVES
  // ==========================================================================
  generateCaveTerrain() {
    // Cave floor
    this.tex('tile_cave_floor', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.2);
      this.dither(g, 0x36393F, 0x40434A, 0.12);
      g.fillStyle(0x2A2D33, 0.5);
      g.fillRect(4, 10, 12, 1);
      g.fillRect(18, 22, 10, 1);
    });

    // Cave wall
    this.tex('tile_cave_wall', (g) => {
      this.fillTile(g, 0x2A2D33);
      g.fillStyle(0x36393F, 1);
      g.fillRect(2, 4, 10, 8);
      g.fillRect(14, 2, 14, 6);
      g.fillRect(6, 16, 12, 10);
      g.fillRect(20, 14, 10, 8);
      g.fillStyle(0x1A1D23, 1);
      g.fillRect(12, 4, 2, 6);
      g.fillRect(4, 14, 8, 2);
      g.fillRect(18, 12, 2, 8);
      g.fillStyle(0x4A4D53, 1);
      g.fillRect(4, 4, 2, 2);
      g.fillRect(22, 16, 2, 2);
    });

    // Crystal formation
    this.tex('tile_crystal', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.15);
      g.fillStyle(0x5B8FA8, 1);
      g.fillRect(12, 6, 8, 20);
      g.fillRect(10, 10, 12, 14);
      g.fillRect(14, 2, 4, 6);
      g.fillRect(22, 12, 6, 14);
      g.fillRect(24, 8, 4, 6);
      g.fillRect(4, 18, 4, 10);
      g.fillRect(6, 14, 2, 6);
      g.fillStyle(0x8BBFD8, 1);
      g.fillRect(14, 8, 2, 8);
      g.fillRect(24, 14, 2, 6);
      g.fillRect(6, 20, 2, 4);
      g.fillStyle(0xAADDEE, 1);
      g.fillRect(14, 10, 2, 4);
    });

    // Cave purple-gray accent
    this.tex('tile_cave_accent', (g) => {
      this.fillTile(g, 0x4A4458);
      this.dither(g, 0x4A4458, 0x36393F, 0.2);
      this.dither(g, 0x4A4458, 0x5A5468, 0.08);
    });
  }

  // ==========================================================================
  // TERRAIN: SWAMP (Phase 5)
  // ==========================================================================
  generateSwampTerrain() {
    // Swamp ground
    this.tex('tile_swamp_ground', (g) => {
      this.fillTile(g, 0x3A4A2A);
      this.dither(g, 0x3A4A2A, 0x2A3A1A, 0.25);
      this.dither(g, 0x3A4A2A, 0x4A5A3A, 0.1);
      g.fillStyle(0x4A6A2A, 0.6);
      g.fillRect(6, 8, 6, 4);
      g.fillRect(20, 20, 8, 4);
    });

    // Swamp water
    this.tex('tile_swamp_water', (g) => {
      this.fillTile(g, 0x2A3A2A);
      this.dither(g, 0x2A3A2A, 0x1A2A1A, 0.2);
      g.fillStyle(0x3A4A3A, 0.5);
      g.fillRect(4, 8, 8, 2);
      g.fillRect(16, 18, 10, 2);
      g.fillRect(8, 26, 6, 2);
      g.fillStyle(0x4A6A2A, 0.4);
      g.fillRect(10, 12, 4, 4);
      g.fillRect(22, 6, 4, 4);
    });

    // Mud
    this.tex('tile_mud', (g) => {
      this.fillTile(g, 0x2A3A1A);
      this.dither(g, 0x2A3A1A, 0x3A4A2A, 0.15);
      this.dither(g, 0x2A3A1A, 0x1A2A0A, 0.2);
      g.fillStyle(0x3A4A3A, 0.3);
      g.fillRect(8, 14, 6, 2);
      g.fillRect(18, 22, 8, 2);
    });

    // Dead tree
    this.tex('tile_dead_tree', (g) => {
      this.fillTile(g, 0x3A4A2A);
      this.dither(g, 0x3A4A2A, 0x2A3A1A, 0.2);
      g.fillStyle(0x4A3A30, 1);
      g.fillRect(12, 10, 8, 22);
      g.fillStyle(0x3A2A20, 1);
      g.fillRect(12, 10, 2, 22);
      g.fillStyle(0x4A3A30, 1);
      g.fillRect(6, 6, 8, 3);
      g.fillRect(4, 4, 4, 3);
      g.fillRect(18, 4, 8, 3);
      g.fillRect(24, 2, 4, 3);
      g.fillRect(14, 2, 4, 10);
      g.fillStyle(0x4A6A2A, 0.6);
      g.fillRect(6, 9, 2, 4);
      g.fillRect(24, 5, 2, 6);
    });
  }

  // ==========================================================================
  // TERRAIN: VOLCANIC RIFT (Phase 5)
  // ==========================================================================
  generateVolcanicTerrain() {
    // Volcanic rock
    this.tex('tile_volcanic_rock', (g) => {
      this.fillTile(g, 0x1A1A1A);
      this.dither(g, 0x1A1A1A, 0x2A2A2A, 0.2);
      this.dither(g, 0x1A1A1A, 0x0D0D0D, 0.1);
      g.fillStyle(0x3A1500, 0.4);
      g.fillRect(4, 12, 10, 1);
      g.fillRect(8, 12, 1, 8);
      g.fillRect(18, 4, 1, 12);
      g.fillRect(18, 4, 8, 1);
    });

    // Lava
    this.tex('tile_lava', (g) => {
      this.fillTile(g, 0xFF4400);
      this.dither(g, 0xFF4400, 0xFFAA00, 0.3);
      this.dither(g, 0xFF4400, 0xCC3300, 0.2);
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(8, 8, 6, 4);
      g.fillRect(18, 18, 8, 4);
      g.fillRect(4, 22, 4, 4);
      g.fillStyle(0x991100, 1);
      g.fillRect(14, 14, 4, 4);
      g.fillRect(24, 6, 4, 4);
    });

    // Ash ground
    this.tex('tile_ash', (g) => {
      this.fillTile(g, 0x2A2A2A);
      this.dither(g, 0x2A2A2A, 0x3A3A3A, 0.15);
      this.dither(g, 0x2A2A2A, 0x1A1A1A, 0.15);
      g.fillStyle(0xFF4400, 0.3);
      g.fillRect(10, 8, 2, 2);
      g.fillRect(22, 20, 2, 2);
      g.fillRect(6, 26, 2, 2);
    });

    // Volcanic wall
    this.tex('tile_volcanic_wall', (g) => {
      this.fillTile(g, 0x0D0D0D);
      g.fillStyle(0x1A1A1A, 1);
      g.fillRect(2, 6, 12, 8);
      g.fillRect(16, 2, 12, 10);
      g.fillRect(4, 18, 10, 8);
      g.fillRect(18, 16, 12, 10);
      g.fillStyle(0xFF4400, 0.5);
      g.fillRect(14, 8, 2, 12);
      g.fillRect(6, 16, 12, 2);
      g.fillStyle(0xFFAA00, 0.3);
      g.fillRect(14, 10, 2, 4);
    });
  }

  // ==========================================================================
  // TERRAIN: WATER
  // ==========================================================================
  generateWaterTiles() {
    // Town water
    this.tex('tile_water', (g) => {
      this.fillTile(g, 0x2266AA);
      this.dither(g, 0x2266AA, 0x1A5599, 0.15);
      g.fillStyle(0x3388CC, 0.6);
      g.fillRect(2, 8, 12, 2);
      g.fillRect(16, 16, 14, 2);
      g.fillRect(6, 24, 10, 2);
      g.fillStyle(0x55AADD, 0.4);
      g.fillRect(8, 6, 4, 2);
      g.fillRect(20, 14, 4, 2);
    });

    // Dock planks
    this.tex('tile_dock', (g) => {
      this.fillTile(g, 0x6B4226);
      g.fillStyle(0x5A3218, 1);
      for (let y = 0; y < T; y += 8) {
        g.fillRect(0, y, T, 1);
      }
      g.fillStyle(0x7B5236, 1);
      g.fillRect(4, 2, 2, 6);
      g.fillRect(16, 10, 2, 6);
      g.fillRect(24, 18, 2, 6);
      g.fillRect(10, 26, 2, 4);
      g.fillStyle(0x888888, 1);
      g.fillRect(2, 2, 2, 2);
      g.fillRect(28, 2, 2, 2);
      g.fillRect(2, 18, 2, 2);
      g.fillRect(28, 18, 2, 2);
    });
  }

  // ==========================================================================
  // BUILDINGS
  // ==========================================================================
  generateBuildings() {
    // --- TAVERN ---
    this.tex('tile_tavern', (g) => {
      this.fillTile(g, 0x8B7355);
      g.fillStyle(0x7A6345, 1);
      g.fillRect(2, 6, 28, 24);
      // Roof
      g.fillStyle(0x4A3220, 1);
      g.fillRect(0, 0, T, 8);
      g.fillStyle(0x3A2210, 1);
      g.fillRect(2, 2, 28, 4);
      // Door
      g.fillStyle(0x4A3520, 1);
      g.fillRect(12, 18, 8, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(18, 24, 2, 2);
      // Window left
      g.fillStyle(0xDAA520, 0.7);
      g.fillRect(4, 12, 6, 6);
      g.fillStyle(0x3A2210, 1);
      g.fillRect(7, 12, 1, 6);
      g.fillRect(4, 15, 6, 1);
      // Window right
      g.fillStyle(0xDAA520, 0.7);
      g.fillRect(22, 12, 6, 6);
      g.fillStyle(0x3A2210, 1);
      g.fillRect(25, 12, 1, 6);
      g.fillRect(22, 15, 6, 1);
      // Sign
      g.fillStyle(0x6B4226, 1);
      g.fillRect(24, 6, 6, 5);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(26, 7, 2, 3);
    });

    // --- SHOP ---
    this.tex('tile_shop', (g) => {
      this.fillTile(g, 0x8B7355);
      g.fillStyle(0x7A6345, 1);
      g.fillRect(2, 6, 28, 24);
      // Green awning
      g.fillStyle(0x2D5A27, 1);
      g.fillRect(0, 0, T, 8);
      g.fillStyle(0x3A6A34, 1);
      g.fillRect(0, 6, T, 3);
      for (let x = 0; x < T; x += 8) {
        g.fillStyle(0x2D5A27, 1);
        g.fillRect(x + 2, 8, 4, 2);
      }
      // Door
      g.fillStyle(0x4A3520, 1);
      g.fillRect(12, 18, 8, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(18, 24, 2, 2);
      // Windows
      g.fillStyle(0xDAA520, 0.5);
      g.fillRect(4, 12, 6, 6);
      g.fillRect(22, 12, 6, 6);
      // Goods
      g.fillStyle(0xCC3333, 1);
      g.fillRect(5, 14, 2, 2);
      g.fillStyle(0x3366CC, 1);
      g.fillRect(8, 14, 2, 2);
      g.fillStyle(0xCCCC33, 1);
      g.fillRect(23, 14, 2, 2);
    });

    // --- FORGE ---
    this.tex('tile_forge', (g) => {
      this.fillTile(g, 0x5A4A3A);
      g.fillStyle(0x4A3A2A, 1);
      g.fillRect(2, 6, 28, 24);
      // Dark roof
      g.fillStyle(0x2A1A0A, 1);
      g.fillRect(0, 0, T, 8);
      // Chimney
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(24, 0, 6, 10);
      g.fillStyle(0xFF6600, 0.7);
      g.fillRect(26, 0, 2, 2);
      // Forge glow window
      g.fillStyle(0xFF4400, 0.8);
      g.fillRect(4, 12, 8, 6);
      g.fillStyle(0xFFAA00, 0.6);
      g.fillRect(6, 14, 4, 2);
      // Anvil
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(22, 22, 6, 4);
      g.fillRect(24, 20, 2, 2);
      // Door
      g.fillStyle(0x3A2510, 1);
      g.fillRect(12, 18, 8, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(18, 24, 2, 2);
    });

    // --- HOME ---
    this.tex('tile_home', (g) => {
      this.fillTile(g, 0x8B7355);
      g.fillStyle(0x7A6345, 1);
      g.fillRect(2, 6, 28, 24);
      // Roof
      g.fillStyle(0x6B4226, 1);
      g.fillRect(0, 0, T, 8);
      g.fillStyle(0x5A3218, 1);
      g.fillRect(2, 2, 28, 4);
      // Door
      g.fillStyle(0x4A3520, 1);
      g.fillRect(12, 18, 8, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(14, 24, 2, 2);
      // Windows
      g.fillStyle(0xDAA520, 0.6);
      g.fillRect(4, 12, 6, 6);
      g.fillRect(22, 12, 6, 6);
      // Flower box
      g.fillStyle(0x6B4226, 1);
      g.fillRect(4, 18, 6, 2);
      g.fillStyle(0xFF6688, 1);
      g.fillRect(5, 17, 2, 2);
      g.fillStyle(0xFFDD44, 1);
      g.fillRect(8, 17, 2, 2);
    });

    // --- KITCHEN (Phase 6) ---
    this.tex('tile_kitchen', (g) => {
      this.fillTile(g, 0x7A6548);
      g.fillStyle(0x6A5538, 1);
      g.fillRect(2, 6, 28, 24);
      // Roof
      g.fillStyle(0x5A4528, 1);
      g.fillRect(0, 0, T, 8);
      // Chimney + white smoke
      g.fillStyle(0x8B7355, 1);
      g.fillRect(22, 0, 6, 10);
      g.fillStyle(0xDDDDDD, 0.6);
      g.fillRect(24, 0, 2, 2);
      // Window with orange firelight
      g.fillStyle(0xFF8833, 0.7);
      g.fillRect(4, 12, 10, 8);
      g.fillStyle(0xFFAA00, 0.5);
      g.fillRect(6, 14, 6, 4);
      // Window frame
      g.fillStyle(0x4A3520, 1);
      g.fillRect(4, 12, 10, 1);
      g.fillRect(4, 19, 10, 1);
      g.fillRect(4, 12, 1, 8);
      g.fillRect(13, 12, 1, 8);
      g.fillRect(9, 12, 1, 8);
      // Door
      g.fillStyle(0x4A3520, 1);
      g.fillRect(18, 18, 8, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(24, 24, 2, 2);
      // Pot sign
      g.fillStyle(0x8B4513, 1);
      g.fillRect(16, 10, 4, 3);
      g.fillRect(15, 13, 6, 2);
    });
  }

  // ==========================================================================
  // ENTITIES: PLAYER
  // ==========================================================================
  generatePlayerSprite() {
    this.tex('player', (g) => {
      // Boots
      g.fillStyle(0x4A3220, 1);
      g.fillRect(10, 26, 5, 6);
      g.fillRect(17, 26, 5, 6);
      // Pants
      g.fillStyle(0x3A4A6A, 1);
      g.fillRect(11, 20, 4, 7);
      g.fillRect(18, 20, 4, 7);
      // Tunic
      g.fillStyle(0x2266AA, 1);
      g.fillRect(9, 10, 14, 11);
      // Belt
      g.fillStyle(0x6B4226, 1);
      g.fillRect(9, 18, 14, 2);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(15, 18, 2, 2);
      // Arms
      g.fillStyle(0x2266AA, 1);
      g.fillRect(5, 12, 4, 8);
      g.fillRect(23, 12, 4, 8);
      // Hands
      g.fillStyle(0xE8C8A0, 1);
      g.fillRect(5, 19, 4, 3);
      g.fillRect(23, 19, 4, 3);
      // Head
      g.fillStyle(0xE8C8A0, 1);
      g.fillRect(11, 2, 10, 9);
      // Hair
      g.fillStyle(0x4A3220, 1);
      g.fillRect(10, 1, 12, 4);
      g.fillRect(10, 1, 2, 7);
      // Eyes
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(13, 5, 2, 2);
      g.fillRect(18, 5, 2, 2);
      // Mouth
      g.fillStyle(0xC8A888, 1);
      g.fillRect(14, 8, 4, 1);
    });
  }

  // ==========================================================================
  // ENTITIES: AGENT
  // ==========================================================================
  generateAgentSprite() {
    this.tex('agent', (g) => {
      // Boots
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(10, 26, 5, 6);
      g.fillRect(17, 26, 5, 6);
      // Legs
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(11, 20, 4, 7);
      g.fillRect(18, 20, 4, 7);
      // Dark armor body
      g.fillStyle(0x4A4A5A, 1);
      g.fillRect(9, 10, 14, 11);
      // Chest plate
      g.fillStyle(0x6A6A7A, 1);
      g.fillRect(11, 12, 10, 6);
      g.fillStyle(0x5A5A6A, 1);
      g.fillRect(13, 13, 6, 4);
      // Belt
      g.fillStyle(0x4A3220, 1);
      g.fillRect(9, 18, 14, 2);
      // Arms
      g.fillStyle(0x4A4A5A, 1);
      g.fillRect(5, 12, 4, 8);
      g.fillRect(23, 12, 4, 8);
      // Pauldrons
      g.fillStyle(0x6A6A7A, 1);
      g.fillRect(4, 10, 6, 3);
      g.fillRect(22, 10, 6, 3);
      // Gauntlets
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(5, 19, 4, 3);
      g.fillRect(23, 19, 4, 3);
      // Sword
      g.fillStyle(0xCCCCCC, 1);
      g.fillRect(25, 10, 2, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(24, 18, 4, 2);
      // Helmet
      g.fillStyle(0x5A5A6A, 1);
      g.fillRect(10, 1, 12, 10);
      // Visor
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(12, 5, 8, 2);
      // Crest
      g.fillStyle(0xCC3333, 1);
      g.fillRect(14, 0, 4, 3);
    });
  }

  // ==========================================================================
  // ENTITIES: MOBS
  // ==========================================================================
  generateMobSprites() {
    // --- SLIME (Phase 1 Forest) ---
    this.tex('mob_slime', (g) => {
      g.fillStyle(0x44BB44, 1);
      g.fillRect(6, 12, 20, 16);
      g.fillRect(8, 10, 16, 2);
      g.fillRect(10, 8, 12, 2);
      g.fillRect(4, 16, 2, 8);
      g.fillRect(26, 16, 2, 8);
      g.fillStyle(0x66DD66, 1);
      g.fillRect(10, 12, 6, 4);
      g.fillRect(8, 14, 4, 2);
      g.fillStyle(0x228822, 1);
      g.fillRect(16, 22, 8, 4);
      g.fillRect(6, 26, 20, 2);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(11, 14, 4, 4);
      g.fillRect(19, 14, 4, 4);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(13, 15, 2, 3);
      g.fillRect(21, 15, 2, 3);
    });

    // --- GOBLIN (Phase 1 Forest) ---
    this.tex('mob_goblin', (g) => {
      g.fillStyle(0x3A6A2A, 1);
      g.fillRect(10, 27, 4, 5);
      g.fillRect(18, 27, 4, 5);
      g.fillStyle(0x4A3220, 1);
      g.fillRect(11, 22, 3, 6);
      g.fillRect(19, 22, 3, 6);
      g.fillStyle(0x6B5A4A, 1);
      g.fillRect(10, 14, 12, 9);
      g.fillStyle(0x3A6A2A, 1);
      g.fillRect(6, 16, 4, 6);
      g.fillRect(22, 16, 4, 6);
      g.fillStyle(0x5A4A3A, 1);
      g.fillRect(24, 10, 3, 12);
      g.fillStyle(0x4A3A2A, 1);
      g.fillRect(23, 8, 5, 4);
      g.fillStyle(0x3A6A2A, 1);
      g.fillRect(11, 4, 10, 10);
      g.fillRect(7, 4, 4, 4);
      g.fillRect(21, 4, 4, 4);
      g.fillStyle(0xFFCC00, 1);
      g.fillRect(13, 7, 3, 3);
      g.fillRect(18, 7, 3, 3);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(14, 8, 2, 2);
      g.fillRect(19, 8, 2, 2);
      g.fillRect(13, 11, 6, 2);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(14, 11, 1, 2);
      g.fillRect(18, 11, 1, 2);
    });

    // --- BAT (Phase 1 Cave) ---
    this.tex('mob_bat', (g) => {
      g.fillStyle(0x3A2A3A, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0x4A3A4A, 1);
      g.fillRect(2, 10, 10, 6);
      g.fillRect(0, 12, 4, 3);
      g.fillRect(4, 8, 4, 3);
      g.fillRect(20, 10, 10, 6);
      g.fillRect(28, 12, 4, 3);
      g.fillRect(24, 8, 4, 3);
      g.fillStyle(0x5A4A5A, 1);
      g.fillRect(4, 11, 2, 4);
      g.fillRect(8, 10, 2, 5);
      g.fillRect(22, 10, 2, 5);
      g.fillRect(26, 11, 2, 4);
      g.fillStyle(0xFF3333, 1);
      g.fillRect(13, 13, 2, 2);
      g.fillRect(18, 13, 2, 2);
      g.fillStyle(0x3A2A3A, 1);
      g.fillRect(13, 9, 2, 4);
      g.fillRect(18, 9, 2, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(14, 18, 1, 2);
      g.fillRect(17, 18, 1, 2);
    });

    // --- SKELETON (Phase 1 Cave) ---
    this.tex('mob_skeleton', (g) => {
      g.fillStyle(0xCCBBAA, 1);
      g.fillRect(11, 27, 4, 5);
      g.fillRect(18, 27, 4, 5);
      g.fillStyle(0xDDCCBB, 1);
      g.fillRect(12, 20, 2, 8);
      g.fillRect(19, 20, 2, 8);
      g.fillStyle(0xCCBBAA, 1);
      g.fillRect(11, 23, 4, 2);
      g.fillRect(18, 23, 4, 2);
      g.fillStyle(0xDDCCBB, 1);
      g.fillRect(10, 12, 12, 8);
      g.fillStyle(0x1A1A2E, 0.5);
      g.fillRect(12, 14, 8, 1);
      g.fillRect(12, 16, 8, 1);
      g.fillRect(12, 18, 8, 1);
      g.fillStyle(0xDDCCBB, 1);
      g.fillRect(6, 13, 4, 2);
      g.fillRect(6, 14, 2, 8);
      g.fillRect(22, 13, 4, 2);
      g.fillRect(24, 14, 2, 8);
      g.fillStyle(0x888888, 1);
      g.fillRect(26, 8, 2, 14);
      g.fillStyle(0x666666, 1);
      g.fillRect(25, 18, 4, 2);
      g.fillStyle(0xDDCCBB, 1);
      g.fillRect(11, 2, 10, 10);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(13, 5, 3, 3);
      g.fillRect(18, 5, 3, 3);
      g.fillStyle(0xFF3333, 0.6);
      g.fillRect(14, 6, 1, 1);
      g.fillRect(19, 6, 1, 1);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(15, 8, 2, 2);
      g.fillStyle(0xCCBBAA, 1);
      g.fillRect(12, 10, 8, 2);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(13, 10, 1, 1);
      g.fillRect(15, 10, 1, 1);
      g.fillRect(17, 10, 1, 1);
      g.fillRect(19, 10, 1, 1);
    });

    // --- BOG LURKER (Phase 5 Swamp) ---
    this.tex('mob_bog_lurker', (g) => {
      g.fillStyle(0x3A4A2A, 1);
      g.fillRect(6, 14, 20, 14);
      g.fillRect(8, 10, 16, 6);
      g.fillStyle(0x4A6A2A, 0.5);
      g.fillRect(10, 16, 6, 4);
      g.fillRect(18, 20, 4, 4);
      g.fillStyle(0x2A3A1A, 1);
      g.fillRect(2, 16, 6, 10);
      g.fillRect(24, 16, 6, 10);
      g.fillStyle(0x5A4A3A, 1);
      g.fillRect(2, 26, 2, 4);
      g.fillRect(6, 26, 2, 4);
      g.fillRect(24, 26, 2, 4);
      g.fillRect(28, 26, 2, 4);
      g.fillStyle(0x3A4A2A, 1);
      g.fillRect(12, 4, 8, 8);
      g.fillStyle(0x44FF44, 1);
      g.fillRect(13, 6, 2, 2);
      g.fillRect(18, 6, 2, 2);
      g.fillStyle(0x2A3A1A, 0.7);
      g.fillRect(8, 28, 4, 4);
      g.fillRect(20, 28, 4, 4);
    });

    // --- SWAMP WITCH (Phase 5 Swamp) ---
    this.tex('mob_swamp_witch', (g) => {
      g.fillStyle(0x3A2A3A, 1);
      g.fillRect(10, 12, 12, 18);
      g.fillRect(8, 16, 16, 14);
      g.fillStyle(0x2A1A2A, 1);
      g.fillRect(8, 28, 4, 4);
      g.fillRect(14, 30, 4, 2);
      g.fillRect(20, 28, 4, 4);
      g.fillStyle(0x3A2A3A, 1);
      g.fillRect(4, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0x4A6A2A, 1);
      g.fillRect(2, 16, 4, 3);
      g.fillRect(26, 16, 4, 3);
      g.fillStyle(0x4A3A20, 1);
      g.fillRect(3, 4, 2, 24);
      g.fillStyle(0x44FF44, 0.8);
      g.fillRect(2, 2, 4, 4);
      g.fillStyle(0x88FF88, 0.5);
      g.fillRect(3, 3, 2, 2);
      g.fillStyle(0x2A1A2A, 1);
      g.fillRect(11, 4, 10, 10);
      g.fillRect(10, 6, 12, 6);
      g.fillStyle(0x1A0A1A, 1);
      g.fillRect(12, 6, 8, 6);
      g.fillStyle(0x44FF44, 1);
      g.fillRect(14, 8, 2, 2);
      g.fillRect(18, 8, 2, 2);
    });

    // --- LAVA BRUTE (Phase 5 Volcanic) ---
    this.tex('mob_lava_brute', (g) => {
      g.fillStyle(0x3A1500, 1);
      g.fillRect(8, 24, 6, 8);
      g.fillRect(18, 24, 6, 8);
      g.fillStyle(0x5A2500, 1);
      g.fillRect(6, 10, 20, 16);
      g.fillStyle(0xFF4400, 0.7);
      g.fillRect(10, 14, 2, 8);
      g.fillRect(16, 12, 2, 6);
      g.fillRect(22, 16, 2, 6);
      g.fillStyle(0xFFAA00, 0.5);
      g.fillRect(10, 16, 2, 2);
      g.fillRect(16, 14, 2, 2);
      g.fillStyle(0x5A2500, 1);
      g.fillRect(2, 12, 6, 12);
      g.fillRect(24, 12, 6, 12);
      g.fillStyle(0xFF4400, 1);
      g.fillRect(2, 22, 6, 4);
      g.fillRect(24, 22, 6, 4);
      g.fillStyle(0x5A2500, 1);
      g.fillRect(10, 2, 12, 10);
      g.fillStyle(0xFFAA00, 1);
      g.fillRect(12, 5, 3, 3);
      g.fillRect(18, 5, 3, 3);
      g.fillStyle(0xFF4400, 1);
      g.fillRect(13, 6, 1, 1);
      g.fillRect(19, 6, 1, 1);
      g.fillStyle(0xFF4400, 0.8);
      g.fillRect(12, 0, 3, 4);
      g.fillRect(17, 0, 3, 4);
      g.fillStyle(0xFFAA00, 0.5);
      g.fillRect(14, 0, 4, 2);
    });

    // --- ASH WRAITH (Phase 5 Volcanic) ---
    this.tex('mob_ash_wraith', (g) => {
      g.fillStyle(0x4A4A4A, 0.7);
      g.fillRect(8, 8, 16, 20);
      g.fillRect(10, 6, 12, 4);
      g.fillStyle(0x3A3A3A, 0.5);
      g.fillRect(6, 24, 20, 4);
      g.fillRect(8, 28, 16, 4);
      g.fillStyle(0x2A2A2A, 0.3);
      g.fillRect(10, 30, 12, 2);
      g.fillStyle(0x4A4A4A, 0.6);
      g.fillRect(2, 12, 8, 4);
      g.fillRect(22, 12, 8, 4);
      g.fillRect(0, 14, 4, 2);
      g.fillRect(28, 14, 4, 2);
      g.fillStyle(0x5A5A5A, 0.8);
      g.fillRect(12, 6, 8, 8);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(13, 8, 2, 2);
      g.fillRect(18, 8, 2, 2);
      g.fillStyle(0xFFAA00, 0.4);
      g.fillRect(12, 7, 4, 4);
      g.fillRect(17, 7, 4, 4);
      g.fillStyle(0x1A1A1A, 1);
      g.fillRect(14, 11, 4, 2);
      g.fillStyle(0xFF4400, 0.6);
      g.fillRect(6, 4, 2, 2);
      g.fillRect(24, 2, 2, 2);
      g.fillRect(18, 0, 2, 2);
      g.fillRect(10, 28, 2, 2);
    });
  }

  // ==========================================================================
  // ENTITIES: WORLD BOSS (64×64 — 2×2 tiles)
  // ==========================================================================
  generateWorldBoss() {
    const bossSize = T * 2; // 64×64
    this.makeTexture('boss_infernal_guardian', bossSize, bossSize, (g) => {
      const S = bossSize;
      // Shadow
      g.fillStyle(0x1A0A00, 0.5);
      g.fillRect(8, S - 10, S - 16, 10);

      // Legs
      g.fillStyle(0x3A1500, 1);
      g.fillRect(12, 44, 10, 20);
      g.fillRect(42, 44, 10, 20);

      // Torso
      g.fillStyle(0x5A2500, 1);
      g.fillRect(8, 18, 48, 30);
      g.fillStyle(0x4A1A00, 1);
      g.fillRect(10, 20, 44, 26);

      // Lava cracks
      g.fillStyle(0xFF4400, 0.8);
      g.fillRect(16, 24, 2, 16);
      g.fillRect(28, 20, 2, 12);
      g.fillRect(40, 26, 2, 14);
      g.fillRect(18, 32, 12, 2);
      g.fillRect(34, 28, 8, 2);
      g.fillStyle(0xFFAA00, 0.6);
      g.fillRect(16, 28, 2, 4);
      g.fillRect(28, 22, 2, 4);
      g.fillRect(40, 30, 2, 4);

      // Arms
      g.fillStyle(0x5A2500, 1);
      g.fillRect(0, 22, 10, 20);
      g.fillRect(54, 22, 10, 20);
      g.fillStyle(0xFF4400, 0.6);
      g.fillRect(4, 28, 2, 8);
      g.fillRect(58, 28, 2, 8);
      g.fillStyle(0xFF4400, 1);
      g.fillRect(0, 38, 10, 6);
      g.fillRect(54, 38, 10, 6);

      // Head
      g.fillStyle(0x5A2500, 1);
      g.fillRect(16, 4, 32, 18);
      g.fillStyle(0x4A1A00, 1);
      g.fillRect(18, 6, 28, 14);

      // Horns
      g.fillStyle(0x3A1500, 1);
      g.fillRect(12, 2, 6, 8);
      g.fillRect(8, 0, 6, 4);
      g.fillRect(46, 2, 6, 8);
      g.fillRect(50, 0, 6, 4);

      // Eyes
      g.fillStyle(0xFFAA00, 1);
      g.fillRect(22, 10, 6, 4);
      g.fillRect(38, 10, 6, 4);
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(24, 11, 2, 2);
      g.fillRect(40, 11, 2, 2);

      // Mouth
      g.fillStyle(0xFF4400, 1);
      g.fillRect(24, 16, 16, 4);
      g.fillStyle(0xFFAA00, 0.7);
      g.fillRect(26, 17, 12, 2);

      // Crown of fire
      g.fillStyle(0xFF4400, 0.8);
      g.fillRect(20, 0, 4, 6);
      g.fillRect(28, 0, 4, 4);
      g.fillRect(36, 0, 4, 6);
      g.fillStyle(0xFFAA00, 0.5);
      g.fillRect(24, 0, 4, 3);
      g.fillRect(32, 0, 4, 3);
    });
  }

  // ==========================================================================
  // FISHING SPOTS
  // ==========================================================================
  generateFishingSpots() {
    this.tex('tile_fishing_spot', (g) => {
      this.fillTile(g, 0x2266AA);
      this.dither(g, 0x2266AA, 0x1A5599, 0.15);
      g.fillStyle(0x3388CC, 0.6);
      g.fillRect(4, 10, 10, 2);
      g.fillRect(18, 20, 12, 2);
      // Bobber
      g.fillStyle(0xFF3333, 1);
      g.fillRect(14, 10, 4, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(14, 10, 4, 2);
      // Line
      g.fillStyle(0xCCCCCC, 0.6);
      g.fillRect(15, 14, 1, 6);
      // Ripple
      g.fillStyle(0x55AADD, 0.4);
      g.fillRect(10, 14, 12, 1);
      g.fillRect(12, 12, 8, 1);
    });
  }

  // ==========================================================================
  // MINING NODES
  // ==========================================================================
  generateMiningNodes() {
    this.tex('tile_mining_copper', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.15);
      g.fillStyle(0x4A4A4A, 1);
      g.fillRect(6, 10, 20, 18);
      g.fillRect(8, 8, 16, 4);
      g.fillStyle(0xB87333, 1);
      g.fillRect(10, 14, 4, 6);
      g.fillRect(18, 12, 6, 4);
      g.fillRect(14, 20, 4, 4);
      g.fillStyle(0xDA8A43, 0.7);
      g.fillRect(10, 14, 2, 2);
      g.fillRect(20, 12, 2, 2);
    });

    this.tex('tile_mining_iron', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.15);
      g.fillStyle(0x4A4A4A, 1);
      g.fillRect(6, 10, 20, 18);
      g.fillRect(8, 8, 16, 4);
      g.fillStyle(0x8A8A8A, 1);
      g.fillRect(8, 12, 6, 4);
      g.fillRect(18, 16, 6, 6);
      g.fillRect(12, 22, 4, 4);
      g.fillStyle(0xAAAAAA, 0.7);
      g.fillRect(10, 12, 2, 2);
      g.fillRect(20, 18, 2, 2);
    });

    this.tex('tile_mining_crystal', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.15);
      g.fillStyle(0x4A4A4A, 1);
      g.fillRect(6, 12, 20, 16);
      g.fillRect(8, 10, 16, 4);
      g.fillStyle(0x5B8FA8, 1);
      g.fillRect(10, 6, 4, 12);
      g.fillRect(18, 4, 4, 10);
      g.fillRect(14, 8, 4, 8);
      g.fillStyle(0x8BBFD8, 1);
      g.fillRect(11, 6, 2, 4);
      g.fillRect(19, 4, 2, 4);
      g.fillRect(15, 8, 2, 4);
      g.fillStyle(0xAADDEE, 0.6);
      g.fillRect(12, 8, 2, 2);
      g.fillRect(20, 6, 2, 2);
    });

    this.tex('tile_mining_depleted', (g) => {
      this.fillTile(g, 0x36393F);
      this.dither(g, 0x36393F, 0x2A2D33, 0.15);
      g.fillStyle(0x3A3A3A, 1);
      g.fillRect(8, 14, 16, 12);
      g.fillRect(10, 12, 12, 4);
      g.fillStyle(0x2A2D33, 1);
      g.fillRect(12, 16, 4, 2);
      g.fillRect(18, 20, 2, 4);
    });
  }

  // ==========================================================================
  // FARM PLOTS (Phase 6)
  // ==========================================================================
  generateFarmPlots() {
    // Empty tilled soil
    this.tex('tile_farm_empty', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      this.dither(g, 0x5A3A1A, 0x6A4A2A, 0.08);
    });

    // Planted — seedling dot
    this.tex('tile_farm_planted', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(14, 14, 4, 4);
    });

    // Growing — sprout
    this.tex('tile_farm_growing', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x33AA33, 1);
      g.fillRect(15, 10, 2, 14);
      g.fillRect(10, 12, 6, 3);
      g.fillRect(11, 11, 4, 2);
      g.fillRect(16, 14, 6, 3);
      g.fillRect(17, 13, 4, 2);
    });

    // Wheat ready
    this.tex('tile_farm_ready_wheat', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      for (const sx of [8, 15, 22]) {
        g.fillStyle(0x7A8A3A, 1);
        g.fillRect(sx, 10, 2, 18);
        g.fillStyle(0xDAA520, 1);
        g.fillRect(sx - 1, 6, 4, 6);
        g.fillStyle(0xCCAA10, 1);
        g.fillRect(sx, 7, 2, 3);
      }
    });

    // Carrot ready
    this.tex('tile_farm_ready_carrot', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(10, 6, 4, 8);
      g.fillRect(18, 8, 4, 6);
      g.fillRect(12, 4, 3, 4);
      g.fillRect(20, 6, 3, 4);
      g.fillStyle(0xFF6622, 1);
      g.fillRect(12, 14, 3, 4);
      g.fillRect(20, 14, 3, 4);
    });

    // Tomato ready
    this.tex('tile_farm_ready_tomato', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(15, 4, 2, 20);
      g.fillRect(10, 8, 12, 2);
      g.fillStyle(0xCC2222, 1);
      g.fillRect(8, 12, 6, 6);
      g.fillRect(18, 10, 6, 6);
      g.fillRect(12, 18, 6, 6);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(9, 13, 2, 2);
      g.fillRect(19, 11, 2, 2);
      g.fillRect(13, 19, 2, 2);
    });

    // Golden wheat ready
    this.tex('tile_farm_ready_golden_wheat', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      for (const sx of [8, 15, 22]) {
        g.fillStyle(0x9AAA3A, 1);
        g.fillRect(sx, 10, 2, 18);
        g.fillStyle(0xFFDD00, 1);
        g.fillRect(sx - 1, 4, 4, 8);
        g.fillStyle(0xFFFF88, 1);
        g.fillRect(sx, 5, 2, 2);
      }
      g.fillStyle(0xFFFFAA, 0.8);
      g.fillRect(6, 8, 2, 2);
      g.fillRect(26, 6, 2, 2);
      g.fillRect(14, 2, 2, 2);
    });

    // Moonberry ready
    this.tex('tile_farm_ready_moonberry', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x2A3A2A, 1);
      g.fillRect(14, 6, 2, 20);
      g.fillRect(8, 10, 16, 2);
      g.fillStyle(0x6644AA, 1);
      g.fillRect(8, 12, 4, 4);
      g.fillRect(12, 14, 4, 4);
      g.fillRect(20, 10, 4, 4);
      g.fillRect(18, 16, 4, 4);
      g.fillStyle(0x8866CC, 0.7);
      g.fillRect(9, 13, 2, 2);
      g.fillRect(21, 11, 2, 2);
    });

    // Starfruit ready
    this.tex('tile_farm_ready_starfruit', (g) => {
      this.fillTile(g, 0x5A3A1A);
      g.fillStyle(0x4A2A0A, 1);
      for (let y = 0; y < T; y += 8) g.fillRect(0, y, T, 2);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(15, 10, 2, 16);
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(12, 6, 8, 8);
      g.fillRect(10, 8, 12, 4);
      g.fillRect(14, 4, 4, 12);
      g.fillStyle(0xFFFF44, 1);
      g.fillRect(14, 8, 4, 4);
      g.fillStyle(0xFFFF88, 0.4);
      g.fillRect(10, 4, 12, 12);
    });
  }

  // ==========================================================================
  // ITEM ICONS: MATERIALS (Fish, Ore, Mob Drops)
  // ==========================================================================
  generateMaterialIcons() {
    this.tex('item_small_fish', (g) => {
      g.fillStyle(0x6688AA, 1);
      g.fillRect(6, 12, 18, 8);
      g.fillRect(8, 10, 14, 2);
      g.fillRect(8, 20, 14, 2);
      g.fillStyle(0x5577AA, 1);
      g.fillRect(22, 10, 4, 12);
      g.fillRect(26, 12, 2, 8);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(8, 13, 3, 3);
      g.fillStyle(0x111111, 1);
      g.fillRect(9, 14, 2, 2);
      g.fillStyle(0x88AACC, 1);
      g.fillRect(10, 18, 10, 2);
    });

    this.tex('item_large_fish', (g) => {
      g.fillStyle(0x4466AA, 1);
      g.fillRect(4, 8, 22, 14);
      g.fillRect(6, 6, 18, 4);
      g.fillRect(6, 20, 18, 4);
      g.fillStyle(0x3355AA, 1);
      g.fillRect(24, 8, 4, 14);
      g.fillRect(28, 10, 2, 10);
      g.fillStyle(0x5577CC, 1);
      g.fillRect(12, 4, 6, 4);
      g.fillRect(14, 22, 6, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(6, 10, 4, 4);
      g.fillStyle(0x111111, 1);
      g.fillRect(8, 11, 2, 2);
      g.fillStyle(0x5588BB, 0.5);
      for (let x = 10; x < 22; x += 4) {
        for (let y = 10; y < 20; y += 4) {
          g.fillRect(x, y, 2, 2);
        }
      }
    });

    this.tex('item_river_crab', (g) => {
      g.fillStyle(0xAA4422, 1);
      g.fillRect(10, 12, 12, 8);
      g.fillRect(8, 14, 16, 4);
      g.fillStyle(0xCC5533, 1);
      g.fillRect(2, 10, 6, 6);
      g.fillRect(24, 10, 6, 6);
      g.fillRect(4, 8, 3, 3);
      g.fillRect(25, 8, 3, 3);
      g.fillStyle(0x993322, 1);
      g.fillRect(8, 20, 2, 6);
      g.fillRect(12, 20, 2, 6);
      g.fillRect(18, 20, 2, 6);
      g.fillRect(22, 20, 2, 6);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(12, 10, 2, 2);
      g.fillRect(18, 10, 2, 2);
      g.fillStyle(0x111111, 1);
      g.fillRect(12, 10, 2, 2);
      g.fillRect(18, 10, 2, 2);
    });

    this.tex('item_golden_carp', (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(6, 10, 18, 10);
      g.fillRect(8, 8, 14, 4);
      g.fillRect(8, 18, 14, 4);
      g.fillStyle(0xCCA520, 1);
      g.fillRect(22, 10, 4, 10);
      g.fillRect(26, 12, 2, 6);
      g.fillStyle(0xFFCC44, 1);
      g.fillRect(10, 12, 8, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(8, 12, 3, 3);
      g.fillStyle(0x111111, 1);
      g.fillRect(9, 13, 2, 2);
    });

    this.tex('item_abyssal_eel', (g) => {
      g.fillStyle(0x2A2A4A, 1);
      g.fillRect(2, 14, 28, 6);
      g.fillRect(4, 12, 24, 2);
      g.fillRect(4, 20, 24, 2);
      g.fillRect(26, 10, 4, 6);
      g.fillStyle(0x4A4A8A, 0.6);
      g.fillRect(8, 15, 2, 2);
      g.fillRect(16, 16, 2, 2);
      g.fillRect(22, 15, 2, 2);
      g.fillStyle(0x44AAFF, 1);
      g.fillRect(4, 15, 2, 2);
    });

    this.tex('item_pearl_fragment', (g) => {
      g.fillStyle(0xEEDDDD, 1);
      g.fillRect(10, 10, 12, 12);
      g.fillRect(12, 8, 8, 2);
      g.fillRect(12, 22, 8, 2);
      g.fillStyle(0xFFEEEE, 1);
      g.fillRect(12, 12, 4, 4);
      g.fillStyle(0xDDCCCC, 1);
      g.fillRect(18, 18, 4, 4);
    });

    this.tex('item_sea_gem', (g) => {
      g.fillStyle(0x2288CC, 1);
      g.fillRect(10, 8, 12, 14);
      g.fillRect(12, 6, 8, 2);
      g.fillRect(12, 22, 8, 2);
      g.fillStyle(0x44AAEE, 1);
      g.fillRect(12, 10, 4, 4);
      g.fillStyle(0x88DDFF, 0.6);
      g.fillRect(14, 11, 2, 2);
    });

    this.tex('item_sunken_ring', (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(8, 10, 16, 12);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(12, 14, 8, 4);
      g.fillStyle(0xFF3333, 1);
      g.fillRect(14, 8, 4, 4);
      g.fillStyle(0xFF6666, 1);
      g.fillRect(15, 9, 2, 2);
    });

    this.tex('item_ancient_coin', (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(8, 8, 16, 16);
      g.fillRect(10, 6, 12, 2);
      g.fillRect(10, 24, 12, 2);
      g.fillStyle(0xCCA520, 1);
      g.fillRect(14, 12, 4, 4);
      g.fillStyle(0xB8952A, 1);
      g.fillRect(10, 10, 12, 1);
      g.fillRect(10, 21, 12, 1);
    });

    this.tex('item_copper_ore', (g) => {
      g.fillStyle(0x5A5A5A, 1);
      g.fillRect(8, 10, 16, 14);
      g.fillRect(10, 8, 12, 4);
      g.fillStyle(0xB87333, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0xDA8A43, 0.7);
      g.fillRect(14, 14, 4, 4);
    });

    this.tex('item_iron_ore', (g) => {
      g.fillStyle(0x5A5A5A, 1);
      g.fillRect(8, 10, 16, 14);
      g.fillRect(10, 8, 12, 4);
      g.fillStyle(0x8A8A8A, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0xAAAAAA, 0.7);
      g.fillRect(14, 14, 4, 4);
    });

    this.tex('item_crystal_shard', (g) => {
      g.fillStyle(0x5B8FA8, 1);
      g.fillRect(12, 6, 8, 18);
      g.fillRect(10, 10, 12, 10);
      g.fillStyle(0x8BBFD8, 1);
      g.fillRect(14, 8, 4, 6);
      g.fillStyle(0xAADDEE, 0.6);
      g.fillRect(15, 10, 2, 2);
    });

    this.tex('item_gemstone_shard', (g) => {
      g.fillStyle(0x9C27B0, 1);
      g.fillRect(10, 8, 12, 14);
      g.fillRect(12, 6, 8, 2);
      g.fillRect(12, 22, 8, 2);
      g.fillStyle(0xCC55DD, 1);
      g.fillRect(12, 10, 4, 4);
      g.fillStyle(0xEE88FF, 0.5);
      g.fillRect(14, 11, 2, 2);
    });

    this.tex('item_void_crystal', (g) => {
      g.fillStyle(0x2A1A3A, 1);
      g.fillRect(10, 6, 12, 18);
      g.fillRect(8, 10, 16, 10);
      g.fillStyle(0x4A2A5A, 1);
      g.fillRect(12, 8, 8, 6);
      g.fillStyle(0x8833AA, 0.6);
      g.fillRect(14, 10, 4, 4);
      g.fillStyle(0xCC66FF, 0.3);
      g.fillRect(15, 11, 2, 2);
    });

    this.tex('item_slime_gel', (g) => {
      g.fillStyle(0x44BB44, 0.8);
      g.fillRect(8, 12, 16, 12);
      g.fillRect(10, 10, 12, 4);
      g.fillStyle(0x66DD66, 0.6);
      g.fillRect(12, 14, 4, 4);
    });

    this.tex('item_goblin_ear', (g) => {
      g.fillStyle(0x3A6A2A, 1);
      g.fillRect(10, 8, 10, 16);
      g.fillRect(12, 6, 8, 4);
      g.fillRect(8, 12, 4, 8);
      g.fillStyle(0x4A7A3A, 1);
      g.fillRect(14, 12, 4, 6);
    });

    this.tex('item_bat_wing', (g) => {
      g.fillStyle(0x4A3A4A, 1);
      g.fillRect(4, 10, 24, 8);
      g.fillRect(8, 8, 16, 4);
      g.fillRect(2, 12, 4, 4);
      g.fillRect(26, 12, 4, 4);
      g.fillStyle(0x5A4A5A, 0.6);
      g.fillRect(10, 11, 2, 5);
      g.fillRect(16, 11, 2, 5);
      g.fillRect(22, 11, 2, 5);
    });

    this.tex('item_bone_fragment', (g) => {
      g.fillStyle(0xDDCCBB, 1);
      g.fillRect(10, 8, 6, 18);
      g.fillRect(8, 6, 10, 4);
      g.fillRect(8, 24, 10, 4);
      g.fillStyle(0xCCBBAA, 1);
      g.fillRect(12, 14, 2, 4);
    });

    this.tex('item_bog_moss', (g) => {
      g.fillStyle(0x4A6A2A, 1);
      g.fillRect(8, 10, 16, 14);
      this.dither(g, 0x4A6A2A, 0x3A5A1A, 0.3);
      g.fillStyle(0x5A7A3A, 1);
      g.fillRect(10, 8, 8, 4);
    });

    this.tex('item_witch_eye', (g) => {
      g.fillStyle(0xEEDDDD, 1);
      g.fillRect(8, 8, 16, 16);
      g.fillRect(10, 6, 12, 4);
      g.fillRect(10, 22, 12, 4);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0x111111, 1);
      g.fillRect(14, 14, 4, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(13, 12, 2, 2);
    });

    this.tex('item_lava_rock', (g) => {
      g.fillStyle(0x3A1500, 1);
      g.fillRect(8, 10, 16, 14);
      g.fillRect(10, 8, 12, 4);
      g.fillStyle(0xFF4400, 0.6);
      g.fillRect(12, 14, 2, 6);
      g.fillRect(18, 12, 2, 4);
      g.fillStyle(0xFFAA00, 0.4);
      g.fillRect(12, 16, 2, 2);
    });

    this.tex('item_ash_dust', (g) => {
      g.fillStyle(0x4A4A4A, 0.8);
      g.fillRect(8, 12, 16, 12);
      g.fillRect(10, 10, 12, 4);
      this.dither(g, 0x4A4A4A, 0x3A3A3A, 0.3);
      g.fillStyle(0xFF4400, 0.4);
      g.fillRect(14, 16, 2, 2);
    });

    this.tex('item_forge_ember', (g) => {
      g.fillStyle(0xFF4400, 1);
      g.fillRect(10, 10, 12, 12);
      g.fillRect(12, 8, 8, 2);
      g.fillRect(12, 22, 8, 2);
      g.fillStyle(0xFFAA00, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0xFFDD00, 0.7);
      g.fillRect(14, 14, 4, 4);
    });
  }

  // ==========================================================================
  // ITEM ICONS: GEAR
  // ==========================================================================
  generateGearIcons() {
    this.tex('gear_weapon', (g) => {
      g.fillStyle(0xCCCCCC, 1);
      g.fillRect(14, 2, 4, 18);
      g.fillRect(12, 4, 8, 2);
      g.fillRect(15, 0, 2, 4);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(8, 18, 16, 3);
      g.fillStyle(0x6B4226, 1);
      g.fillRect(13, 21, 6, 6);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(14, 27, 4, 3);
    });

    this.tex('gear_helmet', (g) => {
      g.fillStyle(0x8A8A8A, 1);
      g.fillRect(6, 6, 20, 18);
      g.fillRect(8, 4, 16, 4);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(10, 14, 12, 4);
      g.fillStyle(0x6A6A6A, 1);
      g.fillRect(14, 2, 4, 6);
      g.fillStyle(0xAAAAAA, 1);
      g.fillRect(8, 8, 4, 4);
    });

    this.tex('gear_chest', (g) => {
      g.fillStyle(0x7A7A7A, 1);
      g.fillRect(6, 4, 20, 22);
      g.fillRect(2, 4, 6, 6);
      g.fillRect(24, 4, 6, 6);
      g.fillStyle(0x8A8A8A, 1);
      g.fillRect(10, 8, 12, 12);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(14, 12, 4, 4);
      g.fillStyle(0x6B4226, 1);
      g.fillRect(8, 22, 16, 3);
    });

    this.tex('gear_boots', (g) => {
      g.fillStyle(0x6B4226, 1);
      g.fillRect(4, 8, 10, 16);
      g.fillRect(2, 20, 12, 6);
      g.fillStyle(0x5A3218, 1);
      g.fillRect(4, 14, 10, 2);
      g.fillStyle(0x6B4226, 1);
      g.fillRect(18, 8, 10, 16);
      g.fillRect(18, 20, 12, 6);
      g.fillStyle(0x5A3218, 1);
      g.fillRect(18, 14, 10, 2);
    });

    this.tex('gear_accessory', (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(8, 8, 16, 16);
      g.fillRect(10, 6, 12, 4);
      g.fillRect(10, 22, 12, 4);
      g.fillStyle(0x1A1A2E, 1);
      g.fillRect(12, 12, 8, 8);
      g.fillStyle(0x2196F3, 1);
      g.fillRect(13, 6, 6, 4);
      g.fillStyle(0x44AAFF, 1);
      g.fillRect(15, 7, 2, 2);
    });
  }

  // ==========================================================================
  // ITEM ICONS: SEEDS (Phase 6)
  // ==========================================================================
  generateSeedIcons() {
    const seedDefs = [
      { key: 'item_wheat_seed',        color: 0xDAA520, sprout: 0x44AA44 },
      { key: 'item_carrot_seed',       color: 0xFF6622, sprout: 0x44AA44 },
      { key: 'item_tomato_seed',       color: 0xCC2222, sprout: 0x44AA44 },
      { key: 'item_golden_wheat_seed', color: 0xFFDD00, sprout: 0x88DD44 },
      { key: 'item_moonberry_seed',    color: 0x6644AA, sprout: 0x44AA44 },
      { key: 'item_starfruit_seed',    color: 0xFFDD00, sprout: 0x44AA44 },
    ];

    for (const { key, color, sprout } of seedDefs) {
      this.tex(key, (g) => {
        g.fillStyle(color, 1);
        g.fillRect(12, 14, 8, 10);
        g.fillRect(14, 12, 4, 2);
        g.fillRect(10, 18, 12, 4);
        g.fillStyle(0xFFFFFF, 0.2);
        g.fillRect(13, 15, 2, 2);
        g.fillStyle(sprout, 1);
        g.fillRect(15, 8, 2, 6);
        g.fillRect(13, 8, 2, 2);
        g.fillRect(17, 10, 2, 2);
      });
    }
  }

  // ==========================================================================
  // ITEM ICONS: CROPS (Phase 6)
  // ==========================================================================
  generateCropIcons() {
    this.tex('item_wheat', (g) => {
      g.fillStyle(0x7A8A3A, 1);
      g.fillRect(15, 14, 2, 14);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(12, 4, 8, 12);
      g.fillStyle(0xCCAA10, 1);
      g.fillRect(14, 6, 4, 4);
    });

    this.tex('item_carrot', (g) => {
      g.fillStyle(0xFF6622, 1);
      g.fillRect(14, 10, 4, 18);
      g.fillRect(12, 12, 8, 10);
      g.fillRect(15, 26, 2, 4);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(12, 6, 8, 6);
      g.fillRect(14, 4, 4, 4);
    });

    this.tex('item_tomato', (g) => {
      g.fillStyle(0xCC2222, 1);
      g.fillRect(8, 10, 16, 14);
      g.fillRect(10, 8, 12, 4);
      g.fillRect(10, 22, 12, 4);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(14, 4, 4, 6);
      g.fillRect(12, 6, 8, 3);
      g.fillStyle(0xFF4444, 1);
      g.fillRect(10, 12, 4, 4);
    });

    this.tex('item_golden_wheat', (g) => {
      g.fillStyle(0x9AAA3A, 1);
      g.fillRect(15, 14, 2, 14);
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(10, 4, 12, 12);
      g.fillStyle(0xFFFF88, 1);
      g.fillRect(14, 6, 4, 4);
      g.fillStyle(0xFFFFAA, 0.8);
      g.fillRect(8, 8, 2, 2);
      g.fillRect(22, 6, 2, 2);
    });

    this.tex('item_moonberry', (g) => {
      g.fillStyle(0x6644AA, 1);
      g.fillRect(8, 10, 16, 14);
      g.fillRect(10, 8, 12, 4);
      g.fillRect(10, 22, 12, 4);
      g.fillStyle(0x8866CC, 0.7);
      g.fillRect(10, 12, 4, 4);
      g.fillStyle(0x2A3A2A, 1);
      g.fillRect(15, 4, 2, 6);
    });

    this.tex('item_starfruit', (g) => {
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(10, 10, 12, 12);
      g.fillRect(8, 12, 16, 8);
      g.fillRect(12, 8, 8, 16);
      g.fillStyle(0xFFFF44, 1);
      g.fillRect(14, 14, 4, 4);
      g.fillStyle(0xFFFF88, 0.3);
      g.fillRect(8, 8, 16, 16);
    });
  }

  // ==========================================================================
  // ITEM ICONS: COOKED FOOD (Phase 6)
  // ==========================================================================
  generateFoodIcons() {
    this.tex('item_basic_stew', (g) => {
      g.fillStyle(0x8B6344, 1);
      g.fillRect(6, 14, 20, 12);
      g.fillRect(8, 12, 16, 4);
      g.fillRect(4, 18, 24, 6);
      g.fillStyle(0x7A5334, 1);
      g.fillRect(8, 14, 16, 4);
      g.fillStyle(0xFFFFFF, 0.3);
      g.fillRect(12, 6, 2, 6);
      g.fillRect(18, 4, 2, 8);
      g.fillRect(15, 8, 2, 4);
    });

    this.tex('item_carrot_soup', (g) => {
      g.fillStyle(0x8B6344, 1);
      g.fillRect(6, 14, 20, 12);
      g.fillRect(8, 12, 16, 4);
      g.fillRect(4, 18, 24, 6);
      g.fillStyle(0xDD8833, 1);
      g.fillRect(8, 14, 16, 4);
      g.fillStyle(0xFFFFFF, 0.3);
      g.fillRect(12, 6, 2, 6);
      g.fillRect(18, 4, 2, 8);
    });

    this.tex('item_grilled_fish', (g) => {
      g.fillStyle(0xAA9988, 1);
      g.fillRect(4, 16, 24, 10);
      g.fillRect(6, 14, 20, 4);
      g.fillStyle(0x8B6344, 1);
      g.fillRect(8, 12, 14, 8);
      g.fillRect(10, 10, 10, 4);
      g.fillRect(20, 14, 4, 6);
      g.fillStyle(0x5A3A1A, 1);
      g.fillRect(10, 14, 10, 1);
      g.fillRect(10, 17, 10, 1);
    });

    this.tex('item_hearty_chowder', (g) => {
      g.fillStyle(0x8B6344, 1);
      g.fillRect(4, 12, 24, 14);
      g.fillRect(6, 10, 20, 4);
      g.fillRect(2, 16, 28, 8);
      g.fillStyle(0xDDCC88, 1);
      g.fillRect(6, 12, 20, 4);
      g.fillStyle(0xFFFFFF, 0.3);
      g.fillRect(10, 4, 2, 6);
      g.fillRect(16, 2, 2, 8);
      g.fillRect(22, 4, 2, 6);
    });

    this.tex('item_miners_meal', (g) => {
      g.fillStyle(0xAA9988, 1);
      g.fillRect(4, 16, 24, 10);
      g.fillRect(6, 14, 20, 4);
      g.fillStyle(0xDD6633, 1);
      g.fillRect(8, 12, 8, 6);
      g.fillStyle(0xCC4422, 1);
      g.fillRect(18, 14, 6, 4);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(10, 18, 8, 3);
    });

    this.tex('item_golden_bread', (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(6, 12, 20, 12);
      g.fillRect(8, 10, 16, 4);
      g.fillStyle(0xCCA520, 1);
      g.fillRect(8, 14, 16, 6);
      g.fillStyle(0xB8952A, 1);
      g.fillRect(10, 12, 1, 10);
      g.fillRect(16, 12, 1, 10);
      g.fillRect(22, 12, 1, 10);
      g.fillStyle(0xFFDD44, 0.5);
      g.fillRect(10, 10, 6, 2);
    });

    this.tex('item_anglers_feast', (g) => {
      g.fillStyle(0xAA9988, 1);
      g.fillRect(2, 16, 28, 10);
      g.fillRect(4, 14, 24, 4);
      g.fillStyle(0xBBAA99, 1);
      g.fillRect(4, 16, 24, 1);
      g.fillStyle(0x6688AA, 1);
      g.fillRect(8, 10, 14, 8);
      g.fillRect(20, 12, 4, 6);
      g.fillStyle(0x44AA44, 1);
      g.fillRect(6, 14, 3, 3);
      g.fillRect(24, 12, 3, 3);
      g.fillStyle(0xFFDD00, 1);
      g.fillRect(12, 8, 2, 2);
    });

    this.tex('item_moonberry_tart', (g) => {
      g.fillStyle(0xCCAA77, 1);
      g.fillRect(6, 12, 20, 14);
      g.fillRect(8, 10, 16, 4);
      g.fillStyle(0xBB9966, 1);
      g.fillRect(6, 24, 20, 2);
      g.fillRect(4, 14, 2, 10);
      g.fillRect(26, 14, 2, 10);
      g.fillStyle(0x6644AA, 1);
      g.fillRect(8, 12, 16, 10);
      g.fillStyle(0x8866CC, 0.6);
      g.fillRect(10, 14, 4, 4);
      g.fillRect(16, 16, 4, 4);
    });

    this.tex('item_abyssal_broth', (g) => {
      g.fillStyle(0x4A3A30, 1);
      g.fillRect(6, 14, 20, 12);
      g.fillRect(8, 12, 16, 4);
      g.fillRect(4, 18, 24, 6);
      g.fillStyle(0x2A3A4A, 1);
      g.fillRect(8, 14, 16, 4);
      g.fillStyle(0x44AAAA, 0.4);
      g.fillRect(12, 4, 2, 8);
      g.fillRect(18, 2, 2, 10);
      g.fillStyle(0x44CCCC, 0.3);
      g.fillRect(15, 6, 2, 6);
    });

    this.tex('item_starfruit_elixir', (g) => {
      g.fillStyle(0xFFDD00, 0.8);
      g.fillRect(10, 12, 12, 14);
      g.fillRect(8, 16, 16, 8);
      g.fillStyle(0xCCCC88, 1);
      g.fillRect(13, 6, 6, 8);
      g.fillStyle(0x8B6344, 1);
      g.fillRect(14, 4, 4, 4);
      g.fillStyle(0xFFFF44, 1);
      g.fillRect(14, 18, 4, 4);
      g.fillRect(12, 19, 8, 2);
      g.fillRect(15, 16, 2, 8);
      g.fillStyle(0xFFFFAA, 0.5);
      g.fillRect(12, 14, 8, 4);
    });
  }

  // ==========================================================================
  // SKILL ICONS (Phase 6)
  // ==========================================================================
  generateSkillIcons() {
    this.tex('skill_fishing', (g) => {
      g.fillStyle(0x2266AA, 1);
      g.fillRect(6, 6, 20, 20);
      g.fillRect(8, 4, 16, 4);
      g.fillRect(8, 24, 16, 4);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(15, 8, 2, 10);
      g.fillRect(14, 18, 4, 2);
      g.fillRect(12, 16, 3, 3);
      g.fillStyle(0xCCCCCC, 0.8);
      g.fillRect(15, 4, 1, 6);
    });

    this.tex('skill_mining', (g) => {
      g.fillStyle(0x6A6A6A, 1);
      g.fillRect(8, 22, 16, 3);
      g.fillRect(6, 20, 4, 3);
      g.fillRect(22, 24, 4, 3);
      g.fillStyle(0x8A8A8A, 1);
      g.fillRect(4, 8, 14, 6);
      g.fillRect(6, 6, 10, 4);
      g.fillRect(2, 10, 4, 3);
      g.fillStyle(0x6B4226, 1);
      g.fillRect(12, 12, 4, 12);
    });

    this.tex('skill_farming', (g) => {
      g.fillStyle(0x44AA44, 1);
      g.fillRect(15, 10, 2, 18);
      g.fillRect(10, 14, 6, 3);
      g.fillRect(16, 18, 6, 3);
      g.fillRect(8, 10, 8, 3);
      g.fillRect(16, 12, 8, 3);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(12, 4, 8, 8);
      g.fillStyle(0xCCAA10, 1);
      g.fillRect(14, 5, 4, 4);
    });

    this.tex('skill_cooking', (g) => {
      g.fillStyle(0x4A4A4A, 1);
      g.fillRect(8, 10, 16, 12);
      g.fillRect(6, 12, 20, 8);
      g.fillRect(4, 12, 4, 3);
      g.fillRect(24, 12, 4, 3);
      g.fillStyle(0x5A5A5A, 1);
      g.fillRect(8, 10, 16, 2);
      g.fillStyle(0xFF4400, 1);
      g.fillRect(12, 22, 8, 4);
      g.fillStyle(0xFFAA00, 1);
      g.fillRect(14, 22, 4, 6);
      g.fillStyle(0xFFDD00, 0.7);
      g.fillRect(15, 24, 2, 4);
    });
  }

  // ==========================================================================
  // UI TEXTURES
  // ==========================================================================
  generateUITextures() {
    // Button
    this.makeTexture('ui_button', 64, 32, (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(0, 0, 64, 32);
      g.fillStyle(0x1A1A2E, 0.85);
      g.fillRect(2, 2, 60, 28);
      g.fillStyle(0xFFFFFF, 0.1);
      g.fillRect(2, 2, 60, 1);
    });

    // Buff bar bg
    this.makeTexture('ui_buff_bar_bg', 200, 28, (g) => {
      g.fillStyle(0x1A1A2E, 0.85);
      g.fillRect(0, 0, 200, 28);
      g.fillStyle(0xDAA520, 0.5);
      g.fillRect(0, 0, 200, 1);
      g.fillRect(0, 27, 200, 1);
    });

    // Skill XP bar fill (teal)
    this.makeTexture('ui_skill_xp_fill', 100, 12, (g) => {
      g.fillStyle(0x22AAAA, 1);
      g.fillRect(0, 0, 100, 12);
      g.fillStyle(0x44CCCC, 0.5);
      g.fillRect(0, 0, 100, 4);
    });

    // Skill XP bar bg
    this.makeTexture('ui_skill_xp_bg', 100, 12, (g) => {
      g.fillStyle(0x2A2A2A, 1);
      g.fillRect(0, 0, 100, 12);
      g.fillStyle(0x3A3A3A, 0.5);
      g.fillRect(0, 0, 100, 1);
    });

    // Skill level-up banner (teal)
    this.makeTexture('ui_skill_levelup_banner', 280, 48, (g) => {
      g.fillStyle(0x115555, 0.92);
      g.fillRect(0, 0, 280, 48);
      g.fillStyle(0x22AAAA, 1);
      g.fillRect(0, 0, 280, 2);
      g.fillRect(0, 46, 280, 2);
      g.fillRect(0, 0, 2, 48);
      g.fillRect(278, 0, 2, 48);
      g.fillStyle(0x44CCCC, 0.2);
      g.fillRect(2, 2, 276, 2);
    });

    // Combat level-up banner (gold)
    this.makeTexture('ui_combat_levelup_banner', 280, 48, (g) => {
      g.fillStyle(0x2A2000, 0.92);
      g.fillRect(0, 0, 280, 48);
      g.fillStyle(0xDAA520, 1);
      g.fillRect(0, 0, 280, 2);
      g.fillRect(0, 46, 280, 2);
      g.fillRect(0, 0, 2, 48);
      g.fillRect(278, 0, 2, 48);
      g.fillStyle(0xFFCC44, 0.2);
      g.fillRect(2, 2, 276, 2);
    });

    // Panel bg
    this.makeTexture('ui_panel_bg', 320, 480, (g) => {
      g.fillStyle(0x1A1A2E, 0.9);
      g.fillRect(0, 0, 320, 480);
      g.fillStyle(0xDAA520, 0.6);
      g.fillRect(0, 0, 320, 2);
      g.fillRect(0, 478, 320, 2);
      g.fillRect(0, 0, 2, 480);
      g.fillRect(318, 0, 2, 480);
    });

    // HP bar
    this.makeTexture('ui_hp_fill', 100, 8, (g) => {
      g.fillStyle(0xCC3333, 1);
      g.fillRect(0, 0, 100, 8);
      g.fillStyle(0xFF5555, 0.4);
      g.fillRect(0, 0, 100, 3);
    });

    this.makeTexture('ui_hp_bg', 100, 8, (g) => {
      g.fillStyle(0x2A1A1A, 1);
      g.fillRect(0, 0, 100, 8);
    });

    // XP bar
    this.makeTexture('ui_xp_fill', 100, 6, (g) => {
      g.fillStyle(0xDAA520, 1);
      g.fillRect(0, 0, 100, 6);
      g.fillStyle(0xFFCC44, 0.4);
      g.fillRect(0, 0, 100, 2);
    });

    this.makeTexture('ui_xp_bg', 100, 6, (g) => {
      g.fillStyle(0x2A2A1A, 1);
      g.fillRect(0, 0, 100, 6);
    });

    // Rarity borders (32×32)
    const rarityColors = {
      common: 0xAAAAAA,
      uncommon: 0x4CAF50,
      rare: 0x2196F3,
      epic: 0x9C27B0,
    };

    for (const [rarity, color] of Object.entries(rarityColors)) {
      this.tex(`ui_border_${rarity}`, (g) => {
        g.fillStyle(color, 1);
        g.fillRect(0, 0, T, 2);
        g.fillRect(0, T - 2, T, 2);
        g.fillRect(0, 0, 2, T);
        g.fillRect(T - 2, 0, 2, T);
        g.fillRect(0, 0, 4, 4);
        g.fillRect(T - 4, 0, 4, 4);
        g.fillRect(0, T - 4, 4, 4);
        g.fillRect(T - 4, T - 4, 4, 4);
      });
    }

    // Close button
    this.makeTexture('ui_close_btn', 32, 32, (g) => {
      g.fillStyle(0x1A1A2E, 0.8);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xF5E6C8, 1);
      for (let i = 0; i < 12; i++) {
        g.fillRect(8 + i, 8 + i, 3, 3);
        g.fillRect(20 - i, 8 + i, 3, 3);
      }
    });

    // Action button
    this.makeTexture('ui_action_btn', 48, 48, (g) => {
      g.fillStyle(0x1A1A2E, 0.85);
      g.fillRect(4, 0, 40, 48);
      g.fillRect(0, 4, 48, 40);
      g.fillStyle(0xDAA520, 0.7);
      g.fillRect(4, 0, 40, 2);
      g.fillRect(4, 46, 40, 2);
      g.fillRect(0, 4, 2, 40);
      g.fillRect(46, 4, 2, 40);
    });
  }
}
```

---

## Verification Checklist

After completing all steps, verify:

1. `TILE_SIZE` is `32` everywhere it is referenced
2. No remaining hardcoded `* 16` or `/ 16` pixel math for tile/sprite dimensions
3. Camera zoom is `1` (not `2`) — or `1.5` if preferred for mobile
4. Camera bounds use `MAP_WIDTH * TILE_SIZE` and `MAP_HEIGHT * TILE_SIZE`
5. World Boss sprite renders at 64×64 (`TILE_SIZE * 2`)
6. All entity `setDisplaySize` calls use `TILE_SIZE` (32) instead of hardcoded 16
7. Game boots without texture errors in console
8. All terrain tiles, buildings, mobs, items, and UI elements render correctly
9. Map is the same tile count (50×50) — world feels the same scale as before
10. Mobile touch targets are still ≥44×44pt (they should be larger now if anything)

---

## What NOT to Change

- **No game logic changes** — combat, loot tables, XP formulas, skill systems, farming timers, etc. are all untouched
- **No file structure changes** — same files, same imports, same exports
- **No texture key renames** — every key is identical to the old version, just bigger pixels
- **No map layout changes** — same 50×50 grid, same building positions, same zone boundaries
- **No new features** — this is purely a visual upgrade
