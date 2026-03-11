import Phaser from 'phaser';
import { COLORS } from '../config/constants.js';
import { FORGE_RECIPES } from '../config/recipeData.js';
import { ITEMS } from '../config/itemData.js';
import { RARITY, GEAR_DEFS } from '../config/gearData.js';
import { getOwnedQuantity, removeFromMaterials } from '../utils/helpers.js';

const SLOT_ICONS = {
  weapon: '🗡️',
  helmet: '⛑️',
  chest: '🛡️',
  boots: '👢',
  accessory: '📿',
};

function rollForgeGear(recipe) {
  const rarities = Object.entries(RARITY);
  const minRarityIndex = rarities.findIndex(([k]) => k.toLowerCase() === recipe.minRarity);

  const eligibleRarities = rarities.slice(minRarityIndex);
  const totalWeight = eligibleRarities.reduce((sum, [, r]) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosenRarity = eligibleRarities[0][1];
  for (const [, rarity] of eligibleRarities) {
    roll -= rarity.weight;
    if (roll <= 0) { chosenRarity = rarity; break; }
  }

  const stats = {};
  for (const [stat, [min, max]] of Object.entries(recipe.output.statRanges)) {
    const base = min + Math.random() * (max - min);
    stats[stat] = Math.round(base * chosenRarity.statMultiplier);
  }

  return {
    uid: `${recipe.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${(ForgePanel._uidCounter = (ForgePanel._uidCounter || 0) + 1)}`,
    defId: recipe.id,
    name: chosenRarity.name === 'Common' ? recipe.name : `${chosenRarity.name} ${recipe.name}`,
    slot: recipe.slot,
    icon: GEAR_DEFS[recipe.id]?.icon || '⚔️',
    textureKey: GEAR_DEFS[recipe.id]?.textureKey || 'gear_slot_bg',
    rarity: Object.keys(RARITY).find(k => RARITY[k] === chosenRarity) || 'RARE',
    rarityColor: chosenRarity.color,
    stats,
    enhancement: 0,
    equippedBy: null,
    type: 'gear',
    sellValue: Object.values(stats).reduce((s, v) => s + v, 0) * 2,
  };
}

export class ForgePanel extends Phaser.Scene {
  constructor() {
    super({ key: 'ForgePanel' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = Math.min(w - 20, 370);
    const panelH = Math.min(h * 0.85, h - 40);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;
    this.elements = [];

    this.backdrop = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.backdrop.setInteractive();
    this.backdrop.on('pointerdown', () => this.scene.stop());

    this.panel = this.add.rectangle(w / 2, h / 2, panelW, panelH, COLORS.UI_PANEL, 0.92);
    this.panel.setStrokeStyle(2, COLORS.UI_GOLD, 0.6);
    this.panel.setInteractive();
    this.panel.setAlpha(0);
    this.panel.y = h;
    this.tweens.add({ targets: this.panel, y: h / 2, alpha: 1, duration: 250, ease: 'Power2' });

    this._render();

    this.gameScene.events.on('inventoryChanged', this._render, this);
    this.gameScene.events.on('gearStashChanged', this._render, this);
    this.events.once('shutdown', () => {
      this.gameScene.events.off('inventoryChanged', this._render, this);
      this.gameScene.events.off('gearStashChanged', this._render, this);
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
    const materials = this.gameScene.gameState.materials;

    // Header (40px)
    this.elements.push(
      this.add.text(w / 2, panelY + 14, '⚒️ Forge', {
        fontSize: '18px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
      }).setOrigin(0.5, 0)
    );

    const closeBtn = this.add.text(panelX + panelW - 12, panelY + 12, '✕', {
      fontSize: '20px', fontFamily: 'monospace', color: '#F5E6C8', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-24, -24, 48, 48), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    closeBtn.on('pointerdown', () => this.scene.stop());
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF6B6B'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#F5E6C8'));
    this.elements.push(closeBtn);

    // Header separator
    this.elements.push(
      this.add.rectangle(w / 2, panelY + 40, panelW - 24, 1, COLORS.UI_GOLD, 0.3)
    );

    this.elements.push(
      this.add.text(panelX + 12, panelY + 46, 'Craft powerful gear from rare materials', {
        fontSize: '12px', fontFamily: 'monospace', color: '#DAA520',
        wordWrap: { width: panelW - 24 },
      })
    );

    let y = panelY + 64;
    const lx = panelX + 12;
    const rightEdge = panelX + panelW - 12;

    // Tier header
    this.elements.push(
      this.add.text(lx, y, '── Tier 4 Recipes ──', {
        fontSize: '13px', fontFamily: 'monospace', color: '#DAA520', fontStyle: 'bold',
      })
    );
    y += 20;

    for (const recipe of Object.values(FORGE_RECIPES)) {
      const canForge = this._canForge(recipe, materials);
      const slotIcon = SLOT_ICONS[recipe.slot] || '⚔️';

      // Recipe name on its own line
      this.elements.push(
        this.add.text(lx + 4, y, `${slotIcon} ${recipe.name}`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#FFFFFF', fontStyle: 'bold',
          wordWrap: { width: panelW - 24 },
        })
      );
      y += 18;

      // Stats preview + Forge button on same line
      const statParts = [];
      for (const [stat, [min, max]] of Object.entries(recipe.output.statRanges)) {
        const label = stat === 'atk' ? 'ATK' : stat === 'def' ? 'DEF' : 'HP';
        statParts.push(`${min}-${max} ${label}`);
      }
      this.elements.push(
        this.add.text(lx + 10, y, `${statParts.join(', ')}  (${recipe.minRarity}+)`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#CCCCCC',
        })
      );

      // Forge button — fixed width, right-aligned with margin
      const forgeBtnColor = canForge ? '#DAA520' : '#555555';
      const forgeBtn = this.add.text(rightEdge - 8, y, '[ Forge ]', {
        fontSize: '12px', fontFamily: 'monospace', color: forgeBtnColor, fontStyle: 'bold',
      }).setOrigin(1, 0);
      if (canForge) {
        forgeBtn.setInteractive({ useHandCursor: true });
        forgeBtn.on('pointerdown', () => {
          this._forge(recipe);
        });
      }
      this.elements.push(forgeBtn);
      y += 16;

      // Ingredients with right-aligned counts
      const ingChecks = this._checkIngredients(recipe, materials);
      for (const ing of ingChecks) {
        const ingDef = ITEMS[ing.id];
        const color = ing.satisfied ? '#4CAF50' : '#FF6B6B';
        const ingName = `  ${ingDef?.emoji || '?'} ${ingDef?.name || ing.id} ×${ing.quantity}`;
        const maxNameW = rightEdge - (lx + 20) - 60;
        this.elements.push(
          this.add.text(lx + 20, y, ingName, {
            fontSize: '11px', fontFamily: 'monospace', color,
            wordWrap: { width: maxNameW },
          })
        );
        // Right-aligned count
        this.elements.push(
          this.add.text(rightEdge - 8, y, `(${ing.owned}/${ing.quantity})`, {
            fontSize: '11px', fontFamily: 'monospace', color,
          }).setOrigin(1, 0)
        );
        y += 16;
      }
      y += 8; // spacing between recipes
    }
  }

  _canForge(recipe, materials) {
    for (const ing of recipe.ingredients) {
      if (getOwnedQuantity(materials, ing.id) < ing.quantity) return false;
    }
    return true;
  }

  _checkIngredients(recipe, materials) {
    return recipe.ingredients.map(ing => ({
      ...ing,
      owned: getOwnedQuantity(materials, ing.id),
      satisfied: getOwnedQuantity(materials, ing.id) >= ing.quantity,
    }));
  }

  _forge(recipe) {
    const materials = this.gameScene.gameState.materials;
    if (!this._canForge(recipe, materials)) return;

    // Consume ingredients
    for (const ing of recipe.ingredients) {
      removeFromMaterials(materials, ing.id, ing.quantity);
    }

    // Roll gear with minRarity guarantee
    const gearItem = rollForgeGear(recipe);

    // Add to gear stash
    this.gameScene.lootSystem.addGearToStash(gearItem);

    this.gameScene.events.emit('inventoryChanged', materials);
    this._render();
  }
}
