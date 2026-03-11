import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { FISHING_POOLS } from '../config/fishData.js';
import { ITEMS } from '../config/itemData.js';

export class FishingPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'FishingPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.fishingSystem = this.gameScene.fishingSystem;
    this.selectedPoolKey = null;

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

    this.titleText = this.add.text(w / 2, panelY + 12, '🎣 Fishing', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.closeBtn = this.add.text(panelX + panelW - 12, panelY + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-22, -22, 44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.closeBtn.on('pointerdown', () => this.closePanel());

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
    const isActive = this.fishingSystem.active;
    let yOff = panelY + 40;

    if (isActive) {
      const status = this.fishingSystem.getStatus();
      const statusText = this.add.text(w / 2, yOff, `Currently fishing: ${status.pool}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#88CC88',
      }).setOrigin(0.5, 0);
      this.contentElements.push(statusText);
      yOff += 24;

      const cycleText = this.add.text(w / 2, yOff, `Cycles completed: ${status.cycleCount}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#AAAAAA',
      }).setOrigin(0.5, 0);
      this.contentElements.push(cycleText);
      yOff += 24;

      const stopBtn = this.add.text(w / 2, yOff, '[ 🛑 Stop Fishing ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#FF6666',
        backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      stopBtn.on('pointerdown', () => {
        this.fishingSystem.stop();
        this._renderContent();
      });
      this.contentElements.push(stopBtn);
      yOff += 40;
    } else {
      const poolLabel = this.add.text(panelX + 16, yOff, 'Available Pools:', {
        fontSize: '13px', fontFamily: 'monospace', color: '#F5E6C8',
      });
      this.contentElements.push(poolLabel);
      yOff += 22;

      const fishingLevel = this.gameScene.skillSystem
        ? this.gameScene.skillSystem.getLevel('fishing')
        : 1;

      for (const [key, pool] of Object.entries(FISHING_POOLS)) {
        const meetsLevel = fishingLevel >= (pool.requiredSkillLevel || pool.requiredLevel || 1);
        const isSelected = this.selectedPoolKey === key;
        const color = !meetsLevel ? '#555555' : (isSelected ? '#88CCFF' : '#F5E6C8');
        const levelNote = (pool.requiredSkillLevel || pool.requiredLevel || 0) > 1
          ? ` (Fishing Lv.${pool.requiredSkillLevel || pool.requiredLevel}+)` : '';
        const timeStr = `~${pool.cycleDuration / 1000}s per catch · ${Math.round(pool.catchChance * 100)}% chance`;

        const poolBg = this.add.rectangle(w / 2, yOff + 18, panelW - 32, 38,
          isSelected ? 0x3A3A5E : 0x2A2A3E, 1);
        if (meetsLevel) {
          poolBg.setInteractive({ useHandCursor: true });
          poolBg.on('pointerdown', () => {
            this.selectedPoolKey = key;
            this._renderContent();
          });
        }
        this.contentElements.push(poolBg);

        const poolName = this.add.text(panelX + 24, yOff + 8, `🌊 ${pool.name}${levelNote}`, {
          fontSize: '12px', fontFamily: 'monospace', color,
        });
        this.contentElements.push(poolName);

        const poolInfo = this.add.text(panelX + 24, yOff + 22, timeStr, {
          fontSize: '10px', fontFamily: 'monospace', color: meetsLevel ? '#AAAAAA' : '#444444',
        });
        this.contentElements.push(poolInfo);

        yOff += 44;
      }

      if (this.selectedPoolKey) {
        const pool = FISHING_POOLS[this.selectedPoolKey];
        yOff += 4;
        const catchLabel = this.add.text(panelX + 16, yOff, 'Possible catches:', {
          fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
        });
        this.contentElements.push(catchLabel);
        yOff += 18;

        const catchItems = pool.catches.map(c => {
          const item = ITEMS[c.id];
          return `${item.emoji} ${item.name}`;
        }).join('  ·  ');
        const catchText = this.add.text(panelX + 16, yOff, catchItems, {
          fontSize: '11px', fontFamily: 'monospace', color: '#F5E6C8',
          wordWrap: { width: panelW - 32 },
        });
        this.contentElements.push(catchText);
        yOff += catchText.height + 12;

        const startBtn = this.add.text(w / 2, yOff, '[ 🎣 Start Fishing ]', {
          fontSize: '14px', fontFamily: 'monospace', color: '#88CCFF',
          backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        startBtn.on('pointerdown', () => {
          this.fishingSystem.start(this.selectedPoolKey);
          this.closePanel();
        });
        this.contentElements.push(startBtn);
        yOff += 36;
      }
    }

    const pending = this.fishingSystem.pendingCatches;
    if (pending.length > 0) {
      yOff += 8;
      const divider = this.add.text(w / 2, yOff, '── Uncollected Catches ──', {
        fontSize: '11px', fontFamily: 'monospace', color: '#888888',
      }).setOrigin(0.5, 0);
      this.contentElements.push(divider);
      yOff += 20;

      const catchStr = pending.map(c => `${c.emoji}×${c.quantity}`).join('  ');
      const catchDisplay = this.add.text(w / 2, yOff, catchStr, {
        fontSize: '13px', fontFamily: 'monospace', color: '#F5E6C8',
      }).setOrigin(0.5, 0);
      this.contentElements.push(catchDisplay);
      yOff += 24;

      const collectBtn = this.add.text(w / 2, yOff, '[ Collect All ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#DAA520',
        backgroundColor: '#2A2A3E', padding: { x: 12, y: 6 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      collectBtn.on('pointerdown', () => {
        const collected = this.fishingSystem.collectAll(this.gameScene.lootSystem);
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
