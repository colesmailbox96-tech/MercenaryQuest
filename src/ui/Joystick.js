import Phaser from 'phaser';

/**
 * Floating joystick that appears at the touch point within a dedicated zone.
 * The ring/nub are hidden until the user touches inside the zone, then they
 * appear at the touch origin and track finger movement to determine direction.
 */
export class Joystick {
  constructor(scene, zoneX, zoneY, zoneW, zoneH) {
    this.scene = scene;
    this.baseX = 0;
    this.baseY = 0;
    this.direction = null;
    this.isActive = false;
    this.pointerId = null;

    // Ring and nub start hidden
    this.ring = scene.add.image(0, 0, 'ui_joystick_ring');
    this.ring.setAlpha(0);
    this.ring.setScrollFactor(0);
    this.ring.setDepth(200);

    this.nub = scene.add.image(0, 0, 'ui_joystick_nub');
    this.nub.setAlpha(0);
    this.nub.setScrollFactor(0);
    this.nub.setDepth(201);

    // Create a large invisible touch zone covering the designated screen area
    this.zone = scene.add.zone(zoneX, zoneY, zoneW, zoneH);
    this.zone.setScrollFactor(0);
    this.zone.setDepth(150);
    this.zone.setInteractive();

    this.zone.on('pointerdown', (pointer) => {
      this.isActive = true;
      this.pointerId = pointer.id;
      this.baseX = pointer.x;
      this.baseY = pointer.y;

      // Show ring/nub at touch point
      this.ring.setPosition(this.baseX, this.baseY);
      this.ring.setAlpha(0.5);
      this.nub.setPosition(this.baseX, this.baseY);
      this.nub.setAlpha(0.7);
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

    // Fade out ring and nub
    this.scene.tweens.add({
      targets: [this.ring, this.nub],
      alpha: 0,
      duration: 150,
      ease: 'Power2',
    });
  }

  getDirection() {
    return this.direction;
  }

  setVisible(visible) {
    this.zone.setVisible(visible);
    if (!visible) {
      this.ring.setAlpha(0);
      this.nub.setAlpha(0);
    }
  }
}
