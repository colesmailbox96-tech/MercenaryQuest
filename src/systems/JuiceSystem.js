export class JuiceSystem {
  constructor(scene) {
    this.scene = scene;
  }

  showDamageNumber(x, y, amount, isCrit = false) {
    const text = this.scene.add.text(x, y, `-${amount}`, {
      fontFamily: 'monospace',
      fontSize: isCrit ? '18px' : '14px',
      color: isCrit ? '#FF4444' : '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showHealNumber(x, y, amount) {
    const text = this.scene.add.text(x, y, `+${amount}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#4CAF50',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showXPNumber(x, y, amount) {
    const text = this.scene.add.text(x, y, `+${amount} XP`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  showGoldNumber(x, y, amount) {
    const text = this.scene.add.text(x, y, `+${amount}g`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000);

    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  screenShake(intensity = 0.005, duration = 100) {
    this.scene.cameras.main.shake(duration, intensity);
  }

  entityFlash(sprite, duration = 100) {
    if (!sprite || !sprite.active) return;
    if (sprite._flashTimer) sprite._flashTimer.remove();
    sprite.setTint(0xffffff);
    sprite._flashTimer = this.scene.time.delayedCall(duration, () => {
      if (sprite && sprite.active) {
        sprite.clearTint();
      }
      sprite._flashTimer = null;
    });
  }

  levelUpBurst(x, y, isSkill = false) {
    const color = isSkill ? 0x00e5ff : 0xdaa520;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = this.scene.add.circle(x, y, 3, color).setDepth(999);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
