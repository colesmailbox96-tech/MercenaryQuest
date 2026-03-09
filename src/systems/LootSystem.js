import { LOOT_TABLES } from '../config/mobData.js';
import { ITEMS } from '../config/itemData.js';
import { weightedRandom } from '../utils/helpers.js';

export class LootSystem {
  constructor(scene) {
    this.scene = scene;
    this.sharedStash = [];
    this.gold = 20;
  }

  rollDrop(mobType) {
    const table = LOOT_TABLES[mobType];
    if (!table) return null;

    const result = weightedRandom(table);
    if (!result.item) return null;

    return { ...ITEMS[result.item] };
  }

  addToStash(item) {
    if (!item) return;

    if (item.id === 'goldCoin') {
      this.gold += 1;
      this.scene.events.emit('goldChanged', this.gold);
      return;
    }

    const existing = this.sharedStash.find(s => s.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      if (this.sharedStash.length >= 30) return;
      this.sharedStash.push({ ...item, quantity: 1 });
    }

    this.scene.events.emit('inventoryChanged', this.sharedStash);
    this.scene.events.emit('lootReceived', { item });
  }

  sellItem(itemId) {
    const idx = this.sharedStash.findIndex(s => s.id === itemId);
    if (idx === -1) return false;

    const item = this.sharedStash[idx];
    this.gold += item.sellValue;
    item.quantity -= 1;

    if (item.quantity <= 0) {
      this.sharedStash.splice(idx, 1);
    }

    this.scene.events.emit('goldChanged', this.gold);
    this.scene.events.emit('inventoryChanged', this.sharedStash);
    return true;
  }

  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    this.scene.events.emit('goldChanged', this.gold);
    return true;
  }
}
