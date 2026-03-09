import Phaser from 'phaser';

export class Companion extends Phaser.GameObjects.Container {
  constructor(scene, x, y, definition) {
    super(scene, x, y);
    this.def = definition;
    this.followTarget = null;
    this.idleTime = 0;
    this.isIdle = false;
    this.hopLoop = null;

    this.sprite = scene.add.sprite(0, 0, definition.textureKey);
    this.add(this.sprite);

    this.nameTag = scene.add.text(0, -12, definition.name, {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.nameTag.setAlpha(0);
    this.add(this.nameTag);

    this.setDepth(50);
    scene.add.existing(this);
  }

  follow(player, delta) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const followDist = this.def.followDistance * 16;

    if (dist > followDist + 4) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.def.moveSpeed * 60;
      this.x += Math.cos(angle) * speed * (delta / 1000);
      this.y += Math.sin(angle) * speed * (delta / 1000);
      this.idleTime = 0;
      this.isIdle = false;
    } else if (dist > followDist) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.def.moveSpeed * 20;
      this.x += Math.cos(angle) * speed * (delta / 1000);
      this.y += Math.sin(angle) * speed * (delta / 1000);
      this.idleTime = 0;
    } else {
      this.idleTime += delta;
      if (this.idleTime > 3000 && !this.isIdle) {
        this.isIdle = true;
        this.playIdleAnimation();
      }
    }

    if (dist > 8 * 16) {
      this.x = player.x - followDist;
      this.y = player.y;
    }

    if (player.x < this.x) this.sprite.setFlipX(true);
    else if (player.x > this.x) this.sprite.setFlipX(false);
  }

  playIdleAnimation() {
    switch (this.def.idleAnimation) {
      case 'sit':
        this.scene.tweens.add({
          targets: this.sprite, scaleY: 0.85, duration: 300, yoyo: false,
        });
        break;
      case 'hop':
        this.hopLoop = this.scene.time.addEvent({
          delay: 2500,
          loop: true,
          callback: () => {
            this.scene.tweens.add({
              targets: this, y: this.y - 4, duration: 200,
              yoyo: true, ease: 'Quad.easeOut',
            });
          },
        });
        break;
      case 'perch':
        break;
    }
  }

  showName() {
    this.scene.tweens.add({
      targets: this.nameTag, alpha: 1, duration: 200,
      hold: 2000, yoyo: true,
    });
  }

  destroy() {
    if (this.hopLoop) this.hopLoop.destroy();
    super.destroy();
  }
}
