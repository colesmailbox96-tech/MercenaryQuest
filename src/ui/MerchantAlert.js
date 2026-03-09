export class MerchantAlert {
  constructor(scene) {
    this.scene = scene;
    this.gameScene = scene.scene.get('GameScene');
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);
    this.container.setVisible(false);

    this.banner = null;
    this.miniBar = null;
    this.zone = '';
    this.spawnedAt = 0;
    this.stayDuration = 0;
    this.active = false;
  }

  create() {
    const w = this.scene.scale.width;

    this.miniBar = this.scene.add.text(w / 2, 115, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#DAA520',
      backgroundColor: '#1A1A2EDD',
      padding: { x: 10, y: 4 },
    });
    this.miniBar.setOrigin(0.5);
    this.miniBar.setVisible(false);
    this.container.add(this.miniBar);

    this.gameScene.events.on('merchantSpawned', (data) => this.onSpawn(data));
    this.gameScene.events.on('merchantLeavingSoon', () => this.onLeavingSoon());
    this.gameScene.events.on('merchantDespawned', () => this.onDespawn());
  }

  onSpawn(data) {
    this.zone = data.zone;
    this.spawnedAt = Date.now();
    this.stayDuration = data.stayDuration;
    this.active = true;

    this.container.setVisible(true);
    this.miniBar.setVisible(true);
    this.miniBar.setColor('#DAA520');
  }

  onLeavingSoon() {
    if (this.miniBar) {
      this.miniBar.setColor('#FF4444');
    }
  }

  onDespawn() {
    this.active = false;
    if (this.miniBar) {
      this.scene.tweens.add({
        targets: this.miniBar,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          this.miniBar.setVisible(false);
          this.miniBar.setAlpha(1);
          this.container.setVisible(false);
        },
      });
    }
  }

  update() {
    if (!this.active) return;
    const elapsed = Date.now() - this.spawnedAt;
    const remaining = Math.max(0, this.stayDuration - elapsed);
    const secs = Math.ceil(remaining / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const zoneNames = { town: 'Town', forest: 'Forest', caves: 'Caves', swamp: 'Swamp', volcanic: 'Volcanic' };
    const zoneName = zoneNames[this.zone] || this.zone;
    let text = `🛒 ${zoneName} ${mins}:${s.toString().padStart(2, '0')}`;
    if (remaining < 15000) {
      text += ' — Leaving soon!';
    }
    this.miniBar.setText(text);
  }
}
