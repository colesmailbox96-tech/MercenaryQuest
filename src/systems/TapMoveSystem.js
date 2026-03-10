import { TILE_SIZE, TILE_SCALE } from '../config/constants.js';
import { getTileAt, isWalkable } from '../utils/mapGenerator.js';
import { distance } from '../utils/helpers.js';

const DISPLAY_TILE = TILE_SIZE * TILE_SCALE;
const PATH_DOT_SIZE = 2;
const PATH_DOT_COLOR = 0x4488FF;
const PATH_DOT_ALPHA = 0.4;
const MARKER_SIZE = 8;
const MARKER_ALPHA = 0.5;
const MARKER_INTERACTIVE_COLOR = 0xDAA520;
const MARKER_DEFAULT_COLOR = 0xFFFFFF;
const MOB_TRACKING_INTERVAL_MS = 1000;

export class TapMoveSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentPath = [];       // Array of {x, y} tile coordinates
    this.pathIndex = 0;          // Current step in the path
    this.isFollowingPath = false;
    this.destinationMarker = null;
    this.pathDots = [];          // Array of dot graphics objects
    this.targetEntity = null;    // If chasing a mob, reference to the mob
    this.autoInteract = null;    // { type: 'building'|'mining'|'fishing', ref } — trigger on arrival
    this.trackingTimer = null;   // Timer for recalculating path to moving targets
    this.markerTween = null;     // Tween for destination marker pulse
  }

  /**
   * Handle a tap on a tile coordinate. Determines what's there and acts accordingly.
   */
  handleTap(tileX, tileY) {
    const player = this.scene.player;
    if (player.inCombat) return;

    // Check what is at the tapped tile
    const tile = getTileAt(this.scene.mapData, tileX, tileY);
    if (!tile) return;

    const playerDist = distance(player.tileX, player.tileY, tileX, tileY);

    // --- Tap on interactive tiles ---

    // Building interaction
    if (tile.type === 'building') {
      if (playerDist <= 1) {
        // Adjacent or on it — interact immediately, no pathfinding
        this.cancelPath('interact');
        this.scene.interactWithBuilding(tile.buildingType);
        return;
      }
      // Far away — pathfind to adjacent tile, then auto-interact
      const adjTile = this._findAdjacentWalkable(tileX, tileY);
      if (!adjTile) return;
      const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, adjTile.x, adjTile.y);
      if (path.length === 0) return;
      this.autoInteract = { type: 'building', buildingType: tile.buildingType };
      this.targetEntity = null;
      this.startPath(path, { interactive: true, destX: tileX, destY: tileY });
      return;
    }

    // Fishing dock interaction
    if (tile.type === 'fishing_dock') {
      if (playerDist <= 1) {
        this.cancelPath('interact');
        this.scene.scene.launch('FishingPanel');
        return;
      }
      const adjTile = this._findAdjacentWalkable(tileX, tileY);
      if (!adjTile) return;
      const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, adjTile.x, adjTile.y);
      if (path.length === 0) return;
      this.autoInteract = { type: 'fishing' };
      this.targetEntity = null;
      this.startPath(path, { interactive: true, destX: tileX, destY: tileY });
      return;
    }

    // Mining node interaction
    if (tile.type === 'mining_node') {
      if (playerDist <= 1) {
        this.cancelPath('interact');
        this.scene.scene.launch('MiningPanel', { nodeKey: tile.nodeType });
        return;
      }
      const adjTile = this._findAdjacentWalkable(tileX, tileY);
      if (!adjTile) return;
      const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, adjTile.x, adjTile.y);
      if (path.length === 0) return;
      this.autoInteract = { type: 'mining', nodeKey: tile.nodeType };
      this.targetEntity = null;
      this.startPath(path, { interactive: true, destX: tileX, destY: tileY });
      return;
    }

    // --- Tap on a mob ---
    const mob = this._getMobAtTile(tileX, tileY);
    if (mob) {
      const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, tileX, tileY);
      if (path.length === 0) return;
      this.autoInteract = null;
      this.targetEntity = mob;
      this.startPath(path, { interactive: false, destX: tileX, destY: tileY });
      this._startTrackingTimer();
      return;
    }

    // --- Tap on a walkable tile (or non-walkable — pathfinding handles fallback) ---
    if (player.tileX === tileX && player.tileY === tileY) return; // Already there

    const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, tileX, tileY);
    if (path.length === 0) return;

    this.autoInteract = null;
    this.targetEntity = null;
    this.startPath(path, { interactive: false, destX: tileX, destY: tileY });
  }

  /**
   * Set up the path execution: draw dots, create marker, start stepping.
   */
  startPath(path, options = {}) {
    // Cancel any existing path first
    this.cancelPath('newPath');

    this.currentPath = path;
    this.pathIndex = 0;
    this.isFollowingPath = true;

    // Draw path visualization
    this.drawPathDots(path);

    // Create destination marker at the last tile in the path
    const dest = path[path.length - 1];
    this.createDestinationMarker(dest.x, dest.y, options.interactive || false);

    // Start walking
    this.stepToNextTile();
  }

  /**
   * Move the player one tile along the computed path.
   */
  stepToNextTile() {
    if (!this.isFollowingPath) return;
    if (this.pathIndex >= this.currentPath.length) {
      this._onArrival();
      return;
    }

    const player = this.scene.player;
    if (player.isMoving || player.inCombat) return;

    const nextTile = this.currentPath[this.pathIndex];

    // Determine facing direction
    const dx = nextTile.x - player.tileX;
    const dy = nextTile.y - player.tileY;
    let dir = 'down';
    if (dy < 0) dir = 'up';
    else if (dy > 0) dir = 'down';
    else if (dx < 0) dir = 'left';
    else if (dx > 0) dir = 'right';

    player.setFacing(dir);

    // Attempt to move, using the tween's onComplete to drive the next step
    const moved = player.moveTo(nextTile.x, nextTile.y, this.scene.mapData, () => {
      this.scene.events.emit('playerMoved');
      this.onStepComplete();
    });
    if (!moved) {
      // Path is blocked (something changed) — cancel
      this.cancelPath('blocked');
      return;
    }

    // Remove the dot for this step
    this.removePathDot(this.pathIndex);
    this.pathIndex++;
  }

  /**
   * Called after each tile step completes.
   */
  onStepComplete() {
    if (!this.isFollowingPath) return;

    const player = this.scene.player;
    if (player.inCombat) {
      this.cancelPath('combat');
      return;
    }

    if (this.pathIndex >= this.currentPath.length) {
      this._onArrival();
      return;
    }

    // Continue stepping
    this.stepToNextTile();
  }

  /**
   * Called when the player reaches the end of the path.
   */
  _onArrival() {
    const autoInteract = this.autoInteract;
    this.cancelPath('arrived');

    // Auto-interact on arrival
    if (autoInteract) {
      if (autoInteract.type === 'building') {
        this.scene.interactWithBuilding(autoInteract.buildingType);
      } else if (autoInteract.type === 'fishing') {
        this.scene.scene.launch('FishingPanel');
      } else if (autoInteract.type === 'mining') {
        this.scene.scene.launch('MiningPanel', { nodeKey: autoInteract.nodeKey });
      }
    }
  }

  /**
   * Cancel the current path and clean up visuals.
   */
  cancelPath(reason) {
    this.isFollowingPath = false;
    this.currentPath = [];
    this.pathIndex = 0;
    this.autoInteract = null;
    this.targetEntity = null;
    this._stopTrackingTimer();

    // Fade remaining path dots
    this._fadeAndDestroyDots();

    // Fade destination marker
    this._fadeAndDestroyMarker();
  }

  /**
   * Draw small dots along the path.
   */
  drawPathDots(path) {
    for (let i = 0; i < path.length; i++) {
      const tile = path[i];
      const worldX = tile.x * DISPLAY_TILE + DISPLAY_TILE / 2;
      const worldY = tile.y * DISPLAY_TILE + DISPLAY_TILE / 2;

      const dot = this.scene.add.rectangle(worldX, worldY, PATH_DOT_SIZE, PATH_DOT_SIZE, PATH_DOT_COLOR, PATH_DOT_ALPHA);
      dot.setDepth(5);
      this.pathDots.push(dot);
    }
  }

  /**
   * Remove (fade) the dot at a specific path index.
   */
  removePathDot(index) {
    if (index < 0 || index >= this.pathDots.length) return;
    const dot = this.pathDots[index];
    if (!dot || !dot.active) return;
    dot.destroy();
    this.pathDots[index] = null;
  }

  /**
   * Fade out and destroy all remaining path dots.
   */
  _fadeAndDestroyDots() {
    for (const dot of this.pathDots) {
      if (dot && dot.active) {
        this.scene.tweens.add({
          targets: dot,
          alpha: 0,
          duration: 200,
          onComplete: () => { if (dot.active) dot.destroy(); },
        });
      }
    }
    this.pathDots = [];
  }

  /**
   * Create a pulsing destination marker at the target tile.
   */
  createDestinationMarker(tileX, tileY, interactive) {
    this._fadeAndDestroyMarker();

    const worldX = tileX * DISPLAY_TILE + DISPLAY_TILE / 2;
    const worldY = tileY * DISPLAY_TILE + DISPLAY_TILE / 2;
    const color = interactive ? MARKER_INTERACTIVE_COLOR : MARKER_DEFAULT_COLOR;

    this.destinationMarker = this.scene.add.rectangle(worldX, worldY, MARKER_SIZE, MARKER_SIZE, color, MARKER_ALPHA);
    this.destinationMarker.setDepth(5);

    // Pulsing animation
    this.markerTween = this.scene.tweens.add({
      targets: this.destinationMarker,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Fade out and destroy the destination marker.
   */
  _fadeAndDestroyMarker() {
    if (this.markerTween) {
      this.markerTween.stop();
      this.markerTween = null;
    }
    if (this.destinationMarker && this.destinationMarker.active) {
      const marker = this.destinationMarker;
      this.destinationMarker = null;
      this.scene.tweens.add({
        targets: marker,
        alpha: 0,
        duration: 200,
        onComplete: () => { if (marker.active) marker.destroy(); },
      });
    }
  }

  /**
   * Find the nearest walkable tile adjacent to (tileX, tileY).
   */
  _findAdjacentWalkable(tileX, tileY) {
    const candidates = [
      { x: tileX, y: tileY - 1 },
      { x: tileX, y: tileY + 1 },
      { x: tileX - 1, y: tileY },
      { x: tileX + 1, y: tileY },
    ];
    const player = this.scene.player;
    // Sort by distance to player so we pathfind to the closest adjacent tile
    candidates.sort((a, b) =>
      distance(player.tileX, player.tileY, a.x, a.y) -
      distance(player.tileX, player.tileY, b.x, b.y)
    );
    for (const c of candidates) {
      if (isWalkable(this.scene.mapData, c.x, c.y)) {
        return c;
      }
    }
    return null;
  }

  /**
   * Find a mob at the given tile position.
   */
  _getMobAtTile(tileX, tileY) {
    const mobs = this.scene.spawner.getMobs();
    for (const mob of mobs) {
      if (mob.active && mob.tileX === tileX && mob.tileY === tileY) {
        return mob;
      }
    }
    return null;
  }

  /**
   * Start a 1-second timer to re-check if a tracked mob has moved.
   */
  _startTrackingTimer() {
    this._stopTrackingTimer();
    this.trackingTimer = this.scene.time.addEvent({
      delay: MOB_TRACKING_INTERVAL_MS,
      loop: true,
      callback: () => this._recalcMobPath(),
    });
  }

  /**
   * Stop the mob tracking timer.
   */
  _stopTrackingTimer() {
    if (this.trackingTimer) {
      this.trackingTimer.destroy();
      this.trackingTimer = null;
    }
  }

  /**
   * Recalculate the path to a tracked mob if it has moved.
   */
  _recalcMobPath() {
    if (!this.targetEntity || !this.targetEntity.active || !this.isFollowingPath) {
      this._stopTrackingTimer();
      return;
    }

    const player = this.scene.player;
    const mob = this.targetEntity;
    const currentDest = this.currentPath.length > 0
      ? this.currentPath[this.currentPath.length - 1]
      : null;

    // Only recalculate if mob has moved away from current destination
    if (currentDest && currentDest.x === mob.tileX && currentDest.y === mob.tileY) return;

    const path = this.scene.pathfinding.findPath(player.tileX, player.tileY, mob.tileX, mob.tileY);
    if (path.length === 0) return;

    // Replace the path
    this._fadeAndDestroyDots();
    this._fadeAndDestroyMarker();

    this.currentPath = path;
    this.pathIndex = 0;

    this.drawPathDots(path);
    const dest = path[path.length - 1];
    this.createDestinationMarker(dest.x, dest.y, false);
  }

  /**
   * Called each frame from the game scene update loop.
   */
  update() {
    // No per-frame logic needed; tracking is handled by the timer.
    // The step loop is driven by tween completion callbacks.
  }

  /**
   * Clean up all objects and timers.
   */
  destroy() {
    this.cancelPath('destroy');
  }
}
