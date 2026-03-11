import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { SEEDS } from '../config/farmData.js';

export class FarmingPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmingPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.selectedPlot = null;
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
    this.backdrop.on('pointerdown', () => this.scene.stop());

    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.92);
    this.panel.setStrokeStyle(2, COLORS.UI_GOLD, 0.6);
    this.panel.setInteractive();
    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 250, ease: 'Power2' });

    this.elements = [];
    this._render();

    // Refresh every second for countdown timers
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => this._render(),
      loop: true,
    });
    this.events.once('shutdown', () => {
      if (this._timerEvent) this._timerEvent.remove();
    });

    // Refresh on plot state changes
    this.gameScene.events.on('plotStateChanged', this._render, this);
    this.events.once('shutdown', () => {
      this.gameScene.events.off('plotStateChanged', this._render, this);
    });
  }

  _clearElements() {
    this.elements.forEach(e => e.destroy && e.destroy());
    this.elements = [];
  }

  _render() {
    this._clearElements();
    const { panelX, panelY, panelW } = this;
    const w = this.scale.width;
    const farmSys = this.gameScene.farmingSystem;
    const skillSys = this.gameScene.skillSystem;

    // Title
    const title = this.add.text(w / 2, panelY + 14, '🌾 Farm', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.elements.push(title);

    const closeBtn = this.add.text(panelX + panelW - 12, panelY + 12, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-22, -22, 44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    closeBtn.on('pointerdown', () => this.scene.stop());
    this.elements.push(closeBtn);

    // Header separator
    this.elements.push(
      this.add.rectangle(w / 2, panelY + 40, panelW - 24, 1, COLORS.UI_GOLD, 0.3)
    );

    // Skill info
    const farmLevel = skillSys.getLevel('farming');
    const prog = skillSys.getSkillProgress('farming');
    const xpStr = prog.isMax ? 'MAX' : `${prog.progressXP}/${prog.neededXP} XP`;
    const infoText = this.add.text(panelX + 12, panelY + 46,
      `Farm Level: ${farmLevel}  (${xpStr})   Plots: ${farmSys.maxPlots}`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
    });
    this.elements.push(infoText);

    let y = panelY + 64;

    // Plot grid (up to 9 plots in 3-column grid)
    const cellSize = 46;
    const cellPad = 6;
    const cols = 3;
    const gridW = cols * (cellSize + cellPad) - cellPad;
    const gridStartX = panelX + (panelW - gridW) / 2;

    for (let i = 0; i < farmSys.maxPlots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gridStartX + col * (cellSize + cellPad) + cellSize / 2;
      const cy = y + row * (cellSize + cellPad) + cellSize / 2;

      const status = farmSys.getPlotStatus(i);
      const isSelected = this.selectedPlot === i;
      const bgColor = status.state === 'ready'
        ? 0x1B5E20
        : isSelected
          ? 0x1A3A5E
          : 0x2A2A3E;

      const cell = this.add.rectangle(cx, cy, cellSize, cellSize, bgColor, 0.9);
      this.elements.push(cell);

      if (status.state === 'empty') {
        const label = this.add.text(cx, cy, 'EMPTY', {
          fontSize: '9px', fontFamily: 'monospace', color: '#666666',
        }).setOrigin(0.5);
        this.elements.push(label);

        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => {
          this.selectedPlot = i;
          this._render();
        });
      } else if (status.state === 'ready') {
        const seedDef = SEEDS[farmSys.plots[i].seedId];
        const cropIcon = seedDef ? seedDef.icon : '🌾';
        const icon = this.add.text(cx, cy - 8, cropIcon, { fontSize: '18px' }).setOrigin(0.5);
        const lbl = this.add.text(cx, cy + 12, 'READY!', {
          fontSize: '9px', fontFamily: 'monospace', color: '#88FF88',
        }).setOrigin(0.5);
        this.elements.push(icon, lbl);

        cell.setInteractive({ useHandCursor: true });
        cell.on('pointerdown', () => this._harvestPlot(i));
      } else {
        const seedDef = SEEDS[farmSys.plots[i].seedId];
        const growIcon = this.add.text(cx, cy - 10, seedDef?.icon || '🌱', { fontSize: '14px' }).setOrigin(0.5);
        const remainMs = status.timeRemaining || 0;
        const totalSec = Math.ceil(remainMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timerStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const timerColor = totalSec <= 10 ? '#4CAF50' : '#AAAAAA';
        const timerLabel = this.add.text(cx, cy + 6,
          timerStr, {
          fontSize: '9px', fontFamily: 'monospace', color: timerColor,
        }).setOrigin(0.5);
        if (totalSec <= 10) {
          this.tweens.add({
            targets: timerLabel,
            scaleX: 1.1, scaleY: 1.1,
            yoyo: true, repeat: -1,
            duration: 500,
          });
        }
        const pctLabel = this.add.text(cx, cy + 18,
          `${Math.round((status.progress || 0) * 100)}%`, {
          fontSize: '8px', fontFamily: 'monospace', color: '#666666',
        }).setOrigin(0.5);
        this.elements.push(growIcon, timerLabel, pctLabel);
      }
    }

    const rowsUsed = Math.ceil(farmSys.maxPlots / cols);
    y += rowsUsed * (cellSize + cellPad) + 4;

    // Harvest All button
    const readyCount = farmSys.countReady();
    if (readyCount > 0) {
      const harvBtn = this.add.text(w / 2, y, `🌾 Harvest All Ready (${readyCount})`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#88FF88',
        backgroundColor: '#1B5E20CC', padding: { x: 10, y: 5 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      harvBtn.on('pointerdown', () => {
        const gs = this.gameScene;
        farmSys.harvestAll(gs.gameState);
        this.selectedPlot = null;
        this._render();
      });
      this.elements.push(harvBtn);
      y += 30;
    }

    // Plant section
    const plantHeader = this.add.text(panelX + 12, y, '── Plant a Seed ──', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888',
    });
    this.elements.push(plantHeader);
    y += 18;

    const farmLevel2 = skillSys.getLevel('farming');
    for (const seedDef of Object.values(SEEDS)) {
      const owned = (this.gameScene.gameState.materials.find(m => m.id === seedDef.id)?.quantity) || 0;
      const locked = farmLevel2 < seedDef.requiredFarmingLevel;

      const rowColor = locked ? '#555555' : '#F5E6C8';
      const rowText = locked
        ? `🔒 ${seedDef.name}   Farm Lv.${seedDef.requiredFarmingLevel}`
        : `${seedDef.icon} ${seedDef.name} (×${owned})`;

      const row = this.add.text(panelX + 14, y, rowText, {
        fontSize: '11px', fontFamily: 'monospace', color: rowColor,
      });
      this.elements.push(row);

      if (!locked && owned > 0 && this.selectedPlot !== null) {
        const plantBtn = this.add.text(panelX + panelW - 60, y, '[Plant]', {
          fontSize: '11px', fontFamily: 'monospace', color: '#DAA520',
        }).setInteractive({ useHandCursor: true });
        plantBtn.on('pointerdown', () => {
          const result = farmSys.plant(this.selectedPlot, seedDef.id, this.gameScene.gameState);
          if (result.success) {
            this.selectedPlot = null;
          }
          this._render();
        });
        this.elements.push(plantBtn);
      }

      y += 20;
    }
  }

  _harvestPlot(plotIndex) {
    const farmSys = this.gameScene.farmingSystem;
    const result = farmSys.harvest(plotIndex, this.gameScene.gameState);
    if (result.success) {
      const hudScene = this.gameScene.scene.get('HUDScene');
      if (hudScene && hudScene.lootToast) {
        hudScene.lootToast.showMaterial({
          name: `${result.crop.name} ×${result.quantity}`,
          emoji: result.crop.icon,
        });
      }
    }
    this._render();
  }
}
