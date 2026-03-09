export const TILE_SIZE = 16;
export const TILE_SCALE = 2;
export const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;
export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 40;

export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;

export const ZONES = {
  TOWN: {
    x: 15, y: 15, width: 10, height: 10, zone: 'town',
  },
  FOREST: {
    x: 0, y: 0, width: 40, height: 40, zone: 'forest',
  },
  CAVES: {
    x: 0, y: 0, width: 40, height: 10, zone: 'caves',
  },
};

export const MOB_CAPS = {
  forest: 8,
  caves: 5,
};

export const RESPAWN_DELAY = 5000;

export const COLORS = {
  TOWN_GROUND: 0x8B7355,
  TOWN_PATH: 0x9C8A6E,
  TOWN_BUILDING: 0x6B4226,
  TOWN_ROOF: 0x8B0000,
  TOWN_LANTERN: 0xDAA520,

  FOREST_GROUND: 0x2D5A27,
  FOREST_GRASS: 0x4A7C3F,
  FOREST_DARK: 0x1A3A15,
  FOREST_TREE_TRUNK: 0x3E2723,
  FOREST_TREE_LEAVES: 0x388E3C,

  CAVE_GROUND: 0x36393F,
  CAVE_WALL: 0x1A1A2E,
  CAVE_CRYSTAL: 0x5B8FA8,
  CAVE_PURPLE: 0x4A4458,

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

  WATER: 0x2856A6,
};

export const PLAYER_SPEED = 170;
export const AGENT_SPEED = 250;
export const AGENT_RETREAT_SPEED = 125;
export const COMBAT_TICK = 800;

export const BUILDINGS = {
  tavern: { name: 'Tavern', hireCost: 10 },
  shop: { name: 'Shop' },
};
