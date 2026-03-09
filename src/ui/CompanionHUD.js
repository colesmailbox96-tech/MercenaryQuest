export class CompanionHUD {
  constructor(scene) {
    this.scene = scene;
    this.gameScene = scene.scene.get('GameScene');
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(101);
    this.container.setVisible(false);

    this.label = scene.add.text(0, 0, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#DAA520',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.container.add(this.label);
  }

  create(x, y) {
    this.label.setPosition(x, y);

    this.label.setInteractive({ useHandCursor: true });
    this.label.on('pointerdown', () => {
      this.scene.scene.launch('CompanionPanel');
    });
  }

  update() {
    if (!this.gameScene || !this.gameScene.companionSystem) return;
    const cs = this.gameScene.companionSystem;
    const def = cs.getActiveCompanionDef();

    if (def) {
      this.container.setVisible(true);
      let text = `${def.icon} ${def.perk.name}`;
      if (cs.treatActive && Date.now() < cs.treatExpiresAt) {
        text += ' ✨';
      }
      this.label.setText(text);
    } else {
      this.container.setVisible(false);
    }
  }
}
