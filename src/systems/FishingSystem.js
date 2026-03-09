import { FISHING_POOLS } from '../config/fishData.js';
import { ITEMS } from '../config/itemData.js';
import { ACTIVITY } from '../config/constants.js';
import { weightedRandom } from '../utils/helpers.js';

export class FishingSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.selectedPool = null;
    this.selectedPoolKey = null;
    this.timer = null;
    this.pendingCatches = [];
    this.maxPending = ACTIVITY.FISHING_MAX_PENDING;
    this.cycleCount = 0;
  }

  start(poolKey) {
    this.selectedPoolKey = poolKey;
    this.selectedPool = FISHING_POOLS[poolKey];
    this.active = true;
    this.cycleCount = 0;
    this.scheduleCycle();
  }

  scheduleCycle() {
    if (!this.active) return;
    if (this.pendingCatches.length >= this.maxPending) {
      this.active = false;
      this.scene.events.emit('fishingPaused', 'Catch bag full! Collect your catches.');
      return;
    }
    this.timer = this.scene.time.delayedCall(
      this.selectedPool.cycleDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('fishingCycleStarted', {
      pool: this.selectedPool.name,
      duration: this.selectedPool.cycleDuration,
    });
  }

  completeCycle() {
    this.cycleCount++;
    if (Math.random() <= this.selectedPool.catchChance) {
      const catchItem = weightedRandom(this.selectedPool.catches);
      this.addToPending(catchItem.id);
      this.scene.events.emit('fishingCatch', { itemId: catchItem.id, cycleNum: this.cycleCount });
    } else {
      this.scene.events.emit('fishingMiss', { cycleNum: this.cycleCount });
    }
    this.scheduleCycle();
  }

  addToPending(itemId) {
    const existing = this.pendingCatches.find(c => c.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      const itemDef = ITEMS[itemId];
      this.pendingCatches.push({
        id: itemId,
        name: itemDef.name,
        emoji: itemDef.emoji,
        quantity: 1,
        sellValue: itemDef.sellValue,
        category: itemDef.category,
      });
    }
  }

  collectAll(lootSystem) {
    for (const pending of this.pendingCatches) {
      if (pending.id === 'ancient_coin') {
        const coinDef = ITEMS['ancient_coin'];
        lootSystem.gold += coinDef.goldValue * pending.quantity;
        lootSystem.scene.events.emit('goldChanged', lootSystem.gold);
      } else {
        for (let i = 0; i < pending.quantity; i++) {
          const existing = lootSystem.sharedStash.find(s => s.id === pending.id);
          if (existing) {
            existing.quantity++;
          } else {
            lootSystem.sharedStash.push({
              id: pending.id,
              name: pending.name,
              emoji: pending.emoji,
              quantity: 1,
              sellValue: pending.sellValue,
            });
          }
        }
      }
    }
    const collected = [...this.pendingCatches];
    this.pendingCatches = [];
    lootSystem.scene.events.emit('inventoryChanged', lootSystem.sharedStash);
    return collected;
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.timer = null;
    this.scene.events.emit('fishingStopped');
  }

  getStatus() {
    return {
      active: this.active,
      pool: this.selectedPool?.name || null,
      pendingCount: this.pendingCatches.length,
      cycleCount: this.cycleCount,
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / this.selectedPool.cycleDuration)
        : 0,
    };
  }
}
