import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, MAP_WIDTH, MAP_HEIGHT, BUILDINGS, KITCHEN_TILE } from '../config/constants.js';
import { generateMap, getTileAt } from '../utils/mapGenerator.js';
import { Player } from '../entities/Player.js';
import { Agent } from '../entities/Agent.js';
import { FarmPlot } from '../entities/FarmPlot.js';
import { Pathfinding } from '../systems/Pathfinding.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { Spawner } from '../systems/Spawner.js';
import { FishingSystem } from '../systems/FishingSystem.js';
import { MiningSystem } from '../systems/MiningSystem.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { FarmingSystem } from '../systems/FarmingSystem.js';
import { CookingSystem } from '../systems/CookingSystem.js';
import { TapMoveSystem } from '../systems/TapMoveSystem.js';
import { ITEMS } from '../config/itemData.js';
import { distance } from '../utils/helpers.js';
import { DayNightSystem } from '../systems/DayNightSystem.js';
import { WanderingMerchant } from '../systems/WanderingMerchant.js';
import { CompanionSystem } from '../systems/CompanionSystem.js';
import { EGG_HATCH_CONFIG } from '../config/companionData.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;
const TAP_DRAG_THRESHOLD = 10;
const HUD_TOP_ZONE_HEIGHT = 100;
const HUD_BOTTOM_ZONE_RATIO = 0.75;

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
    this.skillSystem = new SkillSystem(this);
    this.fishingSystem = new FishingSystem(this);
    this.miningSystem = new MiningSystem(this);
    this.miningSystem.initNodeStates();
    this.farmingSystem = new FarmingSystem(this, this.skillSystem);
    this.cookingSystem = new CookingSystem(this, this.skillSystem);
    this.tapMoveSystem = new TapMoveSystem(this);
    this.dayNightSystem = new DayNightSystem(this);
    this.wanderingMerchant = new WanderingMerchant(this);
    this.companionSystem = new CompanionSystem(this);
    this.agent = null;
    this.viewTarget = 'player';
    this.activeBuffs = [];

    // Shared game state for inventory (materials)
    this.gameState = { materials: this.lootSystem.sharedStash };

    this.miningNodeSprites = {};
    this.farmPlotEntities = [];

    this.createTilemap();
    this.createPlayer();
    this.spawner.spawnInitial();

    this.setupCamera();
    this.setupInput();
    this.setupCombatHandlers();
    this.setupAmbientAnimations();
    this.setupMiningNodeVisuals();
    this.setupSkillHandlers();

    this.scene.launch('HUDScene');

    this.events.emit('goldChanged', this.lootSystem.gold);
    this.events.emit('playerStatsChanged', this.player.stats);
  }

  createTilemap() {
    this.treeSprites = [];
    this.waterSprites = [];
    this.lanternSprites = [];

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

        if (tile.type === 'tree') {
          img._baseY = img.y;
          this.treeSprites.push(img);
        } else if (tile.type === 'water') {
          this.waterSprites.push(img);
        } else if (tile.type === 'mining_node') {
          this.miningNodeSprites[`${x},${y}`] = img;
        } else if (tile.type === 'farm_plot') {
          // Replace plain image with FarmPlot entity for dynamic rendering
          img.destroy();
          const farmPlot = new FarmPlot(this, x, y, tile.plotIndex);
          this.farmPlotEntities.push(farmPlot);
        }
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
    this.events.on('actionButtonPressed', () => {
      if (this.tapMoveSystem.isFollowingPath) {
        this.tapMoveSystem.cancelPath('action');
      }
      this.handleAction();
    });
    this.events.on('toggleView', () => this.toggleView());
    this.events.on('openInventory', () => this.events.emit('showInventory'));
    this.events.on('openEquipment', () => this.scene.launch('EquipmentPanel'));

    // Tap-to-move / tap-to-interact on game viewport
    this.input.on('pointerup', (pointer) => {
      if (this.player.inCombat) return;

      // Ignore if pointer traveled too far (was a drag, not a tap)
      const dist = Phaser.Math.Distance.Between(
        pointer.downX, pointer.downY, pointer.upX, pointer.upY
      );
      if (dist > TAP_DRAG_THRESHOLD) return;

      // Ignore if the joystick is currently active
      const hudScene = this.scene.get('HUDScene');
      if (hudScene && hudScene.joystick && hudScene.joystick.isActive) return;

      // Ignore if tap is in the HUD zone (bottom 25% of screen or top HUD bar)
      const screenH = this.scale.height;
      if (pointer.upY > screenH * HUD_BOTTOM_ZONE_RATIO) return;
      if (pointer.upY < HUD_TOP_ZONE_HEIGHT) return;

      // Convert to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointer.upX, pointer.upY);
      const tileX = Math.floor(worldPoint.x / DISPLAY_TILE);
      const tileY = Math.floor(worldPoint.y / DISPLAY_TILE);

      // Pass to tap move system
      this.tapMoveSystem.handleTap(tileX, tileY);
    });
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

        // Roll loot (material + gear)
        const killerLevel = killer.stats ? killer.stats.level : 1;
        const drops = this.lootSystem.rollLoot(deadEntity.typeKey, killerLevel);
        for (const drop of drops) {
          if (killer.entityType === 'player') {
            this.lootSystem.addToStash(drop.item);
          } else if (killer.entityType === 'agent') {
            if (!killer.addItem(drop.item)) {
              this.lootSystem.addToStash(drop.item);
            }
          }
          this.showLootPickup(deadEntity.x, deadEntity.y, drop.item);
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
    const emoji = item.icon || item.emoji || '?';
    const text = this.add.text(x, y, emoji, {
      fontSize: '16px',
    });
    text.setOrigin(0.5);
    text.setDepth(50);

    this.tweens.add({
      targets: text,
      y: y + 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  handleAction() {
    if (this.player.inCombat) return;

    // Check adjacent tiles for buildings, fishing dock, mining nodes, farm plots
    const adjacent = this.player.getAdjacentTiles();
    for (const pos of adjacent) {
      const tile = getTileAt(this.mapData, pos.x, pos.y);
      if (tile && tile.type === 'building') {
        this.interactWithBuilding(tile.buildingType);
        return;
      }
      if (tile && tile.type === 'fishing_dock') {
        this.scene.launch('FishingPanel');
        return;
      }
      if (tile && tile.type === 'mining_node') {
        this.scene.launch('MiningPanel', { nodeKey: tile.nodeType });
        return;
      }
      if (tile && tile.type === 'farm_plot') {
        this.scene.launch('FarmingPanel');
        return;
      }
      // Companion nest interaction
      if (pos.x === EGG_HATCH_CONFIG.nestPosition.tileX && pos.y === EGG_HATCH_CONFIG.nestPosition.tileY) {
        this.scene.launch('CompanionPanel');
        return;
      }
    }

    // Check merchant interaction
    if (this.wanderingMerchant && this.wanderingMerchant.isActive && this.wanderingMerchant.entity) {
      if (this.wanderingMerchant.entity.isPlayerInRange(this.player)) {
        this.scene.launch('MerchantPanel');
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
    } else if (buildingType === 'kitchen') {
      this.scene.launch('CookingPanel');
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

    // Update tap-to-move system
    this.tapMoveSystem.update();

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

    // Ambient animations
    this.updateAmbientAnimations(time);

    // Update Phase 7 systems
    if (this.dayNightSystem) this.dayNightSystem.update(delta);
    if (this.companionSystem) this.companionSystem.update(delta);

    // Keyboard shortcuts
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.tapMoveSystem.isFollowingPath) {
        this.tapMoveSystem.cancelPath('action');
      }
      this.handleAction();
    }
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.scene.launch('ShopScene');
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

    // Cancel any active tap-to-move path when joystick or keyboard is used
    if (this.tapMoveSystem.isFollowingPath) {
      this.tapMoveSystem.cancelPath('joystick');
    }

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
          // Cancel tap path if player enters combat
          if (entity === this.player && this.tapMoveSystem.isFollowingPath) {
            this.tapMoveSystem.cancelPath('combat');
          }
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
        const name = BUILDINGS[tile.buildingType]?.name || tile.buildingType;
        const icon = tile.buildingType === 'kitchen' ? '🍳' : '🏠';
        contextAction = { type: 'building', name, icon };
        break;
      }
      if (tile && tile.type === 'fishing_dock') {
        contextAction = { type: 'fishing', name: 'Fishing Spot', icon: '🎣' };
        break;
      }
      if (tile && tile.type === 'mining_node') {
        contextAction = { type: 'mining', name: 'Mining Node', icon: '⛏️', nodeKey: tile.nodeType };
        break;
      }
      if (tile && tile.type === 'farm_plot') {
        contextAction = { type: 'farming', name: 'Farm', icon: '🌾' };
        break;
      }
      // Companion nest check
      if (pos.x === EGG_HATCH_CONFIG.nestPosition.tileX && pos.y === EGG_HATCH_CONFIG.nestPosition.tileY) {
        contextAction = { type: 'nest', name: 'Companion Nest', icon: '🥚' };
        break;
      }
    }

    // Check merchant proximity
    if (!contextAction && this.wanderingMerchant && this.wanderingMerchant.isActive && this.wanderingMerchant.entity) {
      if (this.wanderingMerchant.entity.isPlayerInRange(this.player)) {
        contextAction = { type: 'merchant', name: 'Merchant', icon: '🛒' };
      }
    }

    this.events.emit('contextAction', contextAction);
  }

  setupAmbientAnimations() {
    // Water shimmer: shift tint every 500ms
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        for (const water of this.waterSprites) {
          water.setTint(Math.random() > 0.5 ? 0x3D6FC4 : 0x2856A6);
        }
      },
    });
  }

  updateAmbientAnimations(time) {
    // Tree sway: subtle Y-offset oscillation (±1px, 2s cycle)
    for (const tree of this.treeSprites) {
      tree.y = tree._baseY + Math.sin(time / 1000 * Math.PI) * 1;
    }
  }

  setupMiningNodeVisuals() {
    this.events.on('miningNodeStateChanged', ({ nodeKey, state }) => {
      const textureMap = {
        copper_node: 'tile_mining_node_copper',
        iron_node: 'tile_mining_node_iron',
        crystal_node: 'tile_mining_node_crystal',
      };
      for (const [posKey, sprite] of Object.entries(this.miningNodeSprites)) {
        const [sx, sy] = posKey.split(',').map(Number);
        const tile = this.mapData[sy]?.[sx];
        if (tile && tile.nodeType === nodeKey) {
          if (state === 'depleted') {
            sprite.setTexture('tile_mining_node_depleted');
          } else {
            sprite.setTexture(textureMap[nodeKey] || 'tile_mining_node_copper');
          }
        }
      }
    });
  }

  setupSkillHandlers() {
    // Skill level-up banner
    this.events.on('skillLevelUp', ({ skillId, newLevel, unlock }) => {
      const skillIcons = { fishing: '🎣', mining: '⛏', farming: '🌾', cooking: '🍳' };
      const skillNames = { fishing: 'Fishing', mining: 'Mining', farming: 'Farming', cooking: 'Cooking' };
      const icon = skillIcons[skillId] || '📊';
      const name = skillNames[skillId] || skillId;
      let msg = `${icon} ${name} Level ${newLevel}!`;
      if (unlock) msg += `\n${unlock.description}`;

      const w = this.scale.width;
      const banner = this.add.text(w / 2, 150, msg, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#00E5FF',
        backgroundColor: '#003344EE',
        padding: { x: 14, y: 8 },
        align: 'center',
      });
      banner.setOrigin(0.5).setDepth(500).setScrollFactor(0);
      banner.setAlpha(0);
      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 300,
        hold: 3000,
        yoyo: true,
        onComplete: () => banner.destroy(),
      });
    });

    // Skill XP toasts
    this.events.on('skillXPGained', ({ skillId, amount }) => {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene && hudScene.notifications) {
        const icons = { fishing: '🎣', mining: '⛏', farming: '🌾', cooking: '🍳' };
        hudScene.notifications.showLoot({
          name: `+${amount} ${skillId} XP`,
          emoji: icons[skillId] || '📊',
        });
      }
    });

    // Food buff expiry check
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const now = Date.now();
        const prev = this.activeBuffs.length;
        this.activeBuffs = this.activeBuffs.filter(b => b.expiresAt > now);
        if (this.activeBuffs.length < prev) {
          this.events.emit('activeBuffsChanged', this.activeBuffs);
          const hudScene = this.scene.get('HUDScene');
          if (hudScene && hudScene.notifications) {
            hudScene.notifications.showLoot({ name: 'Food buff expired', emoji: '🍽' });
          }
        }
      },
    });

    // Cooking complete → offer to eat
    this.events.on('cookingComplete', ({ item, quantity }) => {
      const hudScene = this.scene.get('HUDScene');
      if (hudScene && hudScene.lootToast) {
        const foodDef = ITEMS[item];
        hudScene.lootToast.showMaterial({
          name: `${foodDef?.name || item} ×${quantity} cooked!`,
          emoji: foodDef?.emoji || '🍽',
        });
      }
    });
  }

  eatFood(itemId) {
    const foodDef = ITEMS[itemId];
    if (!foodDef || foodDef.category !== 'food') return false;

    const mat = this.gameState.materials.find(m => m.id === itemId);
    if (!mat || mat.quantity < 1) return false;

    // Check if buff active already — replace it
    if (this.activeBuffs.length > 0) {
      // Just replace silently (confirmation handled in UI)
      this.activeBuffs = [];
    }

    // Remove item from materials
    mat.quantity--;
    if (mat.quantity <= 0) {
      const idx = this.gameState.materials.indexOf(mat);
      if (idx !== -1) this.gameState.materials.splice(idx, 1);
    }

    // Compute duration with cooking skill bonuses
    const baseDuration = foodDef.duration || 60000;
    const durationBonus = this.skillSystem.getBonus('cooking', 'buffDurationBonus');
    const masterBonus = this.skillSystem.hasPerk('cooking', 'master_chef') ? 0.50 : 0;
    const actualDuration = Math.floor(baseDuration * (1 + durationBonus + masterBonus));

    const buff = {
      id: itemId,
      name: foodDef.name,
      icon: foodDef.emoji,
      stats: foodDef.buff?.stats || null,
      skillEffects: foodDef.buff?.skillEffects || null,
      heal: foodDef.buff?.heal || 0,
      expiresAt: Date.now() + actualDuration,
      duration: actualDuration,
    };
    this.activeBuffs = [buff];

    // Apply HP heal
    if (buff.heal > 0) {
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + buff.heal);
      this.player.updateHPBar?.();
    }

    this.events.emit('activeBuffsChanged', this.activeBuffs);
    this.events.emit('inventoryChanged', this.gameState.materials);

    const hudScene = this.scene.get('HUDScene');
    if (hudScene && hudScene.lootToast) {
      hudScene.lootToast.showMaterial({
        name: `${foodDef.name} buff active!`,
        emoji: foodDef.emoji,
      });
    }
    return true;
  }
}
