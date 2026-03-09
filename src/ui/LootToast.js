import { RARITY } from '../config/gearData.js';

export class LootToast {
  constructor(scene) {
    this.scene = scene;
    this.activeToasts = [];
    this.maxToasts = 4;
    this.toastY = null;
  }

  _getBaseY() {
    return this.scene.scale.height - 240;
  }

  showMaterial(item) {
    this._show(`+1 ${item.name} ${item.emoji}`, '#F5E6C8');
  }

  showGear(gearItem) {
    const rarityData = RARITY[gearItem.rarity] || RARITY.COMMON;
    const color = '#' + rarityData.color.toString(16).padStart(6, '0');
    const statsStr = Object.entries(gearItem.stats)
      .map(([k, v]) => `${k.toUpperCase()} +${v}`)
      .join(', ');
    const label = `${gearItem.icon} ${gearItem.name} (${statsStr})`;
    this._show(label, color);

    // Rare+: screen-edge flash
    if (gearItem.rarity === 'RARE' || gearItem.rarity === 'EPIC') {
      this._screenFlash(rarityData.color);
    }
    // Epic: camera shake
    if (gearItem.rarity === 'EPIC') {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene && gameScene.cameras && gameScene.cameras.main) {
        gameScene.cameras.main.shake(300, 0.008);
      }
    }
  }

  _screenFlash(color) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, color, 0.25);
    flash.setScrollFactor(0);
    flash.setDepth(500);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  _show(label, color) {
    const w = this.scene.scale.width;
    // Reposition existing toasts upward
    this.activeToasts.forEach(t => {
      this.scene.tweens.add({
        targets: t,
        y: t.y - 26,
        duration: 150,
        ease: 'Power1',
      });
    });

    const yBase = this._getBaseY();
    const text = this.scene.add.text(w + 50, yBase, label, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color,
      backgroundColor: '#1A1A2ECC',
      padding: { x: 8, y: 4 },
    });
    text.setScrollFactor(0);
    text.setDepth(250);

    this.activeToasts.push(text);
    if (this.activeToasts.length > this.maxToasts) {
      const old = this.activeToasts.shift();
      if (old && old.active) old.destroy();
    }

    // Slide in
    this.scene.tweens.add({
      targets: text,
      x: w - text.width - 20,
      duration: 300,
      ease: 'Power2',
    });

    // Auto-dismiss after 2.5s
    this.scene.time.delayedCall(2500, () => {
      if (!text.active) return;
      this.scene.tweens.add({
        targets: text,
        x: w + 50,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.activeToasts = this.activeToasts.filter(n => n !== text);
          if (text.active) text.destroy();
        },
      });
    });
  }
}
