import { COMPANIONS, EGG_HATCH_CONFIG } from '../config/companionData.js';
import { Companion } from '../entities/Companion.js';
import { getOwnedQuantity, removeFromMaterials } from '../utils/helpers.js';

export class CompanionSystem {
  constructor(scene) {
    this.scene = scene;
    this.ownedCompanions = [];
    this.activeCompanion = null;
    this.activeCompanionId = null;
    this.incubatingEgg = null;
    this.treatActive = false;
    this.treatExpiresAt = 0;
  }

  hatchEgg(eggItemId, gameState) {
    if (this.incubatingEgg) return { success: false, reason: 'Nest is occupied' };

    const companionId = this.getCompanionFromEgg(eggItemId);
    if (!companionId) return { success: false, reason: 'Unknown egg' };

    if (this.ownedCompanions.includes(companionId)) {
      return { success: false, reason: 'You already have this companion' };
    }

    const owned = getOwnedQuantity(gameState.materials, eggItemId);
    if (owned < 1) return { success: false, reason: 'No egg in inventory' };

    removeFromMaterials(gameState.materials, eggItemId, 1);

    this.incubatingEgg = {
      eggId: eggItemId,
      companionId: companionId,
      startedAt: Date.now(),
      duration: EGG_HATCH_CONFIG.hatchDuration,
    };

    this.scene.time.delayedCall(EGG_HATCH_CONFIG.hatchDuration, () => {
      this.completeHatch();
    });

    this.scene.events.emit('eggPlaced', { companionId, duration: EGG_HATCH_CONFIG.hatchDuration });
    this.scene.events.emit('inventoryChanged', gameState.materials);
    return { success: true };
  }

  completeHatch() {
    if (!this.incubatingEgg) return;

    const companionId = this.incubatingEgg.companionId;
    this.ownedCompanions.push(companionId);
    this.incubatingEgg = null;

    const def = COMPANIONS[companionId];
    this.scene.events.emit('companionHatched', {
      companion: def,
    });

    if (!this.activeCompanionId) {
      this.setActive(companionId);
    }
  }

  setActive(companionId) {
    if (!this.ownedCompanions.includes(companionId)) return;

    if (this.activeCompanion) {
      this.activeCompanion.destroy();
      this.activeCompanion = null;
    }

    this.activeCompanionId = companionId;
    const def = COMPANIONS[companionId];

    const player = this.scene.player;
    this.activeCompanion = new Companion(
      this.scene,
      player.x,
      player.y,
      def
    );

    this.scene.events.emit('companionActivated', { companion: def });
  }

  dismiss() {
    if (this.activeCompanion) {
      this.activeCompanion.destroy();
      this.activeCompanion = null;
    }
    this.activeCompanionId = null;
    this.scene.events.emit('companionDismissed');
  }

  update(delta) {
    if (this.activeCompanion && this.scene.player) {
      this.activeCompanion.follow(this.scene.player, delta);
    }
  }

  getPerkEffect(effectKey) {
    if (!this.activeCompanionId) return 0;
    const def = COMPANIONS[this.activeCompanionId];
    return def.perk.effect[effectKey] || 0;
  }

  hasPerk(perkId) {
    if (!this.activeCompanionId) return false;
    return COMPANIONS[this.activeCompanionId].perk.id === perkId;
  }

  getEffectivePerkValue(effectKey) {
    let base = this.getPerkEffect(effectKey);
    if (this.treatActive && Date.now() < this.treatExpiresAt) {
      base *= 2;
    } else if (this.treatActive) {
      this.treatActive = false;
    }
    return base;
  }

  applyTreat(gameState) {
    if (!this.activeCompanionId) return { success: false, reason: 'No active companion' };
    const owned = getOwnedQuantity(gameState.materials, 'golden_treat');
    if (owned < 1) return { success: false, reason: 'No Golden Treats' };

    removeFromMaterials(gameState.materials, 'golden_treat', 1);

    this.treatActive = true;
    this.treatExpiresAt = Date.now() + 180000;

    this.scene.time.delayedCall(180000, () => {
      this.treatActive = false;
      this.scene.events.emit('companionTreatExpired');
    });

    this.scene.events.emit('companionTreatUsed', {
      companion: COMPANIONS[this.activeCompanionId],
      duration: 180000,
    });
    this.scene.events.emit('inventoryChanged', gameState.materials);
    return { success: true };
  }

  getCompanionFromEgg(eggItemId) {
    for (const [id, def] of Object.entries(COMPANIONS)) {
      if (def.acquisition.egg === eggItemId) return id;
    }
    return null;
  }

  getActiveCompanionDef() {
    if (!this.activeCompanionId) return null;
    return COMPANIONS[this.activeCompanionId];
  }

  getIncubationProgress() {
    if (!this.incubatingEgg) return null;
    const elapsed = Date.now() - this.incubatingEgg.startedAt;
    return {
      companionId: this.incubatingEgg.companionId,
      progress: Math.min(1, elapsed / this.incubatingEgg.duration),
      timeRemaining: Math.max(0, this.incubatingEgg.duration - elapsed),
    };
  }
}
