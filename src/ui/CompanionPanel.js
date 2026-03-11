import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { COMPANIONS, EGG_HATCH_CONFIG } from '../config/companionData.js';

export class CompanionPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'CompanionPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;

    const backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => this.scene.stop());

    const panelW = Math.min(w - 20, 370);
    const panelH = Math.min(h * 0.85, h - 40);
    const panelX = w / 2;
    const panelY = h / 2;

    this.add.rectangle(panelX, panelY, panelW, panelH, COLORS.UI_PANEL, 0.92)
      .setStrokeStyle(2, COLORS.UI_GOLD, 0.6);

    // Title
    this.add.text(panelX, panelY - panelH / 2 + 20, '🐾 Companions', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Close
    const closeBtn = this.add.text(panelX + panelW / 2 - 15, panelY - panelH / 2 + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-24, -24, 48, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    closeBtn.on('pointerdown', () => this.scene.stop());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF6B6B'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#F5E6C8'));

    const cs = this.gameScene.companionSystem;
    if (!cs) { this.scene.stop(); return; }

    let yPos = panelY - panelH / 2 + 50;

    // Active companion section
    this.add.text(panelX - panelW / 2 + 15, yPos, '── Active ──', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    yPos += 22;

    if (cs.activeCompanionId) {
      const def = COMPANIONS[cs.activeCompanionId];
      this.add.text(panelX - panelW / 2 + 15, yPos, `${def.icon} ${def.name}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#DAA520',
      });

      const dismissBtn = this.add.text(panelX + panelW / 2 - 15, yPos, '[Dismiss]', {
        fontSize: '11px', fontFamily: 'monospace', color: '#FF4444',
        backgroundColor: '#1A1A2ECC', padding: { x: 6, y: 2 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      dismissBtn.on('pointerdown', () => {
        cs.dismiss();
        this.scene.restart();
      });
      yPos += 18;

      this.add.text(panelX - panelW / 2 + 15, yPos, `${def.perk.name}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#4CAF50',
      });
      yPos += 16;
      this.add.text(panelX - panelW / 2 + 15, yPos, def.perk.description, {
        fontSize: '9px', fontFamily: 'monospace', color: '#AAAAAA',
        wordWrap: { width: panelW - 30 },
      });
      yPos += 22;

      if (cs.treatActive) {
        const remaining = Math.max(0, cs.treatExpiresAt - Date.now());
        const secs = Math.ceil(remaining / 1000);
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        this.add.text(panelX - panelW / 2 + 15, yPos,
          `🦴 Golden Treat active (${mins}:${s.toString().padStart(2, '0')})`, {
          fontSize: '10px', fontFamily: 'monospace', color: '#DAA520',
        });
        yPos += 18;
      }

      // Feed treat button
      const treatBtn = this.add.text(panelX, yPos, '[Feed Treat]', {
        fontSize: '11px', fontFamily: 'monospace', color: '#DAA520',
        backgroundColor: '#2A2A3ECC', padding: { x: 10, y: 4 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      treatBtn.on('pointerdown', () => {
        const result = cs.applyTreat(this.gameScene.gameState);
        if (!result.success) {
          const hudScene = this.scene.get('HUDScene');
          if (hudScene && hudScene.notifications) {
            hudScene.notifications.showLoot({ name: result.reason, emoji: '❌' });
          }
        } else {
          this.scene.restart();
        }
      });
      yPos += 30;
    } else {
      this.add.text(panelX - panelW / 2 + 15, yPos, 'No active companion', {
        fontSize: '11px', fontFamily: 'monospace', color: '#666666',
      });
      yPos += 30;
    }

    // Owned grid
    this.add.text(panelX - panelW / 2 + 15, yPos, '── Owned ──', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    yPos += 22;

    const allCompanions = Object.values(COMPANIONS);
    const cols = 3;
    const cellW = (panelW - 30) / cols;
    const cellH = 50;

    for (let i = 0; i < allCompanions.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = panelX - panelW / 2 + 15 + col * cellW + cellW / 2;
      const cy = yPos + row * cellH + cellH / 2;

      const comp = allCompanions[i];
      const owned = cs.ownedCompanions.includes(comp.id);
      const isActive = cs.activeCompanionId === comp.id;

      const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6,
        isActive ? 0x3A5A3A : 0x2A2A3E, 0.8);
      cellBg.setStrokeStyle(1, owned ? 0x4CAF50 : 0x444444);

      if (owned) {
        this.add.text(cx, cy - 8, comp.icon, {
          fontSize: '20px',
        }).setOrigin(0.5);
        this.add.text(cx, cy + 14, isActive ? 'Active' : '', {
          fontSize: '8px', fontFamily: 'monospace', color: '#4CAF50',
        }).setOrigin(0.5);

        if (!isActive) {
          cellBg.setInteractive({ useHandCursor: true });
          cellBg.on('pointerdown', () => {
            cs.setActive(comp.id);
            this.scene.restart();
          });
        }
      } else {
        this.add.text(cx, cy - 8, '🔒', {
          fontSize: '18px',
        }).setOrigin(0.5);
        this.add.text(cx, cy + 14, '???', {
          fontSize: '8px', fontFamily: 'monospace', color: '#666666',
        }).setOrigin(0.5);
      }
    }

    yPos += Math.ceil(allCompanions.length / cols) * cellH + 10;

    // Nest section
    this.add.text(panelX - panelW / 2 + 15, yPos, '── Nest ──', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    yPos += 22;

    const incubation = cs.getIncubationProgress();
    if (incubation) {
      const compDef = COMPANIONS[incubation.companionId];
      const secs = Math.ceil(incubation.timeRemaining / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      this.add.text(panelX - panelW / 2 + 15, yPos,
        `🥚 ${compDef.name} Egg incubating... ${mins}:${s.toString().padStart(2, '0')}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#DAA520',
      });
      yPos += 18;

      // Progress bar
      const barW = panelW - 60;
      this.add.rectangle(panelX, yPos + 5, barW, 8, 0x333333);
      this.add.rectangle(
        panelX - barW / 2 + (barW * incubation.progress) / 2,
        yPos + 5,
        barW * incubation.progress,
        8,
        0x4CAF50
      );
    } else {
      this.add.text(panelX - panelW / 2 + 15, yPos, 'Nest is empty. Find an egg!', {
        fontSize: '10px', fontFamily: 'monospace', color: '#666666',
      });
    }
  }
}
