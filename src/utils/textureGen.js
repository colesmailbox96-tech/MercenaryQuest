import { COLORS } from '../config/constants.js';

export function generateTextures(scene) {
  generateTileTextures(scene);
  generateFarmTextures(scene);
  generateEntityTextures(scene);
  generateUITextures(scene);
  generateGearTextures(scene);
  generateItemTextures(scene);
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

  // Fishing dock
  const dock = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let row = 0; row < 16; row += 2) {
    dock.fillStyle(row % 4 === 0 ? 0x8B6914 : 0x6B4226);
    dock.fillRect(0, row, 16, 2);
  }
  dock.fillStyle(0x5A3A1A);
  dock.fillRect(0, 0, 16, 1);
  dock.fillRect(0, 15, 16, 1);
  dock.generateTexture('tile_fishing_dock', 16, 16);
  dock.destroy();

  // Mining node - Copper
  const mnC = scene.make.graphics({ x: 0, y: 0, add: false });
  mnC.fillStyle(0x7A7A7A);
  mnC.fillRect(3, 5, 10, 8);
  mnC.fillRect(5, 3, 6, 2);
  mnC.fillRect(4, 13, 8, 2);
  mnC.fillStyle(0xB87333);
  mnC.fillRect(5, 7, 2, 2);
  mnC.fillRect(9, 9, 2, 2);
  mnC.fillRect(7, 11, 1, 1);
  mnC.fillRect(4, 6, 1, 1);
  mnC.generateTexture('tile_mining_node_copper', 16, 16);
  mnC.destroy();

  // Mining node - Iron
  const mnI = scene.make.graphics({ x: 0, y: 0, add: false });
  mnI.fillStyle(0x7A7A7A);
  mnI.fillRect(3, 5, 10, 8);
  mnI.fillRect(5, 3, 6, 2);
  mnI.fillRect(4, 13, 8, 2);
  mnI.fillStyle(0xC0C0C0);
  mnI.fillRect(5, 7, 2, 2);
  mnI.fillRect(9, 9, 2, 2);
  mnI.fillRect(7, 11, 1, 1);
  mnI.fillRect(4, 6, 1, 1);
  mnI.generateTexture('tile_mining_node_iron', 16, 16);
  mnI.destroy();

  // Mining node - Crystal
  const mnCr = scene.make.graphics({ x: 0, y: 0, add: false });
  mnCr.fillStyle(0x4A4458);
  mnCr.fillRect(3, 5, 10, 8);
  mnCr.fillRect(5, 3, 6, 2);
  mnCr.fillRect(4, 13, 8, 2);
  mnCr.fillStyle(0x5B8FA8);
  mnCr.fillRect(5, 7, 2, 2);
  mnCr.fillRect(9, 9, 2, 2);
  mnCr.fillStyle(0x9C27B0);
  mnCr.fillRect(7, 11, 1, 1);
  mnCr.fillRect(4, 6, 1, 1);
  mnCr.generateTexture('tile_mining_node_crystal', 16, 16);
  mnCr.destroy();

  // Mining node - Depleted
  const mnD = scene.make.graphics({ x: 0, y: 0, add: false });
  mnD.fillStyle(0x4A4A4A);
  mnD.fillRect(3, 5, 10, 8);
  mnD.fillRect(5, 3, 6, 2);
  mnD.fillRect(4, 13, 8, 2);
  mnD.fillStyle(0x333333);
  mnD.fillRect(6, 7, 1, 3);
  mnD.fillRect(9, 8, 1, 2);
  mnD.generateTexture('tile_mining_node_depleted', 16, 16);
  mnD.destroy();

  // Building - Kitchen (warm stone with orange-lit window)
  const kit = scene.make.graphics({ x: 0, y: 0, add: false });
  kit.fillStyle(0x7A6548);
  kit.fillRect(2, 4, 12, 10);
  kit.fillStyle(0x5C4A33);
  kit.fillRect(1, 2, 14, 3);
  // Window with orange fire glow
  kit.fillStyle(0xFF8C00);
  kit.fillRect(5, 6, 4, 4);
  kit.fillStyle(0xFFCC44);
  kit.fillRect(6, 7, 2, 2);
  // Door
  kit.fillStyle(0x3E2723);
  kit.fillRect(7, 10, 3, 4);
  // Chimney smoke (white pixel)
  kit.fillStyle(0xFFFFFF);
  kit.fillRect(11, 1, 2, 2);
  kit.generateTexture('tile_building_kitchen', 16, 16);
  kit.destroy();
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

