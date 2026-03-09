export const COOKING_RECIPES = {
  // ===== TIER 1 (Cooking Lv.1) =====
  basic_stew: {
    id: 'basic_stew',
    name: 'Basic Stew',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'small_fish', quantity: 2 },
      { id: 'wheat',      quantity: 1 },
    ],
    output: { id: 'basic_stew', quantity: 1 },
  },
  carrot_soup: {
    id: 'carrot_soup',
    name: 'Carrot Soup',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'carrot', quantity: 2 },
      { id: 'wheat',  quantity: 1 },
    ],
    output: { id: 'carrot_soup', quantity: 1 },
  },
  grilled_fish: {
    id: 'grilled_fish',
    name: 'Grilled Fish',
    tier: 1,
    requiredCookingLevel: 1,
    ingredients: [
      { id: 'small_fish', quantity: 3 },
    ],
    output: { id: 'grilled_fish', quantity: 1 },
  },

  // ===== TIER 2 (Cooking Lv.2) =====
  hearty_chowder: {
    id: 'hearty_chowder',
    name: 'Hearty Chowder',
    tier: 2,
    requiredCookingLevel: 2,
    ingredients: [
      { id: 'large_fish', quantity: 1 },
      { id: 'carrot',     quantity: 2 },
      { id: 'wheat',      quantity: 2 },
    ],
    output: { id: 'hearty_chowder', quantity: 1 },
  },
  miners_meal: {
    id: 'miners_meal',
    name: "Miner's Meal",
    tier: 2,
    requiredCookingLevel: 2,
    ingredients: [
      { id: 'tomato',     quantity: 2 },
      { id: 'wheat',      quantity: 2 },
      { id: 'river_crab', quantity: 1 },
    ],
    output: { id: 'miners_meal', quantity: 1 },
  },

  // ===== TIER 3 (Cooking Lv.4) =====
  golden_bread: {
    id: 'golden_bread',
    name: 'Golden Bread',
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'golden_wheat', quantity: 2 },
      { id: 'carrot',       quantity: 1 },
    ],
    output: { id: 'golden_bread', quantity: 1 },
  },
  anglers_feast: {
    id: 'anglers_feast',
    name: "Angler's Feast",
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'golden_carp', quantity: 1 },
      { id: 'tomato',      quantity: 2 },
      { id: 'wheat',       quantity: 3 },
    ],
    output: { id: 'anglers_feast', quantity: 1 },
  },

  // ===== TIER 4 (Cooking Lv.6) =====
  moonberry_tart: {
    id: 'moonberry_tart',
    name: 'Moonberry Tart',
    tier: 4,
    requiredCookingLevel: 6,
    ingredients: [
      { id: 'moonberry',    quantity: 2 },
      { id: 'golden_wheat', quantity: 1 },
      { id: 'wheat',        quantity: 2 },
    ],
    output: { id: 'moonberry_tart', quantity: 1 },
  },
  abyssal_broth: {
    id: 'abyssal_broth',
    name: 'Abyssal Broth',
    tier: 4,
    requiredCookingLevel: 6,
    ingredients: [
      { id: 'abyssal_eel', quantity: 2 },
      { id: 'moonberry',   quantity: 1 },
      { id: 'tomato',      quantity: 2 },
    ],
    output: { id: 'abyssal_broth', quantity: 1 },
  },

  // ===== TIER 5 (Cooking Lv.8) =====
  starfruit_elixir: {
    id: 'starfruit_elixir',
    name: 'Starfruit Elixir',
    tier: 5,
    requiredCookingLevel: 8,
    ingredients: [
      { id: 'starfruit',    quantity: 1 },
      { id: 'moonberry',    quantity: 2 },
      { id: 'golden_wheat', quantity: 2 },
      { id: 'sea_gem',      quantity: 1 },
    ],
    output: { id: 'starfruit_elixir', quantity: 1 },
  },
  // ===== NIGHT-EXCLUSIVE (Phase 7) =====
  midnight_broth: {
    id: 'midnight_broth',
    name: 'Midnight Broth',
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'midnight_dew', quantity: 2 },
      { id: 'carrot',       quantity: 1 },
      { id: 'wheat',        quantity: 1 },
    ],
    output: { id: 'midnight_broth', quantity: 1 },
  },
  shadow_stew: {
    id: 'shadow_stew',
    name: 'Shadow Stew',
    tier: 4,
    requiredCookingLevel: 6,
    ingredients: [
      { id: 'shadow_essence', quantity: 1 },
      { id: 'tomato',         quantity: 2 },
      { id: 'moonberry',      quantity: 1 },
    ],
    output: { id: 'shadow_stew', quantity: 1 },
  },
  // Merchant-exclusive crops cooking
  inferno_stew: {
    id: 'inferno_stew',
    name: 'Inferno Stew',
    tier: 3,
    requiredCookingLevel: 4,
    ingredients: [
      { id: 'ember_pepper', quantity: 2 },
      { id: 'tomato',       quantity: 1 },
      { id: 'wheat',        quantity: 1 },
    ],
    output: { id: 'inferno_stew', quantity: 1 },
  },
  frostguard_soup: {
    id: 'frostguard_soup',
    name: 'Frostguard Soup',
    tier: 4,
    requiredCookingLevel: 5,
    ingredients: [
      { id: 'frost_lily', quantity: 2 },
      { id: 'carrot',     quantity: 2 },
      { id: 'wheat',      quantity: 1 },
    ],
    output: { id: 'frostguard_soup', quantity: 1 },
  },
};
