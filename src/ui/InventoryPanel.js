export class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.container = null;
  }

  show(stash, onSell) {
    if (this.container) this.hide();

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const panelW = w * 0.8;
    const panelH = h * 0.7;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(300);
    this.container.setScrollFactor(0);

    // Backdrop
    const backdrop = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    backdrop.setScrollFactor(0);
    backdrop.setInteractive();
    backdrop.on('pointerdown', () => this.hide());
    this.container.add(backdrop);

    // Panel
    const panel = this.scene.add.rectangle(w / 2, h / 2, panelW, panelH, 0x1A1A2E, 0.95);
    panel.setScrollFactor(0);
    panel.setInteractive(); // absorb clicks
    this.container.add(panel);

    // Title
    const title = this.scene.add.text(w / 2, panelY + 20, '📦 Inventory', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    title.setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this.container.add(title);

    // Close button
    const closeBtn = this.scene.add.text(panelX + panelW - 15, panelY + 10, '✕', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setScrollFactor(0);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Items list
    let yOffset = panelY + 55;
    if (stash.length === 0) {
      const empty = this.scene.add.text(w / 2, yOffset, 'No items', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#888',
      });
      empty.setOrigin(0.5, 0);
      empty.setScrollFactor(0);
      this.container.add(empty);
    } else {
      stash.forEach(item => {
        const row = this.scene.add.text(panelX + 20, yOffset,
          `${item.emoji} ${item.name} ×${item.quantity}  —  ${item.sellValue}g`, {
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#F5E6C8',
        });
        row.setScrollFactor(0);
        this.container.add(row);

        if (onSell && item.sellValue > 0) {
          const sellBtn = this.scene.add.text(panelX + panelW - 60, yOffset, '[SELL]', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#DAA520',
          });
          sellBtn.setScrollFactor(0);
          sellBtn.setInteractive({ useHandCursor: true });
          sellBtn.on('pointerdown', () => {
            onSell(item.id);
            this.hide();
            this.show(this.scene.scene.get('GameScene')?.lootSystem?.sharedStash || stash, onSell);
          });
          this.container.add(sellBtn);
        }

        yOffset += 28;
      });
    }
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
