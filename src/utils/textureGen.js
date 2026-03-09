import { COLORS } from '../config/constants.js';

export function generateTextures(scene) {
  generateTileTextures(scene);
  generateEntityTextures(scene);
  generateUITextures(scene);
}

function generateTileTextures(scene) {
  // Town ground
  const tg = scene.make.graphics({ x: 0, y: 0, add: false });
  tg.fillStyle(COLORS.TOWN_GROUND);
  tg.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 16; i += 4) {
    for (let j = 0; j < 16; j += 4) {
      tg.fillStyle((i + j) % 8 === 0 ? 0x7A6548 : COLORS.TOWN_GROUND);
      tg.fillRect(i, j, 4, 4);
    }
  }
  tg.generateTexture('tile_town_ground', 16, 16);
  tg.destroy();

  // Town path
  const tp = scene.make.graphics({ x: 0, y: 0, add: false });
  tp.fillStyle(COLORS.TOWN_PATH);
  tp.fillRect(0, 0, 16, 16);
  tp.fillStyle(0xB09E82);
  tp.fillRect(2, 2, 3, 3);
  tp.fillRect(9, 7, 3, 3);
  tp.fillRect(5, 12, 3, 3);
  tp.generateTexture('tile_town_path', 16, 16);
  tp.destroy();

  // Forest ground
  const fg = scene.make.graphics({ x: 0, y: 0, add: false });
  fg.fillStyle(COLORS.FOREST_GROUND);
  fg.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 8; i++) {
    const px = Math.floor(Math.random() * 16);
    const py = Math.floor(Math.random() * 16);
    fg.fillStyle(COLORS.FOREST_GRASS);
    fg.fillRect(px, py, 2, 2);
  }
  fg.generateTexture('tile_forest_ground', 16, 16);
  fg.destroy();

  // Tree
  const tree = scene.make.graphics({ x: 0, y: 0, add: false });
  tree.fillStyle(COLORS.FOREST_TREE_TRUNK);
  tree.fillRect(7, 10, 2, 6);
  tree.fillStyle(COLORS.FOREST_TREE_LEAVES);
  tree.fillRect(4, 3, 8, 7);
  tree.fillStyle(0x2E7D32);
  tree.fillRect(5, 2, 6, 3);
  tree.fillStyle(0x1B5E20);
  tree.fillRect(6, 4, 4, 2);
  tree.generateTexture('tile_tree', 16, 16);
  tree.destroy();

  // Cave ground
  const cg = scene.make.graphics({ x: 0, y: 0, add: false });
  cg.fillStyle(COLORS.CAVE_GROUND);
  cg.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 4; i++) {
    cg.fillStyle(COLORS.CAVE_PURPLE);
    cg.fillRect(Math.floor(Math.random() * 14), Math.floor(Math.random() * 14), 2, 2);
  }
  cg.generateTexture('tile_cave_ground', 16, 16);
  cg.destroy();

  // Cave wall
  const cw = scene.make.graphics({ x: 0, y: 0, add: false });
  cw.fillStyle(COLORS.CAVE_WALL);
  cw.fillRect(0, 0, 16, 16);
  cw.fillStyle(0x25253E);
  cw.fillRect(0, 0, 16, 4);
  cw.fillRect(0, 12, 16, 4);
  cw.generateTexture('tile_cave_wall', 16, 16);
  cw.destroy();

  // Water
  const wt = scene.make.graphics({ x: 0, y: 0, add: false });
  wt.fillStyle(COLORS.WATER);
  wt.fillRect(0, 0, 16, 16);
  wt.fillStyle(0x3D6FC4);
  wt.fillRect(3, 5, 4, 2);
  wt.fillRect(10, 10, 3, 2);
  wt.generateTexture('tile_water', 16, 16);
  wt.destroy();

  // Building - Tavern
  const tav = scene.make.graphics({ x: 0, y: 0, add: false });
  tav.fillStyle(0x6B4226);
  tav.fillRect(2, 4, 12, 10);
  tav.fillStyle(COLORS.TOWN_ROOF);
  tav.fillRect(1, 2, 14, 3);
  tav.fillStyle(0xDAA520);
  tav.fillRect(5, 6, 2, 2);
  tav.fillRect(9, 6, 2, 2);
  tav.fillStyle(0x3E2723);
  tav.fillRect(6, 10, 4, 4);
  tav.generateTexture('tile_building_tavern', 16, 16);
  tav.destroy();

  // Building - Shop
  const shp = scene.make.graphics({ x: 0, y: 0, add: false });
  shp.fillStyle(0x757575);
  shp.fillRect(2, 4, 12, 10);
  shp.fillStyle(0x546E7A);
  shp.fillRect(1, 2, 14, 3);
  shp.fillStyle(0xFFC107);
  shp.fillRect(4, 3, 8, 1);
  shp.fillStyle(0x3E2723);
  shp.fillRect(6, 10, 4, 4);
  shp.generateTexture('tile_building_shop', 16, 16);
  shp.destroy();

  // Building - Home
  const hm = scene.make.graphics({ x: 0, y: 0, add: false });
  hm.fillStyle(0x8D6E63);
  hm.fillRect(2, 4, 12, 10);
  hm.fillStyle(0x5D4037);
  hm.fillRect(1, 2, 14, 3);
  hm.fillStyle(0xFFCC80);
  hm.fillRect(5, 6, 2, 2);
  hm.fillStyle(0x3E2723);
  hm.fillRect(6, 10, 4, 4);
  hm.generateTexture('tile_building_home', 16, 16);
  hm.destroy();

  // Crystal decoration
  const cr = scene.make.graphics({ x: 0, y: 0, add: false });
  cr.fillStyle(COLORS.CAVE_GROUND);
  cr.fillRect(0, 0, 16, 16);
  cr.fillStyle(COLORS.CAVE_CRYSTAL);
  cr.fillRect(6, 4, 4, 8);
  cr.fillStyle(0x80CBC4);
  cr.fillRect(7, 3, 2, 3);
  cr.generateTexture('tile_crystal', 16, 16);
  cr.destroy();
}

