import Phaser from 'phaser';

export class Joystick {
  constructor(scene, x, y) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    this.direction = null;
    this.isActive = false;
    this.pointerId = null;

    this.ring = scene.add.image(x, y, 'ui_joystick_ring');
    this.ring.setAlpha(0.5);
    this.ring.setScrollFactor(0);
    this.ring.setDepth(200);

    this.nub = scene.add.image(x, y, 'ui_joystick_nub');
    this.nub.setAlpha(0.7);
    this.nub.setScrollFactor(0);
    this.nub.setDepth(201);

    // Create interactive zone
    this.zone = scene.add.zone(x, y, 120, 120);
    this.zone.setScrollFactor(0);
    this.zone.setDepth(202);
    this.zone.setInteractive();

    this.zone.on('pointerdown', (pointer) => {
      this.isActive = true;
      this.pointerId = pointer.id;
      this.updateDirection(pointer);
    });

    scene.input.on('pointermove', (pointer) => {
      if (this.isActive && pointer.id === this.pointerId) {
        this.updateDirection(pointer);
      }
    });

    scene.input.on('pointerup', (pointer) => {
      if (pointer.id === this.pointerId) {
        this.release();
      }
    });
  }

  updateDirection(pointer) {
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      this.direction = null;
      this.nub.setPosition(this.baseX, this.baseY);
      return;
    }

    // Clamp nub position
    const maxDist = 25;
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    this.nub.setPosition(
      this.baseX + Math.cos(angle) * clampedDist,
      this.baseY + Math.sin(angle) * clampedDist
    );

    // 8-directional snapping to 4 cardinals
    const deg = Phaser.Math.RadToDeg(angle);
    if (deg > -45 && deg <= 45) this.direction = 'right';
    else if (deg > 45 && deg <= 135) this.direction = 'down';
    else if (deg > -135 && deg <= -45) this.direction = 'up';
    else this.direction = 'left';
  }

  release() {
    this.isActive = false;
    this.direction = null;
    this.pointerId = null;

    this.scene.tweens.add({
      targets: this.nub,
      x: this.baseX,
      y: this.baseY,
      duration: 100,
      ease: 'Back.easeOut',
    });
  }

  getDirection() {
    return this.direction;
  }

  setVisible(visible) {
    this.ring.setVisible(visible);
    this.nub.setVisible(visible);
    this.zone.setVisible(visible);
  }
}
