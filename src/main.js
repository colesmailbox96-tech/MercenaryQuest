import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { EquipmentPanel } from './ui/EquipmentPanel.js';
import { FishingPanel } from './ui/FishingPanel.js';
import { MiningPanel } from './ui/MiningPanel.js';
import { SkillsPanel } from './ui/SkillsPanel.js';
import { FarmingPanel } from './ui/FarmingPanel.js';
import { CookingPanel } from './ui/CookingPanel.js';
import { MerchantPanel } from './ui/MerchantPanel.js';
import { CompanionPanel } from './ui/CompanionPanel.js';
import { ForgePanel } from './ui/ForgePanel.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { CombatLogPanel } from './ui/CombatLogPanel.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 390,
    height: 844,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, HUDScene, ShopScene, EquipmentPanel, FishingPanel, MiningPanel, SkillsPanel, FarmingPanel, CookingPanel, MerchantPanel, CompanionPanel, ForgePanel, SettingsPanel, CombatLogPanel],
  backgroundColor: '#0a0a14',
};

new Phaser.Game(config);
