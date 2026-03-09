import Phaser from 'phaser';
import { DAY_NIGHT_CONFIG } from '../config/nightData.js';

export class DayNightSystem {
  constructor(scene) {
    this.scene = scene;
    this.cycleTime = DAY_NIGHT_CONFIG.phases.day.start; // Start in daytime
    this.currentPhase = 'day';
    this.isNight = false;

    this.overlay = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width * 2,
      scene.cameras.main.height * 2,
      0x000033, 0
    );
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(999);

    this.fogParticles = [];
    this.lanternGlows = [];
  }

  update(delta) {
    this.cycleTime = (this.cycleTime + delta) % DAY_NIGHT_CONFIG.cycleDuration;
    const prevPhase = this.currentPhase;

    for (const [phase, config] of Object.entries(DAY_NIGHT_CONFIG.phases)) {
      if (this.cycleTime >= config.start &&
          this.cycleTime < config.start + config.duration) {
        this.currentPhase = phase;
        break;
      }
    }

    this.updateOverlay();
    this.updateFog(delta);

    if (prevPhase !== this.currentPhase) {
      const wasNight = this.isNight;
      this.isNight = (this.currentPhase === 'night' || this.currentPhase === 'lateDusk');

      if (this.isNight && !wasNight) {
        this.scene.events.emit('nightFall');
        this.spawnFog();
        this.showLanterns();
      } else if (!this.isNight && wasNight) {
        this.scene.events.emit('dawnBreak');
        this.clearFog();
        this.hideLanterns();
      }

      this.scene.events.emit('phaseChanged', {
        phase: this.currentPhase,
        isNight: this.isNight,
      });
    }
  }

  updateOverlay() {
    let targetAlpha = 0;
    // Check for owl companion perk
    let fogReduction = 0;
    if (this.scene.companionSystem) {
      fogReduction = this.scene.companionSystem.getEffectivePerkValue('nightFogReduction');
    }

    switch (this.currentPhase) {
      case 'dawn': {
        const dawnProgress = this.cycleTime / 10000;
        targetAlpha = 0.45 * (1 - dawnProgress);
        break;
      }
      case 'day':
        targetAlpha = 0;
        break;
      case 'dusk': {
        const duskProgress = (this.cycleTime - 170000) / 10000;
        targetAlpha = 0.45 * duskProgress;
        break;
      }
      case 'night':
      case 'lateDusk':
        targetAlpha = 0.45;
        break;
    }

    targetAlpha *= (1 - fogReduction);
    this.overlay.setAlpha(targetAlpha);
  }

  spawnFog() {
    for (let i = 0; i < 18; i++) {
      const fog = this.scene.add.rectangle(
        Phaser.Math.Between(-100, this.scene.cameras.main.width + 100),
        Phaser.Math.Between(0, this.scene.cameras.main.height),
        Phaser.Math.Between(40, 80),
        Phaser.Math.Between(8, 16),
        0xCCCCCC,
        Phaser.Math.FloatBetween(0.05, 0.15)
      );
      fog.setScrollFactor(Phaser.Math.FloatBetween(0.1, 0.3));
      fog.setDepth(998);
      fog.speedX = Phaser.Math.FloatBetween(0.2, 0.6);
      this.fogParticles.push(fog);
    }
  }

  updateFog(delta) {
    for (const fog of this.fogParticles) {
      if (!fog.active) continue;
      fog.x += fog.speedX * (delta / 16);
      if (fog.x > this.scene.cameras.main.width + 120) {
        fog.x = -100;
      }
    }
  }

  clearFog() {
    for (const fog of this.fogParticles) {
      this.scene.tweens.add({
        targets: fog,
        alpha: 0,
        duration: 3000,
        onComplete: () => fog.destroy(),
      });
    }
    this.fogParticles = [];
  }

  showLanterns() {
    const lanternPositions = [
      { x: 17, y: 17 }, { x: 21, y: 17 },
      { x: 17, y: 21 }, { x: 21, y: 21 },
    ];
    for (const pos of lanternPositions) {
      const glow = this.scene.add.circle(
        pos.x * 32 + 16, pos.y * 32 + 16,
        48, 0xDAA520, 0.15
      );
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(997);
      glow.setAlpha(0);
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.15,
        duration: 2000,
      });
      this.lanternGlows.push(glow);
    }
  }

  hideLanterns() {
    for (const glow of this.lanternGlows) {
      this.scene.tweens.add({
        targets: glow,
        alpha: 0,
        duration: 2000,
        onComplete: () => glow.destroy(),
      });
    }
    this.lanternGlows = [];
  }

  getTimeOfDay() {
    return {
      phase: this.currentPhase,
      isNight: this.isNight,
      cycleProgress: this.cycleTime / DAY_NIGHT_CONFIG.cycleDuration,
      timeUntilToggle: this.isNight
        ? DAY_NIGHT_CONFIG.cycleDuration - this.cycleTime
        : DAY_NIGHT_CONFIG.phases.dusk.start - this.cycleTime,
    };
  }
}
