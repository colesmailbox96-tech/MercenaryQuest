import { Mob } from './Mob.js';

export class NocturnalMob extends Mob {
  constructor(scene, tileX, tileY, typeKey, typeData) {
    super(scene, tileX, tileY, typeKey, typeData);
    this.isNocturnal = true;
  }

  onDawn() {
    if (!this.active) return;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        if (this.active) this.die();
      },
    });
  }
}
