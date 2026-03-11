/**
 * Shared panel utilities for consistent, polished UI across all panels.
 */

/**
 * Create a rounded panel background with gradient and gold border.
 * Returns a Graphics object that replaces the flat rectangle panels.
 */
export function createPanelBackground(scene, x, y, w, h, options = {}) {
  const {
    radius = 12,
    fillColor = 0x1A1A2E,
    fillAlpha = 0.94,
    borderColor = 0xDAA520,
    borderAlpha = 0.6,
    borderWidth = 2,
    headerHeight = 0,
    headerColor = 0x252540,
  } = options;

  const gfx = scene.add.graphics();
  gfx.setScrollFactor(0);

  // Drop shadow
  gfx.fillStyle(0x000000, 0.3);
  gfx.fillRoundedRect(x + 2, y + 2, w, h, radius);

  // Main panel body
  gfx.fillStyle(fillColor, fillAlpha);
  gfx.fillRoundedRect(x, y, w, h, radius);

  // Header gradient band
  if (headerHeight > 0) {
    gfx.fillStyle(headerColor, 0.8);
    gfx.fillRoundedRect(x, y, w, headerHeight, { tl: radius, tr: radius, bl: 0, br: 0 });
  }

  // Border
  gfx.lineStyle(borderWidth, borderColor, borderAlpha);
  gfx.strokeRoundedRect(x, y, w, h, radius);

  return gfx;
}

/**
 * Create a tab button with rounded top corners.
 */
export function createTabButton(scene, x, y, width, height, label, isActive) {
  const gfx = scene.add.graphics();
  gfx.setScrollFactor(0);

  const color = isActive ? 0x3A3A5E : 0x2A2A3E;
  gfx.fillStyle(color, 1);
  gfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, { tl: 6, tr: 6, bl: 0, br: 0 });

  if (isActive) {
    gfx.lineStyle(1, 0xDAA520, 0.4);
    gfx.strokeRoundedRect(x - width / 2, y - height / 2, width, height, { tl: 6, tr: 6, bl: 0, br: 0 });
  }

  const text = scene.add.text(x, y, label, {
    fontSize: '11px', fontFamily: 'monospace', color: isActive ? '#FFD700' : '#F5E6C8',
  }).setOrigin(0.5).setScrollFactor(0);

  return { gfx, text };
}
