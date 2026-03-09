import Phaser from 'phaser';
import { generateTextures } from '../utils/textureGen.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Nothing to preload - all textures generated at runtime
  }

  create() {
    generateTextures(this);
    this.scene.start('GameScene');
  }
}
