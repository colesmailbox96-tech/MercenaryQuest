import { COMBAT_TICK } from '../config/constants.js';
import { getEffectiveStats } from '../systems/StatCalculator.js';

function getEntityName(entity) {
  return entity.name || (entity.entityType === 'player' ? 'You' : entity.entityType === 'agent' ? 'Agent' : 'Enemy');
}

export function calculateDamage(attacker, defender, attackerBuffs = [], defenderBuffs = []) {
  const atkStats = getEffectiveStats(attacker, attackerBuffs);
  const defStats = getEffectiveStats(defender, defenderBuffs);
  const baseDamage = Math.max(1, atkStats.atk - defStats.def);

  // Dodge check: high defense relative to attack grants dodge chance
  if (defStats.def > atkStats.atk) {
    const dodgeChance = Math.min(0.30, (defStats.def - atkStats.atk) * 0.03);
    if (Math.random() < dodgeChance) {
      return { damage: 0, isCrit: false, isMiss: false, isDodge: true };
    }
  }

  // Miss check: glancing blows can miss entirely
  if (baseDamage <= 1 && Math.random() < 0.08) {
    return { damage: 0, isCrit: false, isMiss: true, isDodge: false };
  }

  // Damage variance: 80%-120% of base
  const variance = 0.80 + Math.random() * 0.40;
  let finalDamage = Math.max(1, Math.round(baseDamage * variance));

  // Critical hit check
  const CRIT_CHANCE = 0.05;
  const bonusCrit = atkStats.critChance || 0;
  const totalCritChance = Math.min(0.25, CRIT_CHANCE + bonusCrit);
  let isCrit = false;
  if (Math.random() < totalCritChance) {
    finalDamage = Math.round(finalDamage * 1.5);
    isCrit = true;
  }

  // Final NaN safety net
  if (!Number.isFinite(finalDamage) || finalDamage < 0) finalDamage = 0;

  return { damage: finalDamage, isCrit, isMiss: false, isDodge: false, variance };
}

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.combats = [];
  }

  startCombat(attacker, defender) {
    if (attacker.inCombat || defender.inCombat) return;

    attacker.inCombat = true;
    defender.inCombat = true;

    const combat = {
      attacker,
      defender,
      timer: this.scene.time.addEvent({
        delay: COMBAT_TICK,
        callback: () => this.tick(combat),
        loop: true,
      }),
    };

    this.combats.push(combat);
  }

  tick(combat) {
    const { attacker, defender } = combat;

    if (!attacker.active || !defender.active) {
      this.endCombat(combat);
      return;
    }

    const activeBuffs = this.scene.activeBuffs || [];
    const attackerBuffs = attacker.entityType === 'player' ? activeBuffs : [];
    const defenderBuffs = defender.entityType === 'player' ? activeBuffs : [];
    const attackerName = getEntityName(attacker);
    const defenderName = getEntityName(defender);

    // --- Attacker hits defender ---
    const atkResult = calculateDamage(attacker, defender, attackerBuffs, defenderBuffs);

    if (atkResult.isDodge) {
      this.scene.events.emit('combatDodge', { attacker, defender });
      this.scene.events.emit('combatLogEntry', { type: 'dodge', attackerName, defenderName });
      if (this.scene.audioSystem) this.scene.audioSystem.playDodge();
      return;
    }

    if (atkResult.isMiss) {
      this.scene.events.emit('combatMiss', { attacker, defender });
      this.scene.events.emit('combatLogEntry', { type: 'miss', attackerName, defenderName });
      if (this.scene.audioSystem) this.scene.audioSystem.playMiss();
      return;
    }

    // Apply wolf companion damage bonus for player attacks
    let dmgToDefender = atkResult.damage;
    if (attacker.entityType === 'player' && this.scene.companionSystem) {
      const dmgBonus = this.scene.companionSystem.getEffectivePerkValue('damageBonus');
      if (dmgBonus > 0) dmgToDefender = Math.ceil(dmgToDefender * (1 + dmgBonus));
    }

    if (!Number.isFinite(dmgToDefender) || dmgToDefender < 0) dmgToDefender = 0;

    if (typeof defender.takeDamage === 'function') {
      defender.takeDamage(dmgToDefender);
    } else {
      defender.stats.hp = Math.max(0, defender.stats.hp - dmgToDefender);
      if (!Number.isFinite(defender.stats.hp)) defender.stats.hp = 0;
      if (defender.updateHPBar) defender.updateHPBar();
    }

    if (atkResult.isCrit) {
      this.scene.events.emit('combatCrit', { attacker, defender, damage: dmgToDefender });
      this.scene.events.emit('combatLogEntry', { type: 'crit', attackerName, defenderName, damage: dmgToDefender });
      if (this.scene.audioSystem) this.scene.audioSystem.playCritHit();
    } else {
      this.scene.events.emit('combatHit', { attacker, defender, damage: dmgToDefender });
      this.scene.events.emit('combatLogEntry', { type: 'hit', attackerName, defenderName, damage: dmgToDefender });
      if (this.scene.audioSystem) this.scene.audioSystem.playHit();
    }

    if (this.scene.juiceSystem) {
      this.scene.juiceSystem.showDamageNumber(defender.x, defender.y - 16, dmgToDefender, atkResult.isCrit);
    }

    if (defender.stats.hp <= 0) {
      this.onEntityDeath(defender, attacker);
      this.endCombat(combat);
      return;
    }

    // --- Defender counter-attacks attacker ---
    const defResult = calculateDamage(defender, attacker, defenderBuffs, attackerBuffs);

    if (defResult.isDodge) {
      this.scene.events.emit('combatDodge', { attacker: defender, defender: attacker });
      this.scene.events.emit('combatLogEntry', { type: 'dodge', attackerName: defenderName, defenderName: attackerName });
      if (this.scene.audioSystem) this.scene.audioSystem.playDodge();
      return;
    }

    if (defResult.isMiss) {
      this.scene.events.emit('combatMiss', { attacker: defender, defender: attacker });
      this.scene.events.emit('combatLogEntry', { type: 'miss', attackerName: defenderName, defenderName: attackerName });
      if (this.scene.audioSystem) this.scene.audioSystem.playMiss();
      return;
    }

    // Apply wolf companion damage reduction for player being hit
    let dmgToAttacker = defResult.damage;
    if (attacker.entityType === 'player' && this.scene.companionSystem) {
      const dmgReduce = this.scene.companionSystem.getEffectivePerkValue('damageReduction');
      if (dmgReduce > 0) dmgToAttacker = Math.max(1, Math.ceil(dmgToAttacker * (1 - dmgReduce)));
    }

    if (!Number.isFinite(dmgToAttacker) || dmgToAttacker < 0) dmgToAttacker = 0;

    attacker.stats.hp = Math.max(0, attacker.stats.hp - dmgToAttacker);
    if (!Number.isFinite(attacker.stats.hp)) attacker.stats.hp = 0;
    if (attacker.updateHPBar) attacker.updateHPBar();

    if (defResult.isCrit) {
      this.scene.events.emit('combatCrit', { attacker: defender, defender: attacker, damage: dmgToAttacker });
      this.scene.events.emit('combatLogEntry', { type: 'crit', attackerName: defenderName, defenderName: attackerName, damage: dmgToAttacker });
      if (this.scene.audioSystem) this.scene.audioSystem.playCritHit();
    } else {
      this.scene.events.emit('combatHit', { attacker: defender, defender: attacker, damage: dmgToAttacker });
      this.scene.events.emit('combatLogEntry', { type: 'hit', attackerName: defenderName, defenderName: attackerName, damage: dmgToAttacker });
      if (this.scene.audioSystem) this.scene.audioSystem.playHit();
    }

    if (this.scene.juiceSystem) {
      this.scene.juiceSystem.showDamageNumber(attacker.x, attacker.y - 16, dmgToAttacker, defResult.isCrit);
    }

    if (attacker.stats.hp <= 0) {
      this.onEntityDeath(attacker, defender);
      this.endCombat(combat);
      return;
    }
  }

  onEntityDeath(deadEntity, killer) {
    this.scene.events.emit('entityDeath', deadEntity, killer);
  }

  endCombat(combat) {
    if (combat.timer) {
      combat.timer.destroy();
    }
    combat.attacker.inCombat = false;
    combat.defender.inCombat = false;
    this.combats = this.combats.filter(c => c !== combat);
  }

  isInCombat(entity) {
    return this.combats.some(c => c.attacker === entity || c.defender === entity);
  }

  update() {
    this.combats = this.combats.filter(combat => {
      if (!combat.attacker.active || !combat.defender.active) {
        this.endCombat(combat);
        return false;
      }
      return true;
    });
  }
}
