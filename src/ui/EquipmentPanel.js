import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { RARITY } from '../config/gearData.js';
import { calculatePowerScore } from '../systems/StatCalculator.js';

const SLOT_SIZE = 52;
const GRID_COLS = 4;
const CELL_SIZE = 48;

export class EquipmentPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'EquipmentPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.viewEntity = 'player'; // 'player' or 'agent'
    this.tooltip = null;
    this.slotObjects = {};
    this.gridCells = [];

    const w = this.scale.width;
    const h = this.scale.height;

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this._closeTooltip());

    // Panel
    const panelW = w * 0.95;
    const panelH = h * 0.9;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;

    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.97);
    this.panel.setInteractive();

    // Slide in
    this.panel.y = h;
    this.tweens.add({
      targets: this.panel,
      y: h / 2,
      duration: 300,
      ease: 'Power2',
    });

    // Close button
    this.closeBtn = this.add.text(panelX + panelW - 12, panelY + 8, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this._close());

    // Title
    this.add.text(w / 2, panelY + 10, '🛡️ Equipment', {
      fontSize: '15px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0);

    // Tabs
    this._buildTabs(panelX, panelY, panelW);

    // Content area
    this._buildContent();

    // Listen for changes
    this.gameScene.events.on('equipmentChanged', this._onEquipmentChanged, this);
    this.gameScene.events.on('gearStashChanged', this._onGearStashChanged, this);

    // Cleanup on shutdown
    this.events.once('shutdown', () => {
      this.gameScene.events.off('equipmentChanged', this._onEquipmentChanged, this);
      this.gameScene.events.off('gearStashChanged', this._onGearStashChanged, this);
    });
  }

  _buildTabs(panelX, panelY, panelW) {
    const tabY = panelY + 36;
    const tabW = panelW * 0.45;

    this.tabYou = this.add.rectangle(panelX + panelW * 0.25, tabY, tabW, 26,
      this.viewEntity === 'player' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG, 1);
    this.tabYouLabel = this.add.text(panelX + panelW * 0.25, tabY, 'You', {
      fontSize: '13px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5);
    this.tabYou.setInteractive({ useHandCursor: true });
    this.tabYou.on('pointerdown', () => this._switchTab('player'));

    this.tabAgent = this.add.rectangle(panelX + panelW * 0.75, tabY, tabW, 26,
      this.viewEntity === 'agent' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG, 1);
    this.tabAgentLabel = this.add.text(panelX + panelW * 0.75, tabY, 'Agent', {
      fontSize: '13px', fontFamily: 'monospace', color: this.gameScene.agent ? '#F5E6C8' : '#555566',
    }).setOrigin(0.5);
    this.tabAgent.setInteractive({ useHandCursor: true });
    this.tabAgent.on('pointerdown', () => {
      if (!this.gameScene.agent) return;
      this._switchTab('agent');
    });
  }

  _switchTab(target) {
    this.viewEntity = target;
    this.tabYou.fillColor = target === 'player' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG;
    this.tabAgent.fillColor = target === 'agent' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG;
    this._closeTooltip();
    this._buildContent();
  }

  _getEntity() {
    return this.viewEntity === 'player' ? this.gameScene.player : this.gameScene.agent;
  }

  _buildContent() {
    // Destroy old content
    if (this._contentGroup) {
      this._contentGroup.forEach(obj => { if (obj && obj.active) obj.destroy(); });
    }
    this._contentGroup = [];

    const entity = this._getEntity();
    if (!entity) return;

    const cx = this.panelX + this.panelW / 2;
    const topY = this.panelY + 68;

    // Entity name and level (right side)
    const nameX = this.panelX + this.panelW * 0.72;
    this._add(this.add.text(nameX, topY + 5, `${this.viewEntity === 'player' ? 'You' : 'Agent'}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0));
    this._add(this.add.text(nameX, topY + 24, `Lv. ${entity.stats.level}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
    }).setOrigin(0.5, 0));

    // Effective stats
    const { atk, def, maxHp, bonusAtk, bonusDef, bonusMaxHp } = this._computeEffective(entity);
    const statsY = topY + 44;
    const statTexts = [
      `ATK: ${atk}${bonusAtk > 0 ? ` (+${bonusAtk})` : ''}`,
      `DEF: ${def}${bonusDef > 0 ? ` (+${bonusDef})` : ''}`,
      `HP:  ${entity.stats.hp}/${maxHp}${bonusMaxHp > 0 ? ` (+${bonusMaxHp})` : ''}`,
    ];
    statTexts.forEach((s, i) => {
      this._add(this.add.text(nameX, statsY + i * 16, s, {
        fontSize: '11px', fontFamily: 'monospace', color: '#AADDAA',
      }).setOrigin(0.5, 0));
    });

    // Power score
    const buffs = this.gameScene.activeBuffs || [];
    const entityBuffs = this.viewEntity === 'player' ? buffs : [];
    const powerScore = calculatePowerScore(entity, entityBuffs);
    const basePowerScore = entityBuffs.length > 0 ? calculatePowerScore(entity, []) : powerScore;
    const buffContrib = powerScore - basePowerScore;

    const psY = statsY + 3 * 16 + 4;
    const psText = buffContrib > 0
      ? `⚔️ Power: ${powerScore} (+${buffContrib} from buffs)`
      : `⚔️ Power: ${powerScore}`;
    this._add(this.add.text(nameX, psY, psText, {
      fontSize: '13px', fontFamily: 'monospace', color: '#DAA520',
    }).setOrigin(0.5, 0));

    // Equipment slots layout
    const slotLayoutX = this.panelX + this.panelW * 0.28;
    const slotDefs = [
      { slot: 'helmet',    x: cx - this.panelW * 0.22, y: topY + 8 },
      { slot: 'weapon',    x: cx - this.panelW * 0.38, y: topY + 72 },
      { slot: 'accessory', x: cx - this.panelW * 0.06, y: topY + 72 },
      { slot: 'chest',     x: cx - this.panelW * 0.22, y: topY + 136 },
      { slot: 'boots',     x: cx - this.panelW * 0.22, y: topY + 200 },
    ];

    this.slotObjects = {};
    slotDefs.forEach(({ slot, x, y }) => {
      this._buildSlot(slot, x, y, entity);
    });

    // Divider
    const divY = topY + 262;
    this._add(this.add.rectangle(this.panelX + this.panelW / 2, divY, this.panelW - 20, 1, 0x555577, 1));
    this._add(this.add.text(this.panelX + 12, divY + 6, 'Gear Stash', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888899',
    }));

    // Gear grid
    this._buildGearGrid(divY + 22);

    // Agent config section (agent tab only)
    if (this.viewEntity === 'agent' && this.gameScene.agent) {
      this._buildAgentConfig(divY + 22);
    }
  }

  _computeEffective(entity) {
    const base = { maxHp: entity.stats.maxHp, atk: entity.stats.atk, def: entity.stats.def };
    const bonus = { maxHp: 0, atk: 0, def: 0 };
    for (const slot of Object.values(entity.equipment || {})) {
      if (slot) {
        for (const [stat, val] of Object.entries(slot.stats)) {
          if (bonus[stat] !== undefined) bonus[stat] += val;
        }
      }
    }
    return {
      atk: base.atk + bonus.atk,
      def: base.def + bonus.def,
      maxHp: base.maxHp + bonus.maxHp,
      bonusAtk: bonus.atk,
      bonusDef: bonus.def,
      bonusMaxHp: bonus.maxHp,
    };
  }

  _buildSlot(slot, x, y, entity) {
    const equipped = entity.equipment ? entity.equipment[slot] : null;
    const borderColor = equipped ? equipped.rarityColor : 0x444466;
    const bg = this.add.rectangle(x, y, SLOT_SIZE, SLOT_SIZE, 0x1A1A2E, 1);
    bg.setStrokeStyle(equipped ? 2 : 1, borderColor);
    this._add(bg);

    if (equipped) {
      const label = this.add.text(x, y, equipped.icon, {
        fontSize: '20px',
      }).setOrigin(0.5);
      this._add(label);

      // Rarity dot
      const dot = this.add.circle(x + SLOT_SIZE / 2 - 5, y - SLOT_SIZE / 2 + 5, 4, equipped.rarityColor);
      this._add(dot);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this._showSlotTooltip(slot, equipped, x, y));
    } else {
      const slotLabel = this.add.text(x, y, slot.toUpperCase().slice(0, 4), {
        fontSize: '9px', fontFamily: 'monospace', color: '#444466',
      }).setOrigin(0.5);
      this._add(slotLabel);
    }

    this.slotObjects[slot] = { bg, x, y };
  }

  _buildGearGrid(startY) {
    this.gridCells.forEach(obj => { if (obj && obj.active) obj.destroy(); });
    this.gridCells = [];

    const gearStash = this.gameScene.lootSystem.gearStash;
    const unequipped = gearStash.filter(g => !g.equippedBy);
    const colW = (this.panelW - 20) / GRID_COLS;
    const baseX = this.panelX + 10;

    unequipped.forEach((gear, i) => {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const cx = baseX + col * colW + colW / 2;
      const cy = startY + row * (CELL_SIZE + 6) + CELL_SIZE / 2;

      if (cy > this.panelY + this.panelH - 10) return; // clip to panel

      const bg = this.add.rectangle(cx, cy, CELL_SIZE, CELL_SIZE, 0x1E1E2E, 1);
      bg.setStrokeStyle(1, gear.rarityColor);
      this.gridCells.push(bg);

      const icon = this.add.text(cx, cy - 4, gear.icon, { fontSize: '18px' }).setOrigin(0.5);
      this.gridCells.push(icon);

      // Rarity indicator dot
      const dot = this.add.circle(cx + CELL_SIZE / 2 - 5, cy - CELL_SIZE / 2 + 5, 4, gear.rarityColor);
      this.gridCells.push(dot);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this._showGearTooltip(gear, cx, cy));
    });

    if (unequipped.length === 0) {
      const t = this.add.text(this.panelX + this.panelW / 2, startY + 20, 'No gear in stash', {
        fontSize: '12px', fontFamily: 'monospace', color: '#555566',
      }).setOrigin(0.5, 0);
      this.gridCells.push(t);
    }
  }

  _buildAgentConfig(gearGridStartY) {
    const agent = this.gameScene.agent;
    const config = agent.config;
    const baseX = this.panelX + 10;
    // Position below gear grid area
    let curY = gearGridStartY + 120;

    // Divider
    this._add(this.add.rectangle(this.panelX + this.panelW / 2, curY, this.panelW - 20, 1, 0x555577, 1));
    curY += 10;

    this._add(this.add.text(baseX, curY, 'Agent Config', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888899',
    }));
    curY += 18;

    // Zone preference
    this._add(this.add.text(baseX, curY, 'Zone:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#AABBCC',
    }));
    const zones = ['auto', 'forest', 'caves', 'swamp', 'volcanic'];
    const zoneLabels = ['Auto', 'Forest', 'Caves', 'Swamp', 'Volcanic'];
    let zoneX = baseX + 42;
    zones.forEach((z, i) => {
      const isActive = config.zonePreference === z;
      const btn = this._add(this.add.text(zoneX, curY, zoneLabels[i], {
        fontSize: '10px', fontFamily: 'monospace',
        color: isActive ? '#88FF88' : '#888899',
        backgroundColor: isActive ? '#2A5A2A' : '#1A1A2E',
        padding: { x: 4, y: 2 },
      }));
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        config.zonePreference = z;
        this._buildContent();
      });
      zoneX += btn.width + 4;
    });
    curY += 22;

    // Retreat threshold
    this._add(this.add.text(baseX, curY, 'Retreat:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#AABBCC',
    }));
    const thresholds = [0.10, 0.25, 0.40, 0.50];
    const threshLabels = ['10%', '25%', '40%', '50%'];
    let threshX = baseX + 56;
    thresholds.forEach((t, i) => {
      const isActive = config.retreatThreshold === t;
      const btn = this._add(this.add.text(threshX, curY, threshLabels[i], {
        fontSize: '10px', fontFamily: 'monospace',
        color: isActive ? '#88FF88' : '#888899',
        backgroundColor: isActive ? '#2A5A2A' : '#1A1A2E',
        padding: { x: 4, y: 2 },
      }));
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        config.retreatThreshold = t;
        this._buildContent();
      });
      threshX += btn.width + 4;
    });
    curY += 24;

    // Session stats
    this._add(this.add.rectangle(this.panelX + this.panelW / 2, curY, this.panelW - 20, 1, 0x333355, 1));
    curY += 8;
    const ss = agent.sessionStats || {};
    const statLines = [
      `Kills: ${ss.kills || 0}  Gold: ${ss.goldEarned || 0}  Gear: ${ss.gearFound || 0}`,
      `Deaths: ${ss.deaths || 0}  Trips: ${ss.tripsCompleted || 0}`,
    ];
    statLines.forEach((line) => {
      this._add(this.add.text(baseX, curY, line, {
        fontSize: '10px', fontFamily: 'monospace', color: '#8888AA',
      }));
      curY += 14;
    });
  }

  _simulateEquip(entity, gear) {
    const simEquipment = { ...entity.equipment };
    simEquipment[gear.slot] = gear;
    return {
      stats: { ...entity.stats },
      equipment: simEquipment,
    };
  }

  _showSlotTooltip(slot, equipped, slotX, slotY) {
    this._closeTooltip();
    const entity = this._getEntity();
    const tw = 200;
    const th = 100;
    let tx = slotX + SLOT_SIZE / 2 + 8;
    let ty = slotY - SLOT_SIZE / 2;
    if (tx + tw > this.panelX + this.panelW) tx = slotX - SLOT_SIZE / 2 - tw - 8;

    this.tooltip = this._makeTooltip(tx, ty, tw, th + 30);

    const statsStr = Object.entries(equipped.stats).map(([k, v]) => `${k}: +${v}`).join('\n');
    const rarityColor = '#' + equipped.rarityColor.toString(16).padStart(6, '0');
    this._addTooltipText(tx + 8, ty + 8, equipped.name, rarityColor, '12px');
    this._addTooltipText(tx + 8, ty + 26, statsStr, '#AADDAA', '11px');

    const unequipBtn = this.add.text(tx + tw / 2, ty + th, '[Unequip]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#FF9999',
      backgroundColor: '#2A2A3E', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0);
    unequipBtn.setInteractive({ useHandCursor: true });
    unequipBtn.on('pointerdown', () => {
      entity.unequip(slot);
      this._closeTooltip();
      this._buildContent();
    });
    this.tooltip.push(unequipBtn);
    this._contentGroup.push(unequipBtn);
  }

  _showGearTooltip(gear, gx, gy) {
    this._closeTooltip();
    const entity = this._getEntity();
    const currentEquipped = entity.equipment ? entity.equipment[gear.slot] : null;
    const tw = Math.min(220, this.panelW - 20);
    let tx = gx + CELL_SIZE / 2 + 8;
    let ty = gy - CELL_SIZE / 2;
    if (tx + tw > this.panelX + this.panelW) tx = gx - CELL_SIZE / 2 - tw - 8;
    if (tx < this.panelX + 4) tx = this.panelX + 4;

    const th = currentEquipped ? 185 : 140;
    this.tooltip = this._makeTooltip(tx, ty, tw, th);

    const rarityColor = '#' + gear.rarityColor.toString(16).padStart(6, '0');
    this._addTooltipText(tx + 8, ty + 8, gear.name, rarityColor, '12px');

    const statsStr = Object.entries(gear.stats).map(([k, v]) => `${k.toUpperCase()}: +${v}`).join('  ');
    this._addTooltipText(tx + 8, ty + 26, statsStr, '#AADDAA', '11px');

    let compareY = ty + 46;
    if (currentEquipped) {
      this._addTooltipText(tx + 8, compareY, '─ Equipped ─', '#888899', '10px');
      compareY += 14;
      const curColor = '#' + currentEquipped.rarityColor.toString(16).padStart(6, '0');
      this._addTooltipText(tx + 8, compareY, currentEquipped.name, curColor, '11px');
      compareY += 14;
      const curStats = Object.entries(currentEquipped.stats).map(([k, v]) => `${k.toUpperCase()}: +${v}`).join('  ');
      this._addTooltipText(tx + 8, compareY, curStats, '#AAAAAA', '10px');
      compareY += 18;
    }

    // Power score delta
    const psBuf = this.gameScene.activeBuffs || [];
    const psEntityBuf = this.viewEntity === 'player' ? psBuf : [];
    const currentPS = calculatePowerScore(entity, psEntityBuf);
    const simEntity = this._simulateEquip(entity, gear);
    const newPS = calculatePowerScore(simEntity, psEntityBuf);
    const delta = newPS - currentPS;
    const deltaStr = delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '=';
    const deltaColor = delta > 0 ? '#4CAF50' : delta < 0 ? '#F44336' : '#888888';
    this._addTooltipText(tx + 8, compareY, `Power: ${currentPS} → ${newPS} (${deltaStr})`, deltaColor, '10px');
    compareY += 16;

    // EQUIP button
    const equipBtn = this.add.text(tx + tw * 0.28, compareY + 4, '[EQUIP]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#88FF88',
      backgroundColor: '#1A3A1A', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0);
    equipBtn.setInteractive({ useHandCursor: true });
    equipBtn.on('pointerdown', () => {
      entity.equip(gear.slot, gear);
      this._closeTooltip();
      this._buildContent();
    });
    this.tooltip.push(equipBtn);
    this._contentGroup.push(equipBtn);

    // SELL button
    const sellBtn = this.add.text(tx + tw * 0.72, compareY + 4, `[SELL ${gear.sellValue}g]`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
      backgroundColor: '#2A1A00', padding: { x: 6, y: 4 },
    }).setOrigin(0.5, 0);
    sellBtn.setInteractive({ useHandCursor: true });
    sellBtn.on('pointerdown', () => {
      this.gameScene.lootSystem.sellGear(gear.uid);
      this._closeTooltip();
      this._buildContent();
    });
    this.tooltip.push(sellBtn);
    this._contentGroup.push(sellBtn);
  }

  _makeTooltip(x, y, w, h) {
    const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0D0D1A, 0.97);
    bg.setStrokeStyle(1, 0x555577);
    this._contentGroup.push(bg);
    return [bg];
  }

  _addTooltipText(x, y, text, color, fontSize) {
    const t = this.add.text(x, y, text, {
      fontSize, fontFamily: 'monospace', color, wordWrap: { width: 200 },
    });
    this._contentGroup.push(t);
    if (this.tooltip) this.tooltip.push(t);
  }

  _closeTooltip() {
    if (this.tooltip) {
      this.tooltip.forEach(obj => {
        if (obj && obj.active) obj.destroy();
      });
      this.tooltip = null;
    }
  }

  _add(obj) {
    if (!this._contentGroup) this._contentGroup = [];
    this._contentGroup.push(obj);
    return obj;
  }

  _onEquipmentChanged() {
    this._buildContent();
  }

  _onGearStashChanged() {
    this._buildContent();
  }

  _close() {
    this.gameScene.events.off('equipmentChanged', this._onEquipmentChanged, this);
    this.gameScene.events.off('gearStashChanged', this._onGearStashChanged, this);
    this.tweens.add({
      targets: this.panel,
      y: this.scale.height,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => this.scene.stop(),
    });
  }
}
