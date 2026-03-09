import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { RARITY } from '../config/gearData.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.activeTab = 'materials'; // 'materials' | 'gear'
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = w * 0.9;
    const panelH = h * 0.75;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.closeShop());

    // Panel
    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.95);
    this.panel.setInteractive();

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
    this.titleText = this.add.text(w / 2, panelY + 12, '🏪 Shop', {
      fontSize: '16px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    this.titleText.setOrigin(0.5, 0);

    // Close button
    this.closeBtn = this.add.text(panelX + panelW - 12, panelY + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.closeShop());

    // Gold display
    this.goldText = this.add.text(w / 2, panelY + 34, `🪙 ${this.gameScene.lootSystem.gold}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#DAA520',
    });
    this.goldText.setOrigin(0.5, 0);

    // Tabs
    const tabY = panelY + 56;
    const tabW = panelW * 0.44;
    this.tabMaterials = this.add.rectangle(panelX + panelW * 0.25, tabY, tabW, 24, COLORS.UI_BUTTON_ACTIVE, 1);
    this.tabMaterialsLabel = this.add.text(panelX + panelW * 0.25, tabY, 'Materials', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5);
    this.tabMaterials.setInteractive({ useHandCursor: true });
    this.tabMaterials.on('pointerdown', () => this._switchTab('materials'));

    this.tabGear = this.add.rectangle(panelX + panelW * 0.75, tabY, tabW, 24, COLORS.UI_BUTTON_BG, 1);
    this.tabGearLabel = this.add.text(panelX + panelW * 0.75, tabY, 'Gear', {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5);
    this.tabGear.setInteractive({ useHandCursor: true });
    this.tabGear.on('pointerdown', () => this._switchTab('gear'));

    this.itemRows = [];
    this._renderContent();
  }

  _switchTab(tab) {
    this.activeTab = tab;
    this.tabMaterials.fillColor = tab === 'materials' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG;
    this.tabGear.fillColor = tab === 'gear' ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG;
    this._renderContent();
  }

  _renderContent() {
    this.itemRows.forEach(r => {
      if (r.text && r.text.active) r.text.destroy();
      if (r.btn && r.btn.active) r.btn.destroy();
    });
    this.itemRows = [];

    if (this.activeTab === 'materials') {
      this.renderItems(this.panelX, this.panelY, this.panelW);
    } else {
      this.renderGear(this.panelX, this.panelY, this.panelW);
    }
    this.goldText.setText(`🪙 ${this.gameScene.lootSystem.gold}`);
  }

  renderItems(panelX, panelY, panelW) {
    const stash = this.gameScene.lootSystem.sharedStash;
    let yOffset = panelY + 80;

    if (stash.length === 0) {
      const empty = this.add.text(this.scale.width / 2, yOffset, 'No materials to sell', {
        fontSize: '13px', fontFamily: 'monospace', color: '#888888',
      });
      empty.setOrigin(0.5, 0);
      this.itemRows.push({ text: empty, btn: null });
    } else {
      stash.forEach(item => {
        const rowText = this.add.text(panelX + 16, yOffset,
          `${item.emoji} ${item.name} ×${item.quantity}  —  ${item.sellValue}g`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
        });

        let sellBtn = null;
        if (item.sellValue > 0) {
          sellBtn = this.add.text(panelX + panelW - 55, yOffset, '[SELL]', {
            fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
          });
          sellBtn.setInteractive({ useHandCursor: true });
          sellBtn.on('pointerdown', () => {
            this.gameScene.lootSystem.sellItem(item.id);
            this._renderContent();
          });
        }

        this.itemRows.push({ text: rowText, btn: sellBtn });
        yOffset += 26;
      });
    }
  }

  renderGear(panelX, panelY, panelW) {
    const gearStash = this.gameScene.lootSystem.gearStash;
    const unequipped = gearStash.filter(g => !g.equippedBy);
    let yOffset = panelY + 80;

    if (unequipped.length === 0) {
      const empty = this.add.text(this.scale.width / 2, yOffset, 'No gear to sell', {
        fontSize: '13px', fontFamily: 'monospace', color: '#888888',
      });
      empty.setOrigin(0.5, 0);
      this.itemRows.push({ text: empty, btn: null });
    } else {
      unequipped.forEach(gear => {
        const rarityData = RARITY[gear.rarity] || RARITY.COMMON;
        const rarityHex = '#' + rarityData.color.toString(16).padStart(6, '0');
        const statsStr = Object.entries(gear.stats).map(([k, v]) => `${k}+${v}`).join(' ');
        const rowText = this.add.text(panelX + 16, yOffset,
          `${gear.icon} ${gear.name} [${statsStr}]  —  ${gear.sellValue}g`, {
          fontSize: '11px', fontFamily: 'monospace', color: rarityHex,
        });

        const sellBtn = this.add.text(panelX + panelW - 55, yOffset, '[SELL]', {
          fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        });
        sellBtn.setInteractive({ useHandCursor: true });
        sellBtn.on('pointerdown', () => {
          this.gameScene.lootSystem.sellGear(gear.uid);
          this._renderContent();
        });

        this.itemRows.push({ text: rowText, btn: sellBtn });
        yOffset += 24;
      });

      // Sell All Common button
      const commonCount = unequipped.filter(g => g.rarity === 'COMMON').length;
      if (commonCount > 0) {
        const sellAllBtn = this.add.text(this.scale.width / 2, yOffset + 8, `[SELL ALL COMMON (${commonCount})]`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
          backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 },
        });
        sellAllBtn.setOrigin(0.5, 0);
        sellAllBtn.setInteractive({ useHandCursor: true });
        sellAllBtn.on('pointerdown', () => {
          const earned = this.gameScene.lootSystem.sellAllCommonGear();
          this._renderContent();
        });
        this.itemRows.push({ text: sellAllBtn, btn: null });
      }
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
