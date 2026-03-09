import { COLORS } from '../config/constants.js';

export class BuffBar {
  constructor(hudScene) {
    this.scene = hudScene;
    this.container = null;
    this.buffText = null;
    this._warningTween = null;
    this._visible = false;
  }

  create(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;

    this.bg = this.scene.add.rectangle(x + width / 2, y + 8, width, 16, COLORS.UI_PANEL, 0.85);
    this.bg.setScrollFactor(0).setDepth(199).setVisible(false);

    this.buffText = this.scene.add.text(x + 6, y + 2, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#88FF88',
    });
    this.buffText.setScrollFactor(0).setDepth(200).setVisible(false);
  }

  update(activeBuffs) {
    if (!activeBuffs || activeBuffs.length === 0) {
      this._hide();
      return;
    }

    const buff = activeBuffs[0];
    const remaining = Math.max(0, buff.expiresAt - Date.now());
    const secs = Math.floor(remaining / 1000);
    const minStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const statStr = this._getStatStr(buff);

    this.buffText.setText(`${buff.icon} ${buff.name}  ${statStr}  ${minStr}`);

    if (!this._visible) {
      this.bg.setVisible(true);
      this.buffText.setVisible(true);
      this._visible = true;
    }

    // Warning color when <15s remain
    if (secs <= 15) {
      this.buffText.setColor('#FF8C00');
      if (!this._warningTween) {
        this._warningTween = this.scene.tweens.add({
          targets: this.buffText,
          alpha: 0.4,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      }
    } else {
      this.buffText.setColor('#88FF88');
      if (this._warningTween) {
        this._warningTween.stop();
        this._warningTween = null;
        this.buffText.setAlpha(1);
      }
    }
  }

  _hide() {
    if (!this._visible) return;
    this.bg.setVisible(false);
    this.buffText.setVisible(false);
    if (this._warningTween) {
      this._warningTween.stop();
      this._warningTween = null;
    }
    this._visible = false;
  }

  _getStatStr(buff) {
    const parts = [];
    if (buff.stats) {
      if (buff.stats.atk) parts.push(`+${buff.stats.atk}⚔`);
      if (buff.stats.def) parts.push(`+${buff.stats.def}🛡`);
      if (buff.stats.maxHp) parts.push(`+${buff.stats.maxHp}❤`);
    }
    if (buff.skillEffects) {
      for (const [skill, effects] of Object.entries(buff.skillEffects)) {
        const skillIcons = { fishing: '🎣', mining: '⛏', farming: '🌾', cooking: '🍳' };
        const icon = skillIcons[skill] || skill;
        for (const [eff, val] of Object.entries(effects)) {
          if (eff.includes('Speed')) parts.push(`${icon}+${Math.round(val * 100)}%`);
        }
      }
    }
    return parts.join(' ');
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.bg) this.bg.setPosition(x + this.width / 2, y + 8);
    if (this.buffText) this.buffText.setPosition(x + 6, y + 2);
  }
}
