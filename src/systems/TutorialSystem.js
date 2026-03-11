import { TutorialTooltip } from '../ui/TutorialTooltip.js';

const TUTORIAL_STEPS = [
  {
    text: 'Welcome to AgentQuest! Tap anywhere to move.',
    getTarget: (scene) => ({ x: scene.scale.width / 2, y: scene.scale.height / 2, arrow: 'up' }),
    completesWhen: 'playerMoved3Tiles',
  },
  {
    text: 'Head to the Tavern to hire your first agent.',
    getTarget: (scene) => {
      return { x: scene.scale.width / 2, y: scene.scale.height * 0.4, arrow: 'up' };
    },
    completesWhen: 'nearTavern',
  },
  {
    text: 'Tap the action button to enter and hire an agent for 10 gold.',
    getTarget: (scene) => {
      return { x: scene.scale.width - 60, y: scene.scale.height - 120, arrow: 'down' };
    },
    completesWhen: 'agentHired',
  },
  {
    text: 'Your agent hunts on their own! Tap 👁️ to watch them, or explore freely.',
    getTarget: (scene) => {
      return { x: 60, y: 20, arrow: 'up' };
    },
    completesWhen: 'viewToggled',
  },
  {
    text: 'Tap a mob to auto-walk and fight, or let your agent handle it.',
    getTarget: (scene) => ({ x: scene.scale.width / 2, y: scene.scale.height / 2, arrow: 'up' }),
    completesWhen: 'firstMobKilled',
  },
  {
    text: 'Collect your loot and sell at the Shop. The world is yours — go explore!',
    getTarget: (scene) => ({ x: scene.scale.width / 2, y: scene.scale.height * 0.4, arrow: 'up' }),
    completesWhen: 'autoDismiss',
  },
];

export class TutorialSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentStep = 0;
    this.complete = false;
    this.tooltip = new TutorialTooltip(scene);
    this.steps = TUTORIAL_STEPS;
    this.moveCount = 0;
    this.viewToggleCount = 0;
  }

  init(saveData) {
    this.complete = saveData?.tutorialComplete || false;
    this.currentStep = saveData?.tutorialStep || 0;

    if (!this.complete) {
      const hudScene = this.scene.scene.get('HUDScene');
      if (hudScene) {
        this.tooltip = new TutorialTooltip(hudScene);
      }
      this.setupListeners();
      this.showCurrentStep();
    }
  }

  setupListeners() {
    const scene = this.scene;
    
    this._onPlayerMove = () => {
      this.moveCount++;
      if (this.currentStep === 0 && this.moveCount >= 3) {
        this.advanceStep();
      }
    };
    scene.events.on('playerMoved', this._onPlayerMove);
    
    this._checkNearTavern = () => {
      if (this.currentStep !== 1) return;
      const p = scene.player;
      if (!p) return;
      const tx = p.tileX, ty = p.tileY;
      if (tx >= 15 && tx <= 19 && ty >= 15 && ty <= 19) {
        this.advanceStep();
      }
    };
    scene.events.on('playerMoved', this._checkNearTavern);
    
    this._onAgentHired = () => {
      if (this.currentStep === 2) {
        this.advanceStep();
      }
    };
    scene.events.on('agentHired', this._onAgentHired);
    
    this._onViewToggle = () => {
      this.viewToggleCount++;
      if (this.currentStep === 3 && this.viewToggleCount >= 1) {
        this.advanceStep();
      }
    };
    scene.events.on('viewToggled', this._onViewToggle);
    
    this._onMobKilled = () => {
      if (this.currentStep === 4) {
        this.advanceStep();
      }
    };
    scene.events.on('mobKilled', this._onMobKilled);
  }

  showCurrentStep() {
    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
      return;
    }

    const step = this.steps[this.currentStep];
    const hudScene = this.scene.scene.get('HUDScene');
    const targetScene = hudScene || this.scene;
    const target = step.getTarget(targetScene);
    
    this.tooltip.show(step.text, target.x, target.y, target.arrow);
    this.tooltip.onDismiss = () => this.advanceStep();
    this.tooltip.onSkipAll = () => this.skipAll();
    
    if (step.completesWhen === 'autoDismiss') {
      this.scene.time.delayedCall(4000, () => {
        if (this.currentStep === this.steps.length - 1) {
          this.completeTutorial();
        }
      });
    }
  }

  advanceStep() {
    if (this.tooltip) this.tooltip.destroy();
    this.currentStep++;
    
    if (this.scene.saveSystem) {
      this.scene.saveSystem.markDirty();
    }

    if (this.currentStep >= this.steps.length) {
      this.completeTutorial();
    } else {
      this.showCurrentStep();
    }
  }

  completeTutorial() {
    this.complete = true;
    if (this.tooltip) this.tooltip.destroy();
    this.cleanupListeners();
    if (this.scene.saveSystem) {
      this.scene.saveSystem.markDirty();
    }
  }

  skipAll() {
    this.completeTutorial();
  }

  cleanupListeners() {
    const scene = this.scene;
    if (this._onPlayerMove) scene.events.off('playerMoved', this._onPlayerMove);
    if (this._checkNearTavern) scene.events.off('playerMoved', this._checkNearTavern);
    if (this._onAgentHired) scene.events.off('agentHired', this._onAgentHired);
    if (this._onViewToggle) scene.events.off('viewToggled', this._onViewToggle);
    if (this._onMobKilled) scene.events.off('mobKilled', this._onMobKilled);
  }
  
  getState() {
    return {
      tutorialComplete: this.complete,
      tutorialStep: this.currentStep,
    };
  }
}
