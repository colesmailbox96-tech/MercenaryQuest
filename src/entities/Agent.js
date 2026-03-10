import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, AGENT_SPEED, AGENT_RETREAT_SPEED } from '../config/constants.js';
import { isWalkable } from '../utils/mapGenerator.js';
import { distance } from '../utils/helpers.js';
import { getEffectiveStats } from '../systems/StatCalculator.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;
const AGENT_INV_MAX = 10;

export class Agent extends Phaser.GameObjects.Container {
  constructor(scene, tileX, tileY) {
    super(scene, tileX * DISPLAY_TILE + DISPLAY_TILE / 2, tileY * DISPLAY_TILE + DISPLAY_TILE / 2);

    this.tileX = tileX;
    this.tileY = tileY;
    this.stats = { hp: 40, maxHp: 40, atk: 4, def: 2, level: 1, xp: 0, xpToNext: 25 };
    this.equipment = { weapon: null, helmet: null, chest: null, boots: null, accessory: null };
    this.isMoving = false;
    this.facing = 'down';
    this.inCombat = false;
    this.entityType = 'agent';
    this.state = 'IDLE';
    this.inventory = [];
    this.currentPath = [];
    this.pathTimer = 0;
    this.targetMob = null;

    // Agent AI config (persisted)
    this.config = {
      zonePreference: 'auto',   // 'auto' | 'forest' | 'caves' | 'swamp' | 'volcanic'
      retreatThreshold: 0.25,   // HP percentage to trigger retreat
    };

    // Session stats (NOT persisted — reset each page load)
    this.sessionStats = {
      kills: 0,
      goldEarned: 0,
      gearFound: 0,
      deaths: 0,
      tripsCompleted: 0,
    };

    this.consecutiveDeaths = 0;
    this.currentTargetZone = null;

    this.sprite = scene.add.image(0, 0, 'entity_agent_down');
    this.add(this.sprite);

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

    this.state = 'HUNTING';
    scene.events.emit('agentStateChanged', this.state);
  }

  update(time, delta) {
    if (this.inCombat) return;

    this.pathTimer += delta;

    switch (this.state) {
      case 'HUNTING':
        this.doHunting(time, delta);
        break;
      case 'RETURNING':
        this.doReturning(time, delta);
        break;
      case 'DEPOSITING':
        this.doDepositing();
        break;
      case 'RETREATING':
        this.doRetreating(time, delta);
        break;
    }
  }

  doHunting(time, delta) {
    const mobs = this.scene.spawner.getMobs();
    if (mobs.length === 0) return;

    // Check retreat threshold
    const effectiveStats = getEffectiveStats(this);
    const hpPercent = this.stats.hp / effectiveStats.maxHp;
    if (hpPercent <= this.config.retreatThreshold) {
      this.state = 'RETREATING';
      this.currentPath = [];
      this.scene.events.emit('agentStateChanged', this.state);
      this.scene.events.emit('combatLogEntry', {
        type: 'agent_retreat',
        message: `Agent retreats at ${Math.round(hpPercent * 100)}% HP`,
      });
      return;
    }

    // Night morale check — retreat earlier without Lantern
    if (this.scene.dayNightSystem && this.scene.dayNightSystem.isNight) {
      const hasLantern = this.equipment.accessory &&
        this.equipment.accessory.perk === 'night_vision';
      if (!hasLantern) {
        // Retreat at 40% HP instead of on death
        if (this.stats.hp < this.stats.maxHp * 0.40) {
          this.state = 'RETREATING';
          this.currentPath = [];
          this.scene.events.emit('agentStateChanged', this.state);
          return;
        }
      }
    }

    // Find nearest mob (filtered by zone preference)
    if (!this.targetMob || !this.targetMob.active || this.pathTimer > 2000) {
      let nearest = null;
      let nearestDist = Infinity;
      for (const mob of mobs) {
        if (!mob.active || mob.inCombat) continue;
        // Zone preference filtering
        if (this.config.zonePreference !== 'auto') {
          const tile = this.scene.mapData[mob.tileY]?.[mob.tileX];
          if (tile?.zone && tile.zone !== this.config.zonePreference) continue;
        }
        const d = distance(this.tileX, this.tileY, mob.tileX, mob.tileY);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = mob;
        }
      }
      if (nearest) {
        this.targetMob = nearest;
        // Track current zone
        const mobTile = this.scene.mapData[nearest.tileY]?.[nearest.tileX];
        this.currentTargetZone = mobTile?.zone || 'unknown';
        this.currentPath = this.scene.pathfinding.findPath(this.tileX, this.tileY, nearest.tileX, nearest.tileY);
        this.pathTimer = 0;
      }
    }

