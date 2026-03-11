import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';

const LOG_COLORS = {
  hit: '#FFFFFF',
  crit: '#FFD700',
  miss: '#888888',
  dodge: '#AAAAAA',
  kill: '#4CAF50',
  agent_hit: '#B0BEC5',
  agent_crit: '#FFD700',
  agent_kill: '#81C784',
  agent_retreat: '#FF9800',
  agent_death: '#F44336',
  agent_deposit: '#2196F3',
  player_death: '#F44336',
  loot_gear: '#FFD700',
  loot_material: '#FFFFFF',
  fishing: '#42A5F5',
  fishing_miss: '#78909C',
  mining: '#FF8A65',
  mining_depleted: '#FF8A65',
  farming: '#66BB6A',
  farming_bonus: '#66BB6A',
  cooking: '#FFAB40',
  buff: '#AB47BC',
  buff_expire: '#9E9E9E',
  skill_levelup: '#00897B',
  level_up: '#FFD700',
  boss: '#F44336',
  boss_kill: '#FFD700',
};

export class CombatLogPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatLogPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    if (!this.gameScene || !this.gameScene.combatLog) {
      this.scene.stop();
      return;
    }

    const w = this.scale.width;
    const h = this.scale.height;
    const panelH = Math.floor(h * 0.4);
    const panelY = h - panelH;

    // Semi-transparent backdrop
    this.backdrop = this.add.rectangle(w / 2, panelY + panelH / 2, w, panelH, 0x1A1A2E, 0.92);
    this.backdrop.setScrollFactor(0);
    this.backdrop.setDepth(300);
    this.backdrop.setStrokeStyle(2, 0xDAA520, 0.6);
    this.backdrop.setInteractive();

    // Header bar
    this.headerBg = this.add.rectangle(w / 2, panelY + 14, w, 28, 0x111122, 0.95);
    this.headerBg.setScrollFactor(0);
    this.headerBg.setDepth(301);

    this.titleText = this.add.text(12, panelY + 6, '📜 Activity Log', {
      fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    });
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(302);

    this.closeBtn = this.add.text(w - 12, panelY + 6, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    });
    this.closeBtn.setOrigin(1, 0);
    this.closeBtn.setScrollFactor(0);
    this.closeBtn.setDepth(302);
    this.closeBtn.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-24, -24, 48, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.closeBtn.on('pointerdown', () => this.scene.stop());
    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#FF6B6B'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#F5E6C8'));

    // Log entries area
    this.logStartY = panelY + 30;
    this.logEndY = h - 4;
    this.logAreaH = this.logEndY - this.logStartY;
    this.lineHeight = 14;
    this.maxVisible = Math.floor(this.logAreaH / this.lineHeight);
    this.scrollOffset = 0;
    this.autoScroll = true;

    this.logTexts = [];
    this.renderEntries();

    // Listen for new entries
    this._onNewEntry = () => {
      if (this.autoScroll) {
        this.scrollOffset = 0;
      }
      this.renderEntries();
    };
    this.gameScene.combatLog.onNewEntry(this._onNewEntry);

    // Scroll input
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const entries = this.gameScene.combatLog.entries;
      const totalEntries = entries.length;
      if (deltaY < 0) {
        // Scroll up (older entries)
        this.scrollOffset = Math.min(this.scrollOffset + 2, Math.max(0, totalEntries - this.maxVisible));
        this.autoScroll = false;
      } else {
        // Scroll down (newer entries)
        this.scrollOffset = Math.max(0, this.scrollOffset - 2);
        if (this.scrollOffset === 0) this.autoScroll = true;
      }
      this.renderEntries();
    });

    // Touch drag for scrolling
    this._dragStartY = null;
    this.backdrop.on('pointerdown', (pointer) => {
      this._dragStartY = pointer.y;
    });
    this.input.on('pointermove', (pointer) => {
      if (this._dragStartY === null || !pointer.isDown) return;
      const delta = this._dragStartY - pointer.y;
      if (Math.abs(delta) > 10) {
        const entries = this.gameScene.combatLog.entries;
        const totalEntries = entries.length;
        if (delta > 0) {
          this.scrollOffset = Math.min(this.scrollOffset + 1, Math.max(0, totalEntries - this.maxVisible));
          this.autoScroll = false;
        } else {
          this.scrollOffset = Math.max(0, this.scrollOffset - 1);
          if (this.scrollOffset === 0) this.autoScroll = true;
        }
        this._dragStartY = pointer.y;
        this.renderEntries();
      }
    });
    this.input.on('pointerup', () => {
      this._dragStartY = null;
    });

    this.events.once('shutdown', () => {
      // Remove our listener via CombatLog's public API if available
      const log = this.gameScene.combatLog;
      if (log && typeof log.offNewEntry === 'function' && this._onNewEntry) {
        log.offNewEntry(this._onNewEntry);
        this._onNewEntry = null;
      }
    });
  }

  renderEntries() {
    // Destroy old texts
    for (const t of this.logTexts) {
      if (t && t.active) t.destroy();
    }
    this.logTexts = [];

    const log = this.gameScene.combatLog;
    if (!log) return;

    const entries = log.entries;
    const total = entries.length;

    // Calculate visible range
    const endIdx = total - this.scrollOffset;
    const startIdx = Math.max(0, endIdx - this.maxVisible);

    const visible = entries.slice(startIdx, endIdx);

    visible.forEach((entry, i) => {
      const y = this.logStartY + i * this.lineHeight;
      const elapsed = entry.elapsed || 0;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const color = LOG_COLORS[entry.type] || '#FFFFFF';
      const message = entry.message || this.formatEntry(entry);

      const timeTxt = this.add.text(8, y, timeStr, {
        fontSize: '9px', fontFamily: 'monospace', color: '#666666',
      });
      timeTxt.setScrollFactor(0);
      timeTxt.setDepth(302);
      this.logTexts.push(timeTxt);

      const msgTxt = this.add.text(50, y, message, {
        fontSize: '10px', fontFamily: 'monospace', color,
        wordWrap: { width: this.scale.width - 60 },
      });
      msgTxt.setScrollFactor(0);
      msgTxt.setDepth(302);
      this.logTexts.push(msgTxt);
    });
  }

  formatEntry(entry) {
    switch (entry.type) {
      case 'hit':
        return `${entry.attackerName} hit ${entry.defenderName} for ${entry.damage}`;
      case 'crit':
        return `${entry.attackerName} CRIT ${entry.defenderName} for ${entry.damage}!`;
      case 'miss':
        return `${entry.attackerName} missed ${entry.defenderName}`;
      case 'dodge':
        return `${entry.defenderName} dodged ${entry.attackerName}'s attack`;
      case 'agent_retreat':
        return entry.message || 'Agent retreated';
      default:
        return entry.message || '';
    }
  }
}