function generateGearTextures(scene) {
  // Wooden Sword (16x16): brown handle + gray blade
  const ws = scene.make.graphics({ x: 0, y: 0, add: false });
  ws.fillStyle(0x8B4513);
  ws.fillRect(7, 9, 2, 6);   // handle
  ws.fillStyle(0x888888);
  ws.fillRect(7, 2, 2, 7);   // blade lower
  ws.fillStyle(0xAAAAAA);
  ws.fillRect(7, 1, 2, 1);   // blade tip
  ws.fillStyle(0xC0A060);
  ws.fillRect(6, 9, 4, 1);   // guard
  ws.generateTexture('gear_wooden_sword', 16, 16);
  ws.destroy();

  // Iron Dagger (16x16): gray handle + silver blade
  const id = scene.make.graphics({ x: 0, y: 0, add: false });
  id.fillStyle(0x777777);
  id.fillRect(7, 10, 2, 5);  // handle
  id.fillStyle(0xC0C0C0);
  id.fillRect(7, 4, 2, 6);   // blade
  id.fillStyle(0xE8E8E8);
  id.fillRect(7, 3, 2, 1);   // tip
  id.fillStyle(0x999999);
  id.fillRect(6, 10, 4, 1);  // guard
  id.generateTexture('gear_iron_dagger', 16, 16);
  id.destroy();

  // Shadow Blade (16x16): dark purple + black blade with blue edge
  const sb = scene.make.graphics({ x: 0, y: 0, add: false });
  sb.fillStyle(0x4A1A6A);
  sb.fillRect(7, 10, 2, 5);  // handle
  sb.fillStyle(0x111122);
  sb.fillRect(7, 2, 2, 8);   // blade
  sb.fillStyle(0x2255AA);
  sb.fillRect(7, 1, 1, 1);   // blue tip edge
  sb.fillRect(8, 2, 1, 6);   // blue side edge
  sb.generateTexture('gear_shadow_blade', 16, 16);
  sb.destroy();

  // Leather Cap (16x16): brown dome
  const lc = scene.make.graphics({ x: 0, y: 0, add: false });
  lc.fillStyle(0x8B6914);
  lc.fillRect(4, 6, 8, 5);   // main dome
  lc.fillRect(3, 7, 10, 3);  // wide brim area
  lc.fillStyle(0x6B4A0A);
  lc.fillRect(4, 10, 8, 1);  // brim shadow
  lc.generateTexture('gear_leather_cap', 16, 16);
  lc.destroy();

  // Iron Helm (16x16): gray dome with darker visor
  const ih = scene.make.graphics({ x: 0, y: 0, add: false });
  ih.fillStyle(0x999999);
  ih.fillRect(4, 5, 8, 6);   // dome
  ih.fillRect(3, 6, 10, 4);  // wide
  ih.fillStyle(0x666666);
  ih.fillRect(4, 9, 8, 2);   // visor
  ih.fillStyle(0xAAAAAA);
  ih.fillRect(5, 6, 6, 2);   // highlight
  ih.generateTexture('gear_iron_helm', 16, 16);
  ih.destroy();

  // Cloth Tunic (16x16): brown rectangle body
  const ct = scene.make.graphics({ x: 0, y: 0, add: false });
  ct.fillStyle(0xA0785A);
  ct.fillRect(3, 3, 10, 10);
  ct.fillStyle(0x886040);
  ct.fillRect(3, 12, 10, 1);  // hem
  ct.fillRect(7, 3, 2, 10);   // center seam
  ct.generateTexture('gear_cloth_tunic', 16, 16);
  ct.destroy();

  // Chainmail (16x16): gray rectangle with crosshatch pixel pattern
  const cm = scene.make.graphics({ x: 0, y: 0, add: false });
  cm.fillStyle(0x888888);
  cm.fillRect(3, 3, 10, 11);
  cm.fillStyle(0x666666);
  for (let y = 3; y < 14; y += 2) {
    for (let x = 3; x < 13; x += 2) {
      cm.fillRect(x, y, 1, 1);
    }
  }
  cm.generateTexture('gear_chainmail', 16, 16);
  cm.destroy();

  // Sandals (16x16): two brown L-shapes
  const snd = scene.make.graphics({ x: 0, y: 0, add: false });
  snd.fillStyle(0x8B6914);
  snd.fillRect(2, 10, 4, 3);   // left sandal base
  snd.fillRect(2, 9, 1, 1);    // left strap
  snd.fillRect(10, 10, 4, 3);  // right sandal base
  snd.fillRect(13, 9, 1, 1);   // right strap
  snd.generateTexture('gear_sandals', 16, 16);
  snd.destroy();

  // Iron Greaves (16x16): gray boot shapes with darker sole
  const ig = scene.make.graphics({ x: 0, y: 0, add: false });
  ig.fillStyle(0x888888);
  ig.fillRect(2, 8, 4, 6);    // left boot
  ig.fillRect(10, 8, 4, 6);   // right boot
  ig.fillStyle(0x555555);
  ig.fillRect(2, 13, 4, 1);   // left sole
  ig.fillRect(10, 13, 4, 1);  // right sole
  ig.fillStyle(0xAAAAAA);
  ig.fillRect(3, 8, 2, 4);    // left highlight
  ig.generateTexture('gear_iron_greaves', 16, 16);
  ig.destroy();

  // Bone Ring (16x16): white circle with gap
  const br = scene.make.graphics({ x: 0, y: 0, add: false });
  br.lineStyle(2, 0xEEEEEE);
  br.strokeCircle(8, 8, 4);
  br.fillStyle(0x000000, 0);   // transparent fill
  br.fillRect(8, 4, 2, 2);     // gap at top
  br.generateTexture('gear_bone_ring', 16, 16);
  br.destroy();

  // Echo Pendant (16x16): blue circle with chain above
  const ep = scene.make.graphics({ x: 0, y: 0, add: false });
  ep.fillStyle(0x2196F3);
  ep.fillCircle(8, 10, 4);
  ep.fillStyle(0x88CCFF);
  ep.fillCircle(8, 10, 2);     // inner glow
  ep.lineStyle(1, 0x888888);
  ep.strokeRect(7, 2, 2, 4);   // chain link
  ep.fillStyle(0x888888);
  ep.fillRect(7, 6, 2, 2);     // chain bottom
  ep.generateTexture('gear_echo_pendant', 16, 16);
  ep.destroy();

  // Equip slot backgrounds for each rarity (48x48)
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

  // Empty gear slot (48x48)
  const emptySlot = scene.make.graphics({ x: 0, y: 0, add: false });
  emptySlot.fillStyle(0x1A1A2E, 1);
  emptySlot.fillRect(0, 0, 48, 48);
  emptySlot.lineStyle(1, 0x444466, 1);
  emptySlot.strokeRect(1, 1, 46, 46);
  emptySlot.generateTexture('ui_gear_slot_empty', 48, 48);
  emptySlot.destroy();
}

