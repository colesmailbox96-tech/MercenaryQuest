import Phaser from 'phaser';
import { COLORS, ZONE_DISPLAY_NAMES } from '../config/constants.js';
import { Joystick } from '../ui/Joystick.js';
import { createHPBar, updateHPBar, createXPBar, updateXPBar } from '../ui/HUDComponents.js';
import { MiniNotifications } from '../ui/MiniNotifications.js';
import { LootToast } from '../ui/LootToast.js';
import { ActivityHUD } from '../ui/ActivityHUD.js';
import { BuffBar } from '../ui/BuffBar.js';
import { DayNightHUD } from '../ui/DayNightHUD.js';
import { CompanionHUD } from '../ui/CompanionHUD.js';
import { MerchantAlert } from '../ui/MerchantAlert.js';
import { Minimap } from '../ui/Minimap.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.hasTouchSupport = 'ontouchstart' in window;

    const w = this.scale.width;
    const h = this.scale.height;

    // Read safe area insets for iOS notched phones via CSS custom properties
    const computedStyle = getComputedStyle(document.documentElement);
    this.safeTop = parseInt(computedStyle.getPropertyValue('--sat'), 10) || 0;
    this.safeBottom = parseInt(computedStyle.getPropertyValue('--sab'), 10) || 0;

    this.notifications = new MiniNotifications(this);
    this.lootToast = new LootToast(this);

    this.createTopBar(w);
    this.createStatsBars(w);
    this.createBottomControls(w, h);
    this.createContextPrompt(w, h);
    this.createMiniInventory(w, h);

    this.setupListeners();

    this.activityHUD = new ActivityHUD(this);
    this.activityHUD.create();

    // Buff bar (below stats bars)
    const buffBarY = 78;
    const buffBarW = this.scale.width - 30;
    this.buffBar = new BuffBar(this);
    this.buffBar.create(15, buffBarY, buffBarW);

    // Phase 7 HUD components — day/night moved below minimap area
    this.dayNightHUD = new DayNightHUD(this);
    this.dayNightHUD.create(w - 15, 78);

    this.companionHUD = new CompanionHUD(this);
    this.companionHUD.create(15, 90);

    this.merchantAlert = new MerchantAlert(this);
    this.merchantAlert.create();

    this.viewTarget = 'player';
    this.currentContext = null;
    this.miniLogTexts = [];

    // Zone transition notification
    this.lastZone = null;
    this.zoneTransitionCooldown = 0;
    this._createZoneTransition(w, h);

    // Minimap (QOL Pass B)
    this.minimap = new Minimap(this, this.gameScene);

    // Mini-log: listen for new combat log entries
    this.gameScene.events.on('combatLogEntry', (entry) => {
      this.showMiniLogEntry(entry);
    });

    // Listen for resize events (iOS Safari address bar collapse)
    this.scale.on('resize', (gameSize) => {
      this.onResize(gameSize.width, gameSize.height);
    });
  }

  createTopBar(w) {
    // ROW 1 — Info Bar (32px height)
    this.topPanel = this.add.rectangle(w / 2, 16, w, 32, COLORS.UI_PANEL, COLORS.UI_PANEL_ALPHA);
    this.topPanel.setScrollFactor(0);
    this.topPanel.setDepth(100);

    // View indicator (LEFT)
    this.viewLabel = this.add.text(15, 8, '👁️ You', {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#F5E6C8',
    });
    this.viewLabel.setScrollFactor(0);
    this.viewLabel.setDepth(101);
    this.viewLabel.setInteractive({ useHandCursor: true });
    this.viewLabel.on('pointerdown', () => {
      this.gameScene.events.emit('toggleView');
    });

    // Zone name (CENTER)
    this.zoneLabel = this.add.text(w / 2, 8, '🏘️ Town', {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#F5E6C8',
    });
    this.zoneLabel.setOrigin(0.5, 0);
    this.zoneLabel.setScrollFactor(0);
    this.zoneLabel.setDepth(101);

    // Gold + rate merged (RIGHT)
    this.goldLabel = this.add.text(w - 15, 8, '🪙 20', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#DAA520',
    });
    this.goldLabel.setOrigin(1, 0);
    this.goldLabel.setScrollFactor(0);
    this.goldLabel.setDepth(101);

    // Gold rate — smaller, rendered inline after gold amount
    this.goldRateLabel = this.add.text(w - 15, 22, '+0/m', {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#DAA520',
      alpha: 0.8,
    });
    this.goldRateLabel.setOrigin(1, 0);
    this.goldRateLabel.setScrollFactor(0);
    this.goldRateLabel.setDepth(101);

    // Keep gold rate aligned with gold label on resize
    this.scale.on('resize', () => {
      if (this.goldLabel && this.goldRateLabel) {
        this.goldRateLabel.x = this.goldLabel.x;
        this.goldRateLabel.y = this.goldLabel.y + 14;
      }
    });

    // Agent status indicator (ROW 3 — only visible in agent view, 16px)
    this.agentStatus = this.add.text(15, 62, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#00BCD4',
    });
    this.agentStatus.setScrollFactor(0);
    this.agentStatus.setDepth(101);
  }

  createStatsBars(w) {
    // ROW 2 — Bars (28px total, starting below info bar)
    const barStartY = 38;
    const barW = w - 16; // 8px margin each side
    const barX = 8;

    // HP bar background panel
    this.hpBar = createHPBar(this, barX, barStartY, barW, 12);
    this.hpBar.bg.setDepth(100);
    this.hpBar.fill.setDepth(101);

    // HP text rendered INSIDE the bar
    this.hpText = this.add.text(barX + barW - 4, barStartY, 'HP 50/50', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hpText.setOrigin(1, 0.5);
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(102);

    // XP bar below HP bar
    this.xpBar = createXPBar(this, barX, barStartY + 14, barW, 8);
    this.xpBar.bg.setDepth(100);
    this.xpBar.fill.setDepth(101);

    // XP text rendered INSIDE the bar
    this.xpText = this.add.text(barX + barW - 4, barStartY + 14, 'Lv.1 — 0/25 XP', {
      fontSize: '9px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.xpText.setOrigin(1, 0.5);
    this.xpText.setScrollFactor(0);
    this.xpText.setDepth(102);
  }

  createBottomControls(w, h) {
    // Joystick
    if (this.hasTouchSupport) {
      this.joystick = new Joystick(this, 80, h - 120);
    } else {
      this.joystick = null;
    }

    // --- PRIMARY ROW: 4 main action buttons (44x44, evenly spaced) ---
    const primaryY = h - 80;
    const btnSize = 44;
    const primaryBtns = [
      { icon: '⚔️', event: 'actionButtonPressed', key: 'action' },
      { icon: '📦', event: 'openShop', key: 'inv' },
      { icon: '📜', event: 'toggleLog', key: 'log' },
      { icon: '⚙️', event: 'openSettings', key: 'settings' },
    ];
    const spacing = (w - 24) / primaryBtns.length;

    primaryBtns.forEach((def, i) => {
      const bx = 12 + spacing * i + spacing / 2;
      const bg = this.add.rectangle(bx, primaryY, btnSize, btnSize, 0x1A1A2E, 0.9);
      bg.setScrollFactor(0);
      bg.setDepth(200);
      bg.setStrokeStyle(1, 0x444444);
      bg.setInteractive({ useHandCursor: true });

      const label = this.add.text(bx, primaryY, def.icon, {
        fontSize: '20px',
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(201);

      bg.on('pointerdown', () => {
        bg.setScale(0.9);
        bg.setStrokeStyle(1, 0xDAA520);
        if (def.key === 'action') {
          this.gameScene.events.emit('actionButtonPressed');
        } else if (def.key === 'inv') {
          this.gameScene.events.emit('openInventory');
          this.scene.launch('ShopScene');
        } else if (def.key === 'log') {
          if (this.scene.isActive('CombatLogPanel')) {
            this.scene.stop('CombatLogPanel');
          } else {
            this.scene.launch('CombatLogPanel');
          }
        } else if (def.key === 'settings') {
          this.scene.launch('SettingsPanel');
        }
      });
      bg.on('pointerup', () => {
        bg.setScale(1);
        bg.setStrokeStyle(1, 0x444444);
      });

      if (def.key === 'action') {
        this.actionBtn = bg;
        this.actionBtnLabel = label;
      }
    });

    // --- SECONDARY ROW: smaller shortcut buttons (32x32, lighter style) ---
    const secondaryY = h - 120;
    const secBtns = [
      { icon: '🛡️', action: () => this.gameScene.events.emit('openEquipment') },
      { icon: '📊', action: () => this.scene.launch('SkillsPanel') },
      { icon: '⚒️', action: () => this.scene.launch('ForgePanel') },
      { icon: '🐾', action: () => this.scene.launch('CompanionPanel') },
      { icon: '👁️', action: () => this.gameScene.events.emit('toggleView') },
    ];
    const secSpacing = (w - 24) / secBtns.length;

    // 1px separator between rows
    this.add.rectangle(w / 2, secondaryY + 20, w - 24, 1, 0x333333, 0.6)
      .setScrollFactor(0).setDepth(199);

    secBtns.forEach((def, i) => {
      const bx = 12 + secSpacing * i + secSpacing / 2;
      const label = this.add.text(bx, secondaryY, def.icon, {
        fontSize: '16px',
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(201);
      label.setAlpha(0.7);
      label.setInteractive({ useHandCursor: true });

      label.on('pointerdown', () => {
        label.setScale(0.9);
        label.setAlpha(1);
        def.action();
      });
      label.on('pointerup', () => {
        label.setScale(1);
        label.setAlpha(0.7);
      });
    });

    // Auto-save indicator
    this.saveIndicator = this.add.text(w - 15, 55, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.saveIndicator.setOrigin(1, 0);
    this.saveIndicator.setScrollFactor(0);
    this.saveIndicator.setDepth(101);
    this.saveIndicator.setAlpha(0);
  }

  createContextPrompt(w, h) {
    this.contextPrompt = this.add.text(w / 2, h - 145, '', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
      backgroundColor: '#1A1A2ECC',
      padding: { x: 12, y: 6 },
    });
    this.contextPrompt.setOrigin(0.5);
    this.contextPrompt.setScrollFactor(0);
    this.contextPrompt.setDepth(200);
    this.contextPrompt.setVisible(false);
  }

  createMiniInventory(w, h) {
    this.miniInvContainer = this.add.container(0, 0);
    this.miniInvContainer.setScrollFactor(0);
    this.miniInvContainer.setDepth(200);

    this.miniInvBg = this.add.rectangle(w / 2, h - 36, w, 32, 0x111111, 0.9);
    this.miniInvBg.setScrollFactor(0);
    // 1px top border
    this.miniInvBorder = this.add.rectangle(w / 2, h - 52, w, 1, 0x333333);
    this.miniInvBorder.setScrollFactor(0);
    this.miniInvContainer.add(this.miniInvBg);
    this.miniInvContainer.add(this.miniInvBorder);

    this.miniInvItems = [];
  }

  setupListeners() {
    this.gameScene.events.on('playerStatsChanged', (stats) => {
      if (this.viewTarget === 'player') {
        this.updateStats(stats);
      }
    });

    this.gameScene.events.on('agentStatsChanged', (stats) => {
      if (this.viewTarget === 'agent') {
        this.updateStats(stats);
      }
    });

    this.gameScene.events.on('goldChanged', (gold) => {
      this.goldLabel.setText(`🪙 ${gold}`);
    });

    this.gameScene.events.on('goldRateChanged', (gpm) => {
      const text = gpm > 0 ? `+${gpm}/m` : '+0/m';
      const color = gpm > 0 ? '#DAA520' : '#AAAAAA';
      this.goldRateLabel.setText(text);
      this.goldRateLabel.setColor(color);
    });

    this.gameScene.events.on('viewTargetChanged', (target) => {
      this.viewTarget = target;
      this.viewLabel.setText(target === 'player' ? '👁️ You' : '👁️ Agent');
      // Agent status line only visible in agent view
      if (this.agentStatus) {
        this.agentStatus.setVisible(target === 'agent');
      }
    });

    this.gameScene.events.on('agentStateChanged', (state) => {
      if (!this.gameScene.agent) {
        this.agentStatus.setText('No agent hired');
        this.agentStatus.setColor('#666666');
        return;
      }
      const agent = this.gameScene.agent;
      switch (state) {
        case 'HUNTING': {
          const zone = agent.currentTargetZone || 'wilderness';
          const zoneName = zone.charAt(0).toUpperCase() + zone.slice(1);
          this.agentStatus.setText(`🤖 Hunting in ${zoneName}`);
          this.agentStatus.setColor('#4CAF50');
          break;
        }
        case 'COMBAT': {
          const mobName = agent.targetMob?.name || 'enemy';
          this.agentStatus.setText(`🤖 Fighting ${mobName}`);
          this.agentStatus.setColor('#FF9800');
          break;
        }
        case 'RETURNING':
          this.agentStatus.setText('🤖 Returning to town');
          this.agentStatus.setColor('#FFD700');
          break;
        case 'RETREATING':
          this.agentStatus.setText('🤖 Retreating (low HP)');
          this.agentStatus.setColor('#F44336');
          break;
        case 'DEPOSITING':
          this.agentStatus.setText('🤖 Depositing loot');
          this.agentStatus.setColor('#2196F3');
          break;
        case 'HEALING':
          this.agentStatus.setText('🤖 Healing in town');
          this.agentStatus.setColor('#4CAF50');
          break;
        case 'DEAD':
          this.agentStatus.setText('🤖 Defeated! Respawning...');
          this.agentStatus.setColor('#F44336');
          break;
        default:
          this.agentStatus.setText('🤖 Idle in town');
          this.agentStatus.setColor('#AAAAAA');
      }
    });

    this.gameScene.events.on('contextAction', (action) => {
      if (action) {
        if (action.type === 'fishing') {
          this.contextPrompt.setText('Tap ⚔️ to fish 🎣');
          this.actionBtnLabel.setText('🎣');
        } else if (action.type === 'mining') {
          this.contextPrompt.setText('Tap ⚔️ to mine ⛏️');
          this.actionBtnLabel.setText('⛏️');
        } else if (action.type === 'farming') {
          this.contextPrompt.setText('Tap ⚔️ to farm 🌾');
          this.actionBtnLabel.setText('🌾');
        } else if (action.type === 'merchant') {
          this.contextPrompt.setText('Tap ⚔️ to trade 🛒');
          this.actionBtnLabel.setText('🛒');
        } else if (action.type === 'nest') {
          this.contextPrompt.setText('Tap ⚔️ to check nest 🥚');
          this.actionBtnLabel.setText('🥚');
        } else if (action.type === 'building' && action.icon === '🍳') {
          this.contextPrompt.setText('Tap ⚔️ to cook 🍳');
          this.actionBtnLabel.setText('🍳');
        } else {
          this.contextPrompt.setText(`Tap ⚔️ to enter ${action.name}`);
          this.actionBtnLabel.setText('🏠');
        }
        if (!this.contextPrompt.visible) {
          this.contextPrompt.setVisible(true);
          this.contextPrompt.setAlpha(0);
          this.tweens.add({ targets: this.contextPrompt, alpha: 1, duration: 200 });
        }
      } else {
        if (this.contextPrompt.visible) {
          this.tweens.add({
            targets: this.contextPrompt,
            alpha: 0,
            duration: 200,
            onComplete: () => this.contextPrompt.setVisible(false),
          });
        }
        this.actionBtnLabel.setText('⚔️');
      }
    });

    this.gameScene.events.on('activeBuffsChanged', (buffs) => {
      if (this.buffBar) this.buffBar.update(buffs);
    });

    this.gameScene.events.on('lootReceived', ({ item }) => {
      this.lootToast.showMaterial(item);
      this.updateMiniInventory();
    });

    this.gameScene.events.on('gearReceived', ({ item }) => {
      this.lootToast.showGear(item);
    });

    this.gameScene.events.on('gearAutoSold', ({ item }) => {
      this.lootToast.showMaterial({ name: `Auto-sold ${item.name}`, emoji: '🪙' });
    });

    this.gameScene.events.on('levelUp', (stats) => {
      this.notifications.showLevelUp(stats);
      if (this.gameScene.saveSystem) this.gameScene.saveSystem.markDirty();
    });

    this.gameScene.events.on('gameSaved', () => {
      if (this.saveIndicator) {
        this.saveIndicator.setText('💾');
        this.saveIndicator.setAlpha(1);
        this.tweens.add({
          targets: this.saveIndicator,
          alpha: 0,
          duration: 600,
          delay: 1000,
        });
      }
    });

    this.gameScene.events.on('inventoryChanged', () => {
      this.updateMiniInventory();
    });
  }

  updateStats(stats) {
    if (!stats) return;
    const maxHp = Number.isFinite(stats.maxHp) ? stats.maxHp : 20;
    const hp = Number.isFinite(stats.hp) ? stats.hp : 0;
    const hpRatio = maxHp > 0 ? hp / maxHp : 0;
    updateHPBar(this.hpBar, hpRatio);

    const bonusHp = stats.bonusMaxHp || 0;
    const hpLabel = bonusHp > 0
      ? `HP ${hp}/${maxHp} (+${bonusHp})`
      : `HP ${hp}/${maxHp}`;
    this.hpText.setText(hpLabel);

    if (stats.xpToNext !== undefined) {
      const xp = Number.isFinite(stats.xp) ? stats.xp : 0;
      const xpToNext = Number.isFinite(stats.xpToNext) ? stats.xpToNext : 25;
      const xpRatio = xpToNext > 0 ? xp / xpToNext : 0;
      updateXPBar(this.xpBar, xpRatio);
      this.xpText.setText(`Lv.${stats.level || 1} — ${xp}/${xpToNext} XP`);
    }

    // Update zone label
    const scene = this.gameScene;
    const entity = this.viewTarget === 'player' ? scene.player : scene.agent;
    if (entity) {
      const tile = scene.mapData[entity.tileY]?.[entity.tileX];
      if (tile) {
        const zoneNames = { town: '🏘️ Town', forest: '🌲 Forest', caves: '⛰️ Caves', swamp: '🌿 Swamp', volcanic: '🌋 Volcanic' };
        this.zoneLabel.setText(zoneNames[tile.zone] || tile.zone);
      }
    }
  }

  updateMiniInventory() {
    // Clear old items
    this.miniInvItems.forEach(t => t.destroy());
    this.miniInvItems = [];

    const stash = this.gameScene.lootSystem.sharedStash;
    const w = this.scale.width;
    const h = this.scale.height;
    const last5 = stash.slice(-5);

    let xOff = 15;
    for (const item of last5) {
      const txt = this.add.text(xOff, h - 40, `${item.emoji}×${item.quantity}`, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#F5E6C8',
      });
      txt.setScrollFactor(0);
      txt.setDepth(201);

      // Pop animation: scale 0 → 1.1 → 1.0
      txt.setScale(0);
      this.tweens.add({
        targets: txt,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: txt,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Power2',
          });
        },
      });

      this.miniInvItems.push(txt);
      xOff += txt.width + 15;
    }
  }

  onResize(w, h) {
    // Reposition key HUD elements when viewport resizes (iOS Safari address bar)
    if (this.topPanel) this.topPanel.setPosition(w / 2, 16 + this.safeTop);
    if (this.goldLabel) this.goldLabel.setPosition(w - 15, 8 + this.safeTop);
    if (this.miniInvBg) this.miniInvBg.setPosition(w / 2, h - 36 - this.safeBottom);
  }

  update() {
    if (this.activityHUD) {
      this.activityHUD.update();
    }
    if (this.buffBar && this.gameScene) {
      this.buffBar.update(this.gameScene.activeBuffs || []);
    }
    if (this.dayNightHUD) this.dayNightHUD.update();
    if (this.companionHUD) this.companionHUD.update();
    if (this.merchantAlert) this.merchantAlert.update();

    // Minimap update with panel visibility check
    if (this.minimap) {
      const panelScenes = ['ShopScene', 'EquipmentPanel', 'FarmingPanel', 'CookingPanel', 'FishingPanel', 'MiningPanel', 'SkillsPanel', 'SettingsPanel', 'ForgePanel', 'CombatLogPanel', 'CompanionPanel', 'MerchantPanel'];
      const anyPanelOpen = panelScenes.some(key => this.scene.isActive(key));
      const minimapEnabled = this.gameScene.minimapVisible !== false;
      this.minimap.setVisible(!anyPanelOpen && minimapEnabled);
      this.minimap.update();
    }

    // Zone transition detection
    if (this.gameScene) {
      const entity = this.viewTarget === 'player' ? this.gameScene.player : this.gameScene.agent;
      if (entity) {
        const tile = this.gameScene.mapData[entity.tileY]?.[entity.tileX];
        const currentZone = tile?.zone || null;
        if (currentZone && currentZone !== this.lastZone) {
          if (this.lastZone !== null && this.zoneTransitionCooldown <= 0) {
            this._showZoneTransition(currentZone);
            this.zoneTransitionCooldown = 5000;
          }
          this.lastZone = currentZone;
        }
        if (this.zoneTransitionCooldown > 0) {
          this.zoneTransitionCooldown -= this.game.loop.delta;
        }
      }
    }
  }

  _createZoneTransition(w, h) {
    const ty = Math.floor(h * 0.2);
    this.zoneTransBg = this.add.rectangle(w / 2, ty, 300, 36, 0x1A1A2E, 0.7);
    this.zoneTransBg.setScrollFactor(0).setDepth(500);
    this.zoneTransBg.setStrokeStyle(0);
    this.zoneTransBg.setVisible(false);

    this.zoneTransDash = this.add.text(w / 2, ty, '', {
      fontSize: '18px', fontFamily: 'monospace', color: '#DAA520', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    this.zoneTransDash.setVisible(false);
  }

  _showZoneTransition(zone) {
    const displayName = ZONE_DISPLAY_NAMES[zone] || zone;
    const fullText = `━━  ${displayName}  ━━`;
    this.zoneTransDash.setText(fullText);
    const textWidth = this.zoneTransDash.width + 24;
    this.zoneTransBg.width = textWidth;

    this.zoneTransBg.setVisible(true).setAlpha(0);
    this.zoneTransDash.setVisible(true).setAlpha(0);

    this.tweens.add({
      targets: [this.zoneTransBg, this.zoneTransDash],
      alpha: 1,
      duration: 200,
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: [this.zoneTransBg, this.zoneTransDash],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.zoneTransBg.setVisible(false);
              this.zoneTransDash.setVisible(false);
            },
          });
        });
      },
    });
  }

  showMiniLogEntry(entry) {
    // Don't show mini-log if the full log panel is open
    if (this.scene.isActive('CombatLogPanel')) return;

    const h = this.scale.height;
    const message = entry.message || this._formatMiniEntry(entry);
    if (!message) return;

    const MINI_LOG_COLORS = {
      hit: '#FFFFFF', crit: '#FFD700', miss: '#888888', dodge: '#AAAAAA',
      kill: '#4CAF50', agent_kill: '#81C784', agent_retreat: '#FF9800',
      agent_death: '#F44336', player_death: '#F44336', fishing: '#42A5F5',
      mining: '#FF8A65', cooking: '#FFAB40', skill_levelup: '#00897B',
      level_up: '#FFD700',
    };
    const color = MINI_LOG_COLORS[entry.type] || '#CCCCCC';

    // Shift existing mini-log texts up
    for (const t of this.miniLogTexts) {
      if (t && t.active) {
        t.y -= 12;
      }
    }

    // Remove oldest if more than 2 (2 lines max)
    while (this.miniLogTexts.length >= 2) {
      const old = this.miniLogTexts.shift();
      if (old && old.active) old.destroy();
    }

    // Position above context prompt area, never overlapping buttons
    const txt = this.add.text(8, h - 165, message, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color,
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: '#00000066',
      padding: { x: 4, y: 1 },
    });
    txt.setScrollFactor(0);
    txt.setDepth(200);
    txt.setAlpha(0.8);

    this.miniLogTexts.push(txt);

    // Fade out after 4 seconds
    this.tweens.add({
      targets: txt,
      alpha: 0,
      duration: 1000,
      delay: 4000,
      onComplete: () => {
        const idx = this.miniLogTexts.indexOf(txt);
        if (idx !== -1) this.miniLogTexts.splice(idx, 1);
        if (txt.active) txt.destroy();
      },
    });
  }

  _formatMiniEntry(entry) {
    switch (entry.type) {
      case 'hit':
        return `${entry.attackerName} hit ${entry.defenderName} for ${entry.damage}`;
      case 'crit':
        return `${entry.attackerName} CRIT ${entry.defenderName} for ${entry.damage}!`;
      case 'miss':
        return `${entry.attackerName} missed ${entry.defenderName}`;
      case 'dodge':
        return `${entry.defenderName} dodged ${entry.attackerName}'s attack`;
      default:
        return entry.message || '';
    }
  }
}
