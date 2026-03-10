export class JuiceSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.events.on('combatCrit', ({ attacker, defender, damage }) => {
      this.hitFlash(defender, 0xffffff, 200);
      this.screenShake(0.01, 200);
    });

    this.scene.events.on('combatMiss', ({ attacker, defender }) => {
      this.floatingText(defender, 'MISS', { color: '#888888', scale: 0.8 });
      this.whiffTween(attacker, defender);
    });

    this.scene.events.on('combatDodge', ({ attacker, defender }) => {
      this.floatingText(defender, 'DODGE', { color: '#FFFFFF', scale: 0.9 });
      this.dodgeTween(defender);
    });
  }

  showDamageNumber(x, y, amount, isCrit = false) {
    const text = this.scene.add.text(x, y, `-${amount}`, {
      fontFamily: 'monospace',
      fontSize: isCrit ? '18px' : '14px',
      color: isCrit ? '#FFD700' : '#FFFFFF',
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

    if (isCrit) {
      const critLabel = this.scene.add.text(x, y - 16, 'CRIT!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(1000);

      this.scene.tweens.add({
        targets: critLabel,
        y: y - 56,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => critLabel.destroy(),
      });
    }
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

  floatingText(entity, text, options = {}) {
    const { color = '#FFFFFF', scale = 1.0 } = options;
    const floatX = entity.x;
    const floatY = entity.y - 16;
    const label = this.scene.add.text(floatX, floatY, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000).setScale(scale);

    this.scene.tweens.add({
      targets: label,
      y: floatY - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  whiffTween(attacker, defender) {
    const sprite = attacker.sprite || attacker;
    if (!sprite || !sprite.active) return;
    const dx = defender.x - attacker.x;
    const dy = defender.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const offsetX = (dx / dist) * 2;
    const offsetY = (dy / dist) * 2;
    const origX = sprite.x;
    const origY = sprite.y;

    this.scene.tweens.add({
      targets: sprite,
      x: origX + offsetX,
      y: origY + offsetY,
      duration: 75,
      ease: 'Power1',
      yoyo: true,
      onComplete: () => {
        sprite.x = origX;
        sprite.y = origY;
      },
    });
  }

  dodgeTween(defender) {
    const sprite = defender.sprite || defender;
    if (!sprite || !sprite.active) return;
    const origX = sprite.x;

    this.scene.tweens.add({
      targets: sprite,
      x: origX + 3,
      duration: 100,
      ease: 'Power1',
      yoyo: true,
      onComplete: () => {
        sprite.x = origX;
      },
    });
  }

  hitFlash(entity, color, duration) {
    const sprite = entity.sprite || entity;
    if (!sprite || !sprite.active) return;
    if (sprite._flashTimer) sprite._flashTimer.remove();
    sprite.setTint(color);
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
