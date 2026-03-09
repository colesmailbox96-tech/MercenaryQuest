import { MINING_NODES } from '../config/oreData.js';
import { ITEMS } from '../config/itemData.js';
import { ACTIVITY } from '../config/constants.js';
import { weightedRandom } from '../utils/helpers.js';

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
      this.active = false;
      this.scene.events.emit('miningPaused', 'Ore bag full! Collect your ores.');
      return;
    }
    this.timer = this.scene.time.delayedCall(
      this.activeNodeDef.cycleDuration,
      () => this.completeCycle()
    );
    this.scene.events.emit('miningCycleStarted', {
      node: this.activeNodeDef.name,
      duration: this.activeNodeDef.cycleDuration,
    });
  }

  completeCycle() {
    if (Math.random() <= this.activeNodeDef.extractChance) {
      const ore = weightedRandom(this.activeNodeDef.yields);
      this.addToPending(ore.id);
      this.extractionCount++;
      this.scene.events.emit('miningExtract', { itemId: ore.id });

      if (this.extractionCount >= this.activeNodeDef.maxExtractions) {
        this.depleteNode();
        return;
      }
    } else {
      this.scene.events.emit('miningMiss');
    }
    this.scheduleCycle();
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
    return {
      active: this.active,
      node: this.activeNodeDef?.name || null,
      nodeKey: this.activeNodeKey,
      pendingCount: this.pendingOres.length,
      extractionsLeft: this.activeNodeDef
        ? this.activeNodeDef.maxExtractions - this.extractionCount
        : 0,
      timerProgress: this.timer
        ? 1 - (this.timer.getRemaining() / this.activeNodeDef.cycleDuration)
        : 0,
    };
  }
}
