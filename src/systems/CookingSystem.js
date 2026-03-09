import { COOKING_RECIPES } from '../config/cookingData.js';
import { ITEMS } from '../config/itemData.js';

function getOwnedQuantity(materials, itemId) {
  const entry = materials.find(m => m.id === itemId);
  return entry ? entry.quantity : 0;
}

function removeFromMaterials(materials, itemId, qty) {
  const idx = materials.findIndex(m => m.id === itemId);
  if (idx === -1) return;
  materials[idx].quantity -= qty;
  if (materials[idx].quantity <= 0) materials.splice(idx, 1);
}

function addToMaterials(materials, item) {
  const existing = materials.find(m => m.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    materials.push({ ...item });
  }
}

export class CookingSystem {
  constructor(scene, skillSystem) {
    this.scene = scene;
    this.skillSystem = skillSystem;
  }

  getAvailableRecipes() {
    const cookingLevel = this.skillSystem.getLevel('cooking');
    return Object.values(COOKING_RECIPES).filter(r => r.requiredCookingLevel <= cookingLevel);
  }

  canCook(recipeId, materials) {
    const recipe = COOKING_RECIPES[recipeId];
    if (!recipe) return false;
    if (this.skillSystem.getLevel('cooking') < recipe.requiredCookingLevel) return false;
    for (const ing of recipe.ingredients) {
      if (getOwnedQuantity(materials, ing.id) < ing.quantity) return false;
    }
    return true;
  }

  checkIngredients(recipeId, materials) {
    const recipe = COOKING_RECIPES[recipeId];
    if (!recipe) return [];
    return recipe.ingredients.map(ing => ({
      ...ing,
      owned: getOwnedQuantity(materials, ing.id),
      satisfied: getOwnedQuantity(materials, ing.id) >= ing.quantity,
    }));
  }

  cook(recipeId, gameState) {
    const recipe = COOKING_RECIPES[recipeId];
    if (!recipe) return { success: false, reason: 'Unknown recipe' };
    if (!this.canCook(recipeId, gameState.materials)) {
      return { success: false, reason: 'Missing ingredients or insufficient level' };
    }

    // Consume ingredients
    for (const ing of recipe.ingredients) {
      removeFromMaterials(gameState.materials, ing.id, ing.quantity);
    }

    // Check double portion perk
    let outputQty = recipe.output.quantity;
    if (this.skillSystem.hasPerk('cooking', 'double_portion') && Math.random() < 0.20) {
      outputQty += recipe.output.quantity;
    }

    const foodDef = ITEMS[recipe.output.id];
    addToMaterials(gameState.materials, {
      id: recipe.output.id,
      name: foodDef?.name || recipe.output.id,
      emoji: foodDef?.emoji || '🍽',
      quantity: outputQty,
      sellValue: foodDef?.sellValue || 0,
      category: 'food',
    });

    const isAdvanced = recipe.requiredCookingLevel >= 5;
    this.skillSystem.addXP('cooking', isAdvanced ? 10 : 6);

    this.scene.events.emit('inventoryChanged', gameState.materials);
    return { success: true, item: recipe.output.id, quantity: outputQty };
  }
}
