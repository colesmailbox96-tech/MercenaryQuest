import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, PLAYER_SPEED } from '../config/constants.js';
import { isWalkable } from '../utils/mapGenerator.js';
import { getEffectiveStats } from '../systems/StatCalculator.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY) {
    super(scene, tileX * DISPLAY_TILE + DISPLAY_TILE / 2, tileY * DISPLAY_TILE + DISPLAY_TILE / 2);

    this.tileX = tileX;
    this.tileY = tileY;
    this.stats = { hp: 50, maxHp: 50, atk: 5, def: 2, level: 1, xp: 0, xpToNext: 25 };
    this.equipment = { weapon: null, helmet: null, chest: null, boots: null, accessory: null };
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

    // Gear visual overlay graphics
    this.gearOverlay = scene.make.graphics({ x: 0, y: 0, add: false });
    this.add(this.gearOverlay);

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
    const effective = getEffectiveStats(this);
    const ratio = this.stats.hp / effective.maxHp;
    this.hpFill.setScale(ratio, 1);
    this.scene.events.emit('playerStatsChanged', { ...this.stats, ...effective });
  }

  equip(slot, gearItem) {
    const existing = this.equipment[slot];
    if (existing) {
      existing.equippedBy = null;
      // Return to gear stash (only if not already there)
      if (!this.scene.lootSystem.gearStash.find(g => g.uid === existing.uid)) {
        this.scene.lootSystem.gearStash.push(existing);
      }
    }
    this.equipment[slot] = gearItem;
    gearItem.equippedBy = 'player';
    // Remove from gear stash
    this.scene.lootSystem.gearStash = this.scene.lootSystem.gearStash.filter(g => g.uid !== gearItem.uid);
    // Increase current HP by gear's maxHp bonus (base stat unchanged; getEffectiveStats provides the cap)
    if (gearItem.stats.maxHp) {
      this.stats.hp += gearItem.stats.maxHp;
    }
    this.updateVisuals();
    this.scene.events.emit('equipmentChanged', { entity: 'player' });
    this.updateHPBar();
  }

  unequip(slot) {
    const gearItem = this.equipment[slot];
    if (!gearItem) return;
    this.equipment[slot] = null;
    gearItem.equippedBy = null;
    // Clamp current HP to new effective maxHp (base stats, gear bonus now removed)
    if (gearItem.stats.maxHp) {
      const newEffectiveMax = getEffectiveStats(this).maxHp;
      this.stats.hp = Math.min(this.stats.hp, newEffectiveMax);
    }
    // Return to gear stash (only if not already there)
    if (!this.scene.lootSystem.gearStash.find(g => g.uid === gearItem.uid)) {
      this.scene.lootSystem.gearStash.push(gearItem);
    }
    this.updateVisuals();
    this.scene.events.emit('equipmentChanged', { entity: 'player' });
    this.updateHPBar();
  }

  updateVisuals() {
    const g = this.gearOverlay;
    g.clear();
    const eq = this.equipment;
    // Weapon: small 3×3 rectangle to the right
    if (eq.weapon) {
      g.fillStyle(eq.weapon.rarityColor, 1);
      g.fillRect(9, 5, 3, 3);
    }
    // Helmet: 1px line across top of head
    if (eq.helmet) {
      g.fillStyle(eq.helmet.rarityColor, 1);
      g.fillRect(5, 1, 6, 1);
    }
    // Chest: subtle tint on body area (2px border inside body)
    if (eq.chest) {
      g.fillStyle(eq.chest.rarityColor, 0.3);
      g.fillRect(4, 6, 8, 5);
    }
    // Boots: 1px accent at bottom
    if (eq.boots) {
      g.fillStyle(eq.boots.rarityColor, 1);
      g.fillRect(4, 14, 8, 1);
    }
    // Accessory: tiny 2×2 pulsing dot near entity
    if (eq.accessory) {
      g.fillStyle(eq.accessory.rarityColor, 1);
      g.fillRect(-10, -5, 2, 2);
    }
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
