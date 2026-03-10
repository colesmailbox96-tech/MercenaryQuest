export class TutorialTooltip {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.pulseTween = null;
  }

  show(text, targetX, targetY, arrowDirection = 'down') {
    this.destroy();
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(950);
    this.container.setScrollFactor(0);
    
    const tooltipW = 270;
    const tooltipH = 80;
    let tooltipX = Math.max(10, Math.min(targetX - tooltipW / 2, w - tooltipW - 10));
    let tooltipY;
    
    if (arrowDirection === 'down') {
      tooltipY = targetY - tooltipH - 15;
    } else {
      tooltipY = targetY + 15;
    }
    
    tooltipY = Math.max(10, Math.min(tooltipY, h - tooltipH - 10));
    
    // Background panel
    const bg = this.scene.add.rectangle(
      tooltipX + tooltipW / 2, tooltipY + tooltipH / 2,
      tooltipW, tooltipH, 0x1A1A2E, 0.92
    );
    bg.setStrokeStyle(2, 0xDAA520);
    this.container.add(bg);
    
    // Arrow triangle
    const arrowSize = 10;
    const arrowX = targetX;
    const arrowY = arrowDirection === 'down' ? tooltipY + tooltipH + 2 : tooltipY - 2;
    const arrow = this.scene.add.triangle(
      arrowX, arrowY, 0, arrowSize, arrowSize / 2, 0, arrowSize, arrowSize,
      0xDAA520
    );
    if (arrowDirection === 'up') arrow.setAngle(180);
    this.container.add(arrow);
    
    // Text
    const textObj = this.scene.add.text(tooltipX + 12, tooltipY + 10, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#F5E6C8',
      wordWrap: { width: tooltipW - 40 },
    });
    this.container.add(textObj);
    
    // Dismiss X button with long-press skip-all
    const closeBtn = this.scene.add.text(tooltipX + tooltipW - 18, tooltipY + 4, '\u2715', {
      fontFamily: 'monospace', fontSize: '16px', color: '#F5E6C8',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    let longPressTimer = null;
    closeBtn.on('pointerdown', () => {
      longPressTimer = this.scene.time.delayedCall(2000, () => {
        longPressTimer = null;
        if (this.onSkipAll) this.onSkipAll();
      });
    });
    closeBtn.on('pointerup', () => {
      if (longPressTimer) {
        longPressTimer.remove();
        longPressTimer = null;
        if (this.onDismiss) this.onDismiss();
      }
    });
    this.container.add(closeBtn);
    
    // Pulse animation
    this.pulseTween = this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  destroy() {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
