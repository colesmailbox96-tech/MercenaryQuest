import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { RARITY } from '../config/gearData.js';
import { SEEDS } from '../config/farmData.js';
import { ITEMS } from '../config/itemData.js';
import { createPanelBackground } from '../ui/PanelUtils.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.activeTab = 'materials'; // 'materials' | 'gear' | 'seeds' | 'food'
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

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.closeShop());

    // Panel — rounded with gradient header
    this.panelGfx = createPanelBackground(this, panelX, panelY, panelW, panelH, {
      headerHeight: 34,
    });
    this.panelGfx.setDepth(1);

    // Invisible interactive rect for blocking clicks through panel
    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, 0x000000, 0);
    this.panel.setInteractive();

    this.panelGfx.setAlpha(0);
    this.panel.setAlpha(0);
    this.tweens.add({ targets: [this.panelGfx, this.panel], alpha: 1, duration: 300, ease: 'Power2' });

    // Title
    this.titleText = this.add.text(w / 2, panelY + 12, '🏪 Shop', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5, 0);

    // Close button
    this.closeBtn = this.add.text(panelX + panelW - 16, panelY + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-24, -24, 48, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.closeBtn.on('pointerdown', () => this.closeShop());
    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#FF6B6B'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#F5E6C8'));

    // Gold display
    this.goldText = this.add.text(w / 2, panelY + 36, `🪙 ${this.gameScene.lootSystem.gold}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#DAA520',
    });
    this.goldText.setOrigin(0.5, 0);

    // Tabs — 4 tabs with rounded tops
    const tabY = panelY + 59;
    const tabW = panelW * 0.22;
    const tabPositions = [0.125, 0.375, 0.625, 0.875];
    const tabDefs = [
      { id: 'materials', label: 'Materials' },
      { id: 'gear',      label: 'Gear' },
      { id: 'seeds',     label: 'Seeds' },
      { id: 'food',      label: 'Food' },
    ];
    this.tabObjects = {};
    this._tabGfx = [];
    tabDefs.forEach((tabDef, i) => {
      const tx = panelX + panelW * tabPositions[i];
      const isActive = this.activeTab === tabDef.id;

      const gfx = this.add.graphics();
      gfx.fillStyle(isActive ? 0x3A3A5E : 0x2A2A3E, 1);
      gfx.fillRoundedRect(tx - tabW / 2, tabY - 11, tabW, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
      if (isActive) {
        gfx.lineStyle(1, 0xDAA520, 0.4);
        gfx.strokeRoundedRect(tx - tabW / 2, tabY - 11, tabW, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
      }
      this._tabGfx.push(gfx);

      const label = this.add.text(tx, tabY, tabDef.label, {
        fontSize: '11px', fontFamily: 'monospace', color: isActive ? '#FFD700' : '#F5E6C8',
      }).setOrigin(0.5);

      // Invisible interactive rect for tab
      const hitRect = this.add.rectangle(tx, tabY, tabW, 22, 0x000000, 0);
      hitRect.setInteractive({ useHandCursor: true });
      hitRect.on('pointerdown', () => this._switchTab(tabDef.id));
      this.tabObjects[tabDef.id] = { gfx, label, hitRect };
    });

    // Sort button
    this.sortBtn = this.add.text(panelX + panelW - 14, tabY, '↕', {
      fontSize: '16px', fontFamily: 'monospace', color: '#DAA520',
      backgroundColor: '#2A2A3E', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.sortBtn.on('pointerdown', () => this._sortCurrentTab());

    this.itemRows = [];
    this._renderContent();
  }

  _switchTab(tab) {
    this.activeTab = tab;
    const tabW = this.panelW * 0.22;
    const tabPositions = [0.125, 0.375, 0.625, 0.875];
    const tabIds = ['materials', 'gear', 'seeds', 'food'];
    for (const [id, obj] of Object.entries(this.tabObjects)) {
      const isActive = id === tab;
      const i = tabIds.indexOf(id);
      const tx = this.panelX + this.panelW * tabPositions[i];
      const tabY = this.panelY + 59;
      obj.gfx.clear();
      obj.gfx.fillStyle(isActive ? 0x3A3A5E : 0x2A2A3E, 1);
      obj.gfx.fillRoundedRect(tx - tabW / 2, tabY - 11, tabW, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
      if (isActive) {
        obj.gfx.lineStyle(1, 0xDAA520, 0.4);
        obj.gfx.strokeRoundedRect(tx - tabW / 2, tabY - 11, tabW, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
      }
      obj.label.setColor(isActive ? '#FFD700' : '#F5E6C8');
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
        const itemDef = ITEMS[item.id];
        let textX = panelX + 16;

        // Render image icon if available
        if (itemDef && itemDef.iconKey && this.textures.exists(itemDef.iconKey)) {
          const icon = this.add.image(panelX + 24, yOffset + 8, itemDef.iconKey);
          icon.setDisplaySize(16, 16);
          this.itemRows.push({ text: icon, btn: null });
          textX = panelX + 36;
        }

        const prefix = (itemDef && itemDef.iconKey) ? '' : `${item.emoji} `;
        const rowText = this.add.text(textX, yOffset,
          `${prefix}${item.name} ×${item.quantity}  —  ${item.sellValue}g`, {
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

      const matTotal = this.gameScene.lootSystem.getMaterialsSellTotal();
      if (matTotal > 0) {
        const sellAllMatBtn = this.add.text(this.scale.width / 2, yOffset + 8, `[SELL ALL MATERIALS (${matTotal}g)]`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
          backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        sellAllMatBtn.on('pointerdown', () => {
          this._showConfirmDialog(`Sell all materials for ${matTotal}g?`, () => {
            this.gameScene.lootSystem.sellAllMaterials();
            this._renderContent();
          });
        });
        this.itemRows.push({ text: sellAllMatBtn, btn: null });
      }
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

      const uncommonTotal = this.gameScene.lootSystem.getUncommonAndBelowGearSellTotal();
      const uncommonCount = unequipped.filter(g => g.rarity === 'COMMON' || g.rarity === 'UNCOMMON').length;
      if (uncommonCount > 0) {
        const sellUncBtn = this.add.text(this.scale.width / 2, yOffset + (commonCount > 0 ? 38 : 8), `[SELL ALL ≤ UNCOMMON (${uncommonCount} for ${uncommonTotal}g)]`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#AAAAAA',
          backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        sellUncBtn.on('pointerdown', () => {
          this._showConfirmDialog(`Sell ${uncommonCount} Common+Uncommon gear for ${uncommonTotal}g?`, () => {
            this.gameScene.lootSystem.sellAllUncommonAndBelowGear();
            this._renderContent();
          });
        });
        this.itemRows.push({ text: sellUncBtn, btn: null });
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

      const foodTotal = this.gameScene.lootSystem.getFoodSellTotal();
      if (foodTotal > 0) {
        const sellAllFoodBtn = this.add.text(this.scale.width / 2, yOffset + 8, `[SELL ALL FOOD (${foodTotal}g)]`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#AAAAAA',
          backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 },
        }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        sellAllFoodBtn.on('pointerdown', () => {
          this._showConfirmDialog(`Sell all food for ${foodTotal}g?`, () => {
            this.gameScene.lootSystem.sellAllFood();
            this._renderContent();
          });
        });
        this.itemRows.push({ text: sellAllFoodBtn, btn: null });
      }
    }
  }

  closeShop() {
    this._closeConfirmDialog();
    const targets = [this.panelGfx, this.panel];
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.scene.stop();
      },
    });
  }

  _sortCurrentTab() {
    const lootSystem = this.gameScene.lootSystem;
    if (this.activeTab === 'materials') {
      const items = lootSystem.sharedStash.filter(i => i.category !== 'food' && i.category !== 'seed');
      items.sort((a, b) => (b.sellValue || 0) - (a.sellValue || 0) || a.name.localeCompare(b.name));
      const rest = lootSystem.sharedStash.filter(i => i.category === 'food' || i.category === 'seed');
      lootSystem.sharedStash = [...items, ...rest];
    } else if (this.activeTab === 'gear') {
      const rarityOrder = { EPIC: 0, RARE: 1, UNCOMMON: 2, COMMON: 3 };
      lootSystem.gearStash.sort((a, b) => {
        const ra = rarityOrder[a.rarity] ?? 4;
        const rb = rarityOrder[b.rarity] ?? 4;
        if (ra !== rb) return ra - rb;
        const psA = Object.values(a.stats).reduce((s, v) => s + v, 0);
        const psB = Object.values(b.stats).reduce((s, v) => s + v, 0);
        return psB - psA;
      });
    } else if (this.activeTab === 'seeds') {
      const seeds = lootSystem.sharedStash.filter(i => i.category === 'seed');
      seeds.sort((a, b) => a.name.localeCompare(b.name));
      const rest = lootSystem.sharedStash.filter(i => i.category !== 'seed');
      lootSystem.sharedStash = [...rest, ...seeds];
    } else if (this.activeTab === 'food') {
      const foods = lootSystem.sharedStash.filter(i => i.category === 'food');
      foods.sort((a, b) => (b.sellValue || 0) - (a.sellValue || 0) || a.name.localeCompare(b.name));
      const rest = lootSystem.sharedStash.filter(i => i.category !== 'food');
      lootSystem.sharedStash = [...rest, ...foods];
    }
    this._renderContent();
  }

  _showConfirmDialog(message, onConfirm) {
    if (this._confirmDialog) {
      this._confirmDialog.forEach(obj => obj.destroy && obj.destroy());
    }
    this._confirmDialog = [];
    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add.rectangle(w / 2, h / 2, w * 0.8, 100, 0x1A1A2E, 0.95);
    bg.setStrokeStyle(1, 0xDAA520);
    bg.setDepth(400);
    this._confirmDialog.push(bg);

    const msg = this.add.text(w / 2, h / 2 - 18, message, {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
      wordWrap: { width: w * 0.7 }, align: 'center',
    }).setOrigin(0.5).setDepth(401);
    this._confirmDialog.push(msg);

    const yesBtn = this.add.text(w / 2 - 50, h / 2 + 18, '[ Yes ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#4CAF50',
      backgroundColor: '#1A3A1A', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(401).setInteractive({ useHandCursor: true });
    yesBtn.on('pointerdown', () => {
      this._closeConfirmDialog();
      onConfirm();
    });
    this._confirmDialog.push(yesBtn);

    const noBtn = this.add.text(w / 2 + 50, h / 2 + 18, '[ No ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FF6B6B',
      backgroundColor: '#3A1A1A', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(401).setInteractive({ useHandCursor: true });
    noBtn.on('pointerdown', () => this._closeConfirmDialog());
    this._confirmDialog.push(noBtn);
  }

  _closeConfirmDialog() {
    if (this._confirmDialog) {
      this._confirmDialog.forEach(obj => obj.destroy && obj.destroy());
      this._confirmDialog = null;
    }
  }
}
