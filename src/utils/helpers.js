export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function weightedRandom(table) {
  if (!table || table.length === 0) return null;
  const total = table.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return table[table.length - 1];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function tileToWorld(tileX, tileY, tileSize) {
  return { x: tileX * tileSize + tileSize / 2, y: tileY * tileSize + tileSize / 2 };
}

export function worldToTile(worldX, worldY, tileSize) {
  return { x: Math.floor(worldX / tileSize), y: Math.floor(worldY / tileSize) };
}

// ---- Inventory helpers ----
export function getOwnedQuantity(materials, itemId) {
  const entry = materials.find(m => m.id === itemId);
  return entry ? entry.quantity : 0;
}

export function removeFromMaterials(materials, itemId, qty) {
  const idx = materials.findIndex(m => m.id === itemId);
  if (idx === -1) return;
  materials[idx].quantity -= qty;
  if (materials[idx].quantity <= 0) materials.splice(idx, 1);
}

export function addToMaterials(materials, item) {
  const existing = materials.find(m => m.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    materials.push({ ...item });
  }
}