function generateEntityTextures(scene) {
  const directions = ['down', 'up', 'left', 'right'];

  // Player - blue character
  directions.forEach(dir => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2196F3);
    // Head
    g.fillRect(5, 1, 6, 5);
    // Body
    g.fillStyle(0x1565C0);
    g.fillRect(4, 6, 8, 5);
    // Legs
    g.fillStyle(0x0D47A1);
    if (dir === 'down' || dir === 'up') {
      g.fillRect(4, 11, 3, 4);
      g.fillRect(9, 11, 3, 4);
    } else if (dir === 'left') {
      g.fillRect(3, 11, 3, 4);
      g.fillRect(7, 11, 3, 4);
    } else {
      g.fillRect(6, 11, 3, 4);
      g.fillRect(10, 11, 3, 4);
    }
    // Eyes
    if (dir === 'down') {
      g.fillStyle(0xFFFFFF);
      g.fillRect(6, 3, 2, 2);
      g.fillRect(9, 3, 2, 2);
    }
    g.generateTexture(`entity_player_${dir}`, 16, 16);
    g.destroy();
  });

  // Agent - green character with backpack
  directions.forEach(dir => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4CAF50);
    g.fillRect(5, 1, 6, 5);
    g.fillStyle(0x388E3C);
    g.fillRect(4, 6, 8, 5);
    // Backpack
    g.fillStyle(0x795548);
    if (dir === 'up') {
      g.fillRect(5, 6, 6, 4);
    } else {
      g.fillRect(11, 6, 3, 4);
    }
    g.fillStyle(0x2E7D32);
    if (dir === 'down' || dir === 'up') {
      g.fillRect(4, 11, 3, 4);
      g.fillRect(9, 11, 3, 4);
    } else if (dir === 'left') {
      g.fillRect(3, 11, 3, 4);
      g.fillRect(7, 11, 3, 4);
    } else {
      g.fillRect(6, 11, 3, 4);
      g.fillRect(10, 11, 3, 4);
    }
    if (dir === 'down') {
      g.fillStyle(0xFFFFFF);
      g.fillRect(6, 3, 2, 2);
      g.fillRect(9, 3, 2, 2);
    }
    g.generateTexture(`entity_agent_${dir}`, 16, 16);
    g.destroy();
  });

  // Slime
  const slime = scene.make.graphics({ x: 0, y: 0, add: false });
  slime.fillStyle(0x66BB6A);
  slime.fillRect(3, 6, 10, 8);
  slime.fillRect(4, 5, 8, 1);
  slime.fillRect(5, 4, 6, 1);
  slime.fillStyle(0x43A047);
  slime.fillRect(4, 10, 8, 4);
  slime.fillStyle(0xFFFFFF);
  slime.fillRect(5, 7, 2, 2);
  slime.fillRect(9, 7, 2, 2);
  slime.fillStyle(0x1B5E20);
  slime.fillRect(6, 8, 1, 1);
  slime.fillRect(10, 8, 1, 1);
  slime.generateTexture('mob_slime', 16, 16);
  slime.destroy();

  // Wolf
  const wolf = scene.make.graphics({ x: 0, y: 0, add: false });
  wolf.fillStyle(0x9E9E9E);
  // Body
  wolf.fillRect(3, 6, 10, 5);
  // Head
  wolf.fillStyle(0xBDBDBD);
  wolf.fillRect(10, 4, 5, 4);
  // Ears
  wolf.fillStyle(0x757575);
  wolf.fillRect(12, 2, 2, 2);
  // Legs
  wolf.fillStyle(0x616161);
  wolf.fillRect(4, 11, 2, 4);
  wolf.fillRect(8, 11, 2, 4);
  // Eye
  wolf.fillStyle(0xFFEB3B);
  wolf.fillRect(13, 5, 1, 1);
  // Tail
  wolf.fillStyle(0x757575);
  wolf.fillRect(1, 5, 3, 2);
  wolf.generateTexture('mob_wolf', 16, 16);
  wolf.destroy();

  // Cave Bat
  const bat = scene.make.graphics({ x: 0, y: 0, add: false });
  bat.fillStyle(0x6A1B9A);
  // Body
  bat.fillRect(6, 6, 4, 5);
  // Wings
  bat.fillStyle(0x8E24AA);
  bat.fillRect(1, 5, 5, 4);
  bat.fillRect(10, 5, 5, 4);
  // Wing tips
  bat.fillStyle(0x6A1B9A);
  bat.fillRect(1, 4, 2, 1);
  bat.fillRect(13, 4, 2, 1);
  // Eyes
  bat.fillStyle(0xFF1744);
  bat.fillRect(7, 7, 1, 1);
  bat.fillRect(9, 7, 1, 1);
  bat.generateTexture('mob_bat', 16, 16);
  bat.destroy();
}