    this.followPath(AGENT_SPEED);
  }

  doReturning(time, delta) {
    // Town center at (19, 19)
    if (this.currentPath.length === 0 || this.pathTimer > 2000) {
      this.currentPath = this.scene.pathfinding.findPath(this.tileX, this.tileY, 19, 19);
      this.pathTimer = 0;
    }

    if (this.tileX >= 15 && this.tileX <= 24 && this.tileY >= 15 && this.tileY <= 24) {
      this.state = 'DEPOSITING';
      this.scene.events.emit('agentStateChanged', this.state);
      return;
    }

    this.followPath(AGENT_SPEED);
  }

  doDepositing() {
    if (this.inventory.length === 0) {
      this.state = 'HUNTING';
      this.currentPath = [];
      this.targetMob = null;
      this.scene.events.emit('agentStateChanged', this.state);
      return;
    }

    const item = this.inventory.shift();
    this.scene.lootSystem.addToStash(item);

    this.scene.time.delayedCall(200, () => {
      if (this.active) {
        this.doDepositing();
      }
    });
  }

  doRetreating(time, delta) {
    this.setAlpha(0.5);

    if (this.currentPath.length === 0 || this.pathTimer > 2000) {
      this.currentPath = this.scene.pathfinding.findPath(this.tileX, this.tileY, 19, 19);
      this.pathTimer = 0;
    }

    if (this.tileX >= 15 && this.tileX <= 24 && this.tileY >= 15 && this.tileY <= 24) {
      // Heal over 3 seconds
      this.setAlpha(1);
      const healInterval = this.scene.time.addEvent({
        delay: 300,
        repeat: 9,
        callback: () => {
          this.heal(Math.ceil(this.stats.maxHp / 10));
          if (this.stats.hp >= this.stats.maxHp) {
            healInterval.destroy();
            this.state = 'HUNTING';
            this.currentPath = [];
            this.targetMob = null;
            this.scene.events.emit('agentStateChanged', this.state);
          }
        },
      });
      this.state = 'HEALING';
      return;
    }

    this.followPath(AGENT_RETREAT_SPEED);
  }

  followPath(speed) {
    if (this.isMoving || this.currentPath.length === 0) return;

    // Night debuff: 25% slower without Lantern
    if (this.scene.dayNightSystem && this.scene.dayNightSystem.isNight) {
      const hasLantern = this.equipment.accessory &&
        this.equipment.accessory.perk === 'night_vision';
      if (!hasLantern) {
        speed = Math.floor(speed * 1.25); // Higher duration = slower movement
      }
    }

    const next = this.currentPath.shift();
    if (!next) return;

    // Set facing
    if (next.x > this.tileX) this.setFacing('right');
    else if (next.x < this.tileX) this.setFacing('left');
    else if (next.y > this.tileY) this.setFacing('down');
    else if (next.y < this.tileY) this.setFacing('up');

    if (!isWalkable(this.scene.mapData, next.x, next.y)) {
      this.currentPath = [];
      return;
    }

    this.isMoving = true;
    this.tileX = next.x;
    this.tileY = next.y;

    const targetX = next.x * DISPLAY_TILE + DISPLAY_TILE / 2;
    const targetY = next.y * DISPLAY_TILE + DISPLAY_TILE / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: speed,
      ease: 'Linear',
      onComplete: () => {
        this.isMoving = false;
      },
    });
  }

  setFacing(direction) {
    if (this.facing === direction) return;
    this.facing = direction;
    this.sprite.setTexture(`entity_agent_${direction}`);
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
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.maxHp += 5;
      this.stats.hp = this.stats.maxHp;
      this.stats.atk += 1;
      this.stats.def += 1;
      this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.5);
    }
    this.updateHPBar();
  }

  addItem(item) {
    if (!item) return false;
    if (item.id === 'goldCoin') {
      this.scene.lootSystem.gold += 1;
      this.scene.events.emit('goldChanged', this.scene.lootSystem.gold);
      return true;
    }
    if (this.inventory.length >= AGENT_INV_MAX) return false;
    this.inventory.push(item);
    return true;
  }

  isInventoryFull() {
    return this.inventory.length >= AGENT_INV_MAX;
  }

  updateHPBar() {
    const effective = getEffectiveStats(this);
    const ratio = this.stats.hp / effective.maxHp;
    this.hpFill.setScale(ratio, 1);
    this.scene.events.emit('agentStatsChanged', { ...this.stats, ...effective });
  }

  equip(slot, gearItem) {
    const existing = this.equipment[slot];
    if (existing) {
      existing.equippedBy = null;
      if (!this.scene.lootSystem.gearStash.find(g => g.uid === existing.uid)) {
        this.scene.lootSystem.gearStash.push(existing);
      }
    }
    this.equipment[slot] = gearItem;
    gearItem.equippedBy = 'agent';
    this.scene.lootSystem.gearStash = this.scene.lootSystem.gearStash.filter(g => g.uid !== gearItem.uid);
    // Increase current HP by gear's maxHp bonus (base stat unchanged; getEffectiveStats provides the cap)
    if (gearItem.stats.maxHp) {
      this.stats.hp += gearItem.stats.maxHp;
    }
    this.updateVisuals();
    this.scene.events.emit('equipmentChanged', { entity: 'agent' });
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
    if (!this.scene.lootSystem.gearStash.find(g => g.uid === gearItem.uid)) {
      this.scene.lootSystem.gearStash.push(gearItem);
    }
    this.updateVisuals();
    this.scene.events.emit('equipmentChanged', { entity: 'agent' });
    this.updateHPBar();
  }

  updateVisuals() {
    const g = this.gearOverlay;
    g.clear();
    const eq = this.equipment;
    if (eq.weapon) {
      g.fillStyle(eq.weapon.rarityColor, 1);
      g.fillRect(9, 5, 3, 3);
    }
    if (eq.helmet) {
      g.fillStyle(eq.helmet.rarityColor, 1);
      g.fillRect(5, 1, 6, 1);
    }
    if (eq.chest) {
      g.fillStyle(eq.chest.rarityColor, 0.3);
      g.fillRect(4, 6, 8, 5);
    }
    if (eq.boots) {
      g.fillStyle(eq.boots.rarityColor, 1);
      g.fillRect(4, 14, 8, 1);
    }
    if (eq.accessory) {
      g.fillStyle(eq.accessory.rarityColor, 1);
      g.fillRect(-10, -5, 2, 2);
    }
  }

  onCombatEnd(killed) {
    if (this.stats.hp <= 0) {
      this.sessionStats.deaths++;
      this.consecutiveDeaths++;
      // Warn after 3 consecutive deaths in locked zone
      if (this.consecutiveDeaths >= 3 && this.config.zonePreference !== 'auto') {
        const zone = this.config.zonePreference.charAt(0).toUpperCase() + this.config.zonePreference.slice(1);
        this.scene.events.emit('combatLogEntry', {
          type: 'agent_death',
          message: `Agent is struggling in ${zone}. Consider switching zones or upgrading gear.`,
        });
      }
      this.state = 'RETREATING';
      this.currentPath = [];
      this.scene.events.emit('agentStateChanged', this.state);
      return;
    }

    if (killed) {
      this.consecutiveDeaths = 0;
    }

    // Check retreat threshold after combat
    const effectiveStats = getEffectiveStats(this);
    const hpPercent = this.stats.hp / effectiveStats.maxHp;
    if (hpPercent <= this.config.retreatThreshold) {
      this.state = 'RETREATING';
      this.currentPath = [];
      this.scene.events.emit('agentStateChanged', this.state);
      this.scene.events.emit('combatLogEntry', {
        type: 'agent_retreat',
        message: `Agent retreats at ${Math.round(hpPercent * 100)}% HP`,
      });
      return;
    }

    if (this.isInventoryFull()) {
      this.sessionStats.tripsCompleted++;
      this.state = 'RETURNING';
      this.currentPath = [];
      this.scene.events.emit('agentStateChanged', this.state);
    } else {
      this.state = 'HUNTING';
      this.targetMob = null;
      this.currentPath = [];
      this.scene.events.emit('agentStateChanged', this.state);
    }
  }
}
