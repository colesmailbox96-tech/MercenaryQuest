import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';

export class MerchantPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'MerchantPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;

    // Backdrop
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setInteractive();

    const panelW = w - 40;
    const panelH = h * 0.7;
    const panelX = w / 2;
    const panelY = h / 2;

    this.add.rectangle(panelX, panelY, panelW, panelH, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(2, 0xDAA520);

    // Title
    this.add.text(panelX, panelY - panelH / 2 + 20, '🛒 Wandering Merchant', {
      fontSize: '16px', fontFamily: 'monospace', color: '#DAA520',
    }).setOrigin(0.5);

    // Countdown
    this.countdownText = this.add.text(panelX, panelY - panelH / 2 + 42, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5);

    // Flavor text
    this.add.text(panelX, panelY - panelH / 2 + 64, '"Rare goods from distant lands..."', {
      fontSize: '10px', fontFamily: 'monospace', color: '#888888', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Gold display
    this.goldText = this.add.text(panelX, panelY + panelH / 2 - 25, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#DAA520',
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(panelX + panelW / 2 - 15, panelY - panelH / 2 + 10, '✕', {
      fontSize: '20px', color: '#FF4444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());

    // Item list
    this.itemButtons = [];
    this.buildItemList(panelX, panelY - panelH / 2 + 85, panelW - 30);

    // Listen for merchant despawn
    this.gameScene.events.on('merchantDespawned', this.onMerchantDespawn, this);

    this.events.on('shutdown', () => {
      this.gameScene.events.off('merchantDespawned', this.onMerchantDespawn, this);
    });
  }

  buildItemList(startX, startY, width) {
    const merchant = this.gameScene.wanderingMerchant;
    if (!merchant || !merchant.isActive) return;

    let yOffset = startY;
    for (let i = 0; i < merchant.inventory.length; i++) {
      const item = merchant.inventory[i];
      const itemY = yOffset;

      const nameText = this.add.text(startX - width / 2, itemY,
        `${item.icon} ${item.name} ×${item.remaining}`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
      });

      const costText = this.add.text(startX + width / 2, itemY, `${item.cost}g`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
      }).setOrigin(1, 0);

      const descText = this.add.text(startX - width / 2, itemY + 16, item.description || '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#888888',
        wordWrap: { width: width - 80 },
      });

      const buyBtn = this.add.text(startX + width / 2, itemY + 16, '[Buy ×1]', {
        fontSize: '11px', fontFamily: 'monospace', color: '#4CAF50',
        backgroundColor: '#1A1A2ECC', padding: { x: 6, y: 3 },
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      const idx = i;
      buyBtn.on('pointerdown', () => this.buyItem(idx, nameText, buyBtn));

      if (item.remaining <= 0) {
        buyBtn.setText('SOLD OUT');
        buyBtn.setColor('#666666');
        buyBtn.disableInteractive();
      }

      this.itemButtons.push({ nameText, costText, descText, buyBtn, index: idx });
      yOffset += descText.height + 28;
    }
  }

  buyItem(index, nameText, buyBtn) {
    const merchant = this.gameScene.wanderingMerchant;
    if (!merchant) return;

    const gold = this.gameScene.lootSystem.gold;
    const result = merchant.buyItem(index, { gold, materials: this.gameScene.gameState.materials });

    if (result.success) {
      const item = merchant.inventory[index];
      nameText.setText(`${item.icon} ${item.name} ×${item.remaining}`);
      if (item.remaining <= 0) {
        buyBtn.setText('SOLD OUT');
        buyBtn.setColor('#666666');
        buyBtn.disableInteractive();
      }
    } else {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene && hudScene.notifications) {
        hudScene.notifications.showLoot({ name: result.reason, emoji: '❌' });
      }
    }
  }

  onMerchantDespawn() {
    this.scene.stop();
  }

  update() {
    const merchant = this.gameScene.wanderingMerchant;
    if (merchant && merchant.isActive) {
      const remaining = merchant.getTimeRemaining();
      const secs = Math.ceil(remaining / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      this.countdownText.setText(`Departing in ${mins}:${s.toString().padStart(2, '0')}`);
      if (remaining < 15000) {
        this.countdownText.setColor('#FF4444');
      }
    }

    if (this.gameScene.lootSystem) {
      this.goldText.setText(`── Your Gold: ${this.gameScene.lootSystem.gold}g ──`);
    }
  }
}
