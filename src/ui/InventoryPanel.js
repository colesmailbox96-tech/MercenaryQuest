import { ITEMS } from '../config/itemData.js';

export class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.container = null;
    this.activeFilter = 'all'; // 'all' | 'materials' | 'gear' | 'seeds' | 'food'
  }

  show(stash, onSell, onEat) {
    if (this.container) this.hide();
    this.onSell = onSell;
    this.onEat = onEat;
    this._buildUI(stash);
  }

  _buildUI(stash) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const panelW = Math.min(w - 20, 370);
    const panelH = Math.min(h * 0.85, h - 40);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(300);
    this.container.setScrollFactor(0);

    // Backdrop
    const backdrop = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    backdrop.setScrollFactor(0);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => this.hide());
    this.container.add(backdrop);

    // Panel
    const panel = this.scene.add.rectangle(w / 2, h / 2, panelW, panelH, 0x1A1A2E, 0.92);
    panel.setScrollFactor(0);
    panel.setStrokeStyle(2, 0xDAA520, 0.6);
    panel.setInteractive();
    this.container.add(panel);

    // Title
    const title = this.scene.add.text(w / 2, panelY + 14, '📦 Inventory', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0).setScrollFactor(0);
    this.container.add(title);

    // Close button
    const closeBtn = this.scene.add.text(panelX + panelW - 15, panelY + 10, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    closeBtn.setOrigin(0.5, 0).setScrollFactor(0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Filter tabs
    const filters = ['All', 'Materials', 'Gear', 'Seeds', 'Food'];
    const tabW = (panelW - 10) / filters.length;
    const tabY = panelY + 36;
    filters.forEach((label, i) => {
      const tx = panelX + 5 + i * tabW + tabW / 2;
      const filterId = label.toLowerCase();
      const isActive = this.activeFilter === filterId;
      const tabBg = this.scene.add.rectangle(tx, tabY, tabW - 4, 18,
        isActive ? 0x3A3A5E : 0x2A2A3E, 0.9);
      tabBg.setScrollFactor(0).setInteractive({ useHandCursor: true });
      tabBg.on('pointerdown', () => {
        this.activeFilter = filterId;
        this.hide();
        this._buildUI(stash);
      });
      const tabLabel = this.scene.add.text(tx, tabY, label, {
        fontSize: '10px', fontFamily: 'monospace', color: isActive ? '#FFFFFF' : '#AAAAAA',
      }).setOrigin(0.5).setScrollFactor(0);
      this.container.add(tabBg);
      this.container.add(tabLabel);
    });

    // Filtered items
    const filtered = this._filterItems(stash);
    let yOffset = panelY + 52;

    if (filtered.length === 0) {
      const empty = this.scene.add.text(w / 2, yOffset, 'No items', {
        fontSize: '14px', fontFamily: 'monospace', color: '#888',
      });
      empty.setOrigin(0.5, 0).setScrollFactor(0);
      this.container.add(empty);
    } else {
      filtered.forEach(item => {
        const row = this.scene.add.text(panelX + 16, yOffset,
          `${item.emoji} ${item.name} ×${item.quantity}  —  ${item.sellValue}g`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
        });
        row.setScrollFactor(0);
        this.container.add(row);

        let btnX = panelX + panelW - 55;

        // Eat button for food items
        if (item.category === 'food' && this.onEat) {
          const eatBtn = this.scene.add.text(panelX + panelW - 110, yOffset, '[Eat]', {
            fontSize: '12px', fontFamily: 'monospace', color: '#88FF88',
          });
          eatBtn.setScrollFactor(0).setInteractive({ useHandCursor: true });
          eatBtn.on('pointerdown', () => {
            this.onEat(item.id);
            this.hide();
          });
          this.container.add(eatBtn);
          btnX = panelX + panelW - 60;
        }

        if (this.onSell && item.sellValue > 0 && item.category !== 'gear') {
          const sellBtn = this.scene.add.text(btnX, yOffset, '[Sell]', {
            fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
          });
          sellBtn.setScrollFactor(0).setInteractive({ useHandCursor: true });
          sellBtn.on('pointerdown', () => {
            this.onSell(item.id);
            this.hide();
            this._buildUI(stash);
          });
          this.container.add(sellBtn);
        }

        yOffset += 26;
      });
    }
  }

  _filterItems(stash) {
    if (this.activeFilter === 'all') return stash;
    if (this.activeFilter === 'seeds') return stash.filter(i => i.category === 'seed');
    if (this.activeFilter === 'food') return stash.filter(i => i.category === 'food');
    if (this.activeFilter === 'materials') return stash.filter(i => !['seed', 'food', 'gear'].includes(i.category));
    return stash;
  }

  hide() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  isVisible() {
    return this.container !== null;
  }
}
