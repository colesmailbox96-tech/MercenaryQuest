import { MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';

export class Pathfinding {
  constructor(map) {
    this.grid = [];
    this.buildGrid(map);
  }

  buildGrid(map) {
    this.grid = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        row.push(map[y][x].walkable ? 0 : 1);
      }
      this.grid.push(row);
    }
  }

  findPath(startX, startY, endX, endY) {
    if (startX === endX && startY === endY) return [];
    if (!this.isValid(endX, endY) || this.grid[endY][endX] === 1) {
      // Try to find nearest walkable tile
      const nearest = this.findNearestWalkable(endX, endY);
      if (!nearest) return [];
      endX = nearest.x;
      endY = nearest.y;
    }
    if (!this.isValid(startX, startY)) return [];

    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${startX},${startY}`;
    const endKey = `${endX},${endY}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(startX, startY, endX, endY));
    openSet.push({ x: startX, y: startY, f: fScore.get(startKey) });

    const MAX_ITERATIONS = 2000;
    let iterations = 0;

    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      const currentKey = `${current.x},${current.y}`;

      if (currentKey === endKey) {
        return this.reconstructPath(cameFrom, current);
      }

      closedSet.add(currentKey);

      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
      ];

      for (const neighbor of neighbors) {
        const nKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(nKey)) continue;
        if (!this.isValid(neighbor.x, neighbor.y)) continue;
        if (this.grid[neighbor.y][neighbor.x] === 1) continue;

        const tentativeG = gScore.get(currentKey) + 1;

        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, current);
          gScore.set(nKey, tentativeG);
          const f = tentativeG + this.heuristic(neighbor.x, neighbor.y, endX, endY);
          fScore.set(nKey, f);

          if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
            openSet.push({ x: neighbor.x, y: neighbor.y, f });
          }

          // Max path length
          if (tentativeG > 60) continue;
        }
      }
    }

    return [];
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  isValid(x, y) {
    return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT;
  }

  findNearestWalkable(x, y) {
    for (let r = 1; r < 5; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (this.isValid(nx, ny) && this.grid[ny][nx] === 0) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return null;
  }

  reconstructPath(cameFrom, current) {
    const path = [{ x: current.x, y: current.y }];
    let key = `${current.x},${current.y}`;
    while (cameFrom.has(key)) {
      const node = cameFrom.get(key);
      path.unshift({ x: node.x, y: node.y });
      key = `${node.x},${node.y}`;
    }
    // Remove start position from path
    path.shift();
    return path;
  }
}
