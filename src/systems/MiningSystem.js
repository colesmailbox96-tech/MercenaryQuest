import { MINING_NODES } from '../config/oreData.js';
import { ITEMS } from '../config/itemData.js';
import { ACTIVITY } from '../config/constants.js';
import { weightedRandom } from '../utils/helpers.js';

const RARE_ORES = ['gemstone_shard', 'void_crystal', 'ancient_coin'];
const MAX_SPEED_BONUS = 0.80;

export class MiningSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.activeNodeKey = null;
    this.activeNodeDef = null;
    this.timer = null;
    this.pendingOres = [];
    this.maxPending = ACTIVITY.MINING_MAX_PENDING;
    this.extractionCount = 0;
    this.nodeStates = {};
  }

  get skillSystem() {
    return this.scene.skillSystem || null;
  }

  initNodeStates() {
    for (const key of Object.keys(MINING_NODES)) {
      this.nodeStates[key] = this.nodeStates[key] || { state: 'available', extractionsUsed: 0 };
    }
  }

  getNodeState(nodeKey) {
    if (!this.nodeStates[nodeKey]) {
      this.nodeStates[nodeKey] = { state: 'available', extractionsUsed: 0 };
    }
    return this.nodeStates[nodeKey];
  }

  start(nodeKey) {
    const nodeDef = MINING_NODES[nodeKey];
    if (!nodeDef) return;
    this.activeNodeKey = nodeKey;
    this.activeNodeDef = nodeDef;
    this.active = true;
    this.extractionCount = 0;
    const ns = this.getNodeState(nodeKey);
    ns.state = 'active';
    this.scene.events.emit('miningNodeStateChanged', { nodeKey, state: 'active' });
    this.scheduleCycle();
  }

  scheduleCycle() {
    if (!this.active) return;
    if (this.pendingOres.length >= this.maxPending) {
      if (this.skillSystem && this.skillSystem.hasPerk('mining', 'auto_collect_ore')) {
        this.autoCollect();
      } else {
        this.active = false;
        this.scene.events.emit('miningPaused', 'Ore bag full! Collect your ores.');
        return;
      }
    }

    const speedBonus = this.skillSystem
      ? this.skillSystem.getBonus('mining', 'cycleSpeedBonus')
      : 0;
    const buffSpeed = this._getBuffSpeedBonus();
    const totalSpeed = Math.min(MAX_SPEED_BONUS, speedBonus + buffSpeed);
    const maxExtBonus = this.skillSystem && this.skillSystem.hasPerk('mining', 'master_miner') ? 0.50 : 0;
    const adjustedDuration = Math.floor(this.activeNodeDef.cycleDuration * (1 - totalSpeed));

    this.timer = this.scene.time.delayedCall(
      adjustedDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('miningCycleStarted', {
      node: this.activeNodeDef.name,
      duration: adjustedDuration,
    });
  }

  _getBuffSpeedBonus() {
    const buffs = this.scene.activeBuffs || [];
    let bonus = 0;
    for (const buff of buffs) {
      if (buff.skillEffects && buff.skillEffects.mining && buff.skillEffects.mining.cycleSpeedBonus) {
        bonus += buff.skillEffects.mining.cycleSpeedBonus;
      }
    }
    return bonus;
  }

  completeCycle() {
    const extractBonus = this.skillSystem
      ? this.skillSystem.getBonus('mining', 'extractChanceBonus')
      : 0;
    const buffExtract = this._getBuffExtractBonus();
    const adjustedChance = Math.min(0.99, this.activeNodeDef.extractChance + extractBonus + buffExtract);

    if (Math.random() <= adjustedChance) {
      const ore = weightedRandom(this.activeNodeDef.yields);
      this.addToPending(ore.id);

      // Double yield chance
      const doubleChance = this.skillSystem
        ? this.skillSystem.getBonus('mining', 'doubleYieldChance')
        : 0;
      if (Math.random() < doubleChance) {
        this.addToPending(ore.id);
        this.scene.events.emit('miningDoubleYield', { itemId: ore.id });
      }

      this.extractionCount++;

      // XP
      if (this.skillSystem) {
        const isRare = RARE_ORES.includes(ore.id);
        this.skillSystem.addXP('mining', isRare ? 6 : 4);
      }

      this.scene.events.emit('miningExtract', { itemId: ore.id });

      // Depletion check (master_miner adds 50% more extractions)
      const masterBonus = this.skillSystem && this.skillSystem.hasPerk('mining', 'master_miner') ? 1.5 : 1;
      const maxEx = Math.floor(this.activeNodeDef.maxExtractions * masterBonus);
      if (this.extractionCount >= maxEx) {
        this.depleteNode();
        return;
      }
    } else {
      if (this.skillSystem) this.skillSystem.addXP('mining', 1);
      this.scene.events.emit('miningMiss');
    }
    this.scheduleCycle();
  }

  _getBuffExtractBonus() {
    const buffs = this.scene.activeBuffs || [];
    let bonus = 0;
    for (const buff of buffs) {
      if (buff.skillEffects && buff.skillEffects.mining && buff.skillEffects.mining.extractChanceBonus) {
        bonus += buff.skillEffects.mining.extractChanceBonus;
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

  depleteNode() {
    this.active = false;
    if (this.timer) this.timer.remove();
    const ns = this.getNodeState(this.activeNodeKey);
    ns.state = 'depleted';
    this.scene.events.emit('miningNodeStateChanged', { nodeKey: this.activeNodeKey, state: 'depleted' });
    this.scene.events.emit('miningNodeDepleted', {
      node: this.activeNodeDef.name,
      respawnTime: this.activeNodeDef.respawnTime,
    });
    const depletedKey = this.activeNodeKey;
    this.scene.time.delayedCall(this.activeNodeDef.respawnTime, () => {
      const rns = this.getNodeState(depletedKey);
      rns.state = 'available';
      rns.extractionsUsed = 0;
      this.scene.events.emit('miningNodeStateChanged', { nodeKey: depletedKey, state: 'available' });
      this.scene.events.emit('miningNodeRespawned', { node: MINING_NODES[depletedKey].name });
    });
  }

  addToPending(itemId) {
    const existing = this.pendingOres.find(o => o.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      const itemDef = ITEMS[itemId];
      this.pendingOres.push({
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
    for (const ore of this.pendingOres) {
      if (ore.id === 'ancient_coin') {
        const coinDef = ITEMS['ancient_coin'];
        lootSystem.gold += coinDef.goldValue * ore.quantity;
        lootSystem.scene.events.emit('goldChanged', lootSystem.gold);
      } else {
        for (let i = 0; i < ore.quantity; i++) {
          const existing = lootSystem.sharedStash.find(s => s.id === ore.id);
          if (existing) {
            existing.quantity++;
          } else {
            lootSystem.sharedStash.push({
              id: ore.id,
              name: ore.name,
              emoji: ore.emoji,
              quantity: 1,
              sellValue: ore.sellValue,
            });
          }
        }
      }
    }
    const collected = [...this.pendingOres];
    this.pendingOres = [];
    lootSystem.scene.events.emit('inventoryChanged', lootSystem.sharedStash);
    return collected;
  }

  stop() {
    this.active = false;
    if (this.timer) this.timer.remove();
    this.timer = null;
    if (this.activeNodeKey) {
      const ns = this.getNodeState(this.activeNodeKey);
      if (ns.state === 'active') {
        ns.state = 'available';
        this.scene.events.emit('miningNodeStateChanged', { nodeKey: this.activeNodeKey, state: 'available' });
      }
    }
    this.scene.events.emit('miningStopped');
  }

  getStatus() {
    const speedBonus = this.skillSystem
      ? this.skillSystem.getBonus('mining', 'cycleSpeedBonus')
      : 0;
    const cycleDuration = this.activeNodeDef
      ? Math.floor(this.activeNodeDef.cycleDuration * (1 - speedBonus))
      : 0;
    return {
      active: this.active,
      node: this.activeNodeDef?.name || null,
      nodeKey: this.activeNodeKey,
      pendingCount: this.pendingOres.length,
      extractionsLeft: this.activeNodeDef
        ? this.activeNodeDef.maxExtractions - this.extractionCount
        : 0,
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / cycleDuration)
        : 0,
    };
  }
}
