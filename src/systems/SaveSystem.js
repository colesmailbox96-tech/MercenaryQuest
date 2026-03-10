import { SAVE_KEY, SAVE_VERSION, DEFAULT_SAVE_STATE, migrateSave } from '../config/saveSchema.js';

export class SaveSystem {
  constructor(scene) {
    this.scene = scene;
    this.dirty = false;
    this.autoSaveTimer = null;
  }

  save(gameState) {
    try {
      const data = this.serializeState(gameState);
      data.version = SAVE_VERSION;
      data.timestamp = Date.now();
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
      this.dirty = false;
      this.scene.events.emit('gameSaved', { timestamp: data.timestamp });
      return { success: true };
    } catch (err) {
      console.error('[SaveSystem] save failed:', err);
      return { success: false, error: err.message };
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { success: false, error: 'No save found' };
      let data = JSON.parse(raw);
      data = migrateSave(data);
      return { success: true, data };
    } catch (err) {
      console.error('[SaveSystem] load failed:', err);
      return { success: false, error: err.message };
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  exportSave(gameState) {
    try {
      const data = this.serializeState(gameState);
      data.version = SAVE_VERSION;
      data.timestamp = Date.now();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agentquest_save_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error('[SaveSystem] export failed:', err);
      return { success: false, error: err.message };
    }
  }

  importSave(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid save data' };
      }
      if (!data.version) {
        return { success: false, error: 'Missing save version' };
      }
      const migrated = migrateSave(data);
      const json = JSON.stringify(migrated);
      localStorage.setItem(SAVE_KEY, json);
      return { success: true, data: migrated };
    } catch (err) {
      console.error('[SaveSystem] import failed:', err);
      return { success: false, error: err.message };
    }
  }

  startAutoSave(gameState, intervalMs = 30000) {
    this.stopAutoSave();
    this._autoSaveGameState = gameState;
    this.autoSaveTimer = setInterval(() => {
      if (this.dirty && this._autoSaveGameState) {
        this.save(this._autoSaveGameState);
      }
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  markDirty() {
    this.dirty = true;
  }

  serializeEquipment(equipment) {
    const result = {};
    for (const [slot, item] of Object.entries(equipment || {})) {
      if (item) {
        result[slot] = { ...item };
      } else {
        result[slot] = null;
      }
    }
    return result;
  }

  serializeState(gameState) {
    const player = gameState.player;
    const agent = gameState.agent;

    const data = JSON.parse(JSON.stringify(DEFAULT_SAVE_STATE));

    // Player
    if (player) {
      data.player.level = player.stats?.level ?? 1;
      data.player.xp = player.stats?.xp ?? 0;
      data.player.gold = gameState.gold ?? 0;
      data.player.stats = {
        maxHp: player.stats?.maxHp ?? 50,
        atk: player.stats?.atk ?? 5,
        def: player.stats?.def ?? 2,
      };
      data.player.currentHp = player.stats?.hp ?? player.stats?.maxHp ?? 50;
      data.player.position = {
        tileX: player.tileX ?? null,
        tileY: player.tileY ?? null,
      };
      data.player.equipment = this.serializeEquipment(player.equipment);
    }

    // Agent
    if (agent) {
      data.agent.hired = true;
      data.agent.level = agent.stats?.level ?? 1;
      data.agent.xp = agent.stats?.xp ?? 0;
      data.agent.stats = {
        maxHp: agent.stats?.maxHp ?? 40,
        atk: agent.stats?.atk ?? 4,
        def: agent.stats?.def ?? 2,
      };
      data.agent.currentHp = agent.stats?.hp ?? agent.stats?.maxHp ?? 40;
      data.agent.equipment = this.serializeEquipment(agent.equipment);
    }

    // Inventory
    data.inventory.materials = (gameState.materials || []).map(m => ({ ...m }));
    data.inventory.gear = (gameState.gear || []).map(g => ({ ...g }));

    // Fishing
    const fs = gameState.fishingSystem;
    if (fs) {
      data.fishing.active = fs.active || false;
      data.fishing.selectedPoolId = fs.selectedPoolKey || null;
      data.fishing.pendingCatches = (fs.pendingCatches || []).map(c => ({ ...c }));
      data.fishing.cycleStartedAt = null;
    }

    // Mining
    const ms = gameState.miningSystem;
    if (ms) {
      data.mining.active = ms.active || false;
      data.mining.selectedNodeId = ms.activeNodeKey || null;
      data.mining.pendingExtracts = (ms.pendingOres || []).map(o => ({ ...o }));
      data.mining.cycleStartedAt = null;
    }

    // Skills
    const ss = gameState.skillSystem;
    if (ss && ss.skills) {
      data.skills = JSON.parse(JSON.stringify(ss.skills));
    }

    // Farm plots
    const farm = gameState.farmingSystem;
    if (farm && farm.plots) {
      data.farmPlots = farm.plots.map((plot, idx) => ({
        index: idx,
        state: plot.state || 'empty',
        seedId: plot.seedId || null,
        plantedAt: plot.plantedAt || null,
        growthDuration: plot.growthDuration || null,
      }));
    }

    // Active buff
    const buff = gameState.activeBuff;
    if (buff) {
      data.activeBuff = { ...buff };
    }

    // World boss (handle gracefully if not present)
    const wb = gameState.worldBossSystem;
    if (wb) {
      data.worldBoss.lastDefeatTimestamp = wb.lastDefeatTimestamp || null;
      data.worldBoss.killCount = wb.killCount || 0;
    }

    // Meta
    data.totalPlayTime = gameState.totalPlayTime || 0;
    data.sessionCount = gameState.sessionCount || 0;
    data.createdAt = gameState.createdAt || null;

    return data;
  }
}
