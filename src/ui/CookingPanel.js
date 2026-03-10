import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { COOKING_RECIPES } from '../config/cookingData.js';
import { ITEMS } from '../config/itemData.js';
import { COOKING_TIER_UNLOCK_LEVELS } from '../config/skillData.js';

export class CookingPanel extends Phaser.Scene {
  constructor() {
    super({ key: 'CookingPanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = w * 0.92;
    const panelH = h * 0.85;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;
    this.elements = [];

    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.scene.stop());

    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.97);
    this.panel.setInteractive();
    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 250, ease: 'Power2' });

    this._render();

    this.gameScene.events.on('inventoryChanged', this._render, this);
    this.events.once('shutdown', () => {
      this.gameScene.events.off('inventoryChanged', this._render, this);
    });
  }

  _clearElements() {
    this.elements.forEach(e => e && e.active && e.destroy());
    this.elements = [];
  }

  _render() {
    this._clearElements();
    const { panelX, panelY, panelW } = this;
    const w = this.scale.width;
    const cookSys = this.gameScene.cookingSystem;
    const skillSys = this.gameScene.skillSystem;
    const materials = this.gameScene.gameState.materials;

    // Title
    this.elements.push(
      this.add.text(w / 2, panelY + 14, '🍳 Kitchen', {
        fontSize: '15px', fontFamily: 'monospace', color: '#F5E6C8',
      }).setOrigin(0.5, 0)
    );

    const closeBtn = this.add.text(panelX + panelW - 12, panelY + 12, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());
    this.elements.push(closeBtn);

    const cookLevel = skillSys.getLevel('cooking');
    const prog = skillSys.getSkillProgress('cooking');
    const xpStr = prog.isMax ? 'MAX' : `${prog.progressXP}/${prog.neededXP} XP`;
    this.elements.push(
      this.add.text(panelX + 12, panelY + 36, `Cooking Level: ${cookLevel}  (${xpStr})`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#FF9800',
      })
    );

    let y = panelY + 54;
    const lx = panelX + 12;

    // Active buff
    const activeBuff = this.gameScene.activeBuffs[0];
    if (activeBuff) {
      const remaining = Math.max(0, activeBuff.expiresAt - Date.now());
      const secs = Math.floor(remaining / 1000);
      const minStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      this.elements.push(
        this.add.text(lx, y, `🟢 Active: ${activeBuff.icon} ${activeBuff.name}  ${minStr}`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#88FF88',
        })
      );
      y += 18;
    }

    // Recipes grouped by tier
    const tierMap = {};
    for (const recipe of Object.values(COOKING_RECIPES)) {
      if (!tierMap[recipe.tier]) tierMap[recipe.tier] = [];
      tierMap[recipe.tier].push(recipe);
    }

    for (const [tierNum, recipes] of Object.entries(tierMap)) {
      const tier = parseInt(tierNum);
      const unlockLevel = COOKING_TIER_UNLOCK_LEVELS[tier] || 1;
      const tierUnlocked = cookLevel >= unlockLevel;

      const tierLabel = tierUnlocked
        ? `── Tier ${tier} ──`
        : `── Tier ${tier} (🔒 Cooking Lv.${unlockLevel}) ──`;
      this.elements.push(
        this.add.text(lx, y, tierLabel, {
          fontSize: '11px', fontFamily: 'monospace', color: tierUnlocked ? '#AACCFF' : '#555577',
        })
      );
      y += 16;

      for (const recipe of recipes) {
        if (!tierUnlocked) {
          this.elements.push(
            this.add.text(lx + 8, y, `  ${recipe.name}  (locked)`, {
              fontSize: '11px', fontFamily: 'monospace', color: '#555555',
            })
          );
          y += 16;
          continue;
        }

        const canCook = cookSys.canCook(recipe.id, materials);
        const foodDef = ITEMS[recipe.output.id];
        const buffDesc = this._getBuffDesc(foodDef);

        // Recipe name + buff
        this.elements.push(
          this.add.text(lx + 4, y, `${foodDef?.emoji || '🍽'} ${recipe.name}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#F5E6C8',
          })
        );
        y += 14;

        if (buffDesc) {
          this.elements.push(
            this.add.text(lx + 10, y, `  ${buffDesc}`, {
              fontSize: '10px', fontFamily: 'monospace', color: '#FFCC44',
            })
          );
          y += 12;
        }

        // Ingredients
        const ingChecks = cookSys.checkIngredients(recipe.id, materials);
        for (const ing of ingChecks) {
          const ingDef = ITEMS[ing.id];
          const color = ing.satisfied ? '#88CC88' : '#CC4444';
          const ingText = `  ${ingDef?.emoji || '?'} ${ingDef?.name || ing.id} ×${ing.quantity}  (${ing.owned}/${ing.quantity})`;
          this.elements.push(
            this.add.text(lx + 10, y, ingText, {
              fontSize: '10px', fontFamily: 'monospace', color,
            })
          );
          y += 12;
        }

        // Cook button
        const cookBtnColor = canCook ? '#DAA520' : '#555555';
        const cookBtn = this.add.text(panelX + panelW - 70, y - ingChecks.length * 12 - 14, '[ 🍳 Cook ]', {
          fontSize: '12px', fontFamily: 'monospace', color: cookBtnColor,
        });
        if (canCook) {
          cookBtn.setInteractive({ useHandCursor: true });
          cookBtn.on('pointerdown', () => {
            const result = cookSys.cook(recipe.id, this.gameScene.gameState);
            if (result.success) {
              this.gameScene.events.emit('cookingComplete', result);
            }
          });
        }
        this.elements.push(cookBtn);

        // Cook Max button
        const maxCount = cookSys.getMaxCookCount(recipe.id, materials);
        const cookMaxColor = maxCount > 0 ? '#FF9800' : '#555555';
        const cookMaxBtn = this.add.text(panelX + panelW - 70, y - ingChecks.length * 12 - 14 + 18, `[Max ×${maxCount}]`, {
          fontSize: '11px', fontFamily: 'monospace', color: cookMaxColor,
        });
        if (maxCount > 0) {
          cookMaxBtn.setInteractive({ useHandCursor: true });
          cookMaxBtn.on('pointerdown', () => {
            const result = cookSys.cookBatch(recipe.id, this.gameScene.gameState, maxCount);
            if (result.success) {
              this.gameScene.events.emit('cookingComplete', result);
            }
          });
        }
        this.elements.push(cookMaxBtn);
        y += 8;
      }
    }
  }

  _getBuffDesc(foodDef) {
    if (!foodDef || !foodDef.buff) return null;
    const parts = [];
    if (foodDef.buff.stats) {
      for (const [k, v] of Object.entries(foodDef.buff.stats)) {
        if (k === 'atk') parts.push(`+${v} ATK`);
        else if (k === 'def') parts.push(`+${v} DEF`);
        else if (k === 'maxHp') parts.push(`+${v} HP`);
      }
    }
    if (foodDef.buff.skillEffects) {
      for (const [skill, effects] of Object.entries(foodDef.buff.skillEffects)) {
        for (const [eff, val] of Object.entries(effects)) {
          if (eff.includes('Speed')) parts.push(`+${Math.round(val * 100)}% ${skill} speed`);
          else if (eff.includes('Chance') || eff.includes('Bonus')) parts.push(`+${Math.round(val * 100)}% ${skill}`);
        }
      }
    }
    if (foodDef.duration) {
      parts.push(`${Math.round(foodDef.duration / 1000)}s`);
    }
    return parts.join(', ');
  }
}
