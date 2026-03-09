export class MiniNotifications {
  constructor(scene) {
    this.scene = scene;
    this.activeNotifs = [];
    this.maxNotifs = 3;
  }

  showLoot(item) {
    const w = this.scene.scale.width;
    const yBase = this.scene.scale.height - 240;
    const y = yBase - (this.activeNotifs.length * 25);

    const text = this.scene.add.text(w + 50, y, `+1 ${item.name} ${item.emoji}`, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
      backgroundColor: '#1A1A2ECC',
      padding: { x: 8, y: 4 },
    });
    text.setScrollFactor(0);
    text.setDepth(250);

    this.activeNotifs.push(text);
    if (this.activeNotifs.length > this.maxNotifs) {
      const old = this.activeNotifs.shift();
      old.destroy();
    }

    // Slide in
    this.scene.tweens.add({
      targets: text,
      x: w - text.width - 20,
      duration: 300,
      ease: 'Power2',
    });

    // Slide out after 1.5s
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: text,
        x: w + 50,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.activeNotifs = this.activeNotifs.filter(n => n !== text);
          text.destroy();
        },
      });
    });
  }

  showLevelUp(stats) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    const banner = this.scene.add.text(w / 2, h / 2 - 50,
      `⭐ Level ${stats.level}! ATK +1, HP +5`, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#DAA520',
        backgroundColor: '#1A1A2EDD',
        padding: { x: 16, y: 8 },
      });
    banner.setOrigin(0.5);
    banner.setScrollFactor(0);
    banner.setDepth(260);

    this.scene.tweens.add({
      targets: banner,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: 2,
    });

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: 300,
        onComplete: () => banner.destroy(),
      });
    });
  }
}
