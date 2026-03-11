import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { SAVE_KEY, SAVE_VERSION } from '../config/saveSchema.js';

export class SettingsPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');

    const w = this.scale.width;
    const h = this.scale.height;

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => {});

    // Panel
    const panelW = Math.min(w - 20, 370);
    const panelH = Math.min(h * 0.85, h - 40);
    const panelX = w / 2;
    const panelY = h / 2;

    this.panel = this.add.rectangle(panelX, panelY, panelW, panelH, COLORS.UI_PANEL, 0.92);
    this.panel.setStrokeStyle(2, COLORS.UI_GOLD, 0.6);

    // Slide-in animation
    this.panel.setAlpha(0);
    this.panel.y = h / 2 + 30;
    this.tweens.add({
      targets: this.panel,
      alpha: 1,
      y: panelY,
      duration: 200,
      ease: 'Power2',
    });

    // Close button
    this.closeBtn = this.add.text(panelX + panelW / 2 - 20, panelY - panelH / 2 + 10, '✕', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    this.closeBtn.setOrigin(0.5);
    this.closeBtn.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-22, -22, 44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.closeBtn.on('pointerdown', () => this.closePanel());

    // Title
    this.titleText = this.add.text(panelX, panelY - panelH / 2 + 35, '⚙️ Settings', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);

    const leftX = panelX - panelW / 2 + 20;
    let yOffset = panelY - panelH / 2 + 75;

    // --- Save & Load Section ---
    this.add.text(leftX, yOffset, '💾 Save & Load', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#DAA520',
      fontStyle: 'bold',
    });
    yOffset += 30;

    // Last saved info
    this.lastSavedText = this.add.text(leftX, yOffset, this._getLastSavedText(), {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    yOffset += 30;

    // Save Now button
    this._createButton(panelX, yOffset, panelW - 40, 'Save Now', () => this.onSaveNow());
    yOffset += 50;

    // Export Save button
    this._createButton(panelX, yOffset, panelW - 40, 'Export Save', () => this.onExportSave());
    yOffset += 50;

    // Import Save button
    this._createButton(panelX, yOffset, panelW - 40, 'Import Save', () => this.onImportSave());
    yOffset += 60;

    // --- Danger Zone ---
    this.add.text(leftX, yOffset, '⚠️ Danger Zone', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#FF6666',
      fontStyle: 'bold',
    });
    yOffset += 30;

    this.resetBtn = this._createButton(panelX, yOffset, panelW - 40, 'Reset All Progress', () => this.onResetProgress(), 0x4A1A1A);
    yOffset += 30;

    this.resetConfirmText = this.add.text(panelX, yOffset, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#FF6666',
      align: 'center',
    });
    this.resetConfirmText.setOrigin(0.5);
    this.resetPending = false;
    yOffset += 40;

    // --- Display Section ---
    this.add.text(leftX, yOffset, '🖥️ Display', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#DAA520',
      fontStyle: 'bold',
    });
    yOffset += 30;

    // Minimap toggle
    const minimapVisible = this.gameScene.minimapVisible !== false;
    const minimapToggle = this.add.text(leftX, yOffset, `Show Minimap: ${minimapVisible ? '✅ ON' : '❌ OFF'}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: minimapVisible ? '#4CAF50' : '#FF6B6B',
    });
    minimapToggle.setInteractive({ useHandCursor: true });
    minimapToggle.on('pointerdown', () => {
      this.gameScene.minimapVisible = !this.gameScene.minimapVisible;
      const hudScene = this.gameScene.scene.get('HUDScene');
      if (hudScene && hudScene.minimap) {
        hudScene.minimap.setVisible(this.gameScene.minimapVisible);
      }
      minimapToggle.setText(`Show Minimap: ${this.gameScene.minimapVisible ? '✅ ON' : '❌ OFF'}`);
      minimapToggle.setColor(this.gameScene.minimapVisible ? '#4CAF50' : '#FF6B6B');
      if (this.gameScene.saveSystem) this.gameScene.saveSystem.markDirty();
    });
    yOffset += 30;

    // Movement mode toggle
    const isJoystick = this.gameScene.movementMode !== 'tap';
    const moveToggle = this.add.text(leftX, yOffset, `Movement: ${isJoystick ? '🕹️ Joystick' : '👆 Tap to Move'}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: isJoystick ? '#4CAF50' : '#42A5F5',
    });
    moveToggle.setInteractive({ useHandCursor: true });
    moveToggle.on('pointerdown', () => {
      const newMode = this.gameScene.movementMode === 'tap' ? 'joystick' : 'tap';
      this.gameScene.movementMode = newMode;
      const hudScene = this.gameScene.scene.get('HUDScene');
      if (hudScene && hudScene.joystick) {
        hudScene.joystick.setVisible(newMode === 'joystick');
      }
      moveToggle.setText(`Movement: ${newMode === 'joystick' ? '🕹️ Joystick' : '👆 Tap to Move'}`);
      moveToggle.setColor(newMode === 'joystick' ? '#4CAF50' : '#42A5F5');
      if (this.gameScene.saveSystem) this.gameScene.saveSystem.markDirty();
    });
    yOffset += 30;

    // --- Info Section ---
    this.add.text(leftX, yOffset, 'ℹ️ Info', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#DAA520',
      fontStyle: 'bold',
    });
    yOffset += 25;

    const totalPlayTime = this.gameScene.totalPlayTime || 0;
    const playTimeStr = this._formatPlayTime(totalPlayTime);
    this.add.text(leftX, yOffset, `Play time: ${playTimeStr}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    yOffset += 20;

    const sessions = this.gameScene.sessionCount || 1;
    this.add.text(leftX, yOffset, `Sessions: ${sessions}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });
    yOffset += 20;

    this.add.text(leftX, yOffset, `Save version: v${SAVE_VERSION}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
    });

    // Toast container
    this.toastText = null;

    // Hidden file input for import
    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.accept = '.json';
    this._fileInput.style.display = 'none';
    document.body.appendChild(this._fileInput);
    this._fileInput.addEventListener('change', (e) => this._handleFileSelect(e));

    // Clean up file input on scene shutdown
    this.events.on('shutdown', () => {
      if (this._fileInput && this._fileInput.parentNode) {
        this._fileInput.parentNode.removeChild(this._fileInput);
      }
    });
  }

  _createButton(x, y, width, label, onClick, bgColor) {
    const bg = this.add.rectangle(x, y, width, 36, bgColor || COLORS.UI_BUTTON_BG, 1);
    bg.setStrokeStyle(1, COLORS.UI_GOLD, 0.5);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#DAA520',
    });
    text.setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(COLORS.UI_BUTTON_ACTIVE));
    bg.on('pointerout', () => bg.setFillStyle(bgColor || COLORS.UI_BUTTON_BG));
    bg.on('pointerdown', () => {
      bg.setScale(0.97);
      onClick();
    });
    bg.on('pointerup', () => bg.setScale(1));

    return { bg, text };
  }

  _getLastSavedText() {
    if (!this.gameScene || !this.gameScene.saveSystem) return 'Last saved: never';
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return 'Last saved: never';
      const data = JSON.parse(raw);
      if (!data.timestamp) return 'Last saved: never';
      const ago = Date.now() - data.timestamp;
      if (ago < 60000) return `Last saved: ${Math.floor(ago / 1000)}s ago`;
      if (ago < 3600000) return `Last saved: ${Math.floor(ago / 60000)}m ago`;
      return `Last saved: ${Math.floor(ago / 3600000)}h ago`;
    } catch {
      return 'Last saved: never';
    }
  }

  _formatPlayTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  _showToast(message) {
    if (this.toastText) this.toastText.destroy();
    const w = this.scale.width;
    this.toastText = this.add.text(w / 2, this.scale.height - 60, message, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#F5E6C8',
      backgroundColor: '#2A2A3EEE',
      padding: { x: 12, y: 6 },
    });
    this.toastText.setOrigin(0.5);
    this.toastText.setAlpha(0);
    this.tweens.add({
      targets: this.toastText,
      alpha: 1,
      duration: 200,
      hold: 2000,
      yoyo: true,
      onComplete: () => {
        if (this.toastText) this.toastText.destroy();
        this.toastText = null;
      },
    });
  }

  onSaveNow() {
    if (!this.gameScene.saveSystem) return;
    this.gameScene.saveSystem.markDirty();
    const result = this.gameScene.saveSystem.save(this.gameScene.gameState);
    if (result.success) {
      this._showToast('💾 Game saved!');
      if (this.lastSavedText) this.lastSavedText.setText(this._getLastSavedText());
    } else {
      this._showToast('❌ Save failed!');
    }
  }

  onExportSave() {
    if (!this.gameScene.saveSystem) return;
    const result = this.gameScene.saveSystem.exportSave(this.gameScene.gameState);
    if (result.success) {
      this._showToast('📥 Save exported!');
    } else {
      this._showToast('❌ Export failed!');
    }
  }

  onImportSave() {
    this._fileInput.value = '';
    this._fileInput.click();
  }

  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonString = e.target.result;
      const result = this.gameScene.saveSystem.importSave(jsonString);
      if (result.success) {
        this._showToast('✅ Save imported! Reloading...');
        this.time.delayedCall(1500, () => {
          window.location.reload();
        });
      } else {
        this._showToast(`❌ Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  }

  onResetProgress() {
    if (!this.resetPending) {
      this.resetPending = true;
      this.resetConfirmText.setText('Are you sure? Tap "Reset" again to confirm.');
      this.resetBtn.text.setText('⚠️ Confirm Reset');
      this.resetBtn.bg.setFillStyle(0x8B0000);

      // Auto-cancel after 5 seconds
      this.time.delayedCall(5000, () => {
        if (this.resetPending) {
          this.resetPending = false;
          this.resetConfirmText.setText('');
          this.resetBtn.text.setText('Reset All Progress');
          this.resetBtn.bg.setFillStyle(0x4A1A1A);
        }
      });
      return;
    }

    // Confirmed - delete and reload
    if (this.gameScene.saveSystem) {
      this.gameScene.saveSystem.stopAutoSave();
      this.gameScene.saveSystem.deleteSave();
    }
    this._showToast('🗑️ Progress reset! Reloading...');
    this.time.delayedCall(1500, () => {
      window.location.reload();
    });
  }

  closePanel() {
    this.scene.stop('SettingsPanel');
  }
}
