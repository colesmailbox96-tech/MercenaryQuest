export function getEffectiveStats(entity) {
  const base = {
    maxHp: entity.stats.maxHp,
    atk: entity.stats.atk,
    def: entity.stats.def,
  };
  const gear = entity.equipment || {};
  const bonus = { maxHp: 0, atk: 0, def: 0 };
  for (const slot of Object.values(gear)) {
    if (slot !== null && slot !== undefined) {
      for (const [stat, value] of Object.entries(slot.stats)) {
        if (bonus[stat] !== undefined) {
          bonus[stat] += value;
        }
      }
    }
  }
  return {
    maxHp: base.maxHp + bonus.maxHp,
    atk: base.atk + bonus.atk,
    def: base.def + bonus.def,
    baseAtk: base.atk,
    baseDef: base.def,
    baseMaxHp: base.maxHp,
    bonusAtk: bonus.atk,
    bonusDef: bonus.def,
    bonusMaxHp: bonus.maxHp,
  };
}
