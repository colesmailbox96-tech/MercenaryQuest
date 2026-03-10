import { COLORS } from '../config/constants.js';

export function createHPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, 0x2A2A2A);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);
  bg.setStrokeStyle(1, 0x444444);

  const fill = scene.add.rectangle(x, y, width, height, 0xCC3333);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateHPBar(bar, ratio) {
  bar.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
}

export function createXPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, 0x2A2A2A);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);
  bg.setStrokeStyle(1, 0x444444);

  const fill = scene.add.rectangle(x, y, width, height, 0x7B2FBE);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateXPBar(bar, ratio) {
  bar.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
}
