import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {}

  create() {
    this.generateTerrainTiles();
    this.generateBuildingTextures();
    this.generateFarmPlotTextures();
    this.generateActivityNodeTextures();
    this.generateEntityTextures();
    this.generateMobTextures();
    this.generateCompanionTextures();
    this.generateUITextures();
    this.generateGearTextures();
    this.generateFoodTextures();
    this.generateSeedTextures();
    this.generateItemIconTextures();
    this.scene.start('GameScene');
  }

  makeTexture(key, w, h, drawFn) {
    const canvasTexture = this.textures.createCanvas(key, w, h);
    const ctx = canvasTexture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    drawFn(ctx, w, h);
    canvasTexture.refresh();
  }

  dither(ctx, color, density, size = 32) {
    ctx.fillStyle = color;
    for (let x = 0; x < size; x += 2) {
      for (let y = 0; y < size; y += 2) {
        if (Math.random() < density) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  }


  // ─── TERRAIN TILES ───────────────────────────────────────────
  generateTerrainTiles() {
    // tile_town_ground
    this.makeTexture('tile_town_ground', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#7A6345';
      for (let x = 0; x < 32; x += 8) {
        ctx.fillRect(x, 0, 1, 32);
      }
      for (let y = 0; y < 32; y += 8) {
        ctx.fillRect(0, y, 32, 1);
      }
      for (let x = 0; x < 32; x += 8) {
        for (let y = 0; y < 32; y += 8) {
          const ox = (y / 8 % 2) * 4;
          ctx.fillRect(x + ox, y, 1, 8);
        }
      }
      this.dither(ctx, '#7A6345', 0.08);
      this.dither(ctx, '#9A8365', 0.05);
    });

    // tile_town_path
    this.makeTexture('tile_town_path', 32, 32, (ctx) => {
      ctx.fillStyle = '#A08B6B';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#8B7355';
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 28);
        const y = Math.floor(Math.random() * 28);
        ctx.fillRect(x, y, Math.floor(Math.random() * 4) + 2, 1);
      }
      this.dither(ctx, '#B09B7B', 0.06);
      this.dither(ctx, '#8B7355', 0.04);
    });

    // tile_forest_ground
    this.makeTexture('tile_forest_ground', 32, 32, (ctx) => {
      ctx.fillStyle = '#2D5A27';
      ctx.fillRect(0, 0, 32, 32);
      this.dither(ctx, '#4A7C3F', 0.2);
      this.dither(ctx, '#1A3A15', 0.1);
      ctx.fillStyle = '#4A7C3F';
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(Math.random() * 30);
        const y = Math.floor(Math.random() * 30);
        ctx.fillRect(x, y, 2, 2);
      }
    });

    // tile_tree
    this.makeTexture('tile_tree', 32, 32, (ctx) => {
      ctx.fillStyle = '#1A3A15';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(13, 18, 6, 14);
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(13, 18, 2, 14);
      ctx.fillStyle = '#2D5A27';
      ctx.fillRect(4, 4, 24, 18);
      ctx.fillStyle = '#4A7C3F';
      ctx.fillRect(6, 2, 20, 10);
      ctx.fillStyle = '#1A3A15';
      ctx.fillRect(8, 6, 4, 4);
      ctx.fillRect(18, 8, 6, 4);
      ctx.fillStyle = '#3A6A33';
      ctx.fillRect(10, 4, 12, 6);
    });

    // tile_cave_ground
    this.makeTexture('tile_cave_ground', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      this.dither(ctx, '#4A4458', 0.15);
      this.dither(ctx, '#2A2D33', 0.08);
    });

    // tile_cave_wall
    this.makeTexture('tile_cave_wall', 32, 32, (ctx) => {
      ctx.fillStyle = '#2A2D33';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#36393F';
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 28);
        const y = Math.floor(Math.random() * 28);
        ctx.fillRect(x, y, Math.floor(Math.random() * 6) + 2, 1);
      }
      this.dither(ctx, '#1E2126', 0.1);
    });

    // tile_water
    this.makeTexture('tile_water', 32, 32, (ctx) => {
      ctx.fillStyle = '#1A3A6A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#2A5A8A';
      for (let y = 4; y < 32; y += 8) {
        for (let x = 0; x < 32; x += 6) {
          ctx.fillRect(x + (y % 16 === 4 ? 3 : 0), y, 4, 2);
        }
      }
      this.dither(ctx, '#2A5A8A', 0.06);
    });

    // tile_crystal
    this.makeTexture('tile_crystal', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      this.dither(ctx, '#4A4458', 0.1);
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(6, 10, 2, 8);
      ctx.fillRect(7, 8, 2, 10);
      ctx.fillRect(20, 14, 2, 6);
      ctx.fillRect(21, 12, 2, 8);
      ctx.fillRect(14, 18, 2, 6);
      ctx.fillStyle = '#7BB0C8';
      ctx.fillRect(7, 8, 1, 4);
      ctx.fillRect(21, 12, 1, 3);
    });

    // tile_fishing_dock
    this.makeTexture('tile_fishing_dock', 32, 32, (ctx) => {
      ctx.fillStyle = '#1A3A6A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6B4226';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, i * 6 + 2, 32, 5);
      }
      ctx.fillStyle = '#5A3520';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, i * 6 + 2, 32, 1);
      }
      ctx.fillStyle = '#7B5236';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, i * 6 + 6, 32, 1);
      }
    });

    // tile_companion_nest
    this.makeTexture('tile_companion_nest', 32, 32, (ctx) => {
      ctx.fillStyle = '#2D5A27';
      ctx.fillRect(0, 0, 32, 32);
      this.dither(ctx, '#4A7C3F', 0.1);
      ctx.fillStyle = '#6B4226';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A08B6B';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5A3520';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = 16 + Math.cos(angle) * 10;
        const y = 16 + Math.sin(angle) * 10;
        ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
      }
    });
  }

  // ─── BUILDINGS ────────────────────────────────────────────────
  generateBuildingTextures() {
    // tile_building_tavern
    this.makeTexture('tile_building_tavern', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 12, 24, 18);
      ctx.fillStyle = '#8B4513';
      // Pitched roof
      ctx.fillRect(2, 10, 28, 4);
      ctx.fillRect(4, 8, 24, 4);
      ctx.fillRect(6, 6, 20, 4);
      ctx.fillRect(8, 4, 16, 4);
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(6, 12, 2, 18);
      ctx.fillRect(24, 12, 2, 18);
      // Window
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(10, 16, 4, 4);
      ctx.fillRect(20, 16, 4, 4);
      // Door
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(14, 22, 6, 10);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(18, 26, 1, 1);
      // Lantern glow
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(8, 14, 2, 2);

    });

    // tile_building_shop
    this.makeTexture('tile_building_shop', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(4, 14, 24, 16);
      // Awning
      ctx.fillStyle = '#CC3333';
      ctx.fillRect(2, 10, 28, 4);
      ctx.fillStyle = '#AA2222';
      for (let x = 2; x < 30; x += 4) {
        ctx.fillRect(x, 12, 2, 2);
      }
      // Roof
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 6, 24, 6);
      // Window with goods
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(8, 16, 6, 5);
      ctx.fillStyle = '#CC5500';
      ctx.fillRect(9, 18, 2, 2);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(12, 18, 2, 2);
      // Door
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(20, 20, 6, 12);

    });

    // tile_building_home
    this.makeTexture('tile_building_home', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(4, 14, 24, 18);
      // Roof
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(2, 12, 28, 4);
      ctx.fillRect(4, 10, 24, 4);
      ctx.fillRect(6, 8, 20, 4);
      ctx.fillRect(10, 6, 12, 4);
      // Window with light
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(8, 18, 5, 5);
      ctx.fillStyle = '#FFCC44';
      ctx.fillRect(9, 19, 3, 3);
      // Door
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(20, 22, 5, 10);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(23, 26, 1, 1);

    });

    // tile_building_kitchen
    this.makeTexture('tile_building_kitchen', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(4, 14, 24, 18);
      // Roof
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(2, 12, 28, 4);
      ctx.fillRect(4, 10, 24, 4);
      ctx.fillRect(8, 8, 16, 4);
      // Chimney
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(22, 2, 4, 10);
      // Steam
      ctx.fillStyle = '#AAAAAA';
      ctx.fillRect(23, 0, 2, 2);
      ctx.fillRect(21, 1, 2, 1);
      ctx.fillRect(25, 0, 1, 1);
      // Pot sign
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(14, 16, 6, 4);
      ctx.fillRect(15, 15, 4, 1);
      // Door
      ctx.fillStyle = '#5A3520';
      ctx.fillRect(8, 22, 5, 10);

    });
  }

  // ─── FARM PLOTS ───────────────────────────────────────────────
  generateFarmPlotTextures() {
    // tile_farm_empty
    this.makeTexture('tile_farm_empty', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A3A2A';
      for (let y = 4; y < 32; y += 6) {
        ctx.fillRect(0, y, 32, 2);
      }
      this.dither(ctx, '#2A1A0A', 0.08);
    });

    // tile_farm_planted
    this.makeTexture('tile_farm_planted', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A3A2A';
      for (let y = 4; y < 32; y += 6) {
        ctx.fillRect(0, y, 32, 2);
      }
      ctx.fillStyle = '#5A4A3A';
      ctx.fillRect(14, 14, 4, 3);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(15, 13, 2, 2);
    });

    // tile_farm_growing
    this.makeTexture('tile_farm_growing', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A3A2A';
      for (let y = 4; y < 32; y += 6) {
        ctx.fillRect(0, y, 32, 2);
      }
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(15, 10, 2, 6);
      ctx.fillRect(13, 10, 2, 2);
      ctx.fillRect(17, 12, 2, 2);
    });

    // tile_farm_ready_wheat
    this.makeTexture('tile_farm_ready_wheat', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#DAA520';
      for (let x = 6; x < 28; x += 4) {
        ctx.fillRect(x, 8, 2, 16);
        ctx.fillRect(x - 1, 6, 4, 4);
      }
      ctx.fillStyle = '#FFCC44';
      for (let x = 6; x < 28; x += 4) {
        ctx.fillRect(x, 6, 2, 2);
      }
    });

    // tile_farm_ready_carrot
    this.makeTexture('tile_farm_ready_carrot', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(10, 6, 12, 6);
      ctx.fillRect(12, 4, 8, 4);
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(12, 14, 3, 10);
      ctx.fillRect(18, 14, 3, 8);
      ctx.fillRect(15, 14, 2, 6);
    });

    // tile_farm_ready_tomato
    this.makeTexture('tile_farm_ready_tomato', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(8, 6, 16, 10);
      ctx.fillRect(14, 4, 4, 4);
      ctx.fillStyle = '#CC3333';
      ctx.beginPath();
      ctx.arc(12, 20, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(11, 18, 2, 2);
      ctx.fillRect(19, 16, 2, 2);
    });

    // tile_farm_ready_golden_wheat
    this.makeTexture('tile_farm_ready_golden_wheat', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#FFD700';
      for (let x = 6; x < 28; x += 4) {
        ctx.fillRect(x, 8, 2, 16);
        ctx.fillRect(x - 1, 5, 4, 5);
      }
      ctx.fillStyle = '#FFEE88';
      for (let x = 6; x < 28; x += 4) {
        ctx.fillRect(x, 5, 2, 2);
      }
    });

    // tile_farm_ready_moonberry
    this.makeTexture('tile_farm_ready_moonberry', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(8, 10, 16, 8);
      ctx.fillRect(14, 6, 4, 6);
      ctx.fillStyle = '#9C27B0';
      ctx.fillRect(10, 16, 4, 4);
      ctx.fillRect(18, 14, 4, 4);
      ctx.fillRect(14, 18, 4, 4);
      ctx.fillStyle = '#BA68C8';
      ctx.fillRect(10, 16, 2, 2);
      ctx.fillRect(18, 14, 2, 2);
    });

    // tile_farm_ready_starfruit
    this.makeTexture('tile_farm_ready_starfruit', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(10, 8, 12, 10);
      ctx.fillRect(14, 4, 4, 6);
      ctx.fillStyle = '#FFD700';
      // Star shape
      ctx.fillRect(14, 16, 4, 4);
      ctx.fillRect(12, 18, 8, 2);
      ctx.fillRect(14, 14, 4, 8);
      ctx.fillStyle = '#FFEE88';
      ctx.fillRect(15, 17, 2, 2);
    });
  }

  // ─── ACTIVITY NODES ───────────────────────────────────────────
  generateActivityNodeTextures() {
    // tile_mining_node_copper
    this.makeTexture('tile_mining_node_copper', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(6, 10, 20, 16);
      ctx.fillRect(8, 8, 16, 20);
      ctx.fillStyle = '#B87333';
      ctx.fillRect(10, 12, 4, 4);
      ctx.fillRect(18, 16, 4, 3);
      ctx.fillRect(14, 20, 3, 3);
      ctx.fillStyle = '#D4955A';
      ctx.fillRect(10, 12, 2, 2);
      ctx.fillRect(18, 16, 2, 1);
    });

    // tile_mining_node_iron
    this.makeTexture('tile_mining_node_iron', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(6, 10, 20, 16);
      ctx.fillRect(8, 8, 16, 20);
      ctx.fillStyle = '#71797E';
      ctx.fillRect(10, 12, 5, 4);
      ctx.fillRect(18, 14, 4, 5);
      ctx.fillRect(12, 20, 4, 3);
      ctx.fillStyle = '#99A1A6';
      ctx.fillRect(10, 12, 2, 2);
      ctx.fillRect(18, 14, 2, 2);
    });

    // tile_mining_node_crystal
    this.makeTexture('tile_mining_node_crystal', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(6, 12, 20, 14);
      ctx.fillRect(8, 10, 16, 18);
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(10, 8, 3, 10);
      ctx.fillRect(18, 10, 3, 8);
      ctx.fillRect(14, 6, 3, 12);
      ctx.fillStyle = '#7BB0C8';
      ctx.fillRect(10, 8, 1, 4);
      ctx.fillRect(14, 6, 1, 4);
      ctx.fillRect(18, 10, 1, 3);
    });

    // tile_mining_node_depleted
    this.makeTexture('tile_mining_node_depleted', 32, 32, (ctx) => {
      ctx.fillStyle = '#36393F';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(8, 14, 16, 12);
      ctx.fillRect(10, 12, 12, 14);
      this.dither(ctx, '#3A3D43', 0.1);
      ctx.fillStyle = '#555555';
      ctx.fillRect(12, 16, 3, 2);
      ctx.fillRect(18, 20, 2, 2);
    });
  }

  // ─── ENTITIES ─────────────────────────────────────────────────
  generateEntityTextures() {
    const playerColors = { tunic: '#3A7EC8', skin: '#F5D6A8', belt: '#DAA520', hair: '#5A3520' };
    const agentColors = { cloak: '#8B4513', skin: '#F5D6A8', sash: '#CC3333', hood: '#6B3410' };

    // Player down
    this.makeTexture('entity_player_down', 32, 32, (ctx) => {
      // Hair
      ctx.fillStyle = playerColors.hair;
      ctx.fillRect(11, 4, 10, 6);
      // Skin (face)
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(12, 6, 8, 6);
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, 8, 2, 2);
      ctx.fillRect(18, 8, 2, 2);
      // Tunic
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(10, 12, 12, 10);
      // Belt
      ctx.fillStyle = playerColors.belt;
      ctx.fillRect(10, 18, 12, 2);
      // Arms
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(8, 14, 2, 6);
      ctx.fillRect(22, 14, 2, 6);
      // Hands
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(8, 20, 2, 2);
      ctx.fillRect(22, 20, 2, 2);
      // Legs
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 22, 4, 6);
      ctx.fillRect(18, 22, 4, 6);
      // Boots
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(11, 26, 5, 4);
      ctx.fillRect(17, 26, 5, 4);
      // Highlight
      ctx.fillStyle = '#5A9EE8';
      ctx.fillRect(10, 12, 2, 2);
      // Shadow
      ctx.fillStyle = '#2A6EB8';
      ctx.fillRect(20, 20, 2, 2);

    });

    // Player up
    this.makeTexture('entity_player_up', 32, 32, (ctx) => {
      ctx.fillStyle = playerColors.hair;
      ctx.fillRect(11, 4, 10, 8);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(10, 12, 12, 10);
      ctx.fillStyle = playerColors.belt;
      ctx.fillRect(10, 18, 12, 2);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(8, 14, 2, 6);
      ctx.fillRect(22, 14, 2, 6);
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(8, 20, 2, 2);
      ctx.fillRect(22, 20, 2, 2);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 22, 4, 6);
      ctx.fillRect(18, 22, 4, 6);
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(11, 26, 5, 4);
      ctx.fillRect(17, 26, 5, 4);
      ctx.fillStyle = '#5A9EE8';
      ctx.fillRect(10, 12, 2, 2);

    });

    // Player left
    this.makeTexture('entity_player_left', 32, 32, (ctx) => {
      ctx.fillStyle = playerColors.hair;
      ctx.fillRect(12, 4, 8, 7);
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(11, 6, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 8, 2, 2);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(12, 12, 10, 10);
      ctx.fillStyle = playerColors.belt;
      ctx.fillRect(12, 18, 10, 2);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(10, 14, 2, 6);
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(10, 20, 2, 2);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(13, 22, 4, 6);
      ctx.fillRect(18, 22, 4, 6);
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(12, 26, 5, 4);
      ctx.fillRect(17, 26, 5, 4);

    });

    // Player right
    this.makeTexture('entity_player_right', 32, 32, (ctx) => {
      ctx.fillStyle = playerColors.hair;
      ctx.fillRect(12, 4, 8, 7);
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(15, 6, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(18, 8, 2, 2);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(10, 12, 10, 10);
      ctx.fillStyle = playerColors.belt;
      ctx.fillRect(10, 18, 10, 2);
      ctx.fillStyle = playerColors.tunic;
      ctx.fillRect(20, 14, 2, 6);
      ctx.fillStyle = playerColors.skin;
      ctx.fillRect(20, 20, 2, 2);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(11, 22, 4, 6);
      ctx.fillRect(16, 22, 4, 6);
      ctx.fillStyle = '#3A2510';
      ctx.fillRect(10, 26, 5, 4);
      ctx.fillRect(15, 26, 5, 4);

    });

    // Agent down
    this.makeTexture('entity_agent_down', 32, 32, (ctx) => {
      ctx.fillStyle = agentColors.hood;
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillStyle = agentColors.skin;
      ctx.fillRect(12, 6, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, 8, 2, 2);
      ctx.fillRect(18, 8, 2, 2);
      ctx.fillStyle = agentColors.cloak;
      ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = agentColors.sash;
      ctx.fillRect(14, 14, 4, 12);
      ctx.fillStyle = agentColors.cloak;
      ctx.fillRect(6, 14, 2, 8);
      ctx.fillRect(24, 14, 2, 8);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);
      ctx.fillStyle = '#A05A23';
      ctx.fillRect(8, 12, 2, 2);

    });

    // Agent up
    this.makeTexture('entity_agent_up', 32, 32, (ctx) => {
      ctx.fillStyle = agentColors.hood;
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillStyle = agentColors.cloak;
      ctx.fillRect(8, 12, 16, 14);
      ctx.fillRect(6, 14, 2, 8);
      ctx.fillRect(24, 14, 2, 8);
      ctx.fillStyle = agentColors.sash;
      ctx.fillRect(14, 14, 4, 12);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);
      ctx.fillStyle = '#A05A23';
      ctx.fillRect(8, 12, 2, 2);

    });

    // Agent left
    this.makeTexture('entity_agent_left', 32, 32, (ctx) => {
      ctx.fillStyle = agentColors.hood;
      ctx.fillRect(11, 2, 10, 10);
      ctx.fillStyle = agentColors.skin;
      ctx.fillRect(10, 6, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(11, 8, 2, 2);
      ctx.fillStyle = agentColors.cloak;
      ctx.fillRect(10, 12, 14, 14);
      ctx.fillRect(8, 14, 2, 8);
      ctx.fillStyle = agentColors.sash;
      ctx.fillRect(14, 14, 3, 12);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);

    });

    // Agent right
    this.makeTexture('entity_agent_right', 32, 32, (ctx) => {
      ctx.fillStyle = agentColors.hood;
      ctx.fillRect(11, 2, 10, 10);
      ctx.fillStyle = agentColors.skin;
      ctx.fillRect(16, 6, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(19, 8, 2, 2);
      ctx.fillStyle = agentColors.cloak;
      ctx.fillRect(8, 12, 14, 14);
      ctx.fillRect(22, 14, 2, 8);
      ctx.fillStyle = agentColors.sash;
      ctx.fillRect(15, 14, 3, 12);
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);

    });

    // npc_merchant
    this.makeTexture('npc_merchant', 32, 32, (ctx) => {
      ctx.fillStyle = '#5A4020';
      ctx.fillRect(9, 4, 14, 8);
      ctx.fillStyle = '#F5D6A8';
      ctx.fillRect(12, 6, 8, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, 8, 2, 2);
      ctx.fillRect(18, 8, 2, 2);
      ctx.fillStyle = '#5A4020';
      ctx.fillRect(8, 12, 16, 14);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(8, 12, 16, 1);
      ctx.fillRect(8, 25, 16, 1);
      ctx.fillRect(8, 12, 1, 14);
      ctx.fillRect(23, 12, 1, 14);
      // Pack on back
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(22, 10, 6, 10);
      ctx.fillStyle = '#8B5236';
      ctx.fillRect(22, 10, 6, 2);
      // Legs
      ctx.fillStyle = '#4A3520';
      ctx.fillRect(12, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);

    });
  }

  // ─── MOBS ─────────────────────────────────────────────────────
  generateMobTextures() {
    // mob_slime
    this.makeTexture('mob_slime', 32, 32, (ctx) => {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(6, 14, 20, 14);
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillRect(10, 10, 12, 20);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(10, 12, 6, 4);
      ctx.fillStyle = '#1B5E20';
      ctx.fillRect(12, 24, 8, 4);
      ctx.fillRect(8, 26, 16, 2);
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 16, 3, 3);
      ctx.fillRect(18, 16, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(13, 17, 2, 2);
      ctx.fillRect(19, 17, 2, 2);

    });

    // mob_wolf
    this.makeTexture('mob_wolf', 32, 32, (ctx) => {
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(6, 12, 20, 12);
      ctx.fillRect(4, 14, 24, 8);
      // Head
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(20, 8, 10, 10);
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(22, 8, 4, 4);
      ctx.fillRect(26, 8, 2, 2);
      // Snout
      ctx.fillStyle = '#A08070';
      ctx.fillRect(26, 12, 4, 4);
      // Eyes
      ctx.fillStyle = '#FF6F00';
      ctx.fillRect(24, 10, 2, 2);
      // Ears
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(22, 6, 3, 4);
      ctx.fillRect(26, 6, 3, 4);
      // Tail
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(2, 10, 6, 4);
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(2, 10, 2, 2);
      // Legs
      ctx.fillStyle = '#6D4E43';
      ctx.fillRect(8, 22, 3, 6);
      ctx.fillRect(14, 22, 3, 6);
      ctx.fillRect(20, 22, 3, 6);
      ctx.fillRect(24, 22, 3, 6);

    });

    // mob_bat
    this.makeTexture('mob_bat', 32, 32, (ctx) => {
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(13, 12, 6, 8);
      // Wings spread
      ctx.fillStyle = '#7E57C2';
      ctx.fillRect(2, 8, 12, 8);
      ctx.fillRect(18, 8, 12, 8);
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(4, 10, 8, 4);
      ctx.fillRect(20, 10, 8, 4);
      // Wing tips
      ctx.fillStyle = '#7E57C2';
      ctx.fillRect(2, 6, 4, 4);
      ctx.fillRect(26, 6, 4, 4);
      // Eyes
      ctx.fillStyle = '#FF5722';
      ctx.fillRect(14, 14, 2, 2);
      ctx.fillRect(18, 14, 2, 2);
      // Ears
      ctx.fillStyle = '#4A4458';
      ctx.fillRect(14, 10, 2, 4);
      ctx.fillRect(18, 10, 2, 4);

    });

    // mob_shadow_wisp
    this.makeTexture('mob_shadow_wisp', 32, 32, (ctx) => {
      ctx.fillStyle = '#8866CC';
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillRect(10, 6, 12, 20);
      ctx.fillRect(6, 10, 20, 12);
      ctx.fillStyle = '#6644AA';
      ctx.fillRect(12, 10, 8, 12);
      ctx.fillStyle = '#CCAAFF';
      ctx.fillRect(14, 14, 4, 4);
      // Wisps trailing
      ctx.fillStyle = '#8866CC';
      ctx.fillRect(10, 24, 2, 4);
      ctx.fillRect(16, 26, 2, 4);
      ctx.fillRect(20, 24, 2, 3);

    });

    // mob_night_stalker
    this.makeTexture('mob_night_stalker', 32, 32, (ctx) => {
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(8, 6, 16, 20);
      ctx.fillRect(6, 10, 20, 12);
      ctx.fillStyle = '#2A2A2A';
      ctx.fillRect(10, 8, 12, 4);
      // Glowing eyes
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(12, 12, 3, 2);
      ctx.fillRect(19, 12, 3, 2);
      // Claws
      ctx.fillStyle = '#333333';
      ctx.fillRect(6, 20, 2, 6);
      ctx.fillRect(8, 22, 2, 4);
      ctx.fillRect(22, 20, 2, 6);
      ctx.fillRect(24, 22, 2, 4);
      // Legs
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(10, 24, 4, 6);
      ctx.fillRect(18, 24, 4, 6);

    });

    // mob_moon_beetle
    this.makeTexture('mob_moon_beetle', 32, 32, (ctx) => {
      ctx.fillStyle = '#2A3A5A';
      ctx.fillRect(8, 10, 16, 14);
      ctx.fillRect(10, 8, 12, 18);
      // Shell line
      ctx.fillStyle = '#1A2A4A';
      ctx.fillRect(15, 10, 2, 14);
      // Spots
      ctx.fillStyle = '#88BBFF';
      ctx.fillRect(11, 14, 2, 2);
      ctx.fillRect(19, 14, 2, 2);
      ctx.fillRect(13, 20, 2, 2);
      ctx.fillRect(17, 20, 2, 2);
      // Head
      ctx.fillStyle = '#2A3A5A';
      ctx.fillRect(12, 6, 8, 6);
      // Antennae
      ctx.fillStyle = '#88BBFF';
      ctx.fillRect(12, 4, 2, 4);
      ctx.fillRect(18, 4, 2, 4);
      ctx.fillRect(11, 2, 2, 2);
      ctx.fillRect(19, 2, 2, 2);
      // Legs
      ctx.fillStyle = '#1A2A4A';
      ctx.fillRect(6, 14, 4, 2);
      ctx.fillRect(22, 14, 4, 2);
      ctx.fillRect(6, 20, 4, 2);
      ctx.fillRect(22, 20, 4, 2);

    });

    // mob_ember_wraith
    this.makeTexture('mob_ember_wraith', 32, 32, (ctx) => {
      ctx.fillStyle = '#CC4400';
      ctx.fillRect(10, 6, 12, 18);
      ctx.fillRect(8, 10, 16, 10);
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(12, 10, 8, 8);
      ctx.fillStyle = '#FFDD00';
      ctx.fillRect(14, 12, 2, 2);
      ctx.fillRect(18, 12, 2, 2);
      // Flame wisps
      ctx.fillStyle = '#CC4400';
      ctx.fillRect(10, 22, 3, 4);
      ctx.fillRect(16, 24, 2, 4);
      ctx.fillRect(20, 22, 3, 3);
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(12, 4, 2, 4);
      ctx.fillRect(18, 4, 2, 4);
      ctx.fillRect(15, 2, 2, 4);

    });
  }

  // ─── COMPANIONS ───────────────────────────────────────────────
  generateCompanionTextures() {
    // companion_fox
    this.makeTexture('companion_fox', 32, 32, (ctx) => {
      ctx.fillStyle = '#CC5500';
      ctx.fillRect(10, 10, 14, 12);
      ctx.fillRect(8, 12, 18, 8);
      // Head
      ctx.fillRect(18, 6, 10, 10);
      // Ears
      ctx.fillRect(20, 2, 3, 6);
      ctx.fillRect(25, 2, 3, 6);
      // White belly
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 16, 8, 4);
      // Tail
      ctx.fillStyle = '#CC5500';
      ctx.fillRect(4, 8, 8, 4);
      ctx.fillRect(2, 6, 4, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(2, 8, 2, 2);
      // Eyes and nose
      ctx.fillStyle = '#000000';
      ctx.fillRect(22, 8, 2, 2);
      ctx.fillRect(26, 8, 2, 2);
      ctx.fillRect(26, 12, 2, 2);
      // Legs
      ctx.fillStyle = '#AA4400';
      ctx.fillRect(12, 22, 3, 6);
      ctx.fillRect(19, 22, 3, 6);

    });

    // companion_owl
    this.makeTexture('companion_owl', 32, 32, (ctx) => {
      ctx.fillStyle = '#7A5A30';
      ctx.fillRect(10, 8, 12, 16);
      ctx.fillRect(8, 12, 16, 10);
      // Ear tufts
      ctx.fillRect(10, 4, 3, 6);
      ctx.fillRect(19, 4, 3, 6);
      // Wings
      ctx.fillStyle = '#6A4A20';
      ctx.fillRect(6, 14, 4, 8);
      ctx.fillRect(22, 14, 4, 8);
      // Face disc
      ctx.fillStyle = '#8A6A40';
      ctx.fillRect(12, 10, 8, 8);
      // Eyes
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(13, 12, 3, 3);
      ctx.fillRect(18, 12, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, 13, 1, 1);
      ctx.fillRect(19, 13, 1, 1);
      // Beak
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(15, 16, 2, 2);
      // Feet
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(12, 24, 3, 2);
      ctx.fillRect(18, 24, 3, 2);

    });

    // companion_frog
    this.makeTexture('companion_frog', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A7A3A';
      ctx.fillRect(8, 12, 16, 12);
      ctx.fillRect(6, 14, 20, 8);
      // Head
      ctx.fillRect(10, 8, 12, 8);
      // Eye circles
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 6, 5, 5);
      ctx.fillRect(17, 6, 5, 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 8, 2, 2);
      ctx.fillRect(19, 8, 2, 2);
      // Mouth
      ctx.fillStyle = '#2A5A2A';
      ctx.fillRect(12, 16, 8, 1);
      // Front legs
      ctx.fillStyle = '#2A6A2A';
      ctx.fillRect(6, 20, 4, 4);
      ctx.fillRect(22, 20, 4, 4);
      // Back legs
      ctx.fillRect(8, 24, 6, 4);
      ctx.fillRect(18, 24, 6, 4);

    });

    // companion_mole
    this.makeTexture('companion_mole', 32, 32, (ctx) => {
      ctx.fillStyle = '#5A4030';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(10, 10, 12, 16);
      // Eyes (tiny)
      ctx.fillStyle = '#000000';
      ctx.fillRect(13, 14, 2, 1);
      ctx.fillRect(19, 14, 2, 1);
      // Pink nose
      ctx.fillStyle = '#FFAAAA';
      ctx.fillRect(15, 16, 3, 2);
      // Claws
      ctx.fillStyle = '#8A7060';
      ctx.fillRect(6, 18, 4, 3);
      ctx.fillRect(22, 18, 4, 3);
      ctx.fillStyle = '#DDCCBB';
      ctx.fillRect(6, 20, 1, 2);
      ctx.fillRect(8, 20, 1, 2);
      ctx.fillRect(22, 20, 1, 2);
      ctx.fillRect(24, 20, 1, 2);
      // Feet
      ctx.fillStyle = '#4A3020';
      ctx.fillRect(12, 24, 3, 4);
      ctx.fillRect(18, 24, 3, 4);

    });

    // companion_wolf
    this.makeTexture('companion_wolf', 32, 32, (ctx) => {
      ctx.fillStyle = '#4A4A5A';
      ctx.fillRect(6, 12, 18, 10);
      ctx.fillRect(8, 10, 14, 14);
      // Head
      ctx.fillRect(18, 6, 10, 10);
      // Ears
      ctx.fillStyle = '#3A3A4A';
      ctx.fillRect(20, 2, 3, 6);
      ctx.fillRect(25, 2, 3, 6);
      // Eyes
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(22, 8, 2, 2);
      ctx.fillRect(26, 8, 2, 2);
      // Nose
      ctx.fillStyle = '#2A2A3A';
      ctx.fillRect(26, 12, 2, 2);
      // Tail
      ctx.fillStyle = '#4A4A5A';
      ctx.fillRect(2, 10, 6, 3);
      ctx.fillStyle = '#5A5A6A';
      ctx.fillRect(2, 10, 2, 2);
      // Legs
      ctx.fillStyle = '#3A3A4A';
      ctx.fillRect(10, 22, 3, 6);
      ctx.fillRect(16, 22, 3, 6);
      ctx.fillRect(22, 22, 3, 6);

    });

    // companion_toad
    this.makeTexture('companion_toad', 32, 32, (ctx) => {
      ctx.fillStyle = '#4A5A2A';
      ctx.fillRect(8, 12, 16, 14);
      ctx.fillRect(6, 16, 20, 8);
      // Head
      ctx.fillRect(10, 8, 12, 8);
      // Warts
      ctx.fillStyle = '#5A6A3A';
      ctx.fillRect(10, 14, 2, 2);
      ctx.fillRect(18, 18, 2, 2);
      ctx.fillRect(14, 22, 2, 2);
      // Eyes
      ctx.fillStyle = '#CCCC00';
      ctx.fillRect(11, 8, 3, 3);
      ctx.fillRect(18, 8, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 9, 1, 1);
      ctx.fillRect(19, 9, 1, 1);
      // Legs
      ctx.fillStyle = '#3A4A1A';
      ctx.fillRect(6, 22, 4, 4);
      ctx.fillRect(22, 22, 4, 4);
      ctx.fillRect(10, 26, 4, 4);
      ctx.fillRect(18, 26, 4, 4);

    });

    // Eggs
    const eggCompanions = [
      { key: 'egg_fox', color: '#CC5500' },
      { key: 'egg_owl', color: '#7A5A30' },
      { key: 'egg_frog', color: '#3A7A3A' },
      { key: 'egg_mole', color: '#5A4030' },
      { key: 'egg_wolf', color: '#4A4A5A' },
      { key: 'egg_toad', color: '#4A5A2A' },
    ];
    for (const { key, color } of eggCompanions) {
      this.makeTexture(key, 32, 32, (ctx) => {
        ctx.fillStyle = '#F5F0E0';
        ctx.beginPath();
        ctx.ellipse(16, 16, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.fillRect(12, 12, 8, 4);
        ctx.fillRect(14, 10, 4, 2);
        // Highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(12, 8, 2, 2);
        // Crack
        ctx.fillStyle = '#CCCCAA';
        ctx.fillRect(12, 18, 2, 1);
        ctx.fillRect(14, 19, 2, 1);
        ctx.fillRect(16, 18, 2, 1);
        ctx.fillRect(18, 19, 2, 1);
  
      });
    }
  }

  // ─── UI TEXTURES ──────────────────────────────────────────────
  generateUITextures() {
    // ui_btn_circle
    this.makeTexture('ui_btn_circle', 60, 60, (ctx, w, h) => {
      ctx.fillStyle = '#2A2A3E';
      ctx.beginPath();
      ctx.arc(30, 30, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555577';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 30, 28, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ui_btn_small
    this.makeTexture('ui_btn_small', 44, 44, (ctx) => {
      ctx.fillStyle = '#2A2A3E';
      ctx.beginPath();
      ctx.arc(22, 22, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555577';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(22, 22, 20, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ui_joystick_ring
    this.makeTexture('ui_joystick_ring', 80, 80, (ctx) => {
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#555577';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(40, 40, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // ui_joystick_nub
    this.makeTexture('ui_joystick_nub', 30, 30, (ctx) => {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#888899';
      ctx.beginPath();
      ctx.arc(15, 15, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // ui_hp_bg
    this.makeTexture('ui_hp_bg', 64, 8, (ctx) => {
      ctx.fillStyle = '#B71C1C';
      ctx.fillRect(0, 0, 64, 8);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 64, 8);
    });

    // ui_hp_fill
    this.makeTexture('ui_hp_fill', 64, 8, (ctx) => {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 0, 64, 8);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(0, 0, 64, 3);
    });

    // ui_inv_slot
    this.makeTexture('ui_inv_slot', 80, 80, (ctx) => {
      ctx.fillStyle = '#2A2A3E';
      ctx.fillRect(0, 0, 80, 80);
      ctx.strokeStyle = '#555577';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 78, 78);
    });

    // Gear slots
    const gearSlots = [
      { key: 'ui_gear_slot_common', border: '#AAAAAA' },
      { key: 'ui_gear_slot_uncommon', border: '#4CAF50' },
      { key: 'ui_gear_slot_rare', border: '#2196F3' },
      { key: 'ui_gear_slot_epic', border: '#9C27B0' },
      { key: 'ui_gear_slot_empty', border: '#444466' },
    ];
    for (const { key, border } of gearSlots) {
      this.makeTexture(key, 48, 48, (ctx) => {
        ctx.fillStyle = '#2A2A3E';
        ctx.fillRect(0, 0, 48, 48);
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 46, 46);
      });
    }
  }

  // ─── GEAR TEXTURES ────────────────────────────────────────────
  generateGearTextures() {
    // gear_wooden_sword
    this.makeTexture('gear_wooden_sword', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(14, 18, 4, 10);
      ctx.fillRect(11, 26, 10, 2);
      ctx.fillStyle = '#888888';
      ctx.fillRect(15, 4, 2, 16);
      ctx.fillRect(14, 4, 4, 2);
      ctx.fillStyle = '#AAAAAA';
      ctx.fillRect(15, 4, 1, 8);
    });

    // gear_iron_dagger
    this.makeTexture('gear_iron_dagger', 32, 32, (ctx) => {
      ctx.fillStyle = '#555555';
      ctx.fillRect(14, 18, 4, 8);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(13, 25, 6, 2);
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(15, 4, 2, 16);
      ctx.fillRect(16, 4, 1, 2);
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(15, 4, 1, 10);
    });

    // gear_shadow_blade
    this.makeTexture('gear_shadow_blade', 32, 32, (ctx) => {
      ctx.fillStyle = '#4A2060';
      ctx.fillRect(14, 18, 4, 10);
      ctx.fillRect(11, 26, 10, 2);
      ctx.fillStyle = '#2A2A3E';
      ctx.fillRect(15, 3, 2, 17);
      ctx.fillRect(14, 3, 4, 2);
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(15, 5, 1, 6);
      ctx.fillRect(16, 8, 1, 4);
    });

    // gear_leather_cap
    this.makeTexture('gear_leather_cap', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(8, 10, 16, 10);
      ctx.fillRect(6, 14, 20, 6);
      ctx.fillStyle = '#A06B3B';
      ctx.fillRect(8, 10, 16, 4);
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(6, 18, 20, 2);
    });

    // gear_iron_helm
    this.makeTexture('gear_iron_helm', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(8, 8, 16, 14);
      ctx.fillRect(6, 12, 20, 8);
      ctx.fillStyle = '#AAAAAA';
      ctx.fillRect(8, 8, 16, 4);
      ctx.fillStyle = '#666666';
      ctx.fillRect(10, 16, 12, 4);
      ctx.fillStyle = '#222222';
      ctx.fillRect(12, 18, 8, 2);
    });

    // gear_cloth_tunic
    this.makeTexture('gear_cloth_tunic', 32, 32, (ctx) => {
      ctx.fillStyle = '#7A5A30';
      ctx.fillRect(8, 6, 16, 18);
      ctx.fillRect(4, 8, 24, 14);
      ctx.fillStyle = '#8A6A40';
      ctx.fillRect(8, 6, 16, 4);
      ctx.fillStyle = '#6A4A20';
      ctx.fillRect(14, 6, 4, 2);
      ctx.fillRect(8, 22, 16, 2);
    });

    // gear_chainmail
    this.makeTexture('gear_chainmail', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(8, 6, 16, 18);
      ctx.fillRect(4, 8, 24, 14);
      // Chain pattern
      ctx.fillStyle = '#AAAAAA';
      for (let y = 8; y < 22; y += 2) {
        for (let x = 6; x < 26; x += 2) {
          if ((x + y) % 4 === 0) ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = '#666666';
      ctx.fillRect(14, 6, 4, 2);
    });

    // gear_sandals
    this.makeTexture('gear_sandals', 32, 32, (ctx) => {
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(4, 18, 10, 8);
      ctx.fillRect(18, 18, 10, 8);
      ctx.fillStyle = '#A06B3B';
      ctx.fillRect(6, 16, 2, 4);
      ctx.fillRect(20, 16, 2, 4);
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 24, 10, 2);
      ctx.fillRect(18, 24, 10, 2);
    });

    // gear_iron_greaves
    this.makeTexture('gear_iron_greaves', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(4, 10, 10, 16);
      ctx.fillRect(18, 10, 10, 16);
      ctx.fillStyle = '#AAAAAA';
      ctx.fillRect(4, 10, 10, 4);
      ctx.fillRect(18, 10, 10, 4);
      ctx.fillStyle = '#666666';
      ctx.fillRect(4, 24, 12, 4);
      ctx.fillRect(18, 24, 12, 4);
    });

    // gear_bone_ring
    this.makeTexture('gear_bone_ring', 32, 32, (ctx) => {
      ctx.fillStyle = '#E8E0D0';
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2A2A3E';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#CC3333';
      ctx.fillRect(14, 6, 4, 4);
    });

    // gear_echo_pendant
    this.makeTexture('gear_echo_pendant', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(12, 4, 8, 1);
      ctx.fillRect(11, 5, 1, 4);
      ctx.fillRect(20, 5, 1, 4);
      ctx.fillStyle = '#5B8FA8';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7BB0C8';
      ctx.fillRect(14, 12, 2, 2);
    });

    // gear_moonstone_ring
    this.makeTexture('gear_moonstone_ring', 32, 32, (ctx) => {
      ctx.fillStyle = '#CCCCCC';
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2A2A3E';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(13, 6, 6, 6);
      ctx.fillStyle = '#7BB0C8';
      ctx.fillRect(14, 7, 2, 2);
    });

    // gear_lantern
    this.makeTexture('gear_lantern', 32, 32, (ctx) => {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(12, 4, 8, 2);
      ctx.fillRect(11, 6, 10, 2);
      ctx.fillRect(10, 8, 12, 14);
      ctx.fillRect(11, 22, 10, 2);
      ctx.fillStyle = '#FFCC44';
      ctx.fillRect(12, 10, 8, 10);
      ctx.fillStyle = '#FFEE88';
      ctx.fillRect(14, 12, 4, 6);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(15, 2, 2, 4);
    });

    // gear_swamp_fang_blade
    this.makeTexture('gear_swamp_fang_blade', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A5A1A';
      ctx.fillRect(14, 18, 4, 10);
      ctx.fillRect(11, 26, 10, 2);
      ctx.fillStyle = '#4A7A2A';
      ctx.fillRect(15, 3, 2, 17);
      ctx.fillRect(14, 3, 4, 3);
      ctx.fillStyle = '#66AA33';
      ctx.fillRect(15, 5, 1, 8);
      // Toxic drip
      ctx.fillStyle = '#88CC44';
      ctx.fillRect(17, 6, 1, 2);
      ctx.fillRect(17, 10, 1, 2);
    });

    // gear_volcanic_helm
    this.makeTexture('gear_volcanic_helm', 32, 32, (ctx) => {
      ctx.fillStyle = '#6A2020';
      ctx.fillRect(8, 8, 16, 14);
      ctx.fillRect(6, 12, 20, 8);
      ctx.fillStyle = '#8A3030';
      ctx.fillRect(8, 8, 16, 4);
      // Lava cracks
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(10, 14, 1, 4);
      ctx.fillRect(14, 12, 1, 6);
      ctx.fillRect(20, 14, 1, 3);
      ctx.fillStyle = '#444444';
      ctx.fillRect(12, 18, 8, 2);
    });

    // gear_miasma_mail
    this.makeTexture('gear_miasma_mail', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A5A2A';
      ctx.fillRect(8, 6, 16, 18);
      ctx.fillRect(4, 8, 24, 14);
      ctx.fillStyle = '#9C27B0';
      ctx.fillRect(8, 6, 16, 2);
      ctx.fillRect(8, 22, 16, 2);
      ctx.fillRect(4, 8, 2, 14);
      ctx.fillRect(26, 8, 2, 14);
      ctx.fillStyle = '#4A6A3A';
      ctx.fillRect(14, 6, 4, 2);
    });

    // gear_ashwalker_boots
    this.makeTexture('gear_ashwalker_boots', 32, 32, (ctx) => {
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(4, 10, 10, 16);
      ctx.fillRect(18, 10, 10, 16);
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(4, 10, 10, 4);
      ctx.fillRect(18, 10, 10, 4);
      // Ember soles
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(4, 24, 12, 2);
      ctx.fillRect(18, 24, 12, 2);
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(6, 24, 2, 2);
      ctx.fillRect(20, 24, 2, 2);
    });

    // gear_hexed_amulet
    this.makeTexture('gear_hexed_amulet', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(12, 4, 8, 1);
      ctx.fillRect(11, 5, 1, 4);
      ctx.fillRect(20, 5, 1, 4);
      ctx.fillStyle = '#9C27B0';
      ctx.beginPath();
      ctx.arc(16, 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(14, 14, 4, 4);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(15, 15, 2, 2);
    });

    // gear_infernal_greatsword
    this.makeTexture('gear_infernal_greatsword', 32, 32, (ctx) => {
      ctx.fillStyle = '#4A2020';
      ctx.fillRect(13, 20, 6, 8);
      ctx.fillRect(8, 26, 16, 3);
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(14, 2, 4, 20);
      ctx.fillRect(13, 2, 6, 3);
      // Lava cracks
      ctx.fillStyle = '#FF4400';
      ctx.fillRect(15, 4, 1, 6);
      ctx.fillRect(16, 8, 1, 4);
      ctx.fillRect(14, 14, 1, 4);
      ctx.fillStyle = '#FFAA00';
      ctx.fillRect(15, 6, 1, 2);
    });
  }

  // ─── FOOD TEXTURES ────────────────────────────────────────────
  generateFoodTextures() {
    // food_basic_stew
    this.makeTexture('food_basic_stew', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(6, 14, 20, 12);
      ctx.fillRect(4, 16, 24, 8);
      ctx.fillStyle = '#8B5A30';
      ctx.fillRect(6, 14, 20, 3);
      ctx.fillStyle = '#AA8844';
      ctx.fillRect(8, 16, 16, 6);
      // Steam
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 8, 2, 4);
      ctx.fillRect(16, 6, 2, 4);
      ctx.fillRect(20, 8, 2, 3);
    });

    // food_carrot_soup
    this.makeTexture('food_carrot_soup', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(6, 14, 20, 12);
      ctx.fillRect(4, 16, 24, 8);
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(8, 16, 16, 6);
      ctx.fillStyle = '#FFA030';
      ctx.fillRect(10, 17, 4, 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(14, 8, 2, 4);
      ctx.fillRect(18, 6, 2, 4);
    });

    // food_grilled_fish
    this.makeTexture('food_grilled_fish', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 18, 24, 8);
      ctx.fillStyle = '#CC8844';
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillRect(6, 14, 20, 4);
      ctx.fillStyle = '#AA6633';
      ctx.fillRect(10, 14, 12, 2);
      // Tail
      ctx.fillStyle = '#CC8844';
      ctx.fillRect(22, 10, 4, 4);
      ctx.fillRect(24, 8, 2, 2);
      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, 14, 1, 1);
    });

    // food_hearty_chowder
    this.makeTexture('food_hearty_chowder', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 12, 24, 14);
      ctx.fillRect(2, 14, 28, 10);
      ctx.fillStyle = '#DDBB88';
      ctx.fillRect(6, 14, 20, 8);
      ctx.fillStyle = '#CCAA77';
      ctx.fillRect(8, 16, 6, 4);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 6, 2, 4);
      ctx.fillRect(14, 4, 2, 5);
      ctx.fillRect(18, 6, 2, 4);
    });

    // food_miners_meal
    this.makeTexture('food_miners_meal', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(4, 18, 24, 8);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(6, 12, 12, 8);
      ctx.fillStyle = '#AA6633';
      ctx.fillRect(7, 13, 10, 6);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(20, 14, 6, 6);
      ctx.fillStyle = '#FFCC44';
      ctx.fillRect(21, 15, 4, 4);
    });

    // food_golden_bread
    this.makeTexture('food_golden_bread', 32, 32, (ctx) => {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(6, 12, 20, 12);
      ctx.fillRect(8, 10, 16, 14);
      ctx.fillStyle = '#FFCC44';
      ctx.fillRect(8, 10, 16, 4);
      ctx.fillStyle = '#BB8810';
      ctx.fillRect(6, 22, 20, 2);
      ctx.fillStyle = '#CC9920';
      ctx.fillRect(14, 14, 2, 1);
      ctx.fillRect(10, 16, 1, 1);
      ctx.fillRect(18, 15, 1, 1);
    });

    // food_anglers_feast
    this.makeTexture('food_anglers_feast', 32, 32, (ctx) => {
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(2, 16, 28, 10);
      ctx.fillStyle = '#CC8844';
      ctx.fillRect(4, 10, 14, 8);
      ctx.fillRect(6, 12, 10, 4);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(20, 12, 6, 6);
      ctx.fillRect(18, 14, 3, 3);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(21, 13, 2, 2);
    });

    // food_moonberry_tart
    this.makeTexture('food_moonberry_tart', 32, 32, (ctx) => {
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(6, 14, 20, 10);
      ctx.fillRect(8, 12, 16, 12);
      ctx.fillStyle = '#CC9920';
      ctx.fillRect(6, 22, 20, 2);
      ctx.fillStyle = '#9C27B0';
      ctx.fillRect(10, 14, 12, 6);
      ctx.fillStyle = '#BA68C8';
      ctx.fillRect(12, 15, 2, 2);
      ctx.fillRect(16, 16, 2, 2);
      ctx.fillRect(14, 18, 2, 1);
    });

    // food_abyssal_broth
    this.makeTexture('food_abyssal_broth', 32, 32, (ctx) => {
      ctx.fillStyle = '#2A2A3E';
      ctx.fillRect(6, 14, 20, 12);
      ctx.fillRect(4, 16, 24, 8);
      ctx.fillStyle = '#1A3A6A';
      ctx.fillRect(8, 16, 16, 6);
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(10, 17, 4, 2);
      // Teal steam
      ctx.fillStyle = '#5B8FA8';
      ctx.fillRect(12, 8, 2, 4);
      ctx.fillRect(16, 6, 2, 4);
      ctx.fillRect(20, 8, 2, 3);
    });

    // food_starfruit_elixir
    this.makeTexture('food_starfruit_elixir', 32, 32, (ctx) => {
      // Bottle
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(12, 6, 8, 18);
      ctx.fillRect(14, 4, 4, 4);
      ctx.fillStyle = '#FFEE88';
      ctx.fillRect(12, 6, 8, 6);
      // Cork
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(14, 2, 4, 4);
      // Star motif
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(15, 14, 2, 2);
      ctx.fillRect(14, 15, 4, 1);
      ctx.fillRect(15, 13, 2, 1);
      ctx.fillRect(15, 16, 2, 1);
    });
  }

  // ─── SEED TEXTURES ────────────────────────────────────────────
  generateSeedTextures() {
    const seeds = [
      { key: 'seed_wheat', color: '#DAA520', accent: '#FFCC44' },
      { key: 'seed_carrot', color: '#FF8C00', accent: '#FFA030' },
      { key: 'seed_tomato', color: '#CC3333', accent: '#FF4444' },
      { key: 'seed_golden_wheat', color: '#FFD700', accent: '#FFEE88' },
      { key: 'seed_moonberry', color: '#9C27B0', accent: '#BA68C8' },
      { key: 'seed_starfruit', color: '#FFD700', accent: '#FFEE88' },
      { key: 'seed_mystery', color: '#5B8FA8', accent: '#7BB0C8' },
      { key: 'seed_ember_pepper', color: '#CC4400', accent: '#FFAA00' },
      { key: 'seed_frost_lily', color: '#88BBFF', accent: '#CCDDFF' },
    ];

    for (const { key, color, accent } of seeds) {
      this.makeTexture(key, 32, 32, (ctx) => {
        // Seed packet
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(8, 6, 16, 20);
        ctx.fillStyle = '#6B5335';
        ctx.fillRect(8, 6, 16, 2);
        ctx.fillRect(8, 24, 16, 2);
        // Color band
        ctx.fillStyle = color;
        ctx.fillRect(10, 10, 12, 10);
        // Seeds inside
        ctx.fillStyle = accent;
        ctx.fillRect(13, 13, 2, 2);
        ctx.fillRect(17, 15, 2, 2);
        ctx.fillRect(14, 17, 2, 2);
      });
    }
  }

  // ─── ITEM ICON TEXTURES ──────────────────────────────────────
  generateItemIconTextures() {
    // icon_slime_gel — glossy green slime blob (reference: dome-shaped with highlights)
    this.makeTexture('icon_slime_gel', 32, 32, (ctx) => {
      // Base blob shape — dark green bottom
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(4, 20, 24, 8);
      ctx.fillRect(6, 18, 20, 10);
      ctx.fillRect(2, 22, 28, 6);
      // Main body — mid green dome
      ctx.fillStyle = '#43A047';
      ctx.fillRect(6, 14, 20, 10);
      ctx.fillRect(8, 12, 16, 14);
      ctx.fillRect(10, 10, 12, 16);
      // Upper dome highlight — lighter green
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(10, 12, 12, 6);
      ctx.fillRect(8, 14, 16, 4);
      // Top highlight — bright green sheen
      ctx.fillStyle = '#81C784';
      ctx.fillRect(12, 12, 6, 4);
      ctx.fillRect(10, 14, 4, 2);
      // Specular highlight — white/light spot
      ctx.fillStyle = '#A5D6A7';
      ctx.fillRect(12, 12, 3, 2);
      ctx.fillStyle = '#C8E6C9';
      ctx.fillRect(13, 12, 2, 1);
      // Drip details at base
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(4, 26, 2, 2);
      ctx.fillRect(26, 24, 2, 2);
      ctx.fillRect(14, 28, 3, 2);
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(12, 16, 3, 3);
      ctx.fillRect(18, 16, 3, 3);
      ctx.fillStyle = '#1B5E20';
      ctx.fillRect(13, 17, 2, 2);
      ctx.fillRect(19, 17, 2, 2);
    });

    // icon_river_crab — orange crab with claws (reference: front-facing with raised pincers)
    this.makeTexture('icon_river_crab', 32, 32, (ctx) => {
      // Main body — orange oval
      ctx.fillStyle = '#E65100';
      ctx.fillRect(8, 12, 16, 10);
      ctx.fillRect(10, 10, 12, 14);
      ctx.fillRect(6, 14, 20, 6);
      // Body highlight
      ctx.fillStyle = '#FF6D00';
      ctx.fillRect(10, 12, 12, 6);
      ctx.fillRect(12, 10, 8, 2);
      // Belly — lighter
      ctx.fillStyle = '#FFAB91';
      ctx.fillRect(12, 18, 8, 3);
      // Eyes on stalks
      ctx.fillStyle = '#E65100';
      ctx.fillRect(12, 8, 2, 4);
      ctx.fillRect(18, 8, 2, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 8, 2, 2);
      ctx.fillRect(18, 8, 2, 2);
      // Left claw (raised)
      ctx.fillStyle = '#E65100';
      ctx.fillRect(2, 8, 6, 6);
      ctx.fillRect(4, 6, 4, 4);
      ctx.fillRect(6, 12, 2, 4);
      ctx.fillStyle = '#BF360C';
      ctx.fillRect(2, 10, 2, 2);
      ctx.fillRect(4, 8, 2, 2);
      // Right claw (raised)
      ctx.fillStyle = '#E65100';
      ctx.fillRect(24, 8, 6, 6);
      ctx.fillRect(24, 6, 4, 4);
      ctx.fillRect(24, 12, 2, 4);
      ctx.fillStyle = '#BF360C';
      ctx.fillRect(28, 10, 2, 2);
      ctx.fillRect(26, 8, 2, 2);
      // Legs — 3 pairs
      ctx.fillStyle = '#BF360C';
      ctx.fillRect(4, 16, 4, 2);
      ctx.fillRect(2, 18, 2, 4);
      ctx.fillRect(4, 20, 4, 2);
      ctx.fillRect(2, 22, 2, 4);
      ctx.fillRect(6, 24, 4, 2);
      ctx.fillRect(4, 26, 2, 3);
      ctx.fillRect(24, 16, 4, 2);
      ctx.fillRect(28, 18, 2, 4);
      ctx.fillRect(24, 20, 4, 2);
      ctx.fillRect(28, 22, 2, 4);
      ctx.fillRect(22, 24, 4, 2);
      ctx.fillRect(26, 26, 2, 3);
      // Mouth
      ctx.fillStyle = '#BF360C';
      ctx.fillRect(14, 20, 4, 1);
    });
  }
}
