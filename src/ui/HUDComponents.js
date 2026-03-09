import { COLORS } from '../config/constants.js';

export function createHPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, COLORS.UI_HP_RED);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);

  const fill = scene.add.rectangle(x, y, width, height, COLORS.UI_HP_GREEN);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateHPBar(bar, ratio) {
  bar.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
}

export function createXPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, COLORS.UI_XP_BG);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);

  const fill = scene.add.rectangle(x, y, width, height, COLORS.UI_XP_FILL);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateXPBar(bar, ratio) {
  bar.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
}