function generateFarmTextures(scene) {
  // Shared soil base helper
  function makeSoil(g) {
    g.fillStyle(0x5A3A1A);
    g.fillRect(0, 0, 16, 16);
    // Furrow lines
    g.fillStyle(0x4A2A10);
    for (let row = 2; row < 16; row += 4) {
      g.fillRect(0, row, 16, 1);
    }
  }

  // tile_farm_empty
  const fe = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(fe);
  fe.generateTexture('tile_farm_empty', 16, 16);
  fe.destroy();

  // tile_farm_planted (soil + 2x2 green seedling dot)
  const fp = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(fp);
  fp.fillStyle(0x4CAF50);
  fp.fillRect(7, 7, 2, 2);
  fp.generateTexture('tile_farm_planted', 16, 16);
  fp.destroy();

  // tile_farm_growing (soil + sprout)
  const fg = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(fg);
  fg.fillStyle(0x4CAF50);
  fg.fillRect(7, 6, 2, 6); // stem
  fg.fillStyle(0x66BB6A);
  fg.fillRect(5, 7, 2, 2); // left leaf
  fg.fillRect(9, 8, 2, 2); // right leaf
  fg.generateTexture('tile_farm_growing', 16, 16);
  fg.destroy();

  // tile_farm_ready_wheat
  const frw = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frw);
  frw.fillStyle(0x8B6914);
  frw.fillRect(5, 4, 2, 8);
  frw.fillRect(8, 4, 2, 8);
  frw.fillRect(11, 4, 2, 8);
  frw.fillStyle(0xDAA520);
  frw.fillRect(5, 2, 2, 3);
  frw.fillRect(8, 3, 2, 3);
  frw.fillRect(11, 2, 2, 3);
  frw.generateTexture('tile_farm_ready_wheat', 16, 16);
  frw.destroy();

  // tile_farm_ready_carrot
  const frc = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frc);
  frc.fillStyle(0xFF7043);
  frc.fillRect(6, 8, 4, 5);
  frc.fillStyle(0x4CAF50);
  frc.fillRect(6, 5, 2, 4);
  frc.fillRect(8, 4, 2, 4);
  frc.fillRect(10, 5, 2, 4);
  frc.generateTexture('tile_farm_ready_carrot', 16, 16);
  frc.destroy();

  // tile_farm_ready_tomato
  const frt = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frt);
  frt.fillStyle(0x2E7D32);
  frt.fillRect(6, 4, 4, 6); // vine
  frt.fillStyle(0xE53935);
  frt.fillRect(4, 6, 3, 3);
  frt.fillRect(9, 7, 3, 3);
  frt.generateTexture('tile_farm_ready_tomato', 16, 16);
  frt.destroy();

  // tile_farm_ready_golden_wheat (brighter gold + sparkle)
  const frgw = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frgw);
  frgw.fillStyle(0xBB8A00);
  frgw.fillRect(5, 4, 2, 8);
  frgw.fillRect(8, 4, 2, 8);
  frgw.fillRect(11, 4, 2, 8);
  frgw.fillStyle(0xFFD700);
  frgw.fillRect(5, 2, 2, 3);
  frgw.fillRect(8, 3, 2, 3);
  frgw.fillRect(11, 2, 2, 3);
  frgw.fillStyle(0xFFFFFF);
  frgw.fillRect(4, 1, 1, 1);
  frgw.fillRect(13, 3, 1, 1);
  frgw.generateTexture('tile_farm_ready_golden_wheat', 16, 16);
  frgw.destroy();

  // tile_farm_ready_moonberry (purple-blue berries)
  const frmb = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frmb);
  frmb.fillStyle(0x4A148C);
  frmb.fillRect(6, 5, 4, 7);
  frmb.fillStyle(0x7B1FA2);
  frmb.fillRect(4, 7, 3, 3);
  frmb.fillRect(9, 6, 3, 3);
  frmb.fillStyle(0xCE93D8);
  frmb.fillRect(5, 7, 1, 1);
  frmb.fillRect(10, 7, 1, 1);
  frmb.generateTexture('tile_farm_ready_moonberry', 16, 16);
  frmb.destroy();

  // tile_farm_ready_starfruit (yellow star shape)
  const frsf = scene.make.graphics({ x: 0, y: 0, add: false });
  makeSoil(frsf);
  frsf.fillStyle(0x4CAF50);
  frsf.fillRect(7, 8, 2, 5);
  frsf.fillStyle(0xFFEB3B);
  frsf.fillRect(7, 3, 2, 5);   // top
  frsf.fillRect(5, 5, 6, 2);   // horizontal
  frsf.fillRect(5, 4, 2, 1);   // upper-left
  frsf.fillRect(9, 4, 2, 1);   // upper-right
  frsf.generateTexture('tile_farm_ready_starfruit', 16, 16);
  frsf.destroy();
}

