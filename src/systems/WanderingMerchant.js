import Phaser from 'phaser';
import { MERCHANT_CONFIG, MERCHANT_INVENTORY_POOL } from '../config/merchantData.js';
import { MerchantNPC } from '../entities/MerchantNPC.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';
import { addToMaterials } from '../utils/helpers.js';

export class WanderingMerchant {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.entity = null;
    this.inventory = [];
    this.spawnTimer = null;
    this.despawnTimer = null;
    this.currentZone = null;
    this.spawnedAt = 0;
    this.nextSpawnTime = this.rollNextSpawn();

    this.scheduleNextSpawn();
  }

  rollNextSpawn() {
    const { min, max } = MERCHANT_CONFIG.spawnInterval;
    return Phaser.Math.Between(min, max);
  }

  scheduleNextSpawn() {
    this.spawnTimer = this.scene.time.delayedCall(this.nextSpawnTime, () => {
      this.spawn();
    });
  }

  spawn() {
    if (this.isActive) return;

    const zone = this.pickSpawnZone();
    const position = this.getRandomWalkableTile(zone);
    if (!position) {
      this.nextSpawnTime = this.rollNextSpawn();
      this.scheduleNextSpawn();
      return;
    }

    this.inventory = this.rollInventory();
    this.entity = new MerchantNPC(this.scene, position.x, position.y);
    this.isActive = true;
    this.currentZone = zone;
    this.spawnedAt = Date.now();

    this.scene.events.emit('merchantSpawned', {
      zone: zone,
      position: position,
      stayDuration: MERCHANT_CONFIG.stayDuration,
    });

    this.scene.time.delayedCall(
      MERCHANT_CONFIG.stayDuration - MERCHANT_CONFIG.despawnWarning,
      () => {
        if (this.isActive) {
          this.scene.events.emit('merchantLeavingSoon', {
            timeRemaining: MERCHANT_CONFIG.despawnWarning,
          });
        }
      }
    );

    this.despawnTimer = this.scene.time.delayedCall(
      MERCHANT_CONFIG.stayDuration,
      () => { this.despawn(); }
    );
  }

  despawn() {
    if (!this.isActive) return;

    if (this.entity && this.entity.active) {
      this.scene.tweens.add({
        targets: this.entity,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          if (this.entity) {
            this.entity.destroy();
            this.entity = null;
          }
        },
      });
    }

    this.isActive = false;
    this.inventory = [];
    this.currentZone = null;
    this.scene.events.emit('merchantDespawned');

    this.nextSpawnTime = this.rollNextSpawn();
    this.scheduleNextSpawn();
  }

  pickSpawnZone() {
    const zones = MERCHANT_CONFIG.spawnZones;
    const total = zones.reduce((sum, z) => sum + z.weight, 0);
    let roll = Math.random() * total;
    for (const z of zones) {
      roll -= z.weight;
      if (roll <= 0) return z.zone;
    }
    return 'forest';
  }

  getRandomWalkableTile(zone) {
    const map = this.scene.mapData;
    if (!map) return null;
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = Phaser.Math.Between(1, MAP_WIDTH - 2);
      const y = Phaser.Math.Between(1, MAP_HEIGHT - 2);
      const tile = map[y] && map[y][x];
      if (tile && tile.walkable && tile.zone === zone) {
        return { x, y };
      }
    }
    // Fallback: find any walkable tile
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        const tile = map[y][x];
        if (tile && tile.walkable && tile.zone === zone) return { x, y };
      }
    }
    return null;
  }

  rollInventory() {
    const items = [];
    for (const item of MERCHANT_INVENTORY_POOL.guaranteed) {
      items.push({ ...item, remaining: item.maxQuantity });
    }

    const count = Phaser.Math.Between(3, 5);
    const pool = [...MERCHANT_INVENTORY_POOL.rotating];
    let totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

    for (let i = 0; i < count && pool.length > 0; i++) {
      let roll = Math.random() * totalWeight;
      for (let j = 0; j < pool.length; j++) {
        roll -= pool[j].weight;
        if (roll <= 0) {
          items.push({ ...pool[j], remaining: pool[j].maxQuantity });
          totalWeight -= pool[j].weight;
          pool.splice(j, 1);
          break;
        }
      }
    }

    return items;
  }

  buyItem(itemIndex, gameState) {
    const item = this.inventory[itemIndex];
    if (!item || item.remaining <= 0) return { success: false, reason: 'Sold out' };
    if (gameState.gold < item.cost) return { success: false, reason: 'Not enough gold' };

    gameState.gold -= item.cost;
    item.remaining -= 1;

    // Add item to player inventory
    const lootSystem = this.scene.lootSystem;
    if (lootSystem) {
      lootSystem.gold = gameState.gold;
      this.scene.events.emit('goldChanged', lootSystem.gold);
    }

    addToMaterials(this.scene.gameState.materials, {
      id: item.id,
      name: item.name,
      emoji: item.icon,
      quantity: 1,
      sellValue: item.cost,
      category: item.category,
    });

    this.scene.events.emit('merchantPurchase', {
      item: item,
      goldSpent: item.cost,
      remainingStock: item.remaining,
    });
    this.scene.events.emit('inventoryChanged', this.scene.gameState.materials);

    return { success: true };
  }

  getTimeRemaining() {
    if (!this.isActive) return 0;
    return Math.max(0, MERCHANT_CONFIG.stayDuration - (Date.now() - this.spawnedAt));
  }
}
