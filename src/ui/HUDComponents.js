import { COLORS } from '../config/constants.js';

export function createHPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, 0x222222);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);
  bg.setStrokeStyle(1, 0x333333);

  const fill = scene.add.rectangle(x, y, width, height, 0x4CAF50);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateHPBar(bar, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  bar.fill.setScale(r, 1);

  // Color shift: green > yellow > red based on health
  if (r > 0.5) {
    bar.fill.fillColor = 0x4CAF50;
  } else if (r > 0.25) {
    bar.fill.fillColor = 0xFFA726;
  } else {
    bar.fill.fillColor = 0xEF5350;
  }
}

export function createXPBar(scene, x, y, width, height) {
  const bg = scene.add.rectangle(x, y, width, height, 0x222222);
  bg.setOrigin(0, 0.5);
  bg.setScrollFactor(0);
  bg.setStrokeStyle(1, 0x333333);

  const fill = scene.add.rectangle(x, y, width, height, 0x7B2FBE);
  fill.setOrigin(0, 0.5);
  fill.setScrollFactor(0);

  return { bg, fill, width };
}

export function updateXPBar(bar, ratio) {
  bar.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
}