function generateUITextures(scene) {
  // Button circle
  const btn = scene.make.graphics({ x: 0, y: 0, add: false });
  btn.fillStyle(COLORS.UI_BUTTON_BG);
  btn.fillCircle(30, 30, 30);
  btn.lineStyle(2, 0x555577);
  btn.strokeCircle(30, 30, 29);
  btn.generateTexture('ui_btn_circle', 60, 60);
  btn.destroy();

  // Button small
  const btnSm = scene.make.graphics({ x: 0, y: 0, add: false });
  btnSm.fillStyle(COLORS.UI_BUTTON_BG);
  btnSm.fillCircle(22, 22, 22);
  btnSm.lineStyle(2, 0x555577);
  btnSm.strokeCircle(22, 22, 21);
  btnSm.generateTexture('ui_btn_small', 44, 44);
  btnSm.destroy();

  // Joystick outer ring
  const joyOuter = scene.make.graphics({ x: 0, y: 0, add: false });
  joyOuter.lineStyle(3, 0x555577, 0.5);
  joyOuter.strokeCircle(40, 40, 38);
  joyOuter.generateTexture('ui_joystick_ring', 80, 80);
  joyOuter.destroy();

  // Joystick nub
  const joyNub = scene.make.graphics({ x: 0, y: 0, add: false });
  joyNub.fillStyle(0x888899, 0.7);
  joyNub.fillCircle(15, 15, 15);
  joyNub.generateTexture('ui_joystick_nub', 30, 30);
  joyNub.destroy();

  // HP bar background
  const hpBg = scene.make.graphics({ x: 0, y: 0, add: false });
  hpBg.fillStyle(COLORS.UI_HP_RED);
  hpBg.fillRect(0, 0, 32, 4);
  hpBg.generateTexture('ui_hp_bg', 32, 4);
  hpBg.destroy();

  // HP bar fill
  const hpFill = scene.make.graphics({ x: 0, y: 0, add: false });
  hpFill.fillStyle(COLORS.UI_HP_GREEN);
  hpFill.fillRect(0, 0, 32, 4);
  hpFill.generateTexture('ui_hp_fill', 32, 4);
  hpFill.destroy();

  // Inventory slot
  const slot = scene.make.graphics({ x: 0, y: 0, add: false });
  slot.fillStyle(0x2A2A3E, 0.9);
  slot.fillRect(0, 0, 40, 40);
  slot.lineStyle(1, 0x555577);
  slot.strokeRect(0, 0, 40, 40);
  slot.generateTexture('ui_inv_slot', 40, 40);
  slot.destroy();
}
