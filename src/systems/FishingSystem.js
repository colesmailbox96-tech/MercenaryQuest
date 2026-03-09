import { FISHING_POOLS } from '../config/fishData.js';
import { ITEMS } from '../config/itemData.js';
import { ACTIVITY } from '../config/constants.js';
import { weightedRandom } from '../utils/helpers.js';

const RARE_FISH = ['pearl_fragment', 'sea_gem', 'sunken_ring', 'ancient_coin'];

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

  get skillSystem() {
    return this.scene.skillSystem || null;
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
      // Check auto-collect perk
      if (this.skillSystem && this.skillSystem.hasPerk('fishing', 'auto_collect_fish')) {
        this.autoCollect();
      } else {
        this.active = false;
        this.scene.events.emit('fishingPaused', 'Catch bag full! Collect your catches.');
        return;
      }
    }

    const speedBonus = this.skillSystem
      ? this.skillSystem.getBonus('fishing', 'cycleSpeedBonus')
      : 0;
    const adjustedDuration = Math.floor(this.selectedPool.cycleDuration * (1 - speedBonus));

    this.timer = this.scene.time.delayedCall(
      adjustedDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('fishingCycleStarted', {
      pool: this.selectedPool.name,
      duration: adjustedDuration,
    });
  }

  completeCycle() {
    this.cycleCount++;

    const catchBonus = this.skillSystem
      ? this.skillSystem.getBonus('fishing', 'catchChanceBonus')
      : 0;
    const adjustedChance = Math.min(0.99, this.selectedPool.catchChance + catchBonus);

    if (Math.random() <= adjustedChance) {
      let catches = [...this.selectedPool.catches];

      // Master Angler: double weight of rare items
      if (this.skillSystem && this.skillSystem.hasPerk('fishing', 'master_angler')) {
        catches = catches.map(c =>
          RARE_FISH.includes(c.id) ? { ...c, weight: c.weight * 2 } : c
        );
      }

      const catchItem = weightedRandom(catches);
      this.addToPending(catchItem.id);

      // Double catch chance
      const doubleChance = this.skillSystem
        ? this.skillSystem.getBonus('fishing', 'doubleCatchChance')
        : 0;
      const buffDouble = this._getBuffDoubleCatch();
      if (Math.random() < doubleChance + buffDouble) {
        this.addToPending(catchItem.id);
        this.scene.events.emit('fishingDoubleCatch', { itemId: catchItem.id });
      }

      // XP gain
      if (this.skillSystem) {
        const isRare = RARE_FISH.includes(catchItem.id);
        this.skillSystem.addXP('fishing', isRare ? 8 : 3);
      }

      this.scene.events.emit('fishingCatch', { itemId: catchItem.id, cycleNum: this.cycleCount });
    } else {
      if (this.skillSystem) this.skillSystem.addXP('fishing', 1);
      this.scene.events.emit('fishingMiss', { cycleNum: this.cycleCount });
    }
    this.scheduleCycle();
  }

  _getBuffDoubleCatch() {
    const buffs = this.scene.activeBuffs || [];
    let bonus = 0;
    for (const buff of buffs) {
      if (buff.skillEffects && buff.skillEffects.fishing && buff.skillEffects.fishing.doubleCatchBonus) {
        bonus += buff.skillEffects.fishing.doubleCatchBonus;
      }
    }
    return bonus;
  }

  autoCollect() {
    const lootSystem = this.scene.lootSystem;
    if (!lootSystem) return;
    this.collectAll(lootSystem);
    this.active = true;
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
    const speedBonus = this.skillSystem
      ? this.skillSystem.getBonus('fishing', 'cycleSpeedBonus')
      : 0;
    const cycleDuration = this.selectedPool
      ? Math.floor(this.selectedPool.cycleDuration * (1 - speedBonus))
      : 0;
    return {
      active: this.active,
      pool: this.selectedPool?.name || null,
      pendingCount: this.pendingCatches.length,
      cycleCount: this.cycleCount,
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / cycleDuration)
        : 0,
    };
  }
}
