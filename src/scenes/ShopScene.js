import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = w * 0.8;
    const panelH = h * 0.7;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.closeShop());

    // Panel
    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.95);
    this.panel.setInteractive(); // absorb clicks

    // Slide in
    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({
      targets: this.panel,
      y: h / 2,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    // Title
    this.titleText = this.add.text(w / 2, panelY + 20, '🏪 Shop — Sell Items', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.titleText.setOrigin(0.5, 0);

    // Close button
    this.closeBtn = this.add.text(panelX + panelW - 15, panelY + 10, '✕', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.closeShop());

    // Gold display
    this.goldText = this.add.text(w / 2, panelY + 48, `🪙 ${this.gameScene.lootSystem.gold}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#DAA520',
    });
    this.goldText.setOrigin(0.5, 0);

    this.itemRows = [];
    this.renderItems(panelX, panelY, panelW);
  }

  renderItems(panelX, panelY, panelW) {
    // Clear old rows
    this.itemRows.forEach(r => { r.text.destroy(); if (r.btn) r.btn.destroy(); });
    this.itemRows = [];

    const stash = this.gameScene.lootSystem.sharedStash;
    let yOffset = panelY + 75;

    if (stash.length === 0) {
      const empty = this.add.text(this.scale.width / 2, yOffset, 'No items to sell', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#888888',
      });
      empty.setOrigin(0.5, 0);
      this.itemRows.push({ text: empty, btn: null });
    } else {
      stash.forEach(item => {
        const rowText = this.add.text(panelX + 20, yOffset,
          `${item.emoji} ${item.name} ×${item.quantity}  —  ${item.sellValue}g`, {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#F5E6C8',
        });

        let sellBtn = null;
        if (item.sellValue > 0) {
          sellBtn = this.add.text(panelX + panelW - 60, yOffset, '[SELL]', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#DAA520',
          });
          sellBtn.setInteractive({ useHandCursor: true });
          sellBtn.on('pointerdown', () => {
            this.gameScene.lootSystem.sellItem(item.id);
            this.goldText.setText(`🪙 ${this.gameScene.lootSystem.gold}`);
            const w = this.scale.width;
            const h = this.scale.height;
            const pw = w * 0.8;
            const ph = h * 0.7;
            const px = (w - pw) / 2;
            const py = (h - ph) / 2;
            this.renderItems(px, py, pw);
          });
        }

        this.itemRows.push({ text: rowText, btn: sellBtn });
        yOffset += 28;
      });
    }
  }

  closeShop() {
    this.tweens.add({
      targets: this.panel,
      y: this.scale.height,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.scene.stop();
      },
    });
  }
}
