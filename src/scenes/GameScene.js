import Phaser from 'phaser';
import { TILE_SIZE, TILE_SCALE, MAP_WIDTH, MAP_HEIGHT, BUILDINGS, KITCHEN_TILE, GOLD_TRACKING_WINDOW } from '../config/constants.js';
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
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { JuiceSystem } from '../systems/JuiceSystem.js';
import { TutorialSystem } from '../systems/TutorialSystem.js';
import { CombatLog } from '../systems/CombatLog.js';
import { EGG_HATCH_CONFIG } from '../config/companionData.js';
import { MINING_NODE_PLACEMENTS } from '../config/oreData.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;
const TAP_DRAG_THRESHOLD = 10;
const HUD_TOP_ZONE_HEIGHT = 100;
const HUD_BOTTOM_ZONE_RATIO = 0.75;
const ZONE_GROUND = { town: 'tile_town_ground', forest: 'tile_forest_ground', caves: 'tile_cave_ground' };
const OVERLAY_TILE_TYPES = new Set(['tree', 'building', 'mining_node']);

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
    this.audioSystem = new AudioSystem(this);
    this.juiceSystem = new JuiceSystem(this);
    this.combatLog = new CombatLog(100);
    this.agent = null;
    this.viewTarget = 'player';
    this.activeBuffs = [];
    this.minimapVisible = true;
    this.movementMode = 'joystick'; // 'joystick' (default) or 'tap'

    // Gold rate tracking (QOL Pass B)
    this.goldHistory = [];
    this._goldRateUpdateTimer = 0;

    // Shared game state for save/load serialization
    this.gameState = {
      player: this.player,
      gold: this.lootSystem.gold,
      agent: this.agent,
      materials: this.lootSystem.sharedStash,
      gear: this.lootSystem.gearStash,
      fishingSystem: this.fishingSystem,
      miningSystem: this.miningSystem,
      skillSystem: this.skillSystem,
      farmingSystem: this.farmingSystem,
      activeBuff: this.activeBuffs.length > 0 ? this.activeBuffs[0] : null,
      totalPlayTime: this.totalPlayTime || 0,
      sessionCount: this.sessionCount || 0,
      createdAt: this.createdAt || new Date().toISOString(),
      tutorialSystem: null,
    };

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

    // Initialize SaveSystem
    this.saveSystem = new SaveSystem(this);

    // Attempt to load existing save
    const loadResult = this.saveSystem.load();
    this._initialLoadResult = loadResult;
    if (loadResult.success) {
      this.applyLoadedState(loadResult.data);
    } else {
      this.totalPlayTime = 0;
      this.sessionCount = 1;
      this.createdAt = new Date().toISOString();
    }

    // Start auto-save
    this.saveSystem.startAutoSave(this.gameState, 30000);
    this._lastTimeUpdate = 0;

    // Tutorial system
    this.tutorialSystem = new TutorialSystem(this);
    this.gameState.tutorialSystem = this.tutorialSystem;

    this.scene.launch('HUDScene');

    // Init tutorial (must be after HUDScene is launched)
    this.time.delayedCall(500, () => {
      const cached = this._initialLoadResult;
      this.tutorialSystem.init(cached && cached.success ? cached.data : {});
      this._initialLoadResult = null;
    });

    // Initialize AudioContext on first user interaction (browser autoplay policy)
    this.input.once('pointerdown', () => {
      this.audioSystem.init();
    });

    this.events.emit('goldChanged', this.lootSystem.gold);
    this.events.emit('playerStatsChanged', this.player.stats);

    // Audio hooks for level up and gold
    this.events.on('levelUp', () => {
      this.audioSystem.playLevelUp();
      if (this.player) {
        this.juiceSystem.levelUpBurst(this.player.x, this.player.y);
      }
    });
    this.events.on('goldChanged', () => {
      this.audioSystem.playGold();
    });

    // Track gold gains for rate calculation
    this._lastKnownGold = this.lootSystem.gold;
    this.events.on('goldChanged', (newGold) => {
      const gained = newGold - this._lastKnownGold;
      if (gained > 0) {
        this.goldHistory.push({ gold: gained, timestamp: Date.now() });
      }
      this._lastKnownGold = newGold;
    });
    // Fishing sounds
    this.events.on('fishingCatch', () => {
      this.audioSystem.playFishCatch();
    });
    this.events.on('fishingMiss', () => {
      this.audioSystem.playFishMiss();
    });
    // Mining sounds
    this.events.on('miningExtract', () => {
      this.audioSystem.playMineExtract();
    });
    this.events.on('miningMiss', () => {
      this.audioSystem.playMineMiss();
    });

    // ── Combat Log wiring ──
    this.events.on('combatLogEntry', (entry) => this.combatLog.addEntry(entry));

    this.events.on('fishingCatch', (data) => {
      const itemDef = ITEMS[data?.itemId];
      this.combatLog.addEntry({
        type: 'fishing',
        message: `Caught ${itemDef?.name || 'a fish'}`,
      });
    });
    this.events.on('fishingMiss', () => {
      this.combatLog.addEntry({ type: 'fishing_miss', message: 'The fish got away...' });
    });
    this.events.on('miningExtract', (data) => {
      const itemDef = ITEMS[data?.itemId];
      this.combatLog.addEntry({
        type: 'mining',
        message: `Extracted ${itemDef?.name || 'ore'}`,
      });
    });
    this.events.on('skillLevelUp', (data) => {
      const unlockStr = data.unlock ? ` ${data.unlock.description}` : '';
      const entry = {
        type: 'skill_levelup',
        message: `${data.skillId} reached Level ${data.newLevel}!${unlockStr}`,
      };
      this.combatLog.addEntry(entry);
      this.events.emit('combatLogEntry', entry);
    });
    this.events.on('levelUp', (data) => {
      const entry = {
        type: 'level_up',
        message: `Level up! You are now Level ${data?.level || '?'}`,
      };
      this.combatLog.addEntry(entry);
      this.events.emit('combatLogEntry', entry);
    });
    this.events.on('activeBuffsChanged', (buffs) => {
      if (buffs.length === 0) {
        const entry = { type: 'buff_expire', message: 'Food buff expired' };
        this.combatLog.addEntry(entry);
        this.events.emit('combatLogEntry', entry);
      }
    });
    this.events.on('cookingComplete', (data) => {
      const foodDef = ITEMS[data?.item];
      const entry = {
        type: 'cooking',
        message: `Cooked ${foodDef?.name || data?.item}`,
      };
      this.combatLog.addEntry(entry);
      this.events.emit('combatLogEntry', entry);
    });
  }

  createTilemap() {
    this.treeSprites = [];
    this.waterSprites = [];
    this.lanternSprites = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = this.mapData[y][x];
        const px = x * DISPLAY_TILE + DISPLAY_TILE / 2;
        const py = y * DISPLAY_TILE + DISPLAY_TILE / 2;

        // For overlay tiles, render the zone ground tile first
        if (OVERLAY_TILE_TYPES.has(tile.type)) {
          const groundKey = ZONE_GROUND[tile.zone] || 'tile_town_ground';
          const groundImg = this.add.image(px, py, groundKey);
          groundImg.setDisplaySize(DISPLAY_TILE, DISPLAY_TILE);
          groundImg.setDepth(0);
        }

        const img = this.add.image(px, py, tile.textureKey);
        img.setDisplaySize(DISPLAY_TILE, DISPLAY_TILE);
        img.setDepth(OVERLAY_TILE_TYPES.has(tile.type) ? 1 : 0);

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

    // Tap-to-move / tap-to-interact on game viewport (only when movement mode is 'tap')
    this.input.on('pointerup', (pointer) => {
      if (this.movementMode !== 'tap') return;
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

        // Kill sound + juice
        this.audioSystem.playKill();
        this.juiceSystem.showXPNumber(deadEntity.x, deadEntity.y - 20, deadEntity.xpReward);

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

          // Play rarity-appropriate loot sound for gear drops
          if (drop.type === 'gear' && drop.item.rarity) {
            const lootSounds = {
              EPIC: 'playLootEpic',
              RARE: 'playLootRare',
              UNCOMMON: 'playLootUncommon',
              COMMON: 'playLootCommon',
            };
            const method = lootSounds[drop.item.rarity.toUpperCase()] || 'playLootCommon';
            this.audioSystem[method]();
          } else {
            this.audioSystem.playLootCommon();
          }
        }

        // Kill mob
        deadEntity.die();
        this.spawner.onMobDeath(deadEntity);
        this.events.emit('mobKilled', deadEntity);
        if (this.saveSystem) this.saveSystem.markDirty();

        // Combat log for kill
        const mobName = deadEntity.name || deadEntity.typeKey || 'Enemy';
        const prefix = killer.entityType === 'agent' ? 'Agent' : 'You';
        this.combatLog.addEntry({
          type: killer.entityType === 'agent' ? 'agent_kill' : 'kill',
          message: `${prefix} killed ${mobName}`,
        });

        // Agent session stats
        if (killer.entityType === 'agent' && killer.sessionStats) {
          killer.sessionStats.kills++;
        }

        // Notify agent combat ended
        if (killer.entityType === 'agent') {
          killer.onCombatEnd(true);
        }
      } else if (deadEntity.entityType === 'player') {
        // Player death - respawn in town
        this.audioSystem.playDeath();
        this.juiceSystem.screenShake(0.01, 200);
        this.combatLog.addEntry({
          type: 'player_death',
          message: 'You were defeated!',
        });
        deadEntity.stats.hp = deadEntity.stats.maxHp;
        deadEntity.updateHPBar();
        deadEntity.tileX = 19;
        deadEntity.tileY = 20;
        deadEntity.setPosition(19 * DISPLAY_TILE + DISPLAY_TILE / 2, 20 * DISPLAY_TILE + DISPLAY_TILE / 2);
      } else if (deadEntity.entityType === 'agent') {
        this.events.emit('combatLogEntry', {
          type: 'agent_death',
          message: 'Agent was defeated!',
        });
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

    // Check for adjacent mobs — move player onto mob tile to initiate combat
    for (const pos of adjacent) {
      for (const mob of this.spawner.getMobs()) {
        if (!mob.active || mob.inCombat) continue;
        if (mob.tileX === pos.x && mob.tileY === pos.y) {
          this.player.moveTo(pos.x, pos.y, this.mapData);
          return;
        }
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
        if (this.saveSystem) this.saveSystem.markDirty();
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
    this.events.emit('viewToggled');

    if (this.viewTarget === 'agent') {
      this.events.emit('agentStatsChanged', this.agent.stats);
    } else {
      this.events.emit('playerStatsChanged', this.player.stats);
    }
  }

  update(time, delta) {
    // Gold rate tracking update
    this._goldRateUpdateTimer += delta;
    if (this._goldRateUpdateTimer >= 10000) {
      this._goldRateUpdateTimer = 0;
      const now = Date.now();
      this.goldHistory = this.goldHistory.filter(e => now - e.timestamp < GOLD_TRACKING_WINDOW);
      const totalGold = this.goldHistory.reduce((sum, e) => sum + e.gold, 0);
      const windowSecs = this.goldHistory.length > 0
        ? Math.min(GOLD_TRACKING_WINDOW / 1000, (now - this.goldHistory[0].timestamp) / 1000)
        : 0;
      const gpm = windowSecs > 0 ? Math.round((totalGold / windowSecs) * 60) : 0;
      this.events.emit('goldRateChanged', gpm);
    }

    this.handleMovement();

    // Track play time
    this._lastTimeUpdate += delta;
    if (this._lastTimeUpdate >= 1000) {
      this.totalPlayTime = (this.totalPlayTime || 0) + Math.floor(this._lastTimeUpdate / 1000);
      this._lastTimeUpdate = this._lastTimeUpdate % 1000;
      if (this.gameState) this.gameState.totalPlayTime = this.totalPlayTime;
    }

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

    // Mining node respawn countdowns (QOL Pass B)
    this._updateMiningRespawnTexts();

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
    const moved = this.player.moveTo(this.player.tileX + dx, this.player.tileY + dy, this.mapData);
    if (moved) {
      this.events.emit('playerMoved');
    }
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

    // Check for adjacent mobs
    if (!contextAction && !this.player.inCombat) {
      for (const mob of this.spawner.getMobs()) {
        if (!mob.active || mob.inCombat) continue;
        for (const pos of adjacent) {
          if (mob.tileX === pos.x && mob.tileY === pos.y) {
            contextAction = { type: 'mob', name: mob.mobName || 'Enemy', icon: '⚔️' };
            break;
          }
        }
        if (contextAction) break;
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
      this.audioSystem.playSkillLevelUp();
      if (this.player && this.juiceSystem) {
        this.juiceSystem.levelUpBurst(this.player.x, this.player.y, true);
      }
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
      this.audioSystem.playCraft();
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
    if (this.gameState) this.gameState.activeBuff = buff;
    if (this.saveSystem) this.saveSystem.markDirty();

    // Apply HP heal
    if (buff.heal > 0) {
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + buff.heal);
      this.player.updateHPBar?.();
    }

    this.events.emit('activeBuffsChanged', this.activeBuffs);
    this.events.emit('inventoryChanged', this.gameState.materials);
    this.audioSystem.playEat();

    const hudScene = this.scene.get('HUDScene');
    if (hudScene && hudScene.lootToast) {
      hudScene.lootToast.showMaterial({
        name: `${foodDef.name} buff active!`,
        emoji: foodDef.emoji,
      });
    }
    return true;
  }

  applyLoadedState(saveData) {
    // Player stats
    if (saveData.player) {
      this.player.stats.level = saveData.player.level ?? this.player.stats.level;
      this.player.stats.xp = saveData.player.xp ?? this.player.stats.xp;
      this.player.stats.xpToNext = this._calcXpToNext(this.player.stats.level);

      this.lootSystem.gold = saveData.player.gold ?? this.lootSystem.gold;
      if (saveData.player.stats) {
        this.player.stats.maxHp = saveData.player.stats.maxHp ?? this.player.stats.maxHp;
        this.player.stats.atk = saveData.player.stats.atk ?? this.player.stats.atk;
        this.player.stats.def = saveData.player.stats.def ?? this.player.stats.def;
      }
      this.player.stats.hp = saveData.player.currentHp ?? this.player.stats.hp;

      if (saveData.player.position && saveData.player.position.tileX != null) {
        this.player.tileX = saveData.player.position.tileX;
        this.player.tileY = saveData.player.position.tileY;
        this.player.setPosition(
          saveData.player.position.tileX * DISPLAY_TILE + DISPLAY_TILE / 2,
          saveData.player.position.tileY * DISPLAY_TILE + DISPLAY_TILE / 2
        );
      }
      this.player.equipment = this.deserializeEquipment(saveData.player.equipment);
      this.player.updateVisuals();
      this.player.updateHPBar();
    }

    // Agent
    if (saveData.agent && saveData.agent.hired && !this.agent) {
      this.agent = new Agent(this, 19, 19);
      this.events.emit('agentHired');
      this.events.emit('agentStateChanged', this.agent.state);
    }
    if (this.agent && saveData.agent && saveData.agent.hired) {
      this.agent.stats.level = saveData.agent.level ?? this.agent.stats.level;
      this.agent.stats.xp = saveData.agent.xp ?? this.agent.stats.xp;
      this.agent.stats.xpToNext = this._calcXpToNext(this.agent.stats.level);
      if (saveData.agent.stats) {
        this.agent.stats.maxHp = saveData.agent.stats.maxHp ?? this.agent.stats.maxHp;
        this.agent.stats.atk = saveData.agent.stats.atk ?? this.agent.stats.atk;
        this.agent.stats.def = saveData.agent.stats.def ?? this.agent.stats.def;
      }
      this.agent.stats.hp = saveData.agent.currentHp ?? this.agent.stats.hp;
      this.agent.equipment = this.deserializeEquipment(saveData.agent.equipment);
      this.agent.updateVisuals();
      this.agent.updateHPBar();
      // Restore agent config
      if (saveData.agentConfig && this.agent.config) {
        this.agent.config = { ...this.agent.config, ...saveData.agentConfig };
      }
    }

    // Inventory
    this.lootSystem.sharedStash.length = 0;
    if (saveData.inventory && saveData.inventory.materials) {
      saveData.inventory.materials.forEach(m => this.lootSystem.sharedStash.push(m));
    }
    if (saveData.inventory && saveData.inventory.gear) {
      this.lootSystem.gearStash = saveData.inventory.gear;
    }

    // Skills
    if (this.skillSystem && saveData.skills) {
      this.skillSystem.skills = JSON.parse(JSON.stringify(saveData.skills));
    }

    // Farm plots
    if (this.farmingSystem && saveData.farmPlots && saveData.farmPlots.length > 0) {
      saveData.farmPlots.forEach(plotData => {
        const plot = this.farmingSystem.plots[plotData.index];
        if (plot) {
          plot.state = plotData.state;
          plot.seedId = plotData.seedId;
          plot.plantedAt = plotData.plantedAt;
          plot.growthDuration = plotData.growthDuration;
          if ((plot.state === 'planted' || plot.state === 'growing') && plot.plantedAt) {
            const elapsed = Date.now() - plot.plantedAt;
            if (elapsed >= plot.growthDuration) {
              plot.state = 'ready';
            }
          }
        }
      });
    }

    // Active buff
    if (saveData.activeBuff) {
      if (saveData.activeBuff.expiresAt && Date.now() >= saveData.activeBuff.expiresAt) {
        // Buff expired while offline
      } else {
        this.activeBuffs = [saveData.activeBuff];
      }
    }

    // Meta
    this.totalPlayTime = saveData.totalPlayTime || 0;
    this.sessionCount = (saveData.sessionCount || 0) + 1;
    this.createdAt = saveData.createdAt || new Date().toISOString();

    // Minimap preference
    if (saveData.minimapVisible !== undefined) {
      this.minimapVisible = saveData.minimapVisible;
    }

    // Movement mode preference
    if (saveData.movementMode !== undefined) {
      this.movementMode = saveData.movementMode;
    }

    // Update gameState reference
    this.gameState.player = this.player;
    this.gameState.gold = this.lootSystem.gold;
    this.gameState.agent = this.agent;
    this.gameState.materials = this.lootSystem.sharedStash;
    this.gameState.gear = this.lootSystem.gearStash;
    this.gameState.totalPlayTime = this.totalPlayTime;
    this.gameState.sessionCount = this.sessionCount;
    this.gameState.createdAt = this.createdAt;

    // Emit updates
    this.events.emit('goldChanged', this.lootSystem.gold);
    this.events.emit('playerStatsChanged', this.player.stats);
  }

  _calcXpToNext(level) {
    let xpToNext = 25;
    for (let i = 1; i < level; i++) {
      xpToNext = Math.floor(xpToNext * 1.5);
    }
    return xpToNext;
  }

  deserializeEquipment(eqData) {
    const result = {};
    for (const [slot, item] of Object.entries(eqData || {})) {
      result[slot] = item ? { ...item } : null;
    }
    return result;
  }

  _updateMiningRespawnTexts() {
    if (!this._miningRespawnTexts) this._miningRespawnTexts = {};
    const mining = this.miningSystem;
    const playerX = this.player.tileX;
    const playerY = this.player.tileY;

    for (const [nodeKey, ns] of Object.entries(mining.nodeStates)) {
      const textKey = `respawn_${nodeKey}`;
      if (ns.state === 'depleted' && ns.depletedAt && ns.respawnDuration) {
        const elapsed = Date.now() - ns.depletedAt;
        const remaining = Math.max(0, ns.respawnDuration - elapsed);
        const totalSec = Math.ceil(remaining / 1000);

        const placement = this._getMiningNodePlacement(nodeKey);
        if (!placement) continue;

        const dist = Math.abs(playerX - placement.tileX) + Math.abs(playerY - placement.tileY);
        if (dist > 5) {
          if (this._miningRespawnTexts[textKey]) {
            this._miningRespawnTexts[textKey].destroy();
            delete this._miningRespawnTexts[textKey];
          }
          continue;
        }

        const worldX = placement.tileX * DISPLAY_TILE + DISPLAY_TILE / 2;
        const worldY = placement.tileY * DISPLAY_TILE - 8;
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timerStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const color = totalSec <= 10 ? '#FFFFFF' : '#AAAAAA';

        if (!this._miningRespawnTexts[textKey]) {
          const txt = this.add.text(worldX, worldY, timerStr, {
            fontSize: '10px', fontFamily: 'monospace', color,
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(40);
          this._miningRespawnTexts[textKey] = txt;
        } else {
          this._miningRespawnTexts[textKey].setText(timerStr);
          this._miningRespawnTexts[textKey].setColor(color);
          this._miningRespawnTexts[textKey].setPosition(worldX, worldY);
        }
      } else {
        if (this._miningRespawnTexts[textKey]) {
          this._miningRespawnTexts[textKey].destroy();
          delete this._miningRespawnTexts[textKey];
        }
      }
    }
  }

  _getMiningNodePlacement(nodeKey) {
    // Build cache of placements grouped by nodeType
    if (!this._miningNodePlacementCache) {
      this._miningNodePlacementCache = {};
      for (const p of MINING_NODE_PLACEMENTS) {
        if (!this._miningNodePlacementCache[p.nodeType]) {
          this._miningNodePlacementCache[p.nodeType] = [];
        }
        this._miningNodePlacementCache[p.nodeType].push(p);
      }
    }

    const placements = this._miningNodePlacementCache[nodeKey];
    if (!placements || placements.length === 0) {
      return null;
    }

    // If the player is not yet available, fall back to the first placement
    if (!this.player) {
      return placements[0];
    }

    const playerX = this.player.tileX;
    const playerY = this.player.tileY;

    // Choose the nearest placement of this node type to the player
    let bestPlacement = placements[0];
    let bestDist = distance(playerX, playerY, bestPlacement.tileX, bestPlacement.tileY);

    for (let i = 1; i < placements.length; i++) {
      const p = placements[i];
      const d = distance(playerX, playerY, p.tileX, p.tileY);
      if (d < bestDist) {
        bestDist = d;
        bestPlacement = p;
      }
    }

    return bestPlacement;
  }
}
