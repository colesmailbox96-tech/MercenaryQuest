import { MOB_TYPES } from '../config/mobData.js';
import { MOB_CAPS, RESPAWN_DELAY, MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';
import { Mob } from '../entities/Mob.js';

export class Spawner {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.mobCounts = { forest: 0, caves: 0 };
    this.mobs = [];
  }

  spawnInitial() {
    // Spawn forest mobs
    for (let i = 0; i < MOB_CAPS.forest; i++) {
      this.spawnMob('forest');
    }
    // Spawn cave mobs
    for (let i = 0; i < MOB_CAPS.caves; i++) {
      this.spawnMob('caves');
    }
  }

  spawnMob(zone) {
    const cap = MOB_CAPS[zone];
    if (this.mobCounts[zone] >= cap) return;

    const pos = this.findSpawnPosition(zone);
    if (!pos) return;

    // Pick mob type for zone
    const types = Object.entries(MOB_TYPES).filter(([, data]) => data.zone === zone);
    const [typeKey, typeData] = types[Math.floor(Math.random() * types.length)];

    const mob = new Mob(this.scene, pos.x, pos.y, typeKey, typeData);
    this.mobs.push(mob);
    this.mobCounts[zone]++;

    return mob;
  }

  findSpawnPosition(zone) {
    let minX, maxX, minY, maxY;

    if (zone === 'caves') {
      minX = 1; maxX = MAP_WIDTH - 2;
      minY = 1; maxY = 9;
    } else {
      // Forest - avoid town area
      minX = 1; maxX = MAP_WIDTH - 2;
      minY = 10; maxY = MAP_HEIGHT - 2;
    }

    for (let attempts = 0; attempts < 50; attempts++) {
      const x = minX + Math.floor(Math.random() * (maxX - minX));
      const y = minY + Math.floor(Math.random() * (maxY - minY));

      const tile = this.map[y][x];
      if (tile && tile.walkable && tile.zone === zone) {
        // Check not too close to town center
        if (zone === 'forest') {
          if (x >= 14 && x <= 25 && y >= 14 && y <= 25) continue;
        }
        return { x, y };
      }
    }
    return null;
  }

  onMobDeath(mob) {
    const zone = mob.zone;
    this.mobCounts[zone]--;
    this.mobs = this.mobs.filter(m => m !== mob);

    this.scene.time.delayedCall(RESPAWN_DELAY, () => {
      this.spawnMob(zone);
    });
  }

  getMobs() {
    return this.mobs.filter(m => m.active);
  }
}
