import { COLORS } from '../config/constants.js';

export class ActivityHUD {
  constructor(scene) {
    this.scene = scene;
    this.gameScene = scene.scene.get('GameScene');
    this.fishBar = null;
    this.mineBar = null;
    this.fishElements = [];
    this.mineElements = [];
    this.popup = null;
    this.popupElements = [];
  }

  create() {
    this.setupListeners();
  }

  setupListeners() {
    const gs = this.gameScene;

    gs.events.on('fishingCycleStarted', (data) => this.showFishBar(data));
    gs.events.on('fishingCatch', () => this.updateFishBar());
    gs.events.on('fishingMiss', () => {});
    gs.events.on('fishingPaused', () => this.updateFishBar());
    gs.events.on('fishingStopped', () => this.hideFishBar());

    gs.events.on('miningCycleStarted', (data) => this.showMineBar(data));
    gs.events.on('miningExtract', () => this.updateMineBar());
    gs.events.on('miningMiss', () => {});
    gs.events.on('miningNodeDepleted', () => this.updateMineBar());
    gs.events.on('miningPaused', () => this.updateMineBar());
    gs.events.on('miningStopped', () => this.hideMineBar());
  }

  getBaseY() {
    return 100;
  }

  showFishBar(data) {
    if (this.fishBar) return;
    const w = this.scene.scale.width;
    const y = this.getBaseY();

    this.fishBar = this.scene.add.rectangle(w / 2, y, w - 30, 22, 0x1A1A2E, 0.85);
    this.fishBar.setScrollFactor(0);
    this.fishBar.setDepth(100);
    this.fishBar.setInteractive({ useHandCursor: true });
    this.fishBar.on('pointerdown', () => this.showPopup('fishing'));

    this.fishBarFill = this.scene.add.rectangle(15, y, 0, 18, COLORS.WATER, 0.7);
    this.fishBarFill.setOrigin(0, 0.5);
    this.fishBarFill.setScrollFactor(0);
    this.fishBarFill.setDepth(101);

    const status = this.gameScene.fishingSystem.getStatus();
    this.fishBarText = this.scene.add.text(20, y, `🎣 ${data.pool || status.pool || 'Fishing'}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);

    this.fishBarCount = this.scene.add.text(w - 20, y, `${status.pendingCount}🐟`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(102);

    this.fishElements = [this.fishBar, this.fishBarFill, this.fishBarText, this.fishBarCount];
    this.repositionBars();
  }

  updateFishBar() {
    if (!this.fishBar) {
      this.showFishBar({});
      return;
    }
    const status = this.gameScene.fishingSystem.getStatus();
    if (this.fishBarCount) this.fishBarCount.setText(`${status.pendingCount}🐟`);
  }

  hideFishBar() {
    this.fishElements.forEach(el => { if (el && el.active) el.destroy(); });
    this.fishElements = [];
    this.fishBar = null;
    this.fishBarFill = null;
    this.fishBarText = null;
    this.fishBarCount = null;
    this.repositionBars();
  }

  showMineBar(data) {
    if (this.mineBar) return;
    const w = this.scene.scale.width;
    const y = this.getBaseY() + (this.fishBar ? 26 : 0);

    this.mineBar = this.scene.add.rectangle(w / 2, y, w - 30, 22, 0x1A1A2E, 0.85);
    this.mineBar.setScrollFactor(0);
    this.mineBar.setDepth(100);
    this.mineBar.setInteractive({ useHandCursor: true });
    this.mineBar.on('pointerdown', () => this.showPopup('mining'));

    this.mineBarFill = this.scene.add.rectangle(15, y, 0, 18, 0xB87333, 0.7);
    this.mineBarFill.setOrigin(0, 0.5);
    this.mineBarFill.setScrollFactor(0);
    this.mineBarFill.setDepth(101);

    const status = this.gameScene.miningSystem.getStatus();
    this.mineBarText = this.scene.add.text(20, y, `⛏️ ${data.node || status.node || 'Mining'} (${status.extractionsLeft})`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);

    this.mineBarCount = this.scene.add.text(w - 20, y, `${status.pendingCount}🟠`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(102);

    this.mineElements = [this.mineBar, this.mineBarFill, this.mineBarText, this.mineBarCount];
    this.repositionBars();
  }

  updateMineBar() {
    if (!this.mineBar) {
      this.showMineBar({});
      return;
    }
    const status = this.gameScene.miningSystem.getStatus();
    if (this.mineBarCount) this.mineBarCount.setText(`${status.pendingCount}🟠`);
    if (this.mineBarText) {
      this.mineBarText.setText(`⛏️ ${status.node || 'Mining'} (${status.extractionsLeft})`);
    }
  }

  hideMineBar() {
    this.mineElements.forEach(el => { if (el && el.active) el.destroy(); });
    this.mineElements = [];
    this.mineBar = null;
    this.mineBarFill = null;
    this.mineBarText = null;
    this.mineBarCount = null;
    this.repositionBars();
  }

  repositionBars() {
    let y = this.getBaseY();
    if (this.fishBar) {
      this.fishBar.setPosition(this.scene.scale.width / 2, y);
      this.fishBarFill.setPosition(15, y);
      this.fishBarText.setPosition(20, y);
      this.fishBarCount.setPosition(this.scene.scale.width - 20, y);
      y += 26;
    }
    if (this.mineBar) {
      this.mineBar.setPosition(this.scene.scale.width / 2, y);
      this.mineBarFill.setPosition(15, y);
      this.mineBarText.setPosition(20, y);
      this.mineBarCount.setPosition(this.scene.scale.width - 20, y);
    }
  }

  showPopup(type) {
    this.hidePopup();
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const popW = 200;
    const popH = 80;
    const popX = w / 2;
    const popY = 160;

    const bg = this.scene.add.rectangle(popX, popY, popW, popH, 0x1A1A2E, 0.95);
    bg.setScrollFactor(0);
    bg.setDepth(300);
    bg.setStrokeStyle(1, 0x555577);
    bg.setInteractive();

    let system, label, pendingLabel;
    if (type === 'fishing') {
      system = this.gameScene.fishingSystem;
      const status = system.getStatus();
      label = `🎣 ${status.pool || 'Fishing'}`;
      pendingLabel = `Catches: ${status.pendingCount} pending`;
    } else {
      system = this.gameScene.miningSystem;
      const status = system.getStatus();
      label = `⛏️ ${status.node || 'Mining'}`;
      pendingLabel = `Ores: ${status.pendingCount} pending`;
    }

    const titleText = this.scene.add.text(popX, popY - 24, label, {
      fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301);

    const pendingText = this.scene.add.text(popX, popY - 8, pendingLabel, {
      fontSize: '10px', fontFamily: 'monospace', color: '#AAAAAA',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301);

    const collectBtn = this.scene.add.text(popX - 40, popY + 14, '[Collect]', {
      fontSize: '11px', fontFamily: 'monospace', color: '#DAA520',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
    collectBtn.on('pointerdown', () => {
      const collected = system.collectAll(this.gameScene.lootSystem);
      for (const item of collected) {
        this.scene.lootToast?.showMaterial(item);
      }
      if (type === 'fishing') this.updateFishBar();
      else this.updateMineBar();
      this.hidePopup();
    });

    const stopBtn = this.scene.add.text(popX + 40, popY + 14, '[Stop]', {
      fontSize: '11px', fontFamily: 'monospace', color: '#FF6666',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(301).setInteractive({ useHandCursor: true });
    stopBtn.on('pointerdown', () => {
      system.stop();
      this.hidePopup();
    });

    this.popupElements = [bg, titleText, pendingText, collectBtn, stopBtn];

    this.scene.time.delayedCall(100, () => {
      const dismiss = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.01);
      dismiss.setScrollFactor(0);
      dismiss.setDepth(299);
      dismiss.setInteractive();
      dismiss.on('pointerdown', () => this.hidePopup());
      this.popupElements.push(dismiss);
    });
  }

  hidePopup() {
    this.popupElements.forEach(el => { if (el && el.active) el.destroy(); });
    this.popupElements = [];
  }

  update() {
    if (this.fishBar && this.fishBarFill) {
      const status = this.gameScene.fishingSystem.getStatus();
      const maxW = this.scene.scale.width - 30;
      this.fishBarFill.width = maxW * status.timerProgress;
    }
    if (this.mineBar && this.mineBarFill) {
      const status = this.gameScene.miningSystem.getStatus();
      const maxW = this.scene.scale.width - 30;
      this.mineBarFill.width = maxW * status.timerProgress;
    }
  }
}
