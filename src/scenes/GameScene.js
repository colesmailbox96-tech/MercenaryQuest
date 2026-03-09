import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, MAP_WIDTH, MAP_HEIGHT, BUILDINGS } from '../config/constants.js';
import { generateMap, getTileAt } from '../utils/mapGenerator.js';
import { Player } from '../entities/Player.js';
import { Agent } from '../entities/Agent.js';
import { Pathfinding } from '../systems/Pathfinding.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { Spawner } from '../systems/Spawner.js';
import { distance } from '../utils/helpers.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.mapData = generateMap();
    this.pathfinding = new Pathfinding(this.mapData);
    this.combatSystem = new CombatSystem(this);
    this.lootSystem = new LootSystem(this);
    this.spawner = new Spawner(this, this.mapData);
    this.agent = null;
    this.viewTarget = 'player';

    this.createTilemap();
    this.createPlayer();
    this.spawner.spawnInitial();

    this.setupCamera();
    this.setupInput();
    this.setupCombatHandlers();

    this.scene.launch('HUDScene');

    this.events.emit('goldChanged', this.lootSystem.gold);
    this.events.emit('playerStatsChanged', this.player.stats);
  }

  createTilemap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.mapData[y][x];
        const img = this.add.image(
          x * DISPLAY_TILE + DISPLAY_TILE / 2,
          y * DISPLAY_TILE + DISPLAY_TILE / 2,
          tile.textureKey
        );
        img.setDisplaySize(DISPLAY_TILE, DISPLAY_TILE);
        img.setDepth(0);
      }
    }

    // World bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH * DISPLAY_TILE, MAP_HEIGHT * DISPLAY_TILE);
  }

  createPlayer() {
    this.player = new Player(this, 19, 20);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * DISPLAY_TILE, MAP_HEIGHT * DISPLAY_TILE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D'),
    };
    this.eKey = this.input.keyboard.addKey('E');
    this.iKey = this.input.keyboard.addKey('I');
    this.tabKey = this.input.keyboard.addKey('TAB');

    // Action button from HUD
    this.events.on('actionButtonPressed', () => this.handleAction());
    this.events.on('toggleView', () => this.toggleView());
    this.events.on('openInventory', () => this.events.emit('showInventory'));
  }

  setupCombatHandlers() {
    this.events.on('entityDeath', (deadEntity, killer) => {
      if (deadEntity.entityType === 'mob') {
        // Grant XP
        if (killer.entityType === 'player') {
          killer.gainXP(deadEntity.xpReward);
        } else if (killer.entityType === 'agent') {
          killer.gainXP(deadEntity.xpReward);
        }

        // Roll loot
        const item = this.lootSystem.rollDrop(deadEntity.typeKey);
        if (item) {
          if (killer.entityType === 'player') {
            this.lootSystem.addToStash(item);
          } else if (killer.entityType === 'agent') {
            if (!killer.addItem(item)) {
              this.lootSystem.addToStash(item);
            }
          }
          this.showLootPickup(deadEntity.x, deadEntity.y, item);
        }

        // Kill mob
        deadEntity.die();
        this.spawner.onMobDeath(deadEntity);

        // Notify agent combat ended
        if (killer.entityType === 'agent') {
          killer.onCombatEnd(true);
        }
      } else if (deadEntity.entityType === 'player') {
        // Player death - respawn in town
        deadEntity.stats.hp = deadEntity.stats.maxHp;
        deadEntity.updateHPBar();
        deadEntity.tileX = 19;
        deadEntity.tileY = 20;
        deadEntity.setPosition(19 * DISPLAY_TILE + DISPLAY_TILE / 2, 20 * DISPLAY_TILE + DISPLAY_TILE / 2);
      } else if (deadEntity.entityType === 'agent') {
        deadEntity.onCombatEnd(false);
      }
    });
  }

  showLootPickup(x, y, item) {
    const text = this.add.text(x, y, item.emoji, {
      fontSize: '16px',
    });
    text.setOrigin(0.5);
    text.setDepth(50);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  handleAction() {
    if (this.player.inCombat) return;

    // Check adjacent buildings
    const adjacent = this.player.getAdjacentTiles();
    for (const pos of adjacent) {
      const tile = getTileAt(this.mapData, pos.x, pos.y);
      if (tile && tile.type === 'building') {
        this.interactWithBuilding(tile.buildingType);
        return;
      }
    }
  }

  interactWithBuilding(buildingType) {
    if (buildingType === 'tavern') {
      if (!this.agent && this.lootSystem.spendGold(BUILDINGS.tavern.hireCost)) {
        this.agent = new Agent(this, 19, 19);
        this.events.emit('agentHired');
        this.events.emit('agentStateChanged', this.agent.state);
      }
    } else if (buildingType === 'shop') {
      this.scene.launch('ShopScene');
    }
  }

  toggleView() {
    if (!this.agent) return;

    this.viewTarget = this.viewTarget === 'player' ? 'agent' : 'player';
    const target = this.viewTarget === 'player' ? this.player : this.agent;

    this.cameras.main.startFollow(target, true, 0.1, 0.1);
    this.events.emit('viewTargetChanged', this.viewTarget);

    if (this.viewTarget === 'agent') {
      this.events.emit('agentStatsChanged', this.agent.stats);
    } else {
      this.events.emit('playerStatsChanged', this.player.stats);
    }
  }

  update(time, delta) {
    this.handleMovement();

    // Update agent
    if (this.agent && this.agent.active) {
      this.agent.update(time, delta);
    }

    // Update mobs
    for (const mob of this.spawner.getMobs()) {
      mob.update(time, delta);
    }

    // Check combat overlaps
    this.checkCombatOverlaps();

    // Check context actions
    this.updateContextAction();

    // Keyboard shortcuts
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.handleAction();
    }
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.toggleView();
    }
  }

  handleMovement() {
    if (this.player.isMoving || this.player.inCombat) return;

    let dir = null;

    // Get joystick direction from HUD
    const hudScene = this.scene.get('HUDScene');
    if (hudScene && hudScene.joystick) {
      dir = hudScene.joystick.getDirection();
    }

    // Keyboard fallback
    if (!dir) {
      if (this.cursors.up.isDown || this.wasd.w.isDown) dir = 'up';
      else if (this.cursors.down.isDown || this.wasd.s.isDown) dir = 'down';
      else if (this.cursors.left.isDown || this.wasd.a.isDown) dir = 'left';
      else if (this.cursors.right.isDown || this.wasd.d.isDown) dir = 'right';
    }

    if (!dir) return;

    let dx = 0, dy = 0;
    if (dir === 'up') dy = -1;
    else if (dir === 'down') dy = 1;
    else if (dir === 'left') dx = -1;
    else if (dir === 'right') dx = 1;

    this.player.setFacing(dir);
    this.player.moveTo(this.player.tileX + dx, this.player.tileY + dy, this.mapData);
  }

  checkCombatOverlaps() {
    const entities = [this.player];
    if (this.agent && this.agent.active && this.agent.state !== 'RETREATING' && this.agent.state !== 'HEALING') {
      entities.push(this.agent);
    }

    for (const entity of entities) {
      if (entity.inCombat) continue;

      for (const mob of this.spawner.getMobs()) {
        if (mob.inCombat || !mob.active) continue;
        if (entity.tileX === mob.tileX && entity.tileY === mob.tileY) {
          this.combatSystem.startCombat(entity, mob);
          break;
        }
      }
    }
  }

  updateContextAction() {
    const adjacent = this.player.getAdjacentTiles();
    let contextAction = null;

    for (const pos of adjacent) {
      const tile = getTileAt(this.mapData, pos.x, pos.y);
      if (tile && tile.type === 'building') {
        contextAction = { type: 'building', name: BUILDINGS[tile.buildingType]?.name || tile.buildingType };
        break;
      }
    }

    this.events.emit('contextAction', contextAction);
  }
}
