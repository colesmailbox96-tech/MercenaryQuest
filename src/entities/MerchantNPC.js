import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE } from '../config/constants.js';
import { MERCHANT_CONFIG } from '../config/merchantData.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

export class MerchantNPC extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY) {
    super(scene, tileX * DISPLAY_TILE + DISPLAY_TILE / 2, tileY * DISPLAY_TILE + DISPLAY_TILE / 2);

    this.tileX = tileX;
    this.tileY = tileY;
    this.spawnTileX = tileX;
    this.spawnTileY = tileY;
    this.interactionRadius = 2;

    this.sprite = scene.add.image(0, 0, MERCHANT_CONFIG.textureKey);
    this.add(this.sprite);

    this.nameTag = scene.add.text(0, -14, 'Wandering Merchant', {
      fontSize: '7px',
      fontFamily: 'monospace',
      color: MERCHANT_CONFIG.nameColor,
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.add(this.nameTag);

    this.setDepth(15);
    scene.add.existing(this);

    this.wanderTimer = scene.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.wander(),
    });
  }

  wander() {
    if (!this.active) return;
    const dx = Phaser.Math.Between(-1, 1);
    const dy = Phaser.Math.Between(-1, 1);
    const newX = this.spawnTileX + Phaser.Math.Clamp(this.tileX + dx - this.spawnTileX, -3, 3);
    const newY = this.spawnTileY + Phaser.Math.Clamp(this.tileY + dy - this.spawnTileY, -3, 3);

    this.tileX = newX;
    this.tileY = newY;
    this.scene.tweens.add({
      targets: this,
      x: newX * DISPLAY_TILE + DISPLAY_TILE / 2,
      y: newY * DISPLAY_TILE + DISPLAY_TILE / 2,
      duration: 800,
      ease: 'Linear',
    });
  }

  isPlayerInRange(player) {
    const dist = Phaser.Math.Distance.Between(this.tileX, this.tileY, player.tileX, player.tileY);
    return dist <= this.interactionRadius;
  }

  destroy() {
    if (this.wanderTimer) this.wanderTimer.destroy();
    super.destroy();
  }
}
