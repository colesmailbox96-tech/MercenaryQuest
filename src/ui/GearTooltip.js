import { RARITY } from '../config/gearData.js';
import { calculatePowerScore } from '../systems/StatCalculator.js';

export class GearTooltip {
  constructor(scene, gameScene) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.elements = [];
  }

  show(gear, screenX, screenY, options = {}) {
    this.hide();
    const { mode = 'inventory' } = options;
    const player = this.gameScene.player;
    const currentEquipped = player.equipment ? player.equipment[gear.slot] : null;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const tw = Math.min(260, w * 0.85);
    let tx = Math.min(screenX, w - tw - 10);
    tx = Math.max(10, tx);
    let ty = screenY;

    let contentHeight = 170;
    if (currentEquipped) contentHeight += 50;
    if (ty + contentHeight > h - 20) ty = h - contentHeight - 20;
    ty = Math.max(10, ty);

    const bg = this.scene.add.rectangle(tx + tw / 2, ty + contentHeight / 2, tw, contentHeight, 0x0D0D1A, 0.97);
    bg.setStrokeStyle(1, 0x555577);
    bg.setDepth(600);
    bg.setScrollFactor(0);
    this.elements.push(bg);

    const closeBtn = this.scene.add.text(tx + tw - 10, ty + 4, '✕', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(601);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.elements.push(closeBtn);

    let curY = ty + 8;
    const lx = tx + 10;

    const rarityDef = RARITY[gear.rarity];
    const rarityColor = '#' + (gear.rarityColor || rarityDef?.color || 0xAAAAAA).toString(16).padStart(6, '0');
    const rarityName = rarityDef?.name || gear.rarity;
    this._addText(lx, curY, gear.name, rarityColor, '13px', 'bold');
    curY += 16;

    this._addText(lx, curY, `${gear.slot.charAt(0).toUpperCase() + gear.slot.slice(1)} · ${rarityName}`, '#888899', '10px');
    curY += 14;

    this._addText(lx, curY, '──────────────────', '#444466', '9px');
    curY += 12;

    const stats = ['atk', 'def', 'maxHp'];
    const statLabels = { atk: 'ATK', def: 'DEF', maxHp: 'HP' };
    for (const stat of stats) {
      const newVal = gear.stats[stat] || 0;
      const curVal = currentEquipped ? (currentEquipped.stats[stat] || 0) : 0;
      const delta = newVal - curVal;
      let deltaStr, deltaColor;
      if (delta > 0) {
        deltaStr = `(+${delta} ▲)`;
        deltaColor = '#4CAF50';
      } else if (delta < 0) {
        deltaStr = `(${delta} ▼)`;
        deltaColor = '#FF6B6B';
      } else {
        deltaStr = '(—)';
        deltaColor = '#AAAAAA';
      }
      const label = `${statLabels[stat]}: ${newVal}   ${deltaStr}`;
      this._addText(lx, curY, label, deltaColor, '11px');
      curY += 14;
    }

    this._addText(lx, curY, '──────────────────', '#444466', '9px');
    curY += 12;

    const buffs = this.gameScene.activeBuffs || [];
    const currentPS = calculatePowerScore(player, buffs);
    const simEquipment = { ...player.equipment };
    simEquipment[gear.slot] = gear;
    const simEntity = { stats: { ...player.stats }, equipment: simEquipment };
    const newPS = calculatePowerScore(simEntity, buffs);
    const psDelta = newPS - currentPS;
    let psStr, psColor;
    if (psDelta > 0) {
      psStr = `Power: ${newPS}  (+${psDelta} ▲)`;
      psColor = '#4CAF50';
    } else if (psDelta < 0) {
      psStr = `Power: ${newPS}  (${psDelta} ▼)`;
      psColor = '#FF6B6B';
    } else {
      psStr = `Power: ${newPS}  (—)`;
      psColor = '#AAAAAA';
    }
    this._addText(lx, curY, psStr, psColor, '11px');
    curY += 14;

    this._addText(lx, curY, '──────────────────', '#444466', '9px');
    curY += 12;

    if (currentEquipped) {
      const curRarColor = '#' + (currentEquipped.rarityColor || 0xAAAAAA).toString(16).padStart(6, '0');
      const curRarName = RARITY[currentEquipped.rarity]?.name || '';
      this._addText(lx, curY, 'Currently equipped:', '#888899', '9px');
      curY += 12;
      this._addText(lx, curY, `${currentEquipped.name} (${curRarName})`, curRarColor, '10px');
      curY += 12;
      const curStatsStr = stats.map(s => `${statLabels[s]}: ${currentEquipped.stats[s] || 0}`).join('  ');
      this._addText(lx, curY, curStatsStr, '#AAAAAA', '9px');
      curY += 14;
    } else {
      this._addText(lx, curY, 'No gear equipped', '#888899', '10px');
      curY += 14;
    }

    this._addText(lx, curY, '──────────────────', '#444466', '9px');
    curY += 14;

    if (mode === 'inventory') {
      const equipBtn = this.scene.add.text(tx + tw * 0.3, curY, '[ Equip ]', {
        fontSize: '12px', fontFamily: 'monospace', color: '#88FF88',
        backgroundColor: '#1A3A1A', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(601);
      equipBtn.setInteractive({ useHandCursor: true });
      equipBtn.on('pointerdown', () => {
        player.equip(gear.slot, gear);
        this.hide();
        if (this._onAction) this._onAction();
      });
      this.elements.push(equipBtn);

      const sellBtn = this.scene.add.text(tx + tw * 0.7, curY, `[ Sell: ${gear.sellValue}g ]`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        backgroundColor: '#2A1A00', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(601);
      sellBtn.setInteractive({ useHandCursor: true });
      sellBtn.on('pointerdown', () => {
        this.gameScene.lootSystem.sellGear(gear.uid);
        this.hide();
        if (this._onAction) this._onAction();
      });
      this.elements.push(sellBtn);
    } else if (mode === 'equipped') {
      const unequipBtn = this.scene.add.text(tx + tw / 2, curY, '[ Unequip ]', {
        fontSize: '12px', fontFamily: 'monospace', color: '#FF9999',
        backgroundColor: '#2A2A3E', padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(601);
      unequipBtn.setInteractive({ useHandCursor: true });
      unequipBtn.on('pointerdown', () => {
        const entity = options.entity || player;
        entity.unequip(gear.slot);
        this.hide();
        if (this._onAction) this._onAction();
      });
      this.elements.push(unequipBtn);
    }
  }

  onAction(callback) {
    this._onAction = callback;
  }

  _addText(x, y, text, color, fontSize, fontStyle) {
    const t = this.scene.add.text(x, y, text, {
      fontSize, fontFamily: 'monospace', color,
      fontStyle: fontStyle || '',
      wordWrap: { width: 240 },
    }).setScrollFactor(0).setDepth(601);
    this.elements.push(t);
    return t;
  }

  hide() {
    for (const el of this.elements) {
      if (el && el.active) el.destroy();
    }
    this.elements = [];
  }

  isVisible() {
    return this.elements.length > 0;
  }
}