function generateItemTextures(scene) {
  // Food item icons (16x16)
  // basic_stew - brown bowl with steam
  const is1 = scene.make.graphics({ x: 0, y: 0, add: false });
  is1.fillStyle(0x5D4037);
  is1.fillRect(4, 8, 8, 5);
  is1.fillRect(3, 9, 10, 3);
  is1.fillStyle(0x795548);
  is1.fillRect(5, 7, 6, 2);
  is1.fillStyle(0xFFFFFF);
  is1.fillRect(6, 4, 1, 2);
  is1.fillRect(9, 3, 1, 3);
  is1.generateTexture('food_basic_stew', 16, 16);
  is1.destroy();

  // carrot_soup - orange bowl
  const is2 = scene.make.graphics({ x: 0, y: 0, add: false });
  is2.fillStyle(0xFF8F00);
  is2.fillRect(4, 8, 8, 5);
  is2.fillRect(3, 9, 10, 3);
  is2.fillStyle(0xFFCC02);
  is2.fillRect(5, 7, 6, 2);
  is2.fillStyle(0xFFFFFF);
  is2.fillRect(7, 4, 1, 2);
  is2.fillRect(10, 3, 1, 3);
  is2.generateTexture('food_carrot_soup', 16, 16);
  is2.destroy();

  // grilled_fish - fish shape on plate
  const is3 = scene.make.graphics({ x: 0, y: 0, add: false });
  is3.fillStyle(0xBDBDBD);
  is3.fillRect(3, 11, 10, 2);
  is3.fillStyle(0xFF8A65);
  is3.fillRect(4, 7, 8, 4);
  is3.fillRect(4, 8, 2, 2);
  is3.fillStyle(0x6D4C41);
  is3.fillRect(4, 9, 8, 1);
  is3.generateTexture('food_grilled_fish', 16, 16);
  is3.destroy();

  // hearty_chowder - large yellow bowl
  const is4 = scene.make.graphics({ x: 0, y: 0, add: false });
  is4.fillStyle(0x5D4037);
  is4.fillRect(3, 8, 10, 5);
  is4.fillRect(2, 9, 12, 3);
  is4.fillStyle(0xFFD54F);
  is4.fillRect(4, 7, 8, 3);
  is4.fillStyle(0xFFFFFF);
  is4.fillRect(6, 4, 1, 2);
  is4.fillRect(9, 3, 1, 3);
  is4.generateTexture('food_hearty_chowder', 16, 16);
  is4.destroy();

  // miners_meal - brown plate
  const is5 = scene.make.graphics({ x: 0, y: 0, add: false });
  is5.fillStyle(0xBDBDBD);
  is5.fillRect(3, 11, 10, 2);
  is5.fillStyle(0xBF360C);
  is5.fillRect(4, 7, 8, 5);
  is5.fillStyle(0xFF8A65);
  is5.fillRect(5, 8, 3, 2);
  is5.fillRect(9, 9, 2, 2);
  is5.generateTexture('food_miners_meal', 16, 16);
  is5.destroy();

  // golden_bread - golden loaf
  const is6 = scene.make.graphics({ x: 0, y: 0, add: false });
  is6.fillStyle(0xE65100);
  is6.fillRect(3, 9, 10, 4);
  is6.fillStyle(0xFFB300);
  is6.fillRect(4, 6, 8, 5);
  is6.fillRect(3, 8, 10, 2);
  is6.fillStyle(0xFFD54F);
  is6.fillRect(5, 6, 6, 2);
  is6.generateTexture('food_golden_bread', 16, 16);
  is6.destroy();

  // anglers_feast - fancy fish plate
  const is7 = scene.make.graphics({ x: 0, y: 0, add: false });
  is7.fillStyle(0xE0E0E0);
  is7.fillRect(3, 11, 10, 2);
  is7.fillStyle(0x4CAF50);
  is7.fillRect(4, 10, 1, 1);
  is7.fillRect(11, 10, 1, 1);
  is7.fillStyle(0xFF8A65);
  is7.fillRect(4, 7, 8, 4);
  is7.fillStyle(0x795548);
  is7.fillRect(5, 8, 6, 1);
  is7.fillStyle(0xFFFFFF);
  is7.fillRect(11, 7, 1, 1);
  is7.generateTexture('food_anglers_feast', 16, 16);
  is7.destroy();

  // moonberry_tart - purple pie
  const is8 = scene.make.graphics({ x: 0, y: 0, add: false });
  is8.fillStyle(0x8D6E63);
  is8.fillRect(3, 10, 10, 3);
  is8.fillStyle(0x6A1B9A);
  is8.fillRect(4, 6, 8, 6);
  is8.fillStyle(0xCE93D8);
  is8.fillRect(5, 7, 2, 2);
  is8.fillRect(9, 8, 2, 2);
  is8.generateTexture('food_moonberry_tart', 16, 16);
  is8.destroy();

  // abyssal_broth - dark bowl with blue-green steam
  const is9 = scene.make.graphics({ x: 0, y: 0, add: false });
  is9.fillStyle(0x212121);
  is9.fillRect(3, 8, 10, 5);
  is9.fillRect(2, 9, 12, 3);
  is9.fillStyle(0x00897B);
  is9.fillRect(5, 7, 2, 2);
  is9.fillRect(9, 6, 2, 3);
  is9.fillStyle(0x00BCD4);
  is9.fillRect(6, 5, 1, 2);
  is9.fillRect(10, 4, 1, 2);
  is9.generateTexture('food_abyssal_broth', 16, 16);
  is9.destroy();

  // starfruit_elixir - yellow potion bottle
  const is10 = scene.make.graphics({ x: 0, y: 0, add: false });
  is10.fillStyle(0x7B1FA2);
  is10.fillRect(7, 1, 2, 2); // neck top
  is10.fillStyle(0x555577);
  is10.fillRect(6, 3, 4, 1);  // stopper
  is10.fillStyle(0xFFEB3B);
  is10.fillRect(4, 4, 8, 9);
  is10.fillStyle(0xFFD700);
  is10.fillRect(5, 5, 2, 2);
  is10.fillStyle(0xFFFFFF);
  is10.fillRect(6, 5, 1, 3);
  // star
  is10.fillStyle(0xFFFFFF);
  is10.fillRect(7, 7, 1, 1);
  is10.generateTexture('food_starfruit_elixir', 16, 16);
  is10.destroy();
}
