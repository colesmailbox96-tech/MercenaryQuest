import { TILE_SIZE, TILE_SCALE } from '../config/constants.js';
import { SEEDS } from '../config/farmData.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;

const STAGE_TEXTURES = {
  empty: 'tile_farm_empty',
  planted: 'tile_farm_planted',
  growing: 'tile_farm_growing',
  ready: null, // resolved per seed crop type
};

const CROP_READY_TEXTURES = {
  wheat:        'tile_farm_ready_wheat',
  carrot:       'tile_farm_ready_carrot',
  tomato:       'tile_farm_ready_tomato',
  golden_wheat: 'tile_farm_ready_golden_wheat',
  moonberry:    'tile_farm_ready_moonberry',
  starfruit:    'tile_farm_ready_starfruit',
};

export class FarmPlot {
  constructor(scene, tileX, tileY, plotIndex) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.plotIndex = plotIndex;
    this.state = 'empty';
    this.seedId = null;
    this._bounceTween = null;

    this.sprite = scene.add.image(
      tileX * DISPLAY_TILE + DISPLAY_TILE / 2,
      tileY * DISPLAY_TILE + DISPLAY_TILE / 2,
      'tile_farm_empty'
    );
    this.sprite.setDisplaySize(DISPLAY_TILE, DISPLAY_TILE);
    this.sprite.setDepth(0);
    this._baseY = this.sprite.y;

    // Listen for state changes from FarmingSystem
    scene.events.on('plotStateChanged', ({ plotIndex, state }) => {
      if (plotIndex === this.plotIndex) {
        this._updateVisual(state);
      }
    });
  }

  _updateVisual(state) {
    this.state = state;

    // Stop any bounce tween
    if (this._bounceTween) {
      this._bounceTween.stop();
      this._bounceTween = null;
      this.sprite.y = this._baseY;
    }

    if (state === 'ready') {
      const farmSys = this.scene.farmingSystem;
      const plotStatus = farmSys?.getPlotStatus(this.plotIndex);
      const seedId = plotStatus?.crop ? null : farmSys?.plots[this.plotIndex]?.seedId;
      const actualSeedId = farmSys?.plots[this.plotIndex]?.seedId;
      const cropKey = actualSeedId ? SEEDS[actualSeedId]?.crop : null;
      const textureKey = cropKey ? CROP_READY_TEXTURES[cropKey] : 'tile_farm_ready_wheat';
      this.sprite.setTexture(textureKey || 'tile_farm_ready_wheat');
      this._startBounceTween();
    } else {
      const textureKey = STAGE_TEXTURES[state] || 'tile_farm_empty';
      this.sprite.setTexture(textureKey);
    }
  }

  _startBounceTween() {
    this._bounceTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this._baseY - 2,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  destroy() {
    if (this._bounceTween) this._bounceTween.stop();
    this.sprite.destroy();
  }
}
