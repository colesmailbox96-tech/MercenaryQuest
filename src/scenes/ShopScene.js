import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { RARITY } from '../config/gearData.js';
import { SEEDS } from '../config/farmData.js';
import { ITEMS } from '../config/itemData.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.activeTab = 'materials'; // 'materials' | 'gear' | 'seeds' | 'food'
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = w * 0.9;
    const panelH = h * 0.78;
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

    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 300, ease: 'Power2' });

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

    // Tabs — 4 tabs
    const tabY = panelY + 57;
    const tabW = panelW * 0.23;
    const tabPositions = [0.125, 0.375, 0.625, 0.875];
    const tabDefs = [
      { id: 'materials', label: 'Materials' },
      { id: 'gear',      label: 'Gear' },
      { id: 'seeds',     label: 'Seeds' },
      { id: 'food',      label: 'Food' },
    ];
    this.tabObjects = {};
    tabDefs.forEach((tabDef, i) => {
      const tx = panelX + panelW * tabPositions[i];
      const isActive = this.activeTab === tabDef.id;
      const rect = this.add.rectangle(tx, tabY, tabW, 22, isActive ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG, 1);
      const label = this.add.text(tx, tabY, tabDef.label, {
        fontSize: '11px', fontFamily: 'monospace', color: '#F5E6C8',
      }).setOrigin(0.5);
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => this._switchTab(tabDef.id));
      this.tabObjects[tabDef.id] = { rect, label };
    });

    this.itemRows = [];
    this._renderContent();
  }

  _switchTab(tab) {
    this.activeTab = tab;
    for (const [id, obj] of Object.entries(this.tabObjects)) {
      obj.rect.fillColor = id === tab ? COLORS.UI_BUTTON_ACTIVE : COLORS.UI_BUTTON_BG;
    }
    this._renderContent();
  }

  _renderContent() {
    this.itemRows.forEach(r => {
      if (r.text && r.text.active) r.text.destroy();
      if (r.btn && r.btn.active) r.btn.destroy();
      if (r.btn2 && r.btn2.active) r.btn2.destroy();
    });
    this.itemRows = [];

    if (this.activeTab === 'materials') {
      this.renderItems(this.panelX, this.panelY, this.panelW);
    } else if (this.activeTab === 'gear') {
      this.renderGear(this.panelX, this.panelY, this.panelW);
    } else if (this.activeTab === 'seeds') {
      this.renderSeeds(this.panelX, this.panelY, this.panelW);
    } else if (this.activeTab === 'food') {
      this.renderFood(this.panelX, this.panelY, this.panelW);
    }
    this.goldText.setText(`🪙 ${this.gameScene.lootSystem.gold}`);
  }

  renderItems(panelX, panelY, panelW) {
    const stash = this.gameScene.lootSystem.sharedStash;
    // Show all non-food, non-seed non-gear items
    const items = stash.filter(i => i.category !== 'food' && i.category !== 'seed');
    let yOffset = panelY + 82;

    if (items.length === 0) {
      const empty = this.add.text(this.scale.width / 2, yOffset, 'No materials to sell', {
        fontSize: '13px', fontFamily: 'monospace', color: '#888888',
      });
      empty.setOrigin(0.5, 0);
      this.itemRows.push({ text: empty, btn: null });
    } else {
      items.forEach(item => {
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
    let yOffset = panelY + 82;

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

      const commonCount = unequipped.filter(g => g.rarity === 'COMMON').length;
      if (commonCount > 0) {
        const sellAllBtn = this.add.text(this.scale.width / 2, yOffset + 8, `[SELL ALL COMMON (${commonCount})]`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
          backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 },
        });
        sellAllBtn.setOrigin(0.5, 0);
        sellAllBtn.setInteractive({ useHandCursor: true });
        sellAllBtn.on('pointerdown', () => {
          this.gameScene.lootSystem.sellAllCommonGear();
          this._renderContent();
        });
        this.itemRows.push({ text: sellAllBtn, btn: null });
      }
    }
  }

  renderSeeds(panelX, panelY, panelW) {
    const w = this.scale.width;
    const farmLevel = this.gameScene.skillSystem.getLevel('farming');
    let yOffset = panelY + 82;

    this.add.text(w / 2, yOffset - 18, '🌱 Buy seeds to plant on your farm', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5, 0);

    for (const seedDef of Object.values(SEEDS)) {
      const locked = farmLevel < seedDef.requiredFarmingLevel;
      const color = locked ? '#555555' : '#F5E6C8';
      const nameStr = locked
        ? `🔒 ${seedDef.name}  Farm Lv.${seedDef.requiredFarmingLevel}`
        : `${seedDef.icon} ${seedDef.name}  ${seedDef.cost}g`;

      const rowText = this.add.text(panelX + 16, yOffset, nameStr, {
        fontSize: '12px', fontFamily: 'monospace', color,
      });
      this.itemRows.push({ text: rowText, btn: null });

      if (!locked) {
        const buy1 = this.add.text(panelX + panelW - 110, yOffset, '[×1]', {
          fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        });
        buy1.setInteractive({ useHandCursor: true });
        buy1.on('pointerdown', () => this._buySeed(seedDef, 1));

        const buy5 = this.add.text(panelX + panelW - 55, yOffset, '[×5]', {
          fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        });
        buy5.setInteractive({ useHandCursor: true });
        buy5.on('pointerdown', () => this._buySeed(seedDef, 5));

        this.itemRows.push({ text: buy1, btn: null });
        this.itemRows.push({ text: buy5, btn: null });
      }

      yOffset += 26;
    }
  }

  _buySeed(seedDef, qty) {
    const totalCost = seedDef.cost * qty;
    const lootSystem = this.gameScene.lootSystem;
    if (lootSystem.gold < totalCost) return;

    lootSystem.gold -= totalCost;
    lootSystem.scene.events.emit('goldChanged', lootSystem.gold);

    const materials = this.gameScene.gameState.materials;
    const existing = materials.find(m => m.id === seedDef.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      const itemDef = ITEMS[seedDef.id];
      materials.push({
        id: seedDef.id,
        name: seedDef.name,
        emoji: seedDef.icon,
        quantity: qty,
        sellValue: itemDef?.sellValue || 2,
        category: 'seed',
      });
    }
    lootSystem.scene.events.emit('inventoryChanged', materials);
    this._renderContent();
  }

  renderFood(panelX, panelY, panelW) {
    const stash = this.gameScene.lootSystem.sharedStash;
    const foods = stash.filter(i => i.category === 'food');
    let yOffset = panelY + 82;

    if (foods.length === 0) {
      const empty = this.add.text(this.scale.width / 2, yOffset, 'No food to sell', {
        fontSize: '13px', fontFamily: 'monospace', color: '#888888',
      });
      empty.setOrigin(0.5, 0);
      this.itemRows.push({ text: empty, btn: null });
    } else {
      foods.forEach(item => {
        const foodDef = ITEMS[item.id];
        const buffStr = foodDef?.buff?.stats
          ? Object.entries(foodDef.buff.stats).map(([k, v]) => `+${v}${k}`).join(' ')
          : 'skill buff';
        const rowText = this.add.text(panelX + 16, yOffset,
          `${item.emoji} ${item.name} ×${item.quantity}  [${buffStr}]  —  ${item.sellValue}g`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#F5E6C8',
        });

        const sellBtn = this.add.text(panelX + panelW - 55, yOffset, '[SELL]', {
          fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        });
        sellBtn.setInteractive({ useHandCursor: true });
        sellBtn.on('pointerdown', () => {
          this.gameScene.lootSystem.sellItem(item.id);
          this._renderContent();
        });

        this.itemRows.push({ text: rowText, btn: sellBtn });
        yOffset += 26;
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
