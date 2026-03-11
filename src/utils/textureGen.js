import { COLORS } from '../config/constants.js';

export function generateTextures(scene) {
  generateTileTextures(scene);
  generateFarmTextures(scene);
  generateEntityTextures(scene);
  generateUITextures(scene);
  generateGearTextures(scene);
  generateItemTextures(scene);
  generatePhase7Textures(scene);
}

// ---------------------------------------------------------------------------
// Helper: create canvas-based texture with proper transparency support
// ---------------------------------------------------------------------------
function makeTex(scene, key, w, h, drawFn) {
  const ct = scene.textures.createCanvas(key, w, h);
  const ctx = ct.getContext();
  ctx.clearRect(0, 0, w, h);
  // Shim that mimics Phaser Graphics API on Canvas 2D
  const g = {
    fillStyle(color, alpha) {
      const a = (alpha !== undefined) ? alpha : 1;
      const r = (color >> 16) & 0xFF;
      const gv = (color >> 8) & 0xFF;
      const b = color & 0xFF;
      ctx.fillStyle = `rgba(${r},${gv},${b},${a})`;
    },
    fillRect(x, y, rw, rh) {
      ctx.fillRect(x, y, rw, rh);
    },
    fillCircle(cx, cy, radius) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    lineStyle(width, color, alpha) {
      const a = (alpha !== undefined) ? alpha : 1;
      const r = (color >> 16) & 0xFF;
      const gv = (color >> 8) & 0xFF;
      const b = color & 0xFF;
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(${r},${gv},${b},${a})`;
    },
    strokeCircle(cx, cy, radius) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    },
    strokeRect(x, y, rw, rh) {
      ctx.strokeRect(x, y, rw, rh);
    },
  };
  drawFn(g);
  ct.refresh();
}

function tex32(scene, key, drawFn) {
  makeTex(scene, key, 32, 32, drawFn);
}

function dither(g, noiseColor, density) {
  for (let x = 0; x < 32; x += 2) {
    for (let y = 0; y < 32; y += 2) {
      if (Math.random() < density) {
        g.fillStyle(noiseColor, 1);
        g.fillRect(x, y, 2, 2);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TILE TEXTURES (32×32)
// ---------------------------------------------------------------------------
function generateTileTextures(scene) {
  // tile_town_ground (prompt: tile_grass)
  tex32(scene, 'tile_town_ground', (g) => {
    g.fillStyle(0x4A7C3F);
    g.fillRect(0, 0, 32, 32);
    dither(g, 0x3D6B34, 0.2);
    dither(g, 0x5A8C4F, 0.1);
    g.fillStyle(0x5A9C4F);
    g.fillRect(4, 6, 2, 4);
    g.fillRect(18, 14, 2, 4);
    g.fillRect(26, 24, 2, 4);
  });

  // tile_town_path (prompt: tile_path)
  tex32(scene, 'tile_town_path', (g) => {
    g.fillStyle(0x8B8878);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x7A7768);
    for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 1, 32);
    for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 1);
    g.fillStyle(0x6A6758);
    for (let y = 0; y < 32; y += 16) {
      g.fillRect(4, y + 8, 1, 8);
      g.fillRect(12, y + 8, 1, 8);
      g.fillRect(20, y + 8, 1, 8);
      g.fillRect(28, y + 8, 1, 8);
    }
    dither(g, 0x9A9888, 0.08);
  });

  // tile_forest_ground (prompt: tile_forest_grass)
  tex32(scene, 'tile_forest_ground', (g) => {
    g.fillStyle(0x2D5A27);
    g.fillRect(0, 0, 32, 32);
    dither(g, 0x1A3A15, 0.25);
    dither(g, 0x3A6A34, 0.12);
    g.fillStyle(0x4A3A20);
    g.fillRect(6, 10, 4, 2);
    g.fillRect(20, 22, 4, 2);
  });

  // tile_tree (prompt: tile_tree — key matches)
  tex32(scene, 'tile_tree', (g) => {
    g.fillStyle(0x4A3220);
    g.fillRect(12, 18, 8, 14);
    g.fillStyle(0x3A2210);
    g.fillRect(12, 18, 2, 14);
    g.fillStyle(0x1D4A17);
    g.fillRect(2, 2, 28, 20);
    g.fillStyle(0x2D5A27);
    g.fillRect(4, 4, 24, 16);
    g.fillStyle(0x3A6A34);
    g.fillRect(8, 6, 16, 10);
    g.fillStyle(0x4A7C3F);
    g.fillRect(10, 8, 4, 4);
    g.fillRect(18, 6, 4, 4);
    g.fillRect(14, 10, 4, 2);
    g.fillStyle(0x1A3A15);
    g.fillRect(6, 10, 4, 4);
    g.fillRect(22, 12, 4, 4);
  });

  // tile_cave_ground (prompt: tile_cave_floor)
  tex32(scene, 'tile_cave_ground', (g) => {
    g.fillStyle(0x36393F);
    g.fillRect(0, 0, 32, 32);
    dither(g, 0x2A2D33, 0.2);
    dither(g, 0x40434A, 0.12);
    g.fillStyle(0x2A2D33);
    g.fillRect(4, 10, 12, 1);
    g.fillRect(18, 22, 10, 1);
  });

  // tile_cave_wall (prompt: tile_cave_wall — key matches)
  tex32(scene, 'tile_cave_wall', (g) => {
    g.fillStyle(0x2A2D33);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x36393F);
    g.fillRect(2, 4, 10, 8);
    g.fillRect(14, 2, 14, 6);
    g.fillRect(6, 16, 12, 10);
    g.fillRect(20, 14, 10, 8);
    g.fillStyle(0x1A1D23);
    g.fillRect(12, 4, 2, 6);
    g.fillRect(4, 14, 8, 2);
    g.fillRect(18, 12, 2, 8);
    g.fillStyle(0x4A4D53);
    g.fillRect(4, 4, 2, 2);
    g.fillRect(22, 16, 2, 2);
  });

  // tile_water (prompt: tile_water — key matches)
  tex32(scene, 'tile_water', (g) => {
    g.fillStyle(0x2266AA);
    g.fillRect(0, 0, 32, 32);
    dither(g, 0x1A5599, 0.15);
    g.fillStyle(0x3388CC);
    g.fillRect(2, 8, 12, 2);
    g.fillRect(16, 16, 14, 2);
    g.fillRect(6, 24, 10, 2);
    g.fillStyle(0x55AADD);
    g.fillRect(8, 6, 4, 2);
    g.fillRect(20, 14, 4, 2);
  });

  // tile_building_tavern (prompt: tile_tavern)
  tex32(scene, 'tile_building_tavern', (g) => {
    g.fillStyle(0x7A6345);
    g.fillRect(2, 6, 28, 24);
    g.fillStyle(0x4A3220);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x3A2210);
    g.fillRect(2, 2, 28, 4);
    g.fillStyle(0x4A3520);
    g.fillRect(12, 18, 8, 12);
    g.fillStyle(0xDAA520);
    g.fillRect(18, 24, 2, 2);
    g.fillStyle(0xDAA520);
    g.fillRect(4, 12, 6, 6);
    g.fillStyle(0x3A2210);
    g.fillRect(7, 12, 1, 6);
    g.fillRect(4, 15, 6, 1);
    g.fillStyle(0xDAA520);
    g.fillRect(22, 12, 6, 6);
    g.fillStyle(0x3A2210);
    g.fillRect(25, 12, 1, 6);
    g.fillRect(22, 15, 6, 1);
    g.fillStyle(0x6B4226);
    g.fillRect(24, 6, 6, 5);
    g.fillStyle(0xDAA520);
    g.fillRect(26, 7, 2, 3);
  });

  // tile_building_shop (prompt: tile_shop)
  tex32(scene, 'tile_building_shop', (g) => {
    g.fillStyle(0x7A6345);
    g.fillRect(2, 6, 28, 24);
    g.fillStyle(0x2D5A27);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x3A6A34);
    g.fillRect(0, 6, 32, 3);
    for (let x = 0; x < 32; x += 8) {
      g.fillStyle(0x2D5A27);
      g.fillRect(x + 2, 8, 4, 2);
    }
    g.fillStyle(0x4A3520);
    g.fillRect(12, 18, 8, 12);
    g.fillStyle(0xDAA520);
    g.fillRect(18, 24, 2, 2);
    g.fillStyle(0xDAA520);
    g.fillRect(4, 12, 6, 6);
    g.fillRect(22, 12, 6, 6);
    g.fillStyle(0xCC3333);
    g.fillRect(5, 14, 2, 2);
    g.fillStyle(0x3366CC);
    g.fillRect(8, 14, 2, 2);
    g.fillStyle(0xCCCC33);
    g.fillRect(23, 14, 2, 2);
  });

  // tile_building_home (prompt: tile_home)
  tex32(scene, 'tile_building_home', (g) => {
    g.fillStyle(0x7A6345);
    g.fillRect(2, 6, 28, 24);
    g.fillStyle(0x6B4226);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x5A3218);
    g.fillRect(2, 2, 28, 4);
    g.fillStyle(0x4A3520);
    g.fillRect(12, 18, 8, 12);
    g.fillStyle(0xDAA520);
    g.fillRect(14, 24, 2, 2);
    g.fillStyle(0xDAA520);
    g.fillRect(4, 12, 6, 6);
    g.fillRect(22, 12, 6, 6);
    g.fillStyle(0x6B4226);
    g.fillRect(4, 18, 6, 2);
    g.fillStyle(0xFF6688);
    g.fillRect(5, 17, 2, 2);
    g.fillStyle(0xFFDD44);
    g.fillRect(8, 17, 2, 2);
  });

  // tile_crystal (prompt: tile_crystal — key matches)
  tex32(scene, 'tile_crystal', (g) => {
    g.fillStyle(0x36393F);
    g.fillRect(0, 0, 32, 32);
    dither(g, 0x2A2D33, 0.15);
    g.fillStyle(0x5B8FA8);
    g.fillRect(12, 6, 8, 20);
    g.fillRect(10, 10, 12, 14);
    g.fillRect(14, 2, 4, 6);
    g.fillRect(22, 12, 6, 14);
    g.fillRect(24, 8, 4, 6);
    g.fillRect(4, 18, 4, 10);
    g.fillRect(6, 14, 2, 6);
    g.fillStyle(0x8BBFD8);
    g.fillRect(14, 8, 2, 8);
    g.fillRect(24, 14, 2, 6);
    g.fillRect(6, 20, 2, 4);
    g.fillStyle(0xAADDEE);
    g.fillRect(14, 10, 2, 4);
  });

  // tile_fishing_dock (prompt: tile_dock)
  tex32(scene, 'tile_fishing_dock', (g) => {
    g.fillStyle(0x6B4226);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x5A3218);
    for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 1);
    g.fillStyle(0x7B5236);
    g.fillRect(4, 2, 2, 6);
    g.fillRect(16, 10, 2, 6);
    g.fillRect(24, 18, 2, 6);
    g.fillRect(10, 26, 2, 4);
    g.fillStyle(0x888888);
    g.fillRect(2, 2, 2, 2);
    g.fillRect(28, 2, 2, 2);
    g.fillRect(2, 18, 2, 2);
    g.fillRect(28, 18, 2, 2);
  });

  // tile_mining_node_copper (prompt: tile_mining_copper)
  tex32(scene, 'tile_mining_node_copper', (g) => {
    g.fillStyle(0x4A4A4A);
    g.fillRect(6, 10, 20, 18);
    g.fillRect(8, 8, 16, 4);
    g.fillStyle(0xB87333);
    g.fillRect(10, 14, 4, 6);
    g.fillRect(18, 12, 6, 4);
    g.fillRect(14, 20, 4, 4);
    g.fillStyle(0xDA8A43);
    g.fillRect(10, 14, 2, 2);
    g.fillRect(20, 12, 2, 2);
  });

  // tile_mining_node_iron (prompt: tile_mining_iron)
  tex32(scene, 'tile_mining_node_iron', (g) => {
    g.fillStyle(0x4A4A4A);
    g.fillRect(6, 10, 20, 18);
    g.fillRect(8, 8, 16, 4);
    g.fillStyle(0x8A8A8A);
    g.fillRect(8, 12, 6, 4);
    g.fillRect(18, 16, 6, 6);
    g.fillRect(12, 22, 4, 4);
    g.fillStyle(0xAAAAAA);
    g.fillRect(10, 12, 2, 2);
    g.fillRect(20, 18, 2, 2);
  });

  // tile_mining_node_crystal (prompt: tile_mining_crystal)
  tex32(scene, 'tile_mining_node_crystal', (g) => {
    g.fillStyle(0x4A4A4A);
    g.fillRect(6, 12, 20, 16);
    g.fillRect(8, 10, 16, 4);
    g.fillStyle(0x5B8FA8);
    g.fillRect(10, 6, 4, 12);
    g.fillRect(18, 4, 4, 10);
    g.fillRect(14, 8, 4, 8);
    g.fillStyle(0x8BBFD8);
    g.fillRect(11, 6, 2, 4);
    g.fillRect(19, 4, 2, 4);
    g.fillRect(15, 8, 2, 4);
    g.fillStyle(0xAADDEE);
    g.fillRect(12, 8, 2, 2);
    g.fillRect(20, 6, 2, 2);
  });

  // tile_mining_node_depleted (prompt: tile_mining_depleted)
  tex32(scene, 'tile_mining_node_depleted', (g) => {
    g.fillStyle(0x3A3A3A);
    g.fillRect(8, 14, 16, 12);
    g.fillRect(10, 12, 12, 4);
    g.fillStyle(0x2A2D33);
    g.fillRect(12, 16, 4, 2);
    g.fillRect(18, 20, 2, 4);
  });

  // tile_building_kitchen (prompt: tile_kitchen)
  tex32(scene, 'tile_building_kitchen', (g) => {
    g.fillStyle(0x6A5538);
    g.fillRect(2, 6, 28, 24);
    g.fillStyle(0x5A4528);
    g.fillRect(0, 0, 32, 8);
    g.fillStyle(0x8B7355);
    g.fillRect(22, 0, 6, 10);
    g.fillStyle(0xDDDDDD);
    g.fillRect(24, 0, 2, 2);
    g.fillStyle(0xFF8833);
    g.fillRect(4, 12, 10, 8);
    g.fillStyle(0xFFAA00);
    g.fillRect(6, 14, 6, 4);
    g.fillStyle(0x4A3520);
    g.fillRect(4, 12, 10, 1);
    g.fillRect(4, 19, 10, 1);
    g.fillRect(4, 12, 1, 8);
    g.fillRect(13, 12, 1, 8);
    g.fillRect(9, 12, 1, 8);
    g.fillStyle(0x4A3520);
    g.fillRect(18, 18, 8, 12);
    g.fillStyle(0xDAA520);
    g.fillRect(24, 24, 2, 2);
    g.fillStyle(0x8B4513);
    g.fillRect(16, 10, 4, 3);
    g.fillRect(15, 13, 6, 2);
  });
}

// ---------------------------------------------------------------------------
// ENTITY TEXTURES (32×32)
// ---------------------------------------------------------------------------
function generateEntityTextures(scene) {
  const directions = ['down', 'up', 'left', 'right'];

  // Player - directional sprites
  directions.forEach(dir => {
    tex32(scene, `entity_player_${dir}`, (g) => {
      // Boots
      g.fillStyle(0x4A3220);
      if (dir === 'left') {
        g.fillRect(8, 26, 5, 6);
        g.fillRect(15, 26, 5, 6);
      } else if (dir === 'right') {
        g.fillRect(12, 26, 5, 6);
        g.fillRect(19, 26, 5, 6);
      } else {
        g.fillRect(10, 26, 5, 6);
        g.fillRect(17, 26, 5, 6);
      }
      // Pants
      g.fillStyle(0x3A4A6A);
      if (dir === 'left') {
        g.fillRect(9, 20, 4, 7);
        g.fillRect(16, 20, 4, 7);
      } else if (dir === 'right') {
        g.fillRect(13, 20, 4, 7);
        g.fillRect(20, 20, 4, 7);
      } else {
        g.fillRect(11, 20, 4, 7);
        g.fillRect(18, 20, 4, 7);
      }
      // Tunic
      g.fillStyle(0x2266AA);
      g.fillRect(9, 10, 14, 11);
      // Belt
      g.fillStyle(0x6B4226);
      g.fillRect(9, 18, 14, 2);
      g.fillStyle(0xDAA520);
      g.fillRect(15, 18, 2, 2);
      // Arms
      g.fillStyle(0x2266AA);
      if (dir === 'left') {
        g.fillRect(4, 12, 5, 8);
        g.fillRect(23, 12, 3, 8);
      } else if (dir === 'right') {
        g.fillRect(6, 12, 3, 8);
        g.fillRect(23, 12, 5, 8);
      } else {
        g.fillRect(5, 12, 4, 8);
        g.fillRect(23, 12, 4, 8);
      }
      // Hands
      g.fillStyle(0xE8C8A0);
      if (dir === 'left') {
        g.fillRect(4, 19, 4, 3);
        g.fillRect(23, 19, 3, 3);
      } else if (dir === 'right') {
        g.fillRect(6, 19, 3, 3);
        g.fillRect(24, 19, 4, 3);
      } else {
        g.fillRect(5, 19, 4, 3);
        g.fillRect(23, 19, 4, 3);
      }
      // Head
      g.fillStyle(0xE8C8A0);
      g.fillRect(11, 2, 10, 9);
      // Hair
      g.fillStyle(0x4A3220);
      g.fillRect(10, 1, 12, 4);
      if (dir === 'up') {
        g.fillRect(10, 1, 12, 6);
      } else if (dir === 'left') {
        g.fillRect(10, 1, 2, 7);
        g.fillRect(10, 1, 6, 4);
      } else if (dir === 'right') {
        g.fillRect(20, 1, 2, 7);
        g.fillRect(16, 1, 6, 4);
      } else {
        g.fillRect(10, 1, 2, 7);
      }
      // Eyes and mouth
      if (dir === 'down') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(13, 5, 2, 2);
        g.fillRect(18, 5, 2, 2);
        g.fillStyle(0xC8A888);
        g.fillRect(14, 8, 4, 1);
      } else if (dir === 'left') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(12, 5, 2, 2);
        g.fillStyle(0xC8A888);
        g.fillRect(12, 8, 3, 1);
      } else if (dir === 'right') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(19, 5, 2, 2);
        g.fillStyle(0xC8A888);
        g.fillRect(18, 8, 3, 1);
      }
    });
  });

  // Agent - directional sprites
  directions.forEach(dir => {
    tex32(scene, `entity_agent_${dir}`, (g) => {
      // Boots
      g.fillStyle(0x3A3A3A);
      if (dir === 'left') {
        g.fillRect(8, 26, 5, 6);
        g.fillRect(15, 26, 5, 6);
      } else if (dir === 'right') {
        g.fillRect(12, 26, 5, 6);
        g.fillRect(19, 26, 5, 6);
      } else {
        g.fillRect(10, 26, 5, 6);
        g.fillRect(17, 26, 5, 6);
      }
      // Legs
      g.fillStyle(0x3A3A3A);
      if (dir === 'left') {
        g.fillRect(9, 20, 4, 7);
        g.fillRect(16, 20, 4, 7);
      } else if (dir === 'right') {
        g.fillRect(13, 20, 4, 7);
        g.fillRect(20, 20, 4, 7);
      } else {
        g.fillRect(11, 20, 4, 7);
        g.fillRect(18, 20, 4, 7);
      }
      // Dark armor body
      g.fillStyle(0x4A4A5A);
      g.fillRect(9, 10, 14, 11);
      // Chest plate
      if (dir !== 'up') {
        g.fillStyle(0x6A6A7A);
        g.fillRect(11, 12, 10, 6);
        g.fillStyle(0x5A5A6A);
        g.fillRect(13, 13, 6, 4);
      }
      // Belt
      g.fillStyle(0x4A3220);
      g.fillRect(9, 18, 14, 2);
      // Arms
      g.fillStyle(0x4A4A5A);
      if (dir === 'left') {
        g.fillRect(4, 12, 5, 8);
        g.fillRect(23, 12, 3, 8);
      } else if (dir === 'right') {
        g.fillRect(6, 12, 3, 8);
        g.fillRect(23, 12, 5, 8);
      } else {
        g.fillRect(5, 12, 4, 8);
        g.fillRect(23, 12, 4, 8);
      }
      // Pauldrons
      g.fillStyle(0x6A6A7A);
      g.fillRect(4, 10, 6, 3);
      g.fillRect(22, 10, 6, 3);
      // Gauntlets
      g.fillStyle(0x3A3A3A);
      g.fillRect(5, 19, 4, 3);
      g.fillRect(23, 19, 4, 3);
      // Sword
      if (dir === 'up') {
        g.fillStyle(0xCCCCCC);
        g.fillRect(14, 6, 2, 14);
        g.fillStyle(0xDAA520);
        g.fillRect(13, 18, 4, 2);
      } else if (dir === 'left') {
        g.fillStyle(0xCCCCCC);
        g.fillRect(4, 10, 2, 12);
        g.fillStyle(0xDAA520);
        g.fillRect(3, 18, 4, 2);
      } else if (dir === 'right') {
        g.fillStyle(0xCCCCCC);
        g.fillRect(26, 10, 2, 12);
        g.fillStyle(0xDAA520);
        g.fillRect(25, 18, 4, 2);
      }
      // Helmet
      g.fillStyle(0x5A5A6A);
      g.fillRect(10, 1, 12, 10);
      // Visor
      if (dir === 'down') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(12, 5, 8, 2);
      } else if (dir === 'left') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(11, 5, 5, 2);
      } else if (dir === 'right') {
        g.fillStyle(0x1A1A2E);
        g.fillRect(17, 5, 5, 2);
      }
      // Crest
      g.fillStyle(0xCC3333);
      g.fillRect(14, 0, 4, 3);
    });
  });

  // Slime (prompt: mob_slime — key matches)
  tex32(scene, 'mob_slime', (g) => {
    g.fillStyle(0x44BB44);
    g.fillRect(6, 12, 20, 16);
    g.fillRect(8, 10, 16, 2);
    g.fillRect(10, 8, 12, 2);
    g.fillRect(4, 16, 2, 8);
    g.fillRect(26, 16, 2, 8);
    g.fillStyle(0x66DD66);
    g.fillRect(10, 12, 6, 4);
    g.fillRect(8, 14, 4, 2);
    g.fillStyle(0x228822);
    g.fillRect(16, 22, 8, 4);
    g.fillRect(6, 26, 20, 2);
    g.fillStyle(0xFFFFFF);
    g.fillRect(11, 14, 4, 4);
    g.fillRect(19, 14, 4, 4);
    g.fillStyle(0x1A1A2E);
    g.fillRect(13, 15, 2, 3);
    g.fillRect(21, 15, 2, 3);
  });

  // Wolf (NOT in prompt — scale up old 16×16 by 2x)
  tex32(scene, 'mob_wolf', (g) => {
    g.fillStyle(0x9E9E9E);
    g.fillRect(6, 12, 20, 10);
    g.fillStyle(0xBDBDBD);
    g.fillRect(20, 8, 10, 8);
    g.fillStyle(0x757575);
    g.fillRect(24, 4, 4, 4);
    g.fillStyle(0x616161);
    g.fillRect(8, 22, 4, 8);
    g.fillRect(16, 22, 4, 8);
    g.fillStyle(0xFFEB3B);
    g.fillRect(26, 10, 2, 2);
    g.fillStyle(0x757575);
    g.fillRect(2, 10, 6, 4);
  });

  // Bat (prompt: mob_bat — key matches)
  tex32(scene, 'mob_bat', (g) => {
    g.fillStyle(0x3A2A3A);
    g.fillRect(12, 12, 8, 8);
    g.fillStyle(0x4A3A4A);
    g.fillRect(2, 10, 10, 6);
    g.fillRect(0, 12, 4, 3);
    g.fillRect(4, 8, 4, 3);
    g.fillRect(20, 10, 10, 6);
    g.fillRect(28, 12, 4, 3);
    g.fillRect(24, 8, 4, 3);
    g.fillStyle(0x5A4A5A);
    g.fillRect(4, 11, 2, 4);
    g.fillRect(8, 10, 2, 5);
    g.fillRect(22, 10, 2, 5);
    g.fillRect(26, 11, 2, 4);
    g.fillStyle(0xFF3333);
    g.fillRect(13, 13, 2, 2);
    g.fillRect(18, 13, 2, 2);
    g.fillStyle(0x3A2A3A);
    g.fillRect(13, 9, 2, 4);
    g.fillRect(18, 9, 2, 4);
    g.fillStyle(0xFFFFFF);
    g.fillRect(14, 18, 1, 2);
    g.fillRect(17, 18, 1, 2);
  });
}

// ---------------------------------------------------------------------------
// FARM TEXTURES (32×32)
// ---------------------------------------------------------------------------
function generateFarmTextures(scene) {
  function makeSoil(g) {
    g.fillStyle(0x5A3A1A);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4A2A0A);
    for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 2);
    dither(g, 0x6A4A2A, 0.08);
  }

  tex32(scene, 'tile_farm_empty', (g) => { makeSoil(g); });

  tex32(scene, 'tile_farm_planted', (g) => {
    makeSoil(g);
    g.fillStyle(0x44AA44);
    g.fillRect(14, 14, 4, 4);
  });

  tex32(scene, 'tile_farm_growing', (g) => {
    makeSoil(g);
    g.fillStyle(0x33AA33);
    g.fillRect(15, 10, 2, 14);
    g.fillRect(10, 12, 6, 3);
    g.fillRect(11, 11, 4, 2);
    g.fillRect(16, 14, 6, 3);
    g.fillRect(17, 13, 4, 2);
  });

  tex32(scene, 'tile_farm_ready_wheat', (g) => {
    makeSoil(g);
    for (const sx of [8, 15, 22]) {
      g.fillStyle(0x7A8A3A);
      g.fillRect(sx, 10, 2, 18);
      g.fillStyle(0xDAA520);
      g.fillRect(sx - 1, 6, 4, 6);
      g.fillStyle(0xCCAA10);
      g.fillRect(sx, 7, 2, 3);
    }
  });

  tex32(scene, 'tile_farm_ready_carrot', (g) => {
    makeSoil(g);
    g.fillStyle(0x44AA44);
    g.fillRect(10, 6, 4, 8);
    g.fillRect(18, 8, 4, 6);
    g.fillRect(12, 4, 3, 4);
    g.fillRect(20, 6, 3, 4);
    g.fillStyle(0xFF6622);
    g.fillRect(12, 14, 3, 4);
    g.fillRect(20, 14, 3, 4);
  });

  tex32(scene, 'tile_farm_ready_tomato', (g) => {
    makeSoil(g);
    g.fillStyle(0x44AA44);
    g.fillRect(15, 4, 2, 20);
    g.fillRect(10, 8, 12, 2);
    g.fillStyle(0xCC2222);
    g.fillRect(8, 12, 6, 6);
    g.fillRect(18, 10, 6, 6);
    g.fillRect(12, 18, 6, 6);
    g.fillStyle(0xFF4444);
    g.fillRect(9, 13, 2, 2);
    g.fillRect(19, 11, 2, 2);
    g.fillRect(13, 19, 2, 2);
  });

  tex32(scene, 'tile_farm_ready_golden_wheat', (g) => {
    makeSoil(g);
    for (const sx of [8, 15, 22]) {
      g.fillStyle(0x9AAA3A);
      g.fillRect(sx, 10, 2, 18);
      g.fillStyle(0xFFDD00);
      g.fillRect(sx - 1, 4, 4, 8);
      g.fillStyle(0xFFFF88);
      g.fillRect(sx, 5, 2, 2);
    }
    g.fillStyle(0xFFFFAA);
    g.fillRect(6, 8, 2, 2);
    g.fillRect(26, 6, 2, 2);
    g.fillRect(14, 2, 2, 2);
  });

  tex32(scene, 'tile_farm_ready_moonberry', (g) => {
    makeSoil(g);
    g.fillStyle(0x2A3A2A);
    g.fillRect(14, 6, 2, 20);
    g.fillRect(8, 10, 16, 2);
    g.fillStyle(0x6644AA);
    g.fillRect(8, 12, 4, 4);
    g.fillRect(12, 14, 4, 4);
    g.fillRect(20, 10, 4, 4);
    g.fillRect(18, 16, 4, 4);
    g.fillStyle(0x8866CC);
    g.fillRect(9, 13, 2, 2);
    g.fillRect(21, 11, 2, 2);
  });

  tex32(scene, 'tile_farm_ready_starfruit', (g) => {
    makeSoil(g);
    g.fillStyle(0x44AA44);
    g.fillRect(15, 10, 2, 16);
    g.fillStyle(0xFFDD00);
    g.fillRect(12, 6, 8, 8);
    g.fillRect(10, 8, 12, 4);
    g.fillRect(14, 4, 4, 12);
    g.fillStyle(0xFFFF44);
    g.fillRect(14, 8, 4, 4);
    g.fillStyle(0xFFFF88);
    g.fillRect(10, 4, 12, 12);
  });
}

// ---------------------------------------------------------------------------
// UI TEXTURES
// ---------------------------------------------------------------------------
function generateUITextures(scene) {
  // Button circle (60×60 — screen-space UI, keep same)
  const btn = scene.make.graphics({ x: 0, y: 0, add: false });
  btn.fillStyle(COLORS.UI_BUTTON_BG);
  btn.fillCircle(30, 30, 30);
  btn.lineStyle(2, 0x555577);
  btn.strokeCircle(30, 30, 29);
  btn.generateTexture('ui_btn_circle', 60, 60);
  btn.destroy();

  // Button small (44×44 — screen-space UI, keep same)
  const btnSm = scene.make.graphics({ x: 0, y: 0, add: false });
  btnSm.fillStyle(COLORS.UI_BUTTON_BG);
  btnSm.fillCircle(22, 22, 22);
  btnSm.lineStyle(2, 0x555577);
  btnSm.strokeCircle(22, 22, 21);
  btnSm.generateTexture('ui_btn_small', 44, 44);
  btnSm.destroy();

  // Joystick ring (80×80 — canvas-based for proper transparency)
  const joyRingCT = scene.textures.createCanvas('ui_joystick_ring', 80, 80);
  const joyRingCtx = joyRingCT.getContext();
  joyRingCtx.clearRect(0, 0, 80, 80);
  joyRingCtx.strokeStyle = 'rgba(85,85,119,0.5)';
  joyRingCtx.lineWidth = 3;
  joyRingCtx.beginPath();
  joyRingCtx.arc(40, 40, 38, 0, Math.PI * 2);
  joyRingCtx.stroke();
  joyRingCT.refresh();

  // Joystick nub (30×30 — canvas-based for proper transparency)
  const joyNubCT = scene.textures.createCanvas('ui_joystick_nub', 30, 30);
  const joyNubCtx = joyNubCT.getContext();
  joyNubCtx.clearRect(0, 0, 30, 30);
  joyNubCtx.fillStyle = 'rgba(136,136,153,0.7)';
  joyNubCtx.beginPath();
  joyNubCtx.arc(15, 15, 15, 0, Math.PI * 2);
  joyNubCtx.fill();
  joyNubCT.refresh();

  // HP bar background (scaled 32×4 → 64×8)
  const hpBg = scene.make.graphics({ x: 0, y: 0, add: false });
  hpBg.fillStyle(COLORS.UI_HP_RED);
  hpBg.fillRect(0, 0, 64, 8);
  hpBg.generateTexture('ui_hp_bg', 64, 8);
  hpBg.destroy();

  // HP bar fill (scaled 32×4 → 64×8)
  const hpFill = scene.make.graphics({ x: 0, y: 0, add: false });
  hpFill.fillStyle(COLORS.UI_HP_GREEN);
  hpFill.fillRect(0, 0, 64, 8);
  hpFill.generateTexture('ui_hp_fill', 64, 8);
  hpFill.destroy();

  // Inventory slot (scaled 40×40 → 80×80)
  const slot = scene.make.graphics({ x: 0, y: 0, add: false });
  slot.fillStyle(0x2A2A3E, 0.9);
  slot.fillRect(0, 0, 80, 80);
  slot.lineStyle(2, 0x555577);
  slot.strokeRect(0, 0, 80, 80);
  slot.generateTexture('ui_inv_slot', 80, 80);
  slot.destroy();
}

// ---------------------------------------------------------------------------
// GEAR TEXTURES (32×32 — scaled up from 16×16)
// ---------------------------------------------------------------------------
function generateGearTextures(scene) {
  // Wooden Sword
  tex32(scene, 'gear_wooden_sword', (g) => {
    g.fillStyle(0x8B4513);
    g.fillRect(14, 18, 4, 12);
    g.fillStyle(0x888888);
    g.fillRect(14, 4, 4, 14);
    g.fillStyle(0xAAAAAA);
    g.fillRect(14, 2, 4, 2);
    g.fillStyle(0xC0A060);
    g.fillRect(12, 18, 8, 2);
  });

  // Iron Dagger
  tex32(scene, 'gear_iron_dagger', (g) => {
    g.fillStyle(0x777777);
    g.fillRect(14, 20, 4, 10);
    g.fillStyle(0xC0C0C0);
    g.fillRect(14, 8, 4, 12);
    g.fillStyle(0xE8E8E8);
    g.fillRect(14, 6, 4, 2);
    g.fillStyle(0x999999);
    g.fillRect(12, 20, 8, 2);
  });

  // Shadow Blade
  tex32(scene, 'gear_shadow_blade', (g) => {
    g.fillStyle(0x4A1A6A);
    g.fillRect(14, 20, 4, 10);
    g.fillStyle(0x111122);
    g.fillRect(14, 4, 4, 16);
    g.fillStyle(0x2255AA);
    g.fillRect(14, 2, 2, 2);
    g.fillRect(16, 4, 2, 12);
  });

  // Leather Cap
  tex32(scene, 'gear_leather_cap', (g) => {
    g.fillStyle(0x8B6914);
    g.fillRect(8, 12, 16, 10);
    g.fillRect(6, 14, 20, 6);
    g.fillStyle(0x6B4A0A);
    g.fillRect(8, 20, 16, 2);
  });

  // Iron Helm
  tex32(scene, 'gear_iron_helm', (g) => {
    g.fillStyle(0x999999);
    g.fillRect(8, 10, 16, 12);
    g.fillRect(6, 12, 20, 8);
    g.fillStyle(0x666666);
    g.fillRect(8, 18, 16, 4);
    g.fillStyle(0xAAAAAA);
    g.fillRect(10, 12, 12, 4);
  });

  // Cloth Tunic
  tex32(scene, 'gear_cloth_tunic', (g) => {
    g.fillStyle(0xA0785A);
    g.fillRect(6, 6, 20, 20);
    g.fillStyle(0x886040);
    g.fillRect(6, 24, 20, 2);
    g.fillRect(14, 6, 4, 20);
  });

  // Chainmail
  tex32(scene, 'gear_chainmail', (g) => {
    g.fillStyle(0x888888);
    g.fillRect(6, 6, 20, 22);
    g.fillStyle(0x666666);
    for (let y = 6; y < 28; y += 4) {
      for (let x = 6; x < 26; x += 4) {
        g.fillRect(x, y, 2, 2);
      }
    }
  });

  // Sandals
  tex32(scene, 'gear_sandals', (g) => {
    g.fillStyle(0x8B6914);
    g.fillRect(4, 20, 8, 6);
    g.fillRect(4, 18, 2, 2);
    g.fillRect(20, 20, 8, 6);
    g.fillRect(26, 18, 2, 2);
  });

  // Iron Greaves
  tex32(scene, 'gear_iron_greaves', (g) => {
    g.fillStyle(0x888888);
    g.fillRect(4, 16, 8, 12);
    g.fillRect(20, 16, 8, 12);
    g.fillStyle(0x555555);
    g.fillRect(4, 26, 8, 2);
    g.fillRect(20, 26, 8, 2);
    g.fillStyle(0xAAAAAA);
    g.fillRect(6, 16, 4, 8);
  });

  // Bone Ring
  tex32(scene, 'gear_bone_ring', (g) => {
    g.lineStyle(4, 0xEEEEEE);
    g.strokeCircle(16, 16, 8);
    g.fillStyle(0xEEEEEE);
    g.fillRect(14, 6, 4, 4);
  });

  // Echo Pendant
  tex32(scene, 'gear_echo_pendant', (g) => {
    g.fillStyle(0x2196F3);
    g.fillCircle(16, 20, 8);
    g.fillStyle(0x88CCFF);
    g.fillCircle(16, 20, 4);
    g.lineStyle(2, 0x888888);
    g.strokeRect(14, 4, 4, 8);
    g.fillStyle(0x888888);
    g.fillRect(14, 12, 4, 4);
  });

  // Gear slot backgrounds (48×48 — UI, keep same size)
  const rarityColors = {
    COMMON:   0xAAAAAA,
    UNCOMMON: 0x4CAF50,
    RARE:     0x2196F3,
    EPIC:     0x9C27B0,
  };
  Object.entries(rarityColors).forEach(([rarity, color]) => {
    const slotBg = scene.make.graphics({ x: 0, y: 0, add: false });
    slotBg.fillStyle(0x1A1A2E, 1);
    slotBg.fillRect(0, 0, 48, 48);
    slotBg.lineStyle(2, color, 1);
    slotBg.strokeRect(1, 1, 46, 46);
    slotBg.generateTexture(`ui_gear_slot_${rarity.toLowerCase()}`, 48, 48);
    slotBg.destroy();
  });

  // Empty gear slot (48×48)
  const emptySlot = scene.make.graphics({ x: 0, y: 0, add: false });
  emptySlot.fillStyle(0x1A1A2E, 1);
  emptySlot.fillRect(0, 0, 48, 48);
  emptySlot.lineStyle(1, 0x444466, 1);
  emptySlot.strokeRect(1, 1, 46, 46);
  emptySlot.generateTexture('ui_gear_slot_empty', 48, 48);
  emptySlot.destroy();
}

// ---------------------------------------------------------------------------
// FOOD ITEM TEXTURES (32×32)
// ---------------------------------------------------------------------------
function generateItemTextures(scene) {
  // food_basic_stew (prompt: item_basic_stew)
  tex32(scene, 'food_basic_stew', (g) => {
    g.fillStyle(0x8B6344);
    g.fillRect(6, 14, 20, 12);
    g.fillRect(8, 12, 16, 4);
    g.fillRect(4, 18, 24, 6);
    g.fillStyle(0x7A5334);
    g.fillRect(8, 14, 16, 4);
    g.fillStyle(0xFFFFFF);
    g.fillRect(12, 6, 2, 6);
    g.fillRect(18, 4, 2, 8);
    g.fillRect(15, 8, 2, 4);
  });

  // food_carrot_soup (prompt: item_carrot_soup)
  tex32(scene, 'food_carrot_soup', (g) => {
    g.fillStyle(0x8B6344);
    g.fillRect(6, 14, 20, 12);
    g.fillRect(8, 12, 16, 4);
    g.fillRect(4, 18, 24, 6);
    g.fillStyle(0xDD8833);
    g.fillRect(8, 14, 16, 4);
    g.fillStyle(0xFFFFFF);
    g.fillRect(12, 6, 2, 6);
    g.fillRect(18, 4, 2, 8);
  });

  // food_grilled_fish (prompt: item_grilled_fish)
  tex32(scene, 'food_grilled_fish', (g) => {
    g.fillStyle(0xAA9988);
    g.fillRect(4, 16, 24, 10);
    g.fillRect(6, 14, 20, 4);
    g.fillStyle(0x8B6344);
    g.fillRect(8, 12, 14, 8);
    g.fillRect(10, 10, 10, 4);
    g.fillRect(20, 14, 4, 6);
    g.fillStyle(0x5A3A1A);
    g.fillRect(10, 14, 10, 1);
    g.fillRect(10, 17, 10, 1);
  });

  // food_hearty_chowder (prompt: item_hearty_chowder)
  tex32(scene, 'food_hearty_chowder', (g) => {
    g.fillStyle(0x8B6344);
    g.fillRect(4, 12, 24, 14);
    g.fillRect(6, 10, 20, 4);
    g.fillRect(2, 16, 28, 8);
    g.fillStyle(0xDDCC88);
    g.fillRect(6, 12, 20, 4);
    g.fillStyle(0xFFFFFF);
    g.fillRect(10, 4, 2, 6);
    g.fillRect(16, 2, 2, 8);
    g.fillRect(22, 4, 2, 6);
  });

  // food_miners_meal (prompt: item_miners_meal)
  tex32(scene, 'food_miners_meal', (g) => {
    g.fillStyle(0xAA9988);
    g.fillRect(4, 16, 24, 10);
    g.fillRect(6, 14, 20, 4);
    g.fillStyle(0xDD6633);
    g.fillRect(8, 12, 8, 6);
    g.fillStyle(0xCC4422);
    g.fillRect(18, 14, 6, 4);
    g.fillStyle(0xDAA520);
    g.fillRect(10, 18, 8, 3);
  });

  // food_golden_bread (prompt: item_golden_bread)
  tex32(scene, 'food_golden_bread', (g) => {
    g.fillStyle(0xDAA520);
    g.fillRect(6, 12, 20, 12);
    g.fillRect(8, 10, 16, 4);
    g.fillStyle(0xCCA520);
    g.fillRect(8, 14, 16, 6);
    g.fillStyle(0xB8952A);
    g.fillRect(10, 12, 1, 10);
    g.fillRect(16, 12, 1, 10);
    g.fillRect(22, 12, 1, 10);
    g.fillStyle(0xFFDD44);
    g.fillRect(10, 10, 6, 2);
  });

  // food_anglers_feast (prompt: item_anglers_feast)
  tex32(scene, 'food_anglers_feast', (g) => {
    g.fillStyle(0xAA9988);
    g.fillRect(2, 16, 28, 10);
    g.fillRect(4, 14, 24, 4);
    g.fillStyle(0xBBAA99);
    g.fillRect(4, 16, 24, 1);
    g.fillStyle(0x6688AA);
    g.fillRect(8, 10, 14, 8);
    g.fillRect(20, 12, 4, 6);
    g.fillStyle(0x44AA44);
    g.fillRect(6, 14, 3, 3);
    g.fillRect(24, 12, 3, 3);
    g.fillStyle(0xFFDD00);
    g.fillRect(12, 8, 2, 2);
  });

  // food_moonberry_tart (prompt: item_moonberry_tart)
  tex32(scene, 'food_moonberry_tart', (g) => {
    g.fillStyle(0xCCAA77);
    g.fillRect(6, 12, 20, 14);
    g.fillRect(8, 10, 16, 4);
    g.fillStyle(0xBB9966);
    g.fillRect(6, 24, 20, 2);
    g.fillRect(4, 14, 2, 10);
    g.fillRect(26, 14, 2, 10);
    g.fillStyle(0x6644AA);
    g.fillRect(8, 12, 16, 10);
    g.fillStyle(0x8866CC);
    g.fillRect(10, 14, 4, 4);
    g.fillRect(16, 16, 4, 4);
  });

  // food_abyssal_broth (prompt: item_abyssal_broth)
  tex32(scene, 'food_abyssal_broth', (g) => {
    g.fillStyle(0x4A3A30);
    g.fillRect(6, 14, 20, 12);
    g.fillRect(8, 12, 16, 4);
    g.fillRect(4, 18, 24, 6);
    g.fillStyle(0x2A3A4A);
    g.fillRect(8, 14, 16, 4);
    g.fillStyle(0x44AAAA);
    g.fillRect(12, 4, 2, 8);
    g.fillRect(18, 2, 2, 10);
    g.fillStyle(0x44CCCC);
    g.fillRect(15, 6, 2, 6);
  });

  // food_starfruit_elixir (prompt: item_starfruit_elixir)
  tex32(scene, 'food_starfruit_elixir', (g) => {
    g.fillStyle(0xFFDD00);
    g.fillRect(10, 12, 12, 14);
    g.fillRect(8, 16, 16, 8);
    g.fillStyle(0xCCCC88);
    g.fillRect(13, 6, 6, 8);
    g.fillStyle(0x8B6344);
    g.fillRect(14, 4, 4, 4);
    g.fillStyle(0xFFFF44);
    g.fillRect(14, 18, 4, 4);
    g.fillRect(12, 19, 8, 2);
    g.fillRect(15, 16, 2, 8);
    g.fillStyle(0xFFFFAA);
    g.fillRect(12, 14, 8, 4);
  });
}

// ---------------------------------------------------------------------------
// PHASE 7 TEXTURES (nocturnal mobs, NPC, companions, eggs, extra gear)
// ---------------------------------------------------------------------------
function generatePhase7Textures(scene) {
  // === Nocturnal Mob Sprites (scaled 16→32) ===

  // Shadow Wisp
  tex32(scene, 'mob_shadow_wisp', (g) => {
    g.fillStyle(0x8866CC);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0x6644AA);
    g.fillCircle(16, 16, 6);
    g.fillStyle(0xAA88EE);
    g.fillRect(14, 14, 4, 4);
    g.fillStyle(0x4422AA);
    g.fillRect(10, 24, 12, 4);
  });

  // Night Stalker
  tex32(scene, 'mob_night_stalker', (g) => {
    g.fillStyle(0x1A1A1A);
    g.fillRect(6, 16, 20, 10);
    g.fillRect(10, 12, 12, 6);
    g.fillStyle(0x2A2A2A);
    g.fillRect(8, 14, 16, 8);
    g.fillStyle(0xFFCC00);
    g.fillRect(12, 14, 4, 4);
    g.fillRect(20, 14, 4, 4);
    g.fillStyle(0x1A1A1A);
    g.fillRect(8, 10, 4, 4);
    g.fillRect(20, 10, 4, 4);
  });

  // Moon Beetle
  tex32(scene, 'mob_moon_beetle', (g) => {
    g.fillStyle(0x2A3A5A);
    g.fillCircle(16, 18, 10);
    g.fillStyle(0x1A2A4A);
    g.fillCircle(16, 18, 6);
    g.fillStyle(0x88BBFF);
    g.fillRect(10, 14, 4, 4);
    g.fillRect(18, 14, 4, 4);
    g.fillRect(14, 20, 4, 4);
    g.fillStyle(0x2A3A5A);
    g.fillRect(12, 8, 2, 6);
    g.fillRect(18, 8, 2, 6);
  });

  // Ember Wraith
  tex32(scene, 'mob_ember_wraith', (g) => {
    g.fillStyle(0xCC4400);
    g.fillRect(10, 6, 12, 16);
    g.fillStyle(0xFFAA00);
    g.fillRect(12, 10, 8, 8);
    g.fillStyle(0xFF6600);
    g.fillRect(14, 8, 4, 4);
    g.fillStyle(0xCC4400);
    g.fillRect(8, 22, 16, 6);
    g.fillRect(10, 26, 12, 4);
    g.fillStyle(0xFFDD00);
    g.fillRect(14, 12, 4, 4);
  });

  // === Merchant NPC (scaled 16→32) ===
  tex32(scene, 'npc_merchant', (g) => {
    g.fillStyle(0x5A4020);
    g.fillRect(8, 4, 16, 24);
    g.fillStyle(0x4A3018);
    g.fillRect(10, 6, 12, 8);
    g.fillStyle(0xDAA520);
    g.fillRect(8, 4, 16, 2);
    g.fillStyle(0x6B5030);
    g.fillRect(20, 14, 8, 10);
    g.fillStyle(0xFFDD44);
    g.fillRect(4, 20, 4, 4);
    g.fillStyle(0xDDCCBB);
    g.fillRect(12, 10, 2, 2);
    g.fillRect(14, 12, 4, 2);
  });

  // === Companion Sprites (scaled 16→32) ===

  // Fox
  tex32(scene, 'companion_fox', (g) => {
    g.fillStyle(0xCC5500);
    g.fillRect(6, 12, 20, 12);
    g.fillStyle(0xFFFFFF);
    g.fillRect(10, 18, 12, 6);
    g.fillStyle(0xCC5500);
    g.fillRect(8, 8, 6, 6);
    g.fillRect(18, 8, 6, 6);
    g.fillStyle(0x1A1A1A);
    g.fillRect(10, 10, 2, 2);
    g.fillRect(20, 10, 2, 2);
    g.fillRect(14, 14, 4, 2);
    g.fillStyle(0xCC5500);
    g.fillRect(24, 16, 6, 4);
  });

  // Owl
  tex32(scene, 'companion_owl', (g) => {
    g.fillStyle(0x7A5A30);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0xAA8850);
    g.fillRect(10, 16, 12, 8);
    g.fillStyle(0xFFD700);
    g.fillCircle(12, 12, 4);
    g.fillCircle(20, 12, 4);
    g.fillStyle(0x000000);
    g.fillRect(12, 12, 2, 2);
    g.fillRect(20, 12, 2, 2);
    g.fillStyle(0xCC8800);
    g.fillRect(14, 16, 4, 2);
    g.fillStyle(0x7A5A30);
    g.fillRect(10, 6, 4, 4);
    g.fillRect(18, 6, 4, 4);
  });

  // Frog
  tex32(scene, 'companion_frog', (g) => {
    g.fillStyle(0x3A7A3A);
    g.fillRect(6, 14, 20, 12);
    g.fillStyle(0x55AA55);
    g.fillRect(8, 18, 16, 6);
    g.fillStyle(0x3A7A3A);
    g.fillRect(8, 8, 6, 6);
    g.fillRect(18, 8, 6, 6);
    g.fillStyle(0xFFFFFF);
    g.fillRect(10, 8, 4, 4);
    g.fillRect(20, 8, 4, 4);
    g.fillStyle(0x000000);
    g.fillRect(10, 10, 2, 2);
    g.fillRect(20, 10, 2, 2);
    g.fillStyle(0x55AA55);
    g.fillRect(12, 16, 8, 2);
  });

  // Mole
  tex32(scene, 'companion_mole', (g) => {
    g.fillStyle(0x5A4030);
    g.fillCircle(16, 18, 10);
    g.fillStyle(0x4A3020);
    g.fillCircle(16, 18, 6);
    g.fillStyle(0x000000);
    g.fillRect(12, 14, 2, 2);
    g.fillRect(20, 14, 2, 2);
    g.fillStyle(0xFFAAAA);
    g.fillRect(16, 16, 2, 2);
    g.fillStyle(0xFFCCCC);
    g.fillRect(6, 22, 4, 4);
    g.fillRect(22, 22, 4, 4);
    g.fillStyle(0x5A4030);
    g.fillRect(24, 18, 4, 2);
  });

  // Companion Wolf
  tex32(scene, 'companion_wolf', (g) => {
    g.fillStyle(0x4A4A5A);
    g.fillRect(6, 12, 20, 14);
    g.fillStyle(0x6A6A7A);
    g.fillRect(8, 16, 8, 6);
    g.fillStyle(0x4A4A5A);
    g.fillRect(6, 8, 8, 6);
    g.fillRect(6, 6, 4, 4);
    g.fillRect(16, 6, 4, 4);
    g.fillStyle(0xFFCC00);
    g.fillRect(8, 10, 2, 2);
    g.fillRect(14, 10, 2, 2);
    g.fillStyle(0x4A4A5A);
    g.fillRect(24, 16, 6, 4);
    g.fillRect(26, 14, 4, 2);
  });

  // Toad
  tex32(scene, 'companion_toad', (g) => {
    g.fillStyle(0x4A5A2A);
    g.fillRect(4, 14, 24, 12);
    g.fillStyle(0x5A6A3A);
    g.fillRect(6, 18, 20, 6);
    g.fillStyle(0x3A4A1A);
    g.fillRect(8, 16, 4, 4);
    g.fillRect(16, 16, 4, 4);
    g.fillRect(12, 22, 4, 4);
    g.fillStyle(0xFFDD00);
    g.fillRect(8, 10, 4, 4);
    g.fillRect(20, 10, 4, 4);
    g.fillStyle(0x000000);
    g.fillRect(10, 10, 2, 2);
    g.fillRect(22, 10, 2, 2);
    g.fillStyle(0x4A5A2A);
    g.fillRect(6, 24, 8, 2);
    g.fillRect(18, 24, 8, 2);
  });

  // === Companion Eggs (scaled 16→32) ===
  const eggColors = [
    { key: 'egg_fox',  color: 0xCC7733 },
    { key: 'egg_owl',  color: 0x8B7355 },
    { key: 'egg_frog', color: 0x55AA55 },
    { key: 'egg_mole', color: 0x8B7355 },
    { key: 'egg_wolf', color: 0x6A6A7A },
    { key: 'egg_toad', color: 0x5A6A3A },
  ];
  for (const { key, color } of eggColors) {
    tex32(scene, key, (g) => {
      g.fillStyle(color);
      g.fillRect(10, 6, 12, 20);
      g.fillRect(12, 4, 8, 2);
      g.fillRect(12, 26, 8, 2);
      g.fillStyle(0xFFFFFF, 0.3);
      g.fillRect(14, 8, 4, 6);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(12, 16, 8, 2);
    });
  }

  // Companion Nest (scaled 16→32)
  tex32(scene, 'tile_companion_nest', (g) => {
    g.fillStyle(0x6B4226);
    g.fillCircle(16, 20, 12);
    g.fillStyle(0x8B6226);
    g.fillCircle(16, 20, 8);
    g.fillStyle(0xFFEEDD);
    g.fillCircle(16, 20, 6);
    g.fillStyle(0x6B4226);
    g.fillRect(4, 24, 24, 4);
  });

  // === Extra Gear (scaled 16→32) ===

  // Moonstone Ring
  tex32(scene, 'gear_moonstone_ring', (g) => {
    g.fillStyle(0xC0C0C0);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0x1A1A2E);
    g.fillCircle(16, 16, 6);
    g.fillStyle(0xB0C4DE);
    g.fillRect(14, 6, 4, 6);
    g.fillStyle(0xE0E8FF);
    g.fillRect(14, 8, 4, 2);
  });

  // Lantern
  tex32(scene, 'gear_lantern', (g) => {
    g.fillStyle(0xDAA520);
    g.fillRect(10, 4, 12, 2);
    g.fillRect(8, 6, 2, 20);
    g.fillRect(22, 6, 2, 20);
    g.fillRect(10, 24, 12, 2);
    g.fillStyle(0xFFAA00);
    g.fillRect(10, 6, 12, 18);
    g.fillStyle(0xFFDD00);
    g.fillRect(12, 10, 8, 10);
    g.fillStyle(0xFFFFAA);
    g.fillRect(14, 12, 4, 6);
  });

  // === Tier 4 Forge Gear ===

  // Swamp Fang Blade – murky green weapon with toxic edge
  tex32(scene, 'gear_swamp_fang_blade', (g) => {
    g.fillStyle(0x3A4A2A);
    g.fillRect(14, 18, 4, 12);
    g.fillStyle(0x4A6A2A);
    g.fillRect(14, 4, 4, 14);
    g.fillStyle(0x66AA33);
    g.fillRect(16, 4, 2, 14);
    g.fillStyle(0x5A5A2A);
    g.fillRect(12, 18, 8, 2);
  });

  // Volcanic Helm – dark red-brown with orange lava cracks
  tex32(scene, 'gear_volcanic_helm', (g) => {
    g.fillStyle(0x5A2500);
    g.fillRect(8, 10, 16, 12);
    g.fillRect(6, 12, 20, 8);
    g.fillStyle(0xFF4400);
    g.fillRect(10, 14, 2, 6);
    g.fillRect(18, 12, 2, 8);
    g.fillRect(14, 16, 4, 2);
    g.fillStyle(0x3A1800);
    g.fillRect(8, 20, 16, 2);
  });

  // Miasma Mail – swamp green-brown with purple trim
  tex32(scene, 'gear_miasma_mail', (g) => {
    g.fillStyle(0x3A4A2A);
    g.fillRect(6, 6, 20, 20);
    g.fillStyle(0x4A4458);
    g.fillRect(6, 6, 20, 2);
    g.fillRect(6, 24, 20, 2);
    g.fillRect(6, 6, 2, 20);
    g.fillRect(24, 6, 2, 20);
    g.fillStyle(0x2A3A1A);
    g.fillRect(14, 8, 4, 16);
  });

  // Ashwalker Boots – charcoal with ember orange sole
  tex32(scene, 'gear_ashwalker_boots', (g) => {
    g.fillStyle(0x2A2A2A);
    g.fillRect(4, 16, 8, 10);
    g.fillRect(20, 16, 8, 10);
    g.fillStyle(0xFF4400);
    g.fillRect(4, 26, 8, 2);
    g.fillRect(20, 26, 8, 2);
    g.fillStyle(0x3A3A3A);
    g.fillRect(6, 16, 4, 8);
    g.fillRect(22, 16, 4, 8);
  });

  // Hexed Amulet – purple ring with green eye center
  tex32(scene, 'gear_hexed_amulet', (g) => {
    g.lineStyle(4, 0x9C27B0);
    g.strokeCircle(16, 16, 8);
    g.fillStyle(0x9C27B0);
    g.fillRect(14, 6, 4, 4);
    g.fillStyle(0x44FF44);
    g.fillCircle(16, 16, 3);
    g.fillStyle(0x000000);
    g.fillRect(15, 15, 2, 2);
  });

  // Infernal Greatsword – dark metal with lava blade cracks
  tex32(scene, 'gear_infernal_greatsword', (g) => {
    g.fillStyle(0x3A3A3A);
    g.fillRect(13, 18, 6, 12);
    g.fillStyle(0x2A2A2A);
    g.fillRect(12, 2, 8, 16);
    g.fillStyle(0xFF4400);
    g.fillRect(14, 4, 2, 12);
    g.fillRect(17, 6, 2, 10);
    g.fillStyle(0xFFAA00);
    g.fillRect(15, 8, 2, 4);
    g.fillStyle(0x555555);
    g.fillRect(10, 18, 12, 2);
  });
}
