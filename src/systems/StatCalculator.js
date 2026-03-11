export function calculatePowerScore(entity, activeBuffs = []) {
  const stats = getEffectiveStats(entity, activeBuffs);
  return Math.round(
    (stats.atk * 3) +
    (stats.def * 2.5) +
    (stats.maxHp * 0.5)
  );
}

export function getEffectiveStats(entity, activeBuffs = []) {
  const stats = entity.stats || {};
  const base = {
    maxHp: stats.maxHp || 20,
    atk: stats.atk || 1,
    def: stats.def || 0,
  };
  const gear = entity.equipment || {};
  const gearBonus = { maxHp: 0, atk: 0, def: 0 };
  for (const slot of Object.values(gear)) {
    if (slot !== null && slot !== undefined && slot.stats) {
      for (const [stat, value] of Object.entries(slot.stats)) {
        if (gearBonus[stat] !== undefined && Number.isFinite(value)) {
          gearBonus[stat] += value;
        }
      }
    }
  }

  // Food buff bonuses
  const buffBonus = { maxHp: 0, atk: 0, def: 0 };
  for (const buff of activeBuffs) {
    if (buff.stats) {
      for (const [stat, value] of Object.entries(buff.stats)) {
        if (buffBonus[stat] !== undefined && Number.isFinite(value)) buffBonus[stat] += value;
      }
    }
  }

  let atk = base.atk + gearBonus.atk + buffBonus.atk;
  let def = base.def + gearBonus.def + buffBonus.def;
  let maxHp = base.maxHp + gearBonus.maxHp + buffBonus.maxHp;

  return {
    maxHp: Number.isFinite(maxHp) ? maxHp : 20,
    atk: Number.isFinite(atk) ? atk : 1,
    def: Number.isFinite(def) ? def : 0,
    baseAtk: base.atk,
    baseDef: base.def,
    baseMaxHp: base.maxHp,
    bonusAtk: gearBonus.atk + buffBonus.atk,
    bonusDef: gearBonus.def + buffBonus.def,
    bonusMaxHp: gearBonus.maxHp + buffBonus.maxHp,
  };
}
