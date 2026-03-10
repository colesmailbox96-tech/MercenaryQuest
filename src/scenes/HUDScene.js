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
    const buffBarY = 98;
    const buffBarW = this.scale.width - 30;
    this.buffBar = new BuffBar(this);
    this.buffBar.create(15, buffBarY, buffBarW);

    // Phase 7 HUD components
    this.dayNightHUD = new DayNightHUD(this);
    this.dayNightHUD.create(w - 15, 42);

    this.companionHUD = new CompanionHUD(this);
    this.companionHUD.create(15, 110);

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
    // Dark panel background
    this.topPanel = this.add.rectangle(w / 2, 30, w, 60, COLORS.UI_PANEL, COLORS.UI_PANEL_ALPHA);
    this.topPanel.setScrollFactor(0);
    this.topPanel.setDepth(100);

    // View indicator
    this.viewLabel = this.add.text(15, 20, '👁️ You', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.viewLabel.setScrollFactor(0);
    this.viewLabel.setDepth(101);
    this.viewLabel.setInteractive({ useHandCursor: true });
    this.viewLabel.on('pointerdown', () => {
      this.gameScene.events.emit('toggleView');
    });

    // Zone name
    this.zoneLabel = this.add.text(w / 2, 20, '🏘️ Town', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.zoneLabel.setOrigin(0.5, 0);
    this.zoneLabel.setScrollFactor(0);
    this.zoneLabel.setDepth(101);

    // Gold
    this.goldLabel = this.add.text(w - 15, 20, '🪙 20', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#DAA520',
    });
    this.goldLabel.setOrigin(1, 0);
    this.goldLabel.setScrollFactor(0);
    this.goldLabel.setDepth(101);

    // Gold rate indicator
    this.goldRateLabel = this.add.text(w - 15, 36, '+0g/min', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#AAAAAA',
    });
    this.goldRateLabel.setOrigin(1, 0);
    this.goldRateLabel.setScrollFactor(0);
    this.goldRateLabel.setDepth(101);

    // Agent status indicator
    this.agentStatus = this.add.text(15, 42, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#88CC88',
    });
    this.agentStatus.setScrollFactor(0);
    this.agentStatus.setDepth(101);
  }

  createStatsBars(w) {
    const barY = 72;
    const barW = w - 30;

    this.hpBar = createHPBar(this, 15, barY, barW, 14);
    this.hpBar.bg.setDepth(100);
    this.hpBar.fill.setDepth(101);

    this.hpText = this.add.text(w / 2, barY, 'HP 50/50', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.hpText.setOrigin(0.5);
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(102);

    this.xpBar = createXPBar(this, 15, barY + 16, barW, 8);
    this.xpBar.bg.setDepth(100);
    this.xpBar.fill.setDepth(101);

    this.xpText = this.add.text(w / 2, barY + 16, 'Lv.1 — 0/25 XP', {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.xpText.setOrigin(0.5);
    this.xpText.setScrollFactor(0);
    this.xpText.setDepth(102);
  }

  createBottomControls(w, h) {
    // Joystick
    if (this.hasTouchSupport) {
      this.joystick = new Joystick(this, 80, h - 140);
    } else {
      this.joystick = null;
    }

    // Action button (attack/interact)
    this.actionBtn = this.add.image(w - 70, h - 160, 'ui_btn_circle');
    this.actionBtn.setScrollFactor(0);
    this.actionBtn.setDepth(200);
    this.actionBtn.setInteractive({ useHandCursor: true });
    this.actionBtn.setAlpha(0.8);

    this.actionBtnLabel = this.add.text(w - 70, h - 160, '⚔️', {
      fontSize: '24px',
    });
    this.actionBtnLabel.setOrigin(0.5);
    this.actionBtnLabel.setScrollFactor(0);
    this.actionBtnLabel.setDepth(201);

    this.actionBtn.on('pointerdown', () => {
      this.actionBtn.setAlpha(1);
      this.actionBtn.setScale(0.9);
      this.gameScene.events.emit('actionButtonPressed');
    });
    this.actionBtn.on('pointerup', () => {
      this.actionBtn.setAlpha(0.8);
      this.actionBtn.setScale(1);
    });

    // Inventory button
    this.invBtn = this.add.image(w - 70, h - 95, 'ui_btn_small');
    this.invBtn.setScrollFactor(0);
    this.invBtn.setDepth(200);
    this.invBtn.setInteractive({ useHandCursor: true });
    this.invBtn.setAlpha(0.8);

    this.invBtnLabel = this.add.text(w - 70, h - 95, '📦', {
      fontSize: '18px',
    });
    this.invBtnLabel.setOrigin(0.5);
    this.invBtnLabel.setScrollFactor(0);
    this.invBtnLabel.setDepth(201);

    this.invBtn.on('pointerdown', () => {
      this.invBtn.setScale(0.9);
      this.gameScene.events.emit('openInventory');
      this.scene.launch('ShopScene');
    });
    this.invBtn.on('pointerup', () => {
      this.invBtn.setScale(1);
    });

    // Toggle view button
    this.viewBtn = this.add.image(w - 130, h - 95, 'ui_btn_small');
    this.viewBtn.setScrollFactor(0);
    this.viewBtn.setDepth(200);
    this.viewBtn.setInteractive({ useHandCursor: true });
    this.viewBtn.setAlpha(0.8);

    this.viewBtnLabel = this.add.text(w - 130, h - 95, '👁️', {
      fontSize: '18px',
    });
    this.viewBtnLabel.setOrigin(0.5);
    this.viewBtnLabel.setScrollFactor(0);
    this.viewBtnLabel.setDepth(201);

    this.viewBtn.on('pointerdown', () => {
      this.viewBtn.setScale(0.9);
      this.gameScene.events.emit('toggleView');
    });
    this.viewBtn.on('pointerup', () => {
      this.viewBtn.setScale(1);
    });

    // Equip button
    this.equipBtn = this.add.image(w - 190, h - 95, 'ui_btn_small');
    this.equipBtn.setScrollFactor(0);
    this.equipBtn.setDepth(200);
    this.equipBtn.setInteractive({ useHandCursor: true });
    this.equipBtn.setAlpha(0.8);

    this.equipBtnLabel = this.add.text(w - 190, h - 95, '🛡️', {
      fontSize: '18px',
    });
    this.equipBtnLabel.setOrigin(0.5);
    this.equipBtnLabel.setScrollFactor(0);
    this.equipBtnLabel.setDepth(201);

    this.equipBtn.on('pointerdown', () => {
      this.equipBtn.setScale(0.9);
      this.gameScene.events.emit('openEquipment');
    });
    this.equipBtn.on('pointerup', () => {
      this.equipBtn.setScale(1);
    });

    // Skills button
    this.skillsBtn = this.add.image(w - 250, h - 95, 'ui_btn_small');
    this.skillsBtn.setScrollFactor(0);
    this.skillsBtn.setDepth(200);
    this.skillsBtn.setInteractive({ useHandCursor: true });
    this.skillsBtn.setAlpha(0.8);

    this.skillsBtnLabel = this.add.text(w - 250, h - 95, '📊', {
      fontSize: '18px',
    });
    this.skillsBtnLabel.setOrigin(0.5);
    this.skillsBtnLabel.setScrollFactor(0);
    this.skillsBtnLabel.setDepth(201);

    this.skillsBtn.on('pointerdown', () => {
      this.skillsBtn.setScale(0.9);
      this.scene.launch('SkillsPanel');
    });
    this.skillsBtn.on('pointerup', () => {
      this.skillsBtn.setScale(1);
    });

    // Companion button
    this.companionBtn = this.add.image(w - 250, h - 160, 'ui_btn_small');
    this.companionBtn.setScrollFactor(0);
    this.companionBtn.setDepth(200);
    this.companionBtn.setInteractive({ useHandCursor: true });
    this.companionBtn.setAlpha(0.8);

    this.companionBtnLabel = this.add.text(w - 250, h - 160, '🐾', {
      fontSize: '18px',
    });
    this.companionBtnLabel.setOrigin(0.5);
    this.companionBtnLabel.setScrollFactor(0);
    this.companionBtnLabel.setDepth(201);

    this.companionBtn.on('pointerdown', () => {
      this.companionBtn.setScale(0.9);
      this.scene.launch('CompanionPanel');
    });
    this.companionBtn.on('pointerup', () => {
      this.companionBtn.setScale(1);
    });

    // Settings button
    this.settingsBtn = this.add.image(w - 130, h - 160, 'ui_btn_small');
    this.settingsBtn.setScrollFactor(0);
    this.settingsBtn.setDepth(200);
    this.settingsBtn.setInteractive({ useHandCursor: true });
    this.settingsBtn.setAlpha(0.8);

    this.settingsBtnLabel = this.add.text(w - 130, h - 160, '⚙️', {
      fontSize: '18px',
    });
    this.settingsBtnLabel.setOrigin(0.5);
    this.settingsBtnLabel.setScrollFactor(0);
    this.settingsBtnLabel.setDepth(201);

    this.settingsBtn.on('pointerdown', () => {
      this.settingsBtn.setScale(0.9);
      this.scene.launch('SettingsPanel');
    });
    this.settingsBtn.on('pointerup', () => {
      this.settingsBtn.setScale(1);
    });

    // Forge button
    this.forgeBtn = this.add.image(w - 190, h - 160, 'ui_btn_small');
    this.forgeBtn.setScrollFactor(0);
    this.forgeBtn.setDepth(200);
    this.forgeBtn.setInteractive({ useHandCursor: true });
    this.forgeBtn.setAlpha(0.8);

    this.forgeBtnLabel = this.add.text(w - 190, h - 160, '⚒️', {
      fontSize: '18px',
    });
    this.forgeBtnLabel.setOrigin(0.5);
    this.forgeBtnLabel.setScrollFactor(0);
    this.forgeBtnLabel.setDepth(201);

    this.forgeBtn.on('pointerdown', () => {
      this.forgeBtn.setScale(0.9);
      this.scene.launch('ForgePanel');
    });
    this.forgeBtn.on('pointerup', () => {
      this.forgeBtn.setScale(1);
    });

    // Combat Log button
    this.logBtn = this.add.image(w - 310, h - 95, 'ui_btn_small');
    this.logBtn.setScrollFactor(0);
    this.logBtn.setDepth(200);
    this.logBtn.setInteractive({ useHandCursor: true });
    this.logBtn.setAlpha(0.8);

    this.logBtnLabel = this.add.text(w - 310, h - 95, '📜', {
      fontSize: '18px',
    });
    this.logBtnLabel.setOrigin(0.5);
    this.logBtnLabel.setScrollFactor(0);
    this.logBtnLabel.setDepth(201);

    this.logBtn.on('pointerdown', () => {
      this.logBtn.setScale(0.9);
      if (this.scene.isActive('CombatLogPanel')) {
        this.scene.stop('CombatLogPanel');
      } else {
        this.scene.launch('CombatLogPanel');
      }
    });
    this.logBtn.on('pointerup', () => {
      this.logBtn.setScale(1);
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
    this.contextPrompt = this.add.text(w / 2, h - 210, '', {
      fontSize: '13px',
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

    this.miniInvBg = this.add.rectangle(w / 2, h - 40, w - 20, 35, COLORS.UI_PANEL, 0.7);
    this.miniInvBg.setScrollFactor(0);
    this.miniInvContainer.add(this.miniInvBg);

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
      const color = gpm > 0 ? '#DAA520' : '#AAAAAA';
      this.goldRateLabel.setText(`+${gpm}g/min`);
      this.goldRateLabel.setColor(color);
    });

    this.gameScene.events.on('viewTargetChanged', (target) => {
      this.viewTarget = target;
      this.viewLabel.setText(target === 'player' ? '👁️ You' : '👁️ Agent');
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
    const maxHp = stats.maxHp;
    const hpRatio = stats.hp / maxHp;
    updateHPBar(this.hpBar, hpRatio);

    const bonusHp = stats.bonusMaxHp || 0;
    const hpLabel = bonusHp > 0
      ? `HP ${stats.hp}/${maxHp} (+${bonusHp})`
      : `HP ${stats.hp}/${maxHp}`;
    this.hpText.setText(hpLabel);

    if (stats.xpToNext !== undefined) {
      const xpRatio = stats.xp / stats.xpToNext;
      updateXPBar(this.xpBar, xpRatio);
      this.xpText.setText(`Lv.${stats.level} — ${stats.xp}/${stats.xpToNext} XP`);
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

    let xOff = 30;
    for (const item of last5) {
      const txt = this.add.text(xOff, h - 46, `${item.emoji}×${item.quantity}`, {
        fontSize: '12px',
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
    if (this.topPanel) this.topPanel.setPosition(w / 2, 30 + this.safeTop);
    if (this.goldLabel) this.goldLabel.setPosition(w - 15, 20 + this.safeTop);
    if (this.miniInvBg) this.miniInvBg.setPosition(w / 2, h - 40 - this.safeBottom);
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

    this.zoneTransName = this.add.text(w / 2, ty, '', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    this.zoneTransName.setVisible(false);
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
        t.y -= 14;
      }
    }

    // Remove oldest if more than 3
    while (this.miniLogTexts.length >= 3) {
      const old = this.miniLogTexts.shift();
      if (old && old.active) old.destroy();
    }

    const txt = this.add.text(10, h - 225, message, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    });
    txt.setScrollFactor(0);
    txt.setDepth(200);
    txt.setAlpha(0.6);

    this.miniLogTexts.push(txt);

    // Fade out after 3 seconds
    this.tweens.add({
      targets: txt,
      alpha: 0,
      duration: 1000,
      delay: 3000,
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
