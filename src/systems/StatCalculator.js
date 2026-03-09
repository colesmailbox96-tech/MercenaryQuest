export function getEffectiveStats(entity, activeBuffs = []) {
  const base = {
    maxHp: entity.stats.maxHp,
    atk: entity.stats.atk,
    def: entity.stats.def,
  };
  const gear = entity.equipment || {};
  const gearBonus = { maxHp: 0, atk: 0, def: 0 };
  for (const slot of Object.values(gear)) {
    if (slot !== null && slot !== undefined) {
      for (const [stat, value] of Object.entries(slot.stats)) {
        if (gearBonus[stat] !== undefined) {
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
        if (buffBonus[stat] !== undefined) buffBonus[stat] += value;
      }
    }
  }

  return {
    maxHp: base.maxHp + gearBonus.maxHp + buffBonus.maxHp,
    atk: base.atk + gearBonus.atk + buffBonus.atk,
    def: base.def + gearBonus.def + buffBonus.def,
    baseAtk: base.atk,
    baseDef: base.def,
    baseMaxHp: base.maxHp,
    bonusAtk: gearBonus.atk + buffBonus.atk,
    bonusDef: gearBonus.def + buffBonus.def,
    bonusMaxHp: gearBonus.maxHp + buffBonus.maxHp,
  };
}
