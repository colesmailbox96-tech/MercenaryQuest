import { MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';
import { MINING_NODE_PLACEMENTS } from '../config/oreData.js';

// Build a set of mining node positions for quick lookup
const miningNodeSet = new Map();
MINING_NODE_PLACEMENTS.forEach(p => {
  miningNodeSet.set(`${p.tileX},${p.tileY}`, p.nodeType);
});

export function generateMap() {
  const map = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push(getTile(x, y));
    }
    map.push(row);
  }

  return map;
}

function getTile(x, y) {
  // Check mining nodes first (they override zone tiles)
  const nodeKey = `${x},${y}`;
  if (miningNodeSet.has(nodeKey)) {
    const nodeType = miningNodeSet.get(nodeKey);
    const zone = y < 10 ? 'caves' : 'forest';
    const textureMap = {
      copper_node: 'tile_mining_node_copper',
      iron_node: 'tile_mining_node_iron',
      crystal_node: 'tile_mining_node_crystal',
    };
    return {
      type: 'mining_node',
      zone,
      walkable: false,
      nodeType,
      textureKey: textureMap[nodeType] || 'tile_mining_node_copper',
    };
  }

  // Town zone: center of map, rows 15-24, cols 15-24
  const inTown = x >= 15 && x <= 24 && y >= 15 && y <= 24;
  // Caves zone: top 10 rows
  const inCaves = y < 10;
  // Forest: everything else

  if (inTown) {
    return getTownTile(x, y);
  }
  if (inCaves) {
    return getCaveTile(x, y);
  }
  return getForestTile(x, y);
}

function getTownTile(x, y) {
  // Fishing pond (water tiles): 3x3 at (23,21)-(25,23)
  if (x >= 23 && x <= 25 && y >= 21 && y <= 23) {
    if (x === 23 && y === 23) {
      return { type: 'fishing_dock', zone: 'town', walkable: false, textureKey: 'tile_fishing_dock' };
    }
    return { type: 'water', zone: 'town', walkable: false, textureKey: 'tile_water' };
  }

  // Town paths
  if (x === 19 || x === 20) {
    return { type: 'path', zone: 'town', walkable: true, textureKey: 'tile_town_path' };
  }
  if (y === 19 || y === 20) {
    return { type: 'path', zone: 'town', walkable: true, textureKey: 'tile_town_path' };
  }

  // Buildings
  // Tavern at (17, 17)
  if (x === 17 && y === 17) {
    return { type: 'building', zone: 'town', walkable: false, buildingType: 'tavern', textureKey: 'tile_building_tavern' };
  }
  // Shop at (22, 17)
  if (x === 22 && y === 17) {
    return { type: 'building', zone: 'town', walkable: false, buildingType: 'shop', textureKey: 'tile_building_shop' };
  }
  // Home at (17, 22)
  if (x === 17 && y === 22) {
    return { type: 'building', zone: 'town', walkable: false, buildingType: 'home', textureKey: 'tile_building_home' };
  }
  // Another home at (22, 22)
  if (x === 22 && y === 22) {
    return { type: 'building', zone: 'town', walkable: false, buildingType: 'home', textureKey: 'tile_building_home' };
  }

  return { type: 'ground', zone: 'town', walkable: true, textureKey: 'tile_town_ground' };
}

function getForestTile(x, y) {
  // Water features
  if ((x >= 5 && x <= 7 && y >= 28 && y <= 30) ||
      (x >= 32 && x <= 34 && y >= 25 && y <= 27)) {
    return { type: 'water', zone: 'forest', walkable: false, textureKey: 'tile_water' };
  }

  // Trees scattered throughout forest
  const treePositions = getTreePositions();
  const key = `${x},${y}`;
  if (treePositions.has(key)) {
    return { type: 'tree', zone: 'forest', walkable: false, textureKey: 'tile_tree' };
  }

  // Border trees at map edges
  if (x === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
    return { type: 'tree', zone: 'forest', walkable: false, textureKey: 'tile_tree' };
  }

  return { type: 'ground', zone: 'forest', walkable: true, textureKey: 'tile_forest_ground' };
}

function getCaveTile(x, y) {
  // Cave walls at edges
  if (y === 0 || x === 0 || x === MAP_WIDTH - 1) {
    return { type: 'wall', zone: 'caves', walkable: false, textureKey: 'tile_cave_wall' };
  }

  // Cave walls pattern
  const wallPositions = getCaveWallPositions();
  const key = `${x},${y}`;
  if (wallPositions.has(key)) {
    return { type: 'wall', zone: 'caves', walkable: false, textureKey: 'tile_cave_wall' };
  }

  // Crystal decorations
  if ((x === 10 && y === 3) || (x === 25 && y === 5) || (x === 35 && y === 2) ||
      (x === 15 && y === 7) || (x === 30 && y === 4)) {
    return { type: 'ground', zone: 'caves', walkable: true, decoration: 'crystal', textureKey: 'tile_crystal' };
  }

  return { type: 'ground', zone: 'caves', walkable: true, textureKey: 'tile_cave_ground' };
}

// Use a seeded pseudo-random for deterministic tree placement
function getTreePositions() {
  const positions = new Set();
  // Deterministic placement using simple hash
  const seeds = [
    [3, 12], [5, 14], [8, 11], [10, 13], [12, 14],
    [2, 25], [4, 27], [7, 32], [9, 35], [11, 30],
    [13, 28], [28, 12], [30, 14], [33, 11], [35, 13],
    [37, 14], [27, 25], [29, 27], [31, 32], [34, 35],
    [36, 30], [38, 28], [3, 38], [8, 36], [12, 37],
    [27, 38], [31, 36], [35, 37], [14, 12], [14, 35],
    [25, 12], [25, 35], [10, 20], [30, 20], [20, 10],
    [20, 30], [5, 20], [35, 20], [20, 35], [20, 14],
    [1, 15], [1, 25], [38, 15], [38, 25],
    [6, 18], [8, 22], [12, 26], [28, 18], [32, 22], [36, 26],
  ];
  seeds.forEach(([x, y]) => {
    if (!(x >= 15 && x <= 24 && y >= 15 && y <= 24) && y >= 10) {
      if (!miningNodeSet.has(`${x},${y}`)) {
        positions.add(`${x},${y}`);
      }
    }
  });
  return positions;
}

function getCaveWallPositions() {
  const positions = new Set();
  const walls = [
    [5, 2], [5, 3], [6, 2], [10, 5], [10, 6], [11, 5],
    [18, 3], [18, 4], [19, 3], [25, 7], [25, 8], [26, 7],
    [33, 2], [33, 3], [34, 2], [37, 5], [37, 6], [38, 5],
    [7, 8], [8, 8], [15, 4], [16, 4], [22, 6], [23, 6],
    [30, 3], [31, 3], [36, 8], [37, 8],
  ];
  walls.forEach(([x, y]) => {
    if (!miningNodeSet.has(`${x},${y}`)) {
      positions.add(`${x},${y}`);
    }
  });
  return positions;
}

export function getTileAt(map, x, y) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;
  return map[y][x];
}

export function isWalkable(map, x, y) {
  const tile = getTileAt(map, x, y);
  return tile !== null && tile.walkable;
}
