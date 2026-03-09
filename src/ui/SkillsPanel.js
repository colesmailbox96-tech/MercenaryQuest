import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { SKILLS, SKILL_BONUSES, SKILL_XP_TABLE } from '../config/skillData.js';

export class SkillsPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'SkillsPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = w * 0.92;
    const panelH = h * 0.82;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Backdrop
    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.scene.stop());

    // Panel
    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.97);
    this.panel.setInteractive();

    // Slide in
    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 250, ease: 'Power2' });

    // Title
    this.add.text(w / 2, panelY + 14, '📊 Skills', {
      fontSize: '16px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0);

    // Close button
    const closeBtn = this.add.text(panelX + panelW - 12, panelY + 12, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    });
    closeBtn.setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());

    this._renderSkills(panelX, panelY, panelW, panelH);
  }

  _renderSkills(panelX, panelY, panelW) {
    const skillSystem = this.gameScene.skillSystem;
    let y = panelY + 40;
    const lx = panelX + 14;
    const barW = panelW - 28;

    for (const skillId of ['fishing', 'mining', 'farming', 'cooking']) {
      const def = SKILLS[skillId];
      const prog = skillSystem.getSkillProgress(skillId);

      // Skill header
      this.add.text(lx, y, `${def.icon} ${def.name}`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#F5E6C8',
      });
      const lvlStr = prog.isMax ? 'MAX LEVEL' : `Lv. ${prog.level}`;
      this.add.text(panelX + panelW - 14, y, lvlStr, {
        fontSize: '12px', fontFamily: 'monospace',
        color: prog.isMax ? '#FFD700' : '#88CC88',
      }).setOrigin(1, 0);
      y += 16;

      // XP bar
      const barBg = this.add.rectangle(lx + barW / 2, y + 5, barW, 8, 0x333355);
      barBg.setOrigin(0.5);
      if (!prog.isMax) {
        const fillW = Math.max(2, barW * prog.progress);
        const fillBar = this.add.rectangle(lx, y + 5, fillW, 8, 0x00ACC1);
        fillBar.setOrigin(0, 0.5);
        const xpStr = `${prog.progressXP}/${prog.neededXP} XP`;
        this.add.text(lx + barW / 2, y + 5, xpStr, {
          fontSize: '9px', fontFamily: 'monospace', color: '#FFFFFF',
        }).setOrigin(0.5);
      } else {
        const fillBar = this.add.rectangle(lx, y + 5, barW, 8, 0xFFD700);
        fillBar.setOrigin(0, 0.5);
        this.add.text(lx + barW / 2, y + 5, 'MAX', {
          fontSize: '9px', fontFamily: 'monospace', color: '#1A1A1A',
        }).setOrigin(0.5);
      }
      y += 14;

      // Bonuses
      const bonusDef = SKILL_BONUSES[skillId];
      const level = skillSystem.getLevel(skillId);
      const bonusLines = this._getBonusLines(skillId, bonusDef, level);
      for (const line of bonusLines) {
        this.add.text(lx + 4, y, line, {
          fontSize: '10px', fontFamily: 'monospace', color: '#AACCFF',
        });
        y += 12;
      }

      // Unlocks
      const unlocks = bonusDef.unlocks;
      for (const [lvl, unlock] of Object.entries(unlocks)) {
        const reached = level >= parseInt(lvl);
        const color = reached ? '#88CC88' : '#888888';
        const prefix = reached ? '✓' : `Lv.${lvl}`;
        this.add.text(lx + 4, y, `${prefix} ${unlock.description}`, {
          fontSize: '10px', fontFamily: 'monospace', color,
        });
        y += 12;
      }

      // Next unlock preview
      if (!prog.isMax) {
        let nextUnlockText = null;
        for (const [lvl, unlock] of Object.entries(unlocks)) {
          if (parseInt(lvl) > level) {
            nextUnlockText = `→ Lv.${lvl}: ${unlock.description}`;
            break;
          }
        }
        if (nextUnlockText) {
          this.add.text(lx + 4, y, nextUnlockText, {
            fontSize: '10px', fontFamily: 'monospace', color: '#DDAA55',
          });
          y += 12;
        }
      }

      // Separator
      this.add.rectangle(panelX + panelW / 2, y + 2, panelW - 10, 1, 0x333355);
      y += 8;
    }
  }

  _getBonusLines(skillId, bonusDef, level) {
    const lines = [];
    if (skillId === 'fishing') {
      lines.push(`Cycle speed: +${Math.round(bonusDef.cycleSpeedBonus * (level - 1) * 100)}%`);
      lines.push(`Catch chance: +${Math.round(bonusDef.catchChanceBonus * (level - 1) * 100)}%`);
      lines.push(`Double catch: ${Math.round(bonusDef.doubleCatchChance * (level - 1) * 100)}%`);
    } else if (skillId === 'mining') {
      lines.push(`Cycle speed: +${Math.round(bonusDef.cycleSpeedBonus * (level - 1) * 100)}%`);
      lines.push(`Extract chance: +${Math.round(bonusDef.extractChanceBonus * (level - 1) * 100)}%`);
      lines.push(`Double yield: ${Math.round(bonusDef.doubleYieldChance * (level - 1) * 100)}%`);
    } else if (skillId === 'farming') {
      lines.push(`Growth speed: +${Math.round(bonusDef.growthSpeedBonus * (level - 1) * 100)}%`);
      lines.push(`Bonus crop: ${Math.round(bonusDef.harvestBonusChance * (level - 1) * 100)}%`);
    } else if (skillId === 'cooking') {
      lines.push(`Buff duration: +${Math.round(bonusDef.buffDurationBonus * (level - 1) * 100)}%`);
      lines.push(`Buff potency: +${Math.round(bonusDef.buffPotencyBonus * (level - 1) * 100)}%`);
    }
    return lines;
  }
}
