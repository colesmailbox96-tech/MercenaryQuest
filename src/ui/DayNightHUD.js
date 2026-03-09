export class DayNightHUD {
  constructor(scene) {
    this.scene = scene;
    this.gameScene = scene.scene.get('GameScene');
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(101);

    this.label = scene.add.text(0, 0, '☀ Day', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.label.setOrigin(1, 0);
    this.container.add(this.label);
  }

  create(x, y) {
    this.label.setPosition(x, y);
  }

  update() {
    if (!this.gameScene || !this.gameScene.dayNightSystem) return;
    const info = this.gameScene.dayNightSystem.getTimeOfDay();
    const phase = info.phase;
    const isNight = info.isNight;

    if (isNight) {
      const remaining = Math.max(0, info.timeUntilToggle);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      this.label.setText(`🌙 Night ${timeStr}`);
      this.label.setColor('#B0C4DE');
    } else if (phase === 'dusk') {
      const remaining = Math.max(0, info.timeUntilToggle);
      const secs = Math.floor(remaining / 1000);
      this.label.setText(`🌅 Night in 0:${secs.toString().padStart(2, '0')}`);
      this.label.setColor('#FF8C00');
    } else if (phase === 'dawn') {
      this.label.setText('🌅 Dawn');
      this.label.setColor('#FFD700');
    } else {
      this.label.setText('☀ Day');
      this.label.setColor('#DAA520');
    }
  }
}
