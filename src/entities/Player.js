import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, PLAYER_SPEED } from '../config/constants.js';
import { isWalkable } from '../utils/mapGenerator.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY) {
    super(scene, tileX * DISPLAY_TILE + DISPLAY_TILE / 2, tileY * DISPLAY_TILE + DISPLAY_TILE / 2);

    this.tileX = tileX;
    this.tileY = tileY;
    this.stats = { hp: 50, maxHp: 50, atk: 5, def: 2, level: 1, xp: 0, xpToNext: 25 };
    this.isMoving = false;
    this.facing = 'down';
    this.inCombat = false;
    this.entityType = 'player';

    this.sprite = scene.add.image(0, 0, 'entity_player_down');
    this.add(this.sprite);

    // HP bar
    this.hpBg = scene.add.image(0, -14, 'ui_hp_bg');
    this.hpBg.setOrigin(0.5);
    this.add(this.hpBg);

    this.hpFill = scene.add.image(-16, -14, 'ui_hp_fill');
    this.hpFill.setOrigin(0, 0.5);
    this.add(this.hpFill);

    scene.add.existing(this);
    this.setDepth(10);
  }

  moveTo(tileX, tileY, map) {
    if (this.isMoving || this.inCombat) return false;
    if (!isWalkable(map, tileX, tileY)) return false;

    this.isMoving = true;
    this.tileX = tileX;
    this.tileY = tileY;

    const targetX = tileX * DISPLAY_TILE + DISPLAY_TILE / 2;
    const targetY = tileY * DISPLAY_TILE + DISPLAY_TILE / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: PLAYER_SPEED,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });

    return true;
  }

  setFacing(direction) {
    if (this.facing === direction) return;
    this.facing = direction;
    this.sprite.setTexture(`entity_player_${direction}`);
  }

  takeDamage(amount) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.updateHPBar();
  }

  heal(amount) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    this.updateHPBar();
  }

  gainXP(amount) {
    this.stats.xp += amount;
    let leveledUp = false;
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.maxHp += 5;
      this.stats.hp = this.stats.maxHp;
      this.stats.atk += 1;
      this.stats.def += 1;
      this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
      leveledUp = true;
    }
    if (leveledUp) {
      this.scene.events.emit('levelUp', this.stats);
    }
    this.scene.events.emit('playerStatsChanged', this.stats);
    this.updateHPBar();
    return leveledUp;
  }

  updateHPBar() {
    const ratio = this.stats.hp / this.stats.maxHp;
    this.hpFill.setScale(ratio, 1);
    this.scene.events.emit('playerStatsChanged', this.stats);
  }

  getAdjacentTiles() {
    return [
      { x: this.tileX, y: this.tileY - 1 },
      { x: this.tileX, y: this.tileY + 1 },
      { x: this.tileX - 1, y: this.tileY },
      { x: this.tileX + 1, y: this.tileY },
    ];
  }
}
