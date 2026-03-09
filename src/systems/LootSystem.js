import { LOOT_TABLES } from '../config/mobData.js';
import { ITEMS } from '../config/itemData.js';
import { weightedRandom } from '../utils/helpers.js';
import { GEAR_DEFS, rollGearInstance } from '../config/gearData.js';

const GEAR_DROP_CHANCE = {
  slime: 0.08,
  wolf: 0.12,
  caveBat: 0.15,
};

const MAX_GEAR = 30;

export class LootSystem {
  constructor(scene) {
    this.scene = scene;
    this.sharedStash = [];
    this.gearStash = [];
    this.gold = 20;
  }

  rollDrop(mobType) {
    const table = LOOT_TABLES[mobType];
    if (!table) return null;

    const result = weightedRandom(table);
    if (!result.item) return null;

    return { ...ITEMS[result.item] };
  }

  rollLoot(mobType, killerLevel) {
    const drops = [];

    // Material drop (existing)
    const materialDrop = this.rollDrop(mobType);
    if (materialDrop) drops.push({ type: 'material', item: materialDrop });

    // Gear drop (new)
    const gearDrop = this._rollGearDrop(mobType, killerLevel);
    if (gearDrop) drops.push({ type: 'gear', item: gearDrop });

    return drops;
  }

  _rollGearDrop(mobType, killerLevel) {
    const chance = GEAR_DROP_CHANCE[mobType];
    if (!chance || Math.random() > chance) return null;

    const eligible = Object.keys(GEAR_DEFS).filter(id => {
      const def = GEAR_DEFS[id];
      return def.dropSources.includes(mobType) && killerLevel >= def.dropLevel;
    });
    if (eligible.length === 0) return null;

    const defId = eligible[Math.floor(Math.random() * eligible.length)];
    return rollGearInstance(defId);
  }

  addToStash(item) {
    if (!item) return;

    if (item.type === 'gear') {
      this.addGearToStash(item);
      return;
    }

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

  addGearToStash(gearItem) {
    if (this.gearStash.length < MAX_GEAR) {
      this.gearStash.push(gearItem);
      this.scene.events.emit('gearReceived', { item: gearItem });
    } else {
      // Auto-compare: swap if new gear is higher rarity than lowest in stash
      const rarityOrder = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3 };
      const newRarityVal = rarityOrder[gearItem.rarity] || 0;
      // Find lowest rarity unequipped gear in stash
      let lowestIdx = -1;
      let lowestVal = newRarityVal;
      for (let i = 0; i < this.gearStash.length; i++) {
        const g = this.gearStash[i];
        if (g.equippedBy) continue;
        const val = rarityOrder[g.rarity] || 0;
        if (val < lowestVal) {
          lowestVal = val;
          lowestIdx = i;
        }
      }
      if (lowestIdx >= 0) {
        const displaced = this.gearStash[lowestIdx];
        this.gold += displaced.sellValue;
        this.scene.events.emit('goldChanged', this.gold);
        this.gearStash[lowestIdx] = gearItem;
        this.scene.events.emit('gearReceived', { item: gearItem, autoSold: displaced });
      } else {
        // Auto-sell the new gear
        this.gold += gearItem.sellValue;
        this.scene.events.emit('goldChanged', this.gold);
        this.scene.events.emit('gearAutoSold', { item: gearItem });
      }
    }
    this.scene.events.emit('gearStashChanged', this.gearStash);
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

  sellGear(uid) {
    const idx = this.gearStash.findIndex(g => g.uid === uid);
    if (idx === -1) return false;
    const gear = this.gearStash[idx];
    if (gear.equippedBy) return false;
    this.gold += gear.sellValue;
    this.gearStash.splice(idx, 1);
    this.scene.events.emit('goldChanged', this.gold);
    this.scene.events.emit('gearStashChanged', this.gearStash);
    return true;
  }

  sellAllCommonGear() {
    let total = 0;
    this.gearStash = this.gearStash.filter(g => {
      if (!g.equippedBy && g.rarity === 'COMMON') {
        total += g.sellValue;
        return false;
      }
      return true;
    });
    if (total > 0) {
      this.gold += total;
      this.scene.events.emit('goldChanged', this.gold);
      this.scene.events.emit('gearStashChanged', this.gearStash);
    }
    return total;
  }

  spendGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    this.scene.events.emit('goldChanged', this.gold);
    return true;
  }
}
