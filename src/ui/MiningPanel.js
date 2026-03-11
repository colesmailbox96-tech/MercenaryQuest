import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { MINING_NODES } from '../config/oreData.js';
import { ITEMS } from '../config/itemData.js';

export class MiningPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'MiningPanel' });
  }

  init(data) {
    this.nodeKey = data.nodeKey || null;
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.miningSystem = this.gameScene.miningSystem;

    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = Math.min(w - 20, 370);
    const panelH = Math.min(h * 0.85, h - 40);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;

    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.closePanel());

    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.92);
    this.panel.setStrokeStyle(2, COLORS.UI_GOLD, 0.6);
    this.panel.setInteractive();

    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 300, ease: 'Power2' });

    this.titleText = this.add.text(w / 2, panelY + 12, '⛏️ Mining', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.closeBtn = this.add.text(panelX + panelW - 12, panelY + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-24, -24, 48, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.closeBtn.on('pointerdown', () => this.closePanel());
    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#FF6B6B'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#F5E6C8'));

    this.contentElements = [];
    this._renderContent();
  }

  _clearContent() {
    this.contentElements.forEach(el => { if (el && el.active) el.destroy(); });
    this.contentElements = [];
  }

  _renderContent() {
    this._clearContent();
    const { panelX, panelY, panelW } = this;
    const w = this.scale.width;
    const playerLevel = this.gameScene.player.stats.level;
    const nodeDef = MINING_NODES[this.nodeKey];
    if (!nodeDef) return;

    const nodeState = this.miningSystem.getNodeState(this.nodeKey);
    const isActiveOnThis = this.miningSystem.active && this.miningSystem.activeNodeKey === this.nodeKey;
    const isActiveOnOther = this.miningSystem.active && this.miningSystem.activeNodeKey !== this.nodeKey;
    let yOff = panelY + 40;

    const nameText = this.add.text(w / 2, yOff, `⛰️ ${nodeDef.name}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0);
    this.contentElements.push(nameText);
    yOff += 20;

    const zoneText = this.add.text(w / 2, yOff, `Zone: ${nodeDef.zone.charAt(0).toUpperCase() + nodeDef.zone.slice(1)}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#AAAAAA',
    }).setOrigin(0.5, 0);
    this.contentElements.push(zoneText);
    yOff += 18;

    const extractLeft = nodeDef.maxExtractions - (isActiveOnThis ? this.miningSystem.extractionCount : 0);
    const extractText = this.add.text(w / 2, yOff, `Extractions remaining: ${extractLeft}/${nodeDef.maxExtractions}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#AAAAAA',
    }).setOrigin(0.5, 0);
    this.contentElements.push(extractText);
    yOff += 18;

    const infoText = this.add.text(w / 2, yOff, `~${nodeDef.cycleDuration / 1000}s per extraction · ${Math.round(nodeDef.extractChance * 100)}% chance`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5, 0);
    this.contentElements.push(infoText);
    yOff += 24;

    const yieldLabel = this.add.text(panelX + 16, yOff, 'Possible yields:', {
      fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
    });
    this.contentElements.push(yieldLabel);
    yOff += 18;

    const yieldItems = nodeDef.yields.map(y => {
      const item = ITEMS[y.id];
      return `${item.emoji} ${item.name}`;
    }).join('  ·  ');
    const yieldText = this.add.text(panelX + 16, yOff, yieldItems, {
      fontSize: '11px', fontFamily: 'monospace', color: '#F5E6C8',
      wordWrap: { width: panelW - 32 },
    });
    this.contentElements.push(yieldText);
    yOff += yieldText.height + 16;

    if (nodeState.state === 'depleted') {
      const depText = this.add.text(w / 2, yOff, 'Depleted — Respawning...', {
        fontSize: '13px', fontFamily: 'monospace', color: '#FF6666',
      }).setOrigin(0.5, 0);
      this.contentElements.push(depText);
      yOff += 28;
    } else if (isActiveOnThis) {
      const status = this.miningSystem.getStatus();
      const statusText = this.add.text(w / 2, yOff, `Mining in progress... (${status.extractionsLeft} left)`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#88CC88',
      }).setOrigin(0.5, 0);
      this.contentElements.push(statusText);
      yOff += 24;

      const stopBtn = this.add.text(w / 2, yOff, '[ 🛑 Stop Mining ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#FF6666',
        backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      stopBtn.on('pointerdown', () => {
        this.miningSystem.stop();
        this._renderContent();
      });
      this.contentElements.push(stopBtn);
      yOff += 36;
    } else if (isActiveOnOther) {
      const otherNode = this.miningSystem.activeNodeDef?.name || 'another node';
      const msgText = this.add.text(w / 2, yOff, `Already mining ${otherNode}.\nStop current mining first.`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#FFAA44',
        align: 'center',
      }).setOrigin(0.5, 0);
      this.contentElements.push(msgText);
      yOff += 36;
    } else {
      const miningLevel = this.gameScene.skillSystem
        ? this.gameScene.skillSystem.getLevel('mining')
        : 1;
      const requiredSkillLevel = nodeDef.requiredSkillLevel || nodeDef.requiredLevel || 1;
      if (miningLevel < requiredSkillLevel) {
        const lvlText = this.add.text(w / 2, yOff, `Requires Mining Lv.${requiredSkillLevel}`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#FF6666',
        }).setOrigin(0.5, 0);
        this.contentElements.push(lvlText);
        yOff += 28;
      } else {
        const startBtn = this.add.text(w / 2, yOff, '[ ⛏️ Start Mining ]', {
          fontSize: '14px', fontFamily: 'monospace', color: '#FFBB66',
          backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        startBtn.on('pointerdown', () => {
          this.miningSystem.start(this.nodeKey);
          this.closePanel();
        });
        this.contentElements.push(startBtn);
        yOff += 36;
      }
    }

    const pending = this.miningSystem.pendingOres;
    if (pending.length > 0) {
      yOff += 4;
      const divider = this.add.text(w / 2, yOff, '── Uncollected Ores ──', {
        fontSize: '11px', fontFamily: 'monospace', color: '#888888',
      }).setOrigin(0.5, 0);
      this.contentElements.push(divider);
      yOff += 20;

      const oreStr = pending.map(o => `${o.emoji}×${o.quantity}`).join('  ');
      const oreDisplay = this.add.text(w / 2, yOff, oreStr, {
        fontSize: '13px', fontFamily: 'monospace', color: '#F5E6C8',
      }).setOrigin(0.5, 0);
      this.contentElements.push(oreDisplay);
      yOff += 24;

      const collectBtn = this.add.text(w / 2, yOff, '[ Collect All ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#DAA520',
        backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      collectBtn.on('pointerdown', () => {
        const collected = this.miningSystem.collectAll(this.gameScene.lootSystem);
        for (const item of collected) {
          this.gameScene.scene.get('HUDScene')?.lootToast?.showMaterial(item);
        }
        this._renderContent();
      });
      this.contentElements.push(collectBtn);
    }
  }

  closePanel() {
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
