import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';
import { isWalkable } from '../utils/mapGenerator.js';
import { distance, randomInt } from '../utils/helpers.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

export class Mob extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY, typeKey, typeData) {
    super(scene, tileX * DISPLAY_TILE + DISPLAY_TILE / 2, tileY * DISPLAY_TILE + DISPLAY_TILE / 2);

    this.tileX = tileX;
    this.tileY = tileY;
    this.typeKey = typeKey;
    this.zone = typeData.zone;
    this.stats = {
      hp: typeData.hp,
      maxHp: typeData.hp,
      atk: typeData.atk,
      def: typeData.def,
    };
    this.xpReward = typeData.xp;
    this.speed = typeData.speed;
    this.aggroRange = typeData.aggroRange;
    this.isMoving = false;
    this.inCombat = false;
    this.entityType = 'mob';
    this.wanderTimer = 0;
    this.wanderInterval = randomInt(typeData.wanderMin, typeData.wanderMax);

    this.sprite = scene.add.image(0, 0, typeData.textureKey);
    this.add(this.sprite);

    // HP bar
    this.hpBg = scene.add.image(0, -14, 'ui_hp_bg');
    this.hpBg.setOrigin(0.5);
    this.add(this.hpBg);

    this.hpFill = scene.add.image(-16, -14, 'ui_hp_fill');
    this.hpFill.setOrigin(0, 0.5);
    this.add(this.hpFill);

    scene.add.existing(this);
    this.setDepth(5);

    // Idle animation - gentle pulse
    scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(time, delta) {
    if (this.inCombat || !this.active) return;

    // Check aggro
    const player = this.scene.player;
    const agent = this.scene.agent;
    let closestTarget = null;
    let closestDist = Infinity;

    if (player) {
      const d = distance(this.tileX, this.tileY, player.tileX, player.tileY);
      if (d <= this.aggroRange && d < closestDist) {
        closestDist = d;
        closestTarget = player;
      }
    }

    if (agent && agent.active && agent.state !== 'RETREATING' && agent.state !== 'HEALING') {
      const d = distance(this.tileX, this.tileY, agent.tileX, agent.tileY);
      if (d <= this.aggroRange && d < closestDist) {
        closestDist = d;
        closestTarget = agent;
      }
    }

    if (closestTarget) {
      this.pursueTarget(closestTarget);
      return;
    }

    // Wander
    this.wanderTimer += delta;
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = randomInt(2000, 4000);
      this.wander();
    }
  }

  pursueTarget(target) {
    if (this.isMoving) return;

    // Move toward target one tile at a time
    let dx = target.tileX - this.tileX;
    let dy = target.tileY - this.tileY;

    let nextX = this.tileX;
    let nextY = this.tileY;

    if (Math.abs(dx) > Math.abs(dy)) {
      nextX += Math.sign(dx);
    } else {
      nextY += Math.sign(dy);
    }

    if (this.isInZone(nextX, nextY) && isWalkable(this.scene.mapData, nextX, nextY)) {
      this.moveToTile(nextX, nextY);
    }
  }

  wander() {
    if (this.isMoving) return;

    const dirs = [
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: 1, y: 0 },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = this.tileX + dir.x;
    const ny = this.tileY + dir.y;

    if (this.isInZone(nx, ny) && isWalkable(this.scene.mapData, nx, ny)) {
      this.moveToTile(nx, ny);
    }
  }

  isInZone(x, y) {
    if (this.zone === 'caves') {
      return y >= 0 && y < 10 && x >= 0 && x < MAP_WIDTH;
    }
    if (this.zone === 'forest') {
      return y >= 10 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH;
    }
    return true;
  }

  moveToTile(tileX, tileY) {
    this.isMoving = true;
    this.tileX = tileX;
    this.tileY = tileY;

    this.scene.tweens.add({
      targets: this,
      x: tileX * DISPLAY_TILE + DISPLAY_TILE / 2,
      y: tileY * DISPLAY_TILE + DISPLAY_TILE / 2,
      duration: this.speed,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  takeDamage(amount) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.updateHPBar();
  }

  heal(amount) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    this.updateHPBar();
  }

  updateHPBar() {
    const ratio = this.stats.hp / this.stats.maxHp;
    this.hpFill.setScale(ratio, 1);
  }

  die() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
