import { SEEDS, CROPS } from '../config/farmData.js';
import { randomInt, getOwnedQuantity, removeFromMaterials, addToMaterials } from '../utils/helpers.js';

export class FarmingSystem {
  constructor(scene, skillSystem) {
    this.scene = scene;
    this.skillSystem = skillSystem;
    this.plots = [];
    this.maxPlots = 4;
    this.initPlots();

    // Listen for level-ups that expand the farm
    this.scene.events.on('skillLevelUp', ({ skillId, newLevel }) => {
      if (skillId === 'farming') {
        this._expandPlotsForLevel(newLevel);
      }
    });
  }

  _expandPlotsForLevel(level) {
    let newMax = this.maxPlots;
    if (level >= 5) newMax = 9;
    else if (level >= 3) newMax = 6;
    if (newMax > this.maxPlots) {
      this.maxPlots = newMax;
      this._addMissingPlots();
      this.scene.events.emit('farmPlotsExpanded', { maxPlots: this.maxPlots });
    }
  }

  _addMissingPlots() {
    for (let i = this.plots.length; i < this.maxPlots; i++) {
      this.plots.push({
        index: i,
        state: 'empty',
        seedId: null,
        plantedAt: null,
        growthDuration: null,
        timer: null,
        growingTimer: null,
      });
    }
  }

  initPlots() {
    const farmLevel = this.skillSystem.getLevel('farming');
    if (farmLevel >= 5) this.maxPlots = 9;
    else if (farmLevel >= 3) this.maxPlots = 6;
    else this.maxPlots = 4;
    this._addMissingPlots();
  }

  plant(plotIndex, seedId, gameState) {
    const plot = this.plots[plotIndex];
    if (!plot || plot.state !== 'empty') return { success: false, reason: 'Plot not empty' };

    const seedDef = SEEDS[seedId];
    if (!seedDef) return { success: false, reason: 'Invalid seed' };

    if (this.skillSystem.getLevel('farming') < seedDef.requiredFarmingLevel) {
      return { success: false, reason: `Requires Farming Lv.${seedDef.requiredFarmingLevel}` };
    }

    const ownedSeeds = getOwnedQuantity(gameState.materials, seedId);
    if (ownedSeeds < 1) return { success: false, reason: 'No seeds available' };

    removeFromMaterials(gameState.materials, seedId, 1);

    const speedBonus = this.skillSystem.getBonus('farming', 'growthSpeedBonus');
    const masterBonus = this.skillSystem.hasPerk('farming', 'master_farmer') ? 0.25 : 0;
    // Night moonlight bonus: 15% faster growth
    let nightBonus = 0;
    if (this.scene.dayNightSystem && this.scene.dayNightSystem.isNight) {
      nightBonus = 0.15;
    }
    // Toad companion perk: farming growth bonus
    let companionGrowthBonus = 0;
    if (this.scene.companionSystem) {
      companionGrowthBonus = this.scene.companionSystem.getEffectivePerkValue('farmGrowthBonus');
    }
    const totalSpeedReduction = Math.min(0.70, speedBonus + masterBonus + nightBonus + companionGrowthBonus);
    const adjustedGrowth = Math.floor(seedDef.growthTime * (1 - totalSpeedReduction));

    plot.state = 'planted';
    plot.seedId = seedId;
    plot.plantedAt = Date.now();
    plot.growthDuration = adjustedGrowth;

    plot.growingTimer = this.scene.time.delayedCall(adjustedGrowth * 0.2, () => {
      if (plot.state === 'planted') {
        plot.state = 'growing';
        this.scene.events.emit('plotStateChanged', { plotIndex, state: 'growing' });
      }
    });

    plot.timer = this.scene.time.delayedCall(adjustedGrowth, () => {
      plot.state = 'ready';
      this.scene.events.emit('plotStateChanged', { plotIndex, state: 'ready' });
      this.scene.events.emit('cropReady', { plotIndex, seedId });
    });

    this.skillSystem.addXP('farming', 2);
    this.scene.events.emit('plotStateChanged', { plotIndex, state: 'planted' });
    return { success: true };
  }

  harvest(plotIndex, gameState) {
    const plot = this.plots[plotIndex];
    if (!plot || plot.state !== 'ready') return { success: false, reason: 'Not ready' };

    const seedDef = SEEDS[plot.seedId];
    let cropKey = seedDef.crop;
    // Mystery seed: resolve to random crop at harvest
    if (cropKey === 'mystery') {
      const allCrops = Object.keys(CROPS).filter(k => k !== 'mystery');
      cropKey = allCrops[Math.floor(Math.random() * allCrops.length)];
    }
    const cropDef = CROPS[cropKey];

    let quantity = randomInt(seedDef.cropYield.min, seedDef.cropYield.max);

    let bonusChance = this.skillSystem.getBonus('farming', 'harvestBonusChance');
    // Toad companion perk: bonus crop harvest chance
    if (this.scene.companionSystem) {
      bonusChance += this.scene.companionSystem.getEffectivePerkValue('farmBonusCropBonus');
    }
    if (Math.random() < bonusChance) {
      quantity += 1;
      this.scene.events.emit('farmingBonusCrop', { crop: cropDef.name });
    }

    addToMaterials(gameState.materials, {
      id: cropDef.id,
      name: cropDef.name,
      emoji: cropDef.icon,
      quantity,
      sellValue: cropDef.sellValue,
      category: cropDef.category,
    });

    const isRare = ['golden_wheat', 'moonberry', 'starfruit'].includes(cropDef.id);
    this.skillSystem.addXP('farming', isRare ? 8 : 5);

    plot.state = 'empty';
    plot.seedId = null;
    plot.plantedAt = null;
    plot.growthDuration = null;
    plot.timer = null;
    plot.growingTimer = null;

    this.scene.events.emit('plotStateChanged', { plotIndex, state: 'empty' });
    this.scene.events.emit('inventoryChanged', gameState.materials);
    return { success: true, crop: cropDef, quantity };
  }

  harvestAll(gameState) {
    const results = [];
    for (let i = 0; i < this.plots.length; i++) {
      if (this.plots[i].state === 'ready') {
        results.push(this.harvest(i, gameState));
      }
    }
    return results;
  }

  getPlotStatus(plotIndex) {
    const plot = this.plots[plotIndex];
    if (!plot) return null;
    if (plot.state === 'empty') return { state: 'empty' };
    if (plot.state === 'ready') return { state: 'ready', crop: SEEDS[plot.seedId]?.crop };

    const elapsed = Date.now() - plot.plantedAt;
    const progress = Math.min(1.0, elapsed / plot.growthDuration);
    return {
      state: plot.state,
      seedId: plot.seedId,
      progress,
      timeRemaining: Math.max(0, plot.growthDuration - elapsed),
    };
  }

  countReady() {
    return this.plots.filter(p => p.state === 'ready').length;
  }
}
