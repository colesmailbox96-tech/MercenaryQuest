import { COMBAT_TICK } from '../config/constants.js';
import { getEffectiveStats } from '../systems/StatCalculator.js';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.combats = [];
  }

  startCombat(attacker, defender) {
    // Check if already in combat
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

    // Attacker hits defender
    const activeBuffs = this.scene.activeBuffs || [];
    const attackerBuffs = attacker.entityType === 'player' ? activeBuffs : [];
    const defenderBuffs = defender.entityType === 'player' ? activeBuffs : [];
    const attackerStats = getEffectiveStats(attacker, attackerBuffs);
    const defenderStats = getEffectiveStats(defender, defenderBuffs);
    let dmgToDefender = Math.max(1, attackerStats.atk - defenderStats.def);
    // Wolf companion perk: +10% damage dealt by player
    if (attacker.entityType === 'player' && this.scene.companionSystem) {
      const dmgBonus = this.scene.companionSystem.getEffectivePerkValue('damageBonus');
      if (dmgBonus > 0) dmgToDefender = Math.ceil(dmgToDefender * (1 + dmgBonus));
    }
    defender.takeDamage(dmgToDefender);
    this.showDamageNumber(defender, dmgToDefender);
    // Play combat hit sound and juice effects
    if (this.scene.audioSystem) this.scene.audioSystem.playHit();
    if (this.scene.juiceSystem) {
      this.scene.juiceSystem.showDamageNumber(defender.x, defender.y - 16, dmgToDefender);
    }

    // Check if defender died
    if (defender.stats.hp <= 0) {
      this.onEntityDeath(defender, attacker);
      this.endCombat(combat);
      return;
    }

    // Defender hits attacker
    let dmgToAttacker = Math.max(1, defenderStats.atk - attackerStats.def);
    // Wolf companion perk: -5% damage taken by player
    if (attacker.entityType === 'player' && this.scene.companionSystem) {
      const dmgReduce = this.scene.companionSystem.getEffectivePerkValue('damageReduction');
      if (dmgReduce > 0) dmgToAttacker = Math.max(1, Math.ceil(dmgToAttacker * (1 - dmgReduce)));
    }
    attacker.takeDamage(dmgToAttacker);
    this.showDamageNumber(attacker, dmgToAttacker);
    if (this.scene.juiceSystem) {
      this.scene.juiceSystem.showDamageNumber(attacker.x, attacker.y - 16, dmgToAttacker);
    }

    // Check if attacker died
    if (attacker.stats.hp <= 0) {
      this.onEntityDeath(attacker, defender);
      this.endCombat(combat);
      return;
    }
  }

  showDamageNumber(entity, damage) {
    if (!entity || !entity.active) return;

    const text = this.scene.add.text(entity.x, entity.y - 16, `-${damage}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });

    // Red tint flash on damaged entity
    if (entity.sprite) {
      entity.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(150, () => {
        if (entity.active && entity.sprite) {
          entity.sprite.clearTint();
        }
      });
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
    // Clean up combats where entities are gone
    this.combats = this.combats.filter(combat => {
      if (!combat.attacker.active || !combat.defender.active) {
        this.endCombat(combat);
        return false;
      }
      return true;
    });
  }
}
