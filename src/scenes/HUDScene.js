import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { Joystick } from '../ui/Joystick.js';
import { createHPBar, updateHPBar, createXPBar, updateXPBar } from '../ui/HUDComponents.js';
import { MiniNotifications } from '../ui/MiniNotifications.js';
import { LootToast } from '../ui/LootToast.js';

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

    this.viewTarget = 'player';
    this.currentContext = null;

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

    this.gameScene.events.on('viewTargetChanged', (target) => {
      this.viewTarget = target;
      this.viewLabel.setText(target === 'player' ? '👁️ You' : '👁️ Agent');
    });

    this.gameScene.events.on('agentStateChanged', (state) => {
      const stateEmojis = {
        HUNTING: '🌲 Hunting',
        RETURNING: '🏘️ Returning',
        DEPOSITING: '📦 Depositing',
        RETREATING: '💀 Retreating',
        HEALING: '💚 Healing',
        IDLE: '😴 Idle',
      };
      this.agentStatus.setText(`🤖 Agent: ${stateEmojis[state] || state}`);
    });

    this.gameScene.events.on('contextAction', (action) => {
      if (action) {
        this.contextPrompt.setText(`Tap ⚔️ to enter ${action.name}`);
        if (!this.contextPrompt.visible) {
          this.contextPrompt.setVisible(true);
          this.contextPrompt.setAlpha(0);
          this.tweens.add({ targets: this.contextPrompt, alpha: 1, duration: 200 });
        }
        this.actionBtnLabel.setText('🏠');
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
        const zoneNames = { town: '🏘️ Town', forest: '🌲 Forest', caves: '⛰️ Caves' };
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
}
