import { MAP_WIDTH, MAP_HEIGHT } from '../config/constants.js';

const MINIMAP_SIZE = 80;
const TILE_PX = MINIMAP_SIZE / Math.max(MAP_WIDTH, MAP_HEIGHT);

const ZONE_COLORS = {
  town:     { color: 0x8B7355, alpha: 0.6 },
  forest:   { color: 0x2D5A27, alpha: 0.6 },
  caves:    { color: 0x36393F, alpha: 0.6 },
  swamp:    { color: 0x3A4A2A, alpha: 0.6 },
  volcanic: { color: 0x1A1A1A, alpha: 0.6 },
};

export class Minimap {
  constructor(scene, gameScene) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.visible = true;

    const w = scene.scale.width;
    this.x = w - MINIMAP_SIZE - 8;
    this.y = 66;

    this.container = scene.add.container(this.x, this.y);
    this.container.setScrollFactor(0);
    this.container.setDepth(150);

    this.bg = scene.add.rectangle(0, 0, MINIMAP_SIZE + 2, MINIMAP_SIZE + 2, 0x000000, 0.7);
    this.bg.setOrigin(0, 0);
    this.bg.setStrokeStyle(1, 0xDAA520, 0.5);
    this.container.add(this.bg);

    this.rt = scene.add.renderTexture(1, 1, MINIMAP_SIZE, MINIMAP_SIZE);
    this.rt.setOrigin(0, 0);
    this.container.add(this.rt);

    this.playerDot = scene.add.rectangle(0, 0, 3, 3, 0xFFFFFF);
    this.playerDot.setOrigin(0.5);
    this.container.add(this.playerDot);

    this.agentDot = scene.add.rectangle(0, 0, 3, 3, 0x00BCD4);
    this.agentDot.setOrigin(0.5);
    this.agentDot.setVisible(false);
    this.container.add(this.agentDot);

    this.bossDot = scene.add.rectangle(0, 0, 4, 4, 0xFF00FF);
    this.bossDot.setOrigin(0.5);
    this.bossDot.setVisible(false);
    this.container.add(this.bossDot);

    this.fishDot = scene.add.rectangle(0, 0, 2, 2, 0x5B8FA8);
    this.fishDot.setOrigin(0.5);
    this.fishDot.setVisible(false);
    this.container.add(this.fishDot);

    this.mineDot = scene.add.rectangle(0, 0, 2, 2, 0xAAAAAA);
    this.mineDot.setOrigin(0.5);
    this.mineDot.setVisible(false);
    this.container.add(this.mineDot);

    scene.tweens.add({
      targets: this.playerDot,
      alpha: 0.4, yoyo: true, repeat: -1, duration: 600,
    });
    scene.tweens.add({
      targets: this.agentDot,
      alpha: 0.4, yoyo: true, repeat: -1, duration: 600,
    });
    scene.tweens.add({
      targets: this.bossDot,
      alpha: 0.4, yoyo: true, repeat: -1, duration: 800,
    });

    this._drawMap();

    this._refreshTimer = scene.time.addEvent({
      delay: 2000,
      callback: () => this._drawMap(),
      loop: true,
    });
  }

  _tileToMinimap(tileX, tileY) {
    return {
      x: 1 + tileX * TILE_PX + TILE_PX / 2,
      y: 1 + tileY * TILE_PX + TILE_PX / 2,
    };
  }

  _drawMap() {
    this.rt.clear();
    const mapData = this.gameScene.mapData;
    if (!mapData) return;

    const gfx = this.scene.add.graphics();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = mapData[y]?.[x];
        if (!tile) continue;
        const zoneStyle = ZONE_COLORS[tile.zone];
        if (!zoneStyle) continue;
        gfx.fillStyle(zoneStyle.color, zoneStyle.alpha);
        gfx.fillRect(x * TILE_PX, y * TILE_PX, Math.ceil(TILE_PX), Math.ceil(TILE_PX));

        if (tile.type === 'building') {
          gfx.fillStyle(0xDAA520, 1);
          gfx.fillRect(x * TILE_PX, y * TILE_PX, 2, 2);
        }
      }
    }

    this.rt.draw(gfx);
    gfx.destroy();
  }

  update() {
    if (!this.visible || !this.container.visible) return;

    const player = this.gameScene.player;
    if (player) {
      const pos = this._tileToMinimap(player.tileX, player.tileY);
      this.playerDot.setPosition(pos.x, pos.y);
    }

    const agent = this.gameScene.agent;
    if (agent && agent.active) {
      this.agentDot.setVisible(true);
      const pos = this._tileToMinimap(agent.tileX, agent.tileY);
      this.agentDot.setPosition(pos.x, pos.y);
    } else {
      this.agentDot.setVisible(false);
    }

    const worldBoss = this.gameScene.worldBossSystem;
    if (worldBoss && worldBoss.bossEntity && worldBoss.bossEntity.active) {
      this.bossDot.setVisible(true);
      const pos = this._tileToMinimap(worldBoss.bossEntity.tileX, worldBoss.bossEntity.tileY);
      this.bossDot.setPosition(pos.x, pos.y);
    } else {
      this.bossDot.setVisible(false);
    }

    const fishing = this.gameScene.fishingSystem;
    if (fishing && fishing.active) {
      this.fishDot.setVisible(true);
      const pos = this._tileToMinimap(23, 23);
      this.fishDot.setPosition(pos.x, pos.y);
    } else {
      this.fishDot.setVisible(false);
    }

    const mining = this.gameScene.miningSystem;
    if (mining && mining.active && mining.activeNodeKey) {
      this.mineDot.setVisible(true);
      const placement = this.gameScene._getMiningNodePlacement?.(mining.activeNodeKey);
      if (placement) {
        const pos = this._tileToMinimap(placement.tileX, placement.tileY);
        this.mineDot.setPosition(pos.x, pos.y);
      }
    } else {
      this.mineDot.setVisible(false);
    }
  }

  setVisible(v) {
    this.visible = v;
    this.container.setVisible(v);
  }

  destroy() {
    if (this._refreshTimer) this._refreshTimer.remove();
    if (this.container) this.container.destroy();
  }
}
