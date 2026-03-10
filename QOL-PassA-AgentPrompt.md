# QOL Pass A: Combat Feel, Agent Intelligence, Combat Log & Power Score — Agent Execution Prompt

## Directive

You are implementing QOL Pass A for AgentQuest: a focused set of improvements to the core gameplay loop. This pass makes combat feel dynamic, the agent feel smart, and gives the player clear information about what's happening and how strong they are.

Four systems in this pass:

1. **Combat System Upgrade** — Damage variance, critical hits, miss/dodge chance, and visual feedback for each
2. **Agent AI Improvements** — Zone lock toggle, HP retreat threshold, visible status text on HUD
3. **Combat Log** — Scrollable activity feed showing combat events, loot, life skill results, and agent actions
4. **Power Score** — Single-number strength metric on the Equipment Panel for player and agent

**Phase gate:** All phases through Phase 9 (Life Skills) must be passing their success criteria. All existing systems must remain functionally identical — this pass adds on top, never replaces.

## Table of Contents

1. Combat System Upgrade
2. Agent AI Improvements
3. Combat Log
4. Power Score
5. New Files
6. Modified Files
7. Sound & Juice Integration
8. Save/Load Integration
9. What NOT to Build
10. Success Criteria

---

## 1. Combat System Upgrade

### Overview

The current auto-combat is deterministic: `damage = max(1, attackerATK - defenderDEF)`. Every hit deals the same number. This makes combat feel flat — the player never gets a surprise moment and gear upgrades produce a predictable, unexciting shift.

This upgrade adds three layers of variance that make every fight feel different while preserving the same average damage output and balance.

### 1A. Damage Variance (±20%)

Every attack rolls a damage multiplier between 0.80 and 1.20, applied to the base damage formula.

```js
// In CombatSystem.js — replace the damage calculation
function calculateDamage(attacker, defender, attackerBuffs = [], defenderBuffs = []) {
  const atkStats = getEffectiveStats(attacker, attackerBuffs);
  const defStats = getEffectiveStats(defender, defenderBuffs);
  const baseDamage = Math.max(1, atkStats.atk - defStats.def);

  // Damage variance: ±20%
  const variance = 0.80 + (Math.random() * 0.40); // Range: 0.80 to 1.20
  let finalDamage = Math.max(1, Math.round(baseDamage * variance));

  // Return result object for downstream processing
  return {
    damage: finalDamage,
    isCrit: false,
    isMiss: false,
    isDodge: false,
    variance: variance,
  };
}
```

**Balance note:** The average multiplier is 1.0, so average DPS is unchanged. Fights just feel less robotic.

### 1B. Critical Hits

A critical hit deals 1.5× damage and triggers distinct visual/audio feedback. Base crit rate is 5%, modified by a new `critChance` stat that can come from gear or buffs in the future.

```js
// Inside calculateDamage(), after variance is applied:
const CRIT_CHANCE = 0.05; // 5% base crit rate

// Future-proof: check for critChance bonus on attacker
const bonusCrit = atkStats.critChance || 0;
const totalCritChance = Math.min(0.25, CRIT_CHANCE + bonusCrit); // Cap at 25%

let isCrit = false;
if (Math.random() < totalCritChance) {
  finalDamage = Math.round(finalDamage * 1.5);
  isCrit = true;
}

return {
  damage: finalDamage,
  isCrit: isCrit,
  isMiss: false,
  isDodge: false,
};
```

**Visual feedback for crits:**

- Floating damage number is larger (1.5× font scale), gold-colored (`#FFD700`), with a brief "CRIT!" label above it
- Entity being hit flashes white instead of the normal red flash (200ms)
- Screen shake: 3px amplitude, 200ms duration (stronger than normal hit shake)
- Sound: A sharper, higher-pitched version of the normal hit sound

### 1C. Miss / Dodge System

When the defender significantly outclasses the attacker defensively, hits can miss. When the attacker significantly outclasses, they never miss.

```js
// Inside calculateDamage(), BEFORE applying variance:

// Dodge chance: scales when defender DEF exceeds attacker ATK
// 0% dodge at equal stats, scales up to a max of 30%
const statDifference = defStats.def - atkStats.atk;
let dodgeChance = 0;
if (statDifference > 0) {
  // Every point of DEF over ATK adds 3% dodge, capped at 30%
  dodgeChance = Math.min(0.30, statDifference * 0.03);
}

if (Math.random() < dodgeChance) {
  return {
    damage: 0,
    isCrit: false,
    isMiss: false,
    isDodge: true,
  };
}

// Miss chance: very low flat rate, represents "glancing blow"
// Only applies when damage would be minimum (1) — i.e., attacker is weak
const MISS_CHANCE = 0.08; // 8% chance to fully miss
if (baseDamage <= 1 && Math.random() < MISS_CHANCE) {
  return {
    damage: 0,
    isCrit: false,
    isMiss: true,
    isDodge: false,
  };
}
```

**Visual feedback for miss/dodge:**

- **MISS** (attacker whiffs): Gray floating text "MISS" at the defender's position. No hit flash, no shake. Attacker does a brief forward-then-back "whiff" tween (2px toward defender, snap back, 150ms).
- **DODGE** (defender evades): White floating text "DODGE" at the defender's position. Defender does a quick sidestep tween (3px lateral, snap back, 200ms). No damage flash.
- **Sound:** Soft "whoosh" for miss, quick "swish" for dodge — both quieter than hit sounds to avoid feeling like they're competing for attention.

### 1D. Combat Result Flow

Refactor the combat tick to use the new result object:

```js
// In CombatSystem.js — the main combat tick
processCombatTick(attacker, defender) {
  const attackerBuffs = (attacker === this.scene.player) ? this.scene.getActiveBuffArray() : [];
  const defenderBuffs = (defender === this.scene.player) ? this.scene.getActiveBuffArray() : [];

  const result = calculateDamage(attacker, defender, attackerBuffs, defenderBuffs);

  if (result.isDodge) {
    this.scene.events.emit('combatDodge', { attacker, defender });
    this.scene.events.emit('combatLogEntry', {
      type: 'dodge',
      attackerName: attacker.name,
      defenderName: defender.name,
    });
    return;
  }

  if (result.isMiss) {
    this.scene.events.emit('combatMiss', { attacker, defender });
    this.scene.events.emit('combatLogEntry', {
      type: 'miss',
      attackerName: attacker.name,
      defenderName: defender.name,
    });
    return;
  }

  // Apply damage
  defender.hp -= result.damage;
  defender.hp = Math.max(0, defender.hp);

  // Emit appropriate event
  if (result.isCrit) {
    this.scene.events.emit('combatCrit', {
      attacker, defender,
      damage: result.damage,
    });
  } else {
    this.scene.events.emit('combatHit', {
      attacker, defender,
      damage: result.damage,
    });
  }

  // Combat log
  this.scene.events.emit('combatLogEntry', {
    type: result.isCrit ? 'crit' : 'hit',
    attackerName: attacker.name,
    defenderName: defender.name,
    damage: result.damage,
  });

  // Check for death
  if (defender.hp <= 0) {
    this.handleDeath(attacker, defender);
  }
}
```

### 1E. Existing Event Integration

The existing `JuiceSystem.js` likely already listens for `combatHit` events to trigger floating damage numbers and hit flashes. Add new listeners:

```js
// In JuiceSystem.js or wherever visual effects are handled:

// Existing — normal hit (keep as-is but ensure it reads damage from event)
this.scene.events.on('combatHit', ({ attacker, defender, damage }) => {
  this.floatingDamage(defender, damage, { color: '#FFFFFF', scale: 1.0 });
  this.hitFlash(defender, '#FF0000', 150);
  this.screenShake(1, 100);
});

// NEW — critical hit
this.scene.events.on('combatCrit', ({ attacker, defender, damage }) => {
  this.floatingDamage(defender, damage, { color: '#FFD700', scale: 1.5, label: 'CRIT!' });
  this.hitFlash(defender, '#FFFFFF', 200);
  this.screenShake(3, 200);
});

// NEW — miss
this.scene.events.on('combatMiss', ({ attacker, defender }) => {
  this.floatingText(defender, 'MISS', { color: '#888888', scale: 0.8 });
  this.whiffTween(attacker, defender); // Small forward-back motion
});

// NEW — dodge
this.scene.events.on('combatDodge', ({ attacker, defender }) => {
  this.floatingText(defender, 'DODGE', { color: '#FFFFFF', scale: 0.9 });
  this.dodgeTween(defender); // Quick lateral sidestep
});
```

---

## 2. Agent AI Improvements

### Overview

The agent currently runs a rigid FSM: IDLE → find mob → walk to it → fight → loot → return to town → deposit → repeat. The player has no control over agent behavior and no visibility into what it's doing. This upgrade adds player-configurable behavior and clear status communication.

### 2A. Zone Lock Toggle

The player can restrict which zone the agent hunts in, instead of relying solely on auto-selected zones based on gear power score.

**Data model:**

```js
// On Agent entity
this.config = {
  zonePreference: 'auto', // 'auto' | 'forest' | 'caves' | 'swamp' | 'volcanic'
  retreatThreshold: 0.25,  // HP percentage to trigger retreat (see 2B)
};
```

**Behavior change in Agent FSM:**

```js
// In the HUNTING state, when selecting a target zone:
selectHuntZone() {
  if (this.config.zonePreference !== 'auto') {
    return this.config.zonePreference;
  }
  // Existing auto-selection logic based on gear power score
  return this.autoSelectZone();
}
```

Auto-selection remains the default. The player must explicitly change the preference. If the agent is set to a zone where it can't survive (gets killed repeatedly), show a warning notification after 3 consecutive deaths: "Your agent is struggling in [Zone]. Consider switching to a safer zone or upgrading their gear."

**UI — Agent Config Panel:**

Add a small config section to the Agent tab of the Equipment Panel, below the stat display:

```
┌─────────────────────────────────────┐
│        ── Agent Behavior ──         │
│                                     │
│ Hunt Zone:                          │
│ [ Auto ] [Forest] [Caves]           │
│ [Swamp] [Volcanic]                  │
│                                     │
│ Retreat at:  ████░░  25% HP         │
│ [10%] [25%] [40%] [50%]            │
│                                     │
│ Status: Hunting in Forest           │
│ Kills this session: 47              │
└─────────────────────────────────────┘
```

- Zone buttons are toggle-style: tap one to select, it highlights. Tap the active one to deselect (returns to Auto).
- Only zones that exist in the game are shown. Locked zones (if any gating exists) are grayed out.
- Current selection persists across sessions (saved in save data).

### 2B. HP Retreat Threshold

The player can set the HP percentage at which the agent breaks combat and returns to town. Currently the agent likely fights until very low HP or death.

```js
// In Agent FSM — COMBAT state, each tick:
checkRetreat() {
  const stats = getEffectiveStats(this);
  const hpPercent = this.hp / stats.maxHp;

  if (hpPercent <= this.config.retreatThreshold) {
    this.setState('RETURNING');
    this.currentTarget = null;

    this.scene.events.emit('agentRetreating', {
      reason: 'low_hp',
      hpPercent: Math.round(hpPercent * 100),
    });

    this.scene.events.emit('combatLogEntry', {
      type: 'agent_retreat',
      message: `Agent retreats at ${Math.round(hpPercent * 100)}% HP`,
    });

    return true;
  }
  return false;
}
```

**Preset values:** 10%, 25%, 40%, 50%. Displayed as tappable buttons (not a slider — sliders are imprecise on mobile).

- **10%** = aggressive, agent fights until nearly dead. Maximum kills per trip but risky.
- **25%** = balanced default. Good survivability, decent efficiency.
- **40%** = cautious. Retreats early, fewer deaths, more trips to town.
- **50%** = very safe. Good for undergeared agents in tough zones.

**Agent healing on return:** When the agent reaches town during RETURNING state, heal to full HP over 3 seconds (gradual, visible on HP bar), then resume IDLE → HUNTING cycle.

### 2C. Agent Status Text on HUD

A single line of text on the main HUD showing what the agent is currently doing. Positioned near the agent's HP bar or in the top HUD bar area.

**Status messages:**

| FSM State | HUD Text | Color |
|---|---|---|
| IDLE | "Agent: Idle in town" | #AAAAAA (gray) |
| HUNTING | "Agent: Hunting in [Zone]" | #4CAF50 (green) |
| COMBAT | "Agent: Fighting [Mob Name]" | #FF9800 (orange) |
| RETURNING | "Agent: Returning to town" | #FFD700 (gold) |
| RETURNING (low HP) | "Agent: Retreating (low HP)" | #F44336 (red) |
| DEPOSITING | "Agent: Depositing loot" | #2196F3 (blue) |
| DEAD | "Agent: Defeated! Respawning…" | #F44336 (red, pulsing) |
| Not hired | "No agent hired" | #666666 (dim gray) |

```js
// In HUDScene — update every 500ms or on FSM state change
updateAgentStatus() {
  if (!this.scene.agent) {
    this.agentStatusText.setText('No agent hired');
    this.agentStatusText.setColor('#666666');
    return;
  }

  const agent = this.scene.agent;
  const state = agent.currentState;

  switch (state) {
    case 'HUNTING':
      const zone = agent.currentTargetZone || 'unknown';
      this.agentStatusText.setText(`Agent: Hunting in ${zone}`);
      this.agentStatusText.setColor('#4CAF50');
      break;
    case 'COMBAT':
      const mobName = agent.currentTarget?.name || 'enemy';
      this.agentStatusText.setText(`Agent: Fighting ${mobName}`);
      this.agentStatusText.setColor('#FF9800');
      break;
    case 'RETURNING':
      const isLowHp = agent.hp / getEffectiveStats(agent).maxHp <= agent.config.retreatThreshold;
      if (isLowHp) {
        this.agentStatusText.setText('Agent: Retreating (low HP)');
        this.agentStatusText.setColor('#F44336');
      } else {
        this.agentStatusText.setText('Agent: Returning to town');
        this.agentStatusText.setColor('#FFD700');
      }
      break;
    case 'DEPOSITING':
      this.agentStatusText.setText('Agent: Depositing loot');
      this.agentStatusText.setColor('#2196F3');
      break;
    case 'DEAD':
      this.agentStatusText.setText('Agent: Defeated! Respawning...');
      this.agentStatusText.setColor('#F44336');
      break;
    default:
      this.agentStatusText.setText('Agent: Idle in town');
      this.agentStatusText.setColor('#AAAAAA');
  }
}
```

**Layout:** Small text (10-11px), positioned in the top HUD bar area or just below it. Should not overlap with other HUD elements. Use the same parchment text color (`#F5E6C8`) for the "Agent:" prefix, then the state-specific color for the rest.

### 2D. Agent Session Stats

Track basic stats for the current play session (reset on page load, NOT persisted):

```js
// On Agent entity
this.sessionStats = {
  kills: 0,
  goldEarned: 0,
  gearFound: 0,
  deaths: 0,
  tripsCompleted: 0,
};
```

These show at the bottom of the Agent Config section in the Equipment Panel. They give the player a sense of how productive their agent setup is — which validates zone/threshold tuning.

---

## 3. Combat Log

### Overview

A scrollable feed of recent game events. Solves the biggest information gap: "I was fishing for 2 minutes, what did my agent do? What grew in my farm? Did I miss any drops?"

### 3A. Log Data Model

```js
// CombatLog.js — new system
export class CombatLog {
  constructor(maxEntries = 100) {
    this.entries = []; // Array of log entry objects
    this.maxEntries = maxEntries;
    this.listeners = [];
  }

  addEntry(entry) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      ...entry,
    };

    this.entries.push(logEntry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Notify listeners (for UI updates)
    for (const listener of this.listeners) {
      listener(logEntry);
    }
  }

  getRecent(count = 20) {
    return this.entries.slice(-count);
  }

  onNewEntry(callback) {
    this.listeners.push(callback);
  }
}
```

### 3B. Entry Types

Every significant game event generates a log entry. Entries have a `type` field used for filtering and color-coding.

| Type | Color | Example Messages |
|---|---|---|
| hit | #FFFFFF (white) | "You hit Slime for 8 damage" |
| crit | #FFD700 (gold) | "You CRIT Goblin for 14 damage!" |
| miss | #888888 (gray) | "You missed Bat" |
| dodge | #AAAAAA (light gray) | "Skeleton dodged your attack" |
| kill | #4CAF50 (green) | "You killed Goblin (+12g, +Goblin Tooth)" |
| agent_hit | #B0BEC5 (blue-gray) | "Agent hit Wolf for 6 damage" |
| agent_crit | #FFD700 | "Agent CRIT Cave Bat for 11 damage!" |
| agent_kill | #81C784 (light green) | "Agent killed Wolf (+8g)" |
| agent_retreat | #FF9800 (orange) | "Agent retreats at 22% HP" |
| agent_death | #F44336 (red) | "Agent was defeated by Lava Imp" |
| agent_deposit | #2196F3 (blue) | "Agent deposited: 3 items, 45g" |
| player_death | #F44336 | "You were defeated! Lost 12g" |
| loot_gear | Rarity color | "Rare Iron Helm dropped! (DEF +5, HP +8)" |
| loot_material | #FFFFFF | "Obtained Slime Gel ×2" |
| fishing | #42A5F5 (light blue) | "Caught Large Fish" |
| fishing_miss | #78909C (gray-blue) | "The fish got away…" |
| mining | #FF8A65 (orange) | "Extracted Iron Ore" |
| mining_depleted | #FF8A65 | "Copper Vein depleted (respawns in 60s)" |
| farming | #66BB6A (green) | "Harvested Wheat ×2" |
| farming_bonus | #66BB6A | "Bonus crop! +1 Tomato" |
| cooking | #FFAB40 (amber) | "Cooked Bossfight Brew" |
| buff | #AB47BC (purple) | "Buff active: Bossfight Brew (+8 ATK, +5 DEF, +20 HP) 2:00" |
| buff_expire | #9E9E9E (gray) | "Bossfight Brew buff expired" |
| skill_levelup | #00897B (teal) | "Fishing reached Level 5! Abyssal Depths unlocked" |
| level_up | #FFD700 (gold) | "Level up! You are now Level 4" |
| boss | #F44336 (red) | "Infernal Guardian has appeared!" |
| boss_kill | #FFD700 | "Infernal Guardian defeated! Loot: Infernal Blade" |

### 3C. Event Wiring

Wire events from all existing systems into the combat log. This is done in `GameScene.js` during initialization:

```js
// In GameScene.create() or a dedicated setupCombatLog() method:

this.combatLog = new CombatLog(100);

// Combat events (from CombatSystem)
this.events.on('combatLogEntry', (entry) => this.combatLog.addEntry(entry));

// Loot events
this.events.on('lootDropped', (data) => {
  if (data.type === 'gear') {
    this.combatLog.addEntry({
      type: 'loot_gear',
      message: `${data.item.rarity} ${data.item.name} dropped!`,
      rarity: data.item.rarity,
    });
  } else {
    this.combatLog.addEntry({
      type: 'loot_material',
      message: `Obtained ${data.item.name} ×${data.item.quantity}`,
    });
  }
});

// Kill events
this.events.on('mobKilled', (data) => {
  const prefix = data.killer === 'agent' ? 'Agent' : 'You';
  const lootStr = data.goldEarned ? ` (+${data.goldEarned}g)` : '';
  this.combatLog.addEntry({
    type: data.killer === 'agent' ? 'agent_kill' : 'kill',
    message: `${prefix} killed ${data.mobName}${lootStr}`,
  });
});

// Fishing events
this.events.on('fishingCatch', (data) => {
  const itemDef = ITEM_DATA[data.itemId];
  this.combatLog.addEntry({
    type: 'fishing',
    message: `Caught ${itemDef.name}`,
  });
});

this.events.on('fishingMiss', () => {
  this.combatLog.addEntry({
    type: 'fishing_miss',
    message: 'The fish got away...',
  });
});

// Mining events
this.events.on('miningExtract', (data) => {
  const itemDef = ITEM_DATA[data.itemId];
  this.combatLog.addEntry({
    type: 'mining',
    message: `Extracted ${itemDef.name}`,
  });
});

this.events.on('miningNodeDepleted', (data) => {
  this.combatLog.addEntry({
    type: 'mining_depleted',
    message: `${data.node} depleted (respawns in ${Math.round(data.respawnTime / 1000)}s)`,
  });
});

// Farming events
this.events.on('plotStateChanged', (data) => {
  if (data.state === 'ready') {
    // Don't log — harvest log covers it
  }
});

// Hook into harvest results directly in FarmingSystem or wherever harvest emits

// Cooking events
this.events.on('cookEffect', (data) => {
  const recipeDef = COOKING_RECIPES[data.recipeId];
  this.combatLog.addEntry({
    type: 'cooking',
    message: `Cooked ${recipeDef.name}`,
  });
});

// Buff events
this.events.on('buffActivated', (buff) => {
  const statsStr = Object.entries(buff.stats)
    .filter(([k, v]) => v > 0)
    .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
    .join(', ');
  const duration = Math.round(buff.duration / 1000);
  this.combatLog.addEntry({
    type: 'buff',
    message: `Buff active: ${buff.name} (${statsStr}) ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`,
  });
});

this.events.on('buffExpired', (data) => {
  this.combatLog.addEntry({
    type: 'buff_expire',
    message: `${data.name} buff expired`,
  });
});

// Skill level-ups
this.events.on('skillLevelUp', (data) => {
  const unlockStr = data.unlock ? ` ${data.unlock.description}` : '';
  this.combatLog.addEntry({
    type: 'skill_levelup',
    message: `${data.skillId} reached Level ${data.newLevel}!${unlockStr}`,
  });
});

// Combat level-ups
this.events.on('playerLevelUp', (data) => {
  this.combatLog.addEntry({
    type: 'level_up',
    message: `Level up! You are now Level ${data.newLevel}`,
  });
});

// Boss events
this.events.on('bossSpawned', () => {
  this.combatLog.addEntry({
    type: 'boss',
    message: 'Infernal Guardian has appeared!',
  });
});

this.events.on('bossDefeated', (data) => {
  this.combatLog.addEntry({
    type: 'boss_kill',
    message: `Infernal Guardian defeated!`,
  });
});

// Agent deposit
this.events.on('agentDeposited', (data) => {
  this.combatLog.addEntry({
    type: 'agent_deposit',
    message: `Agent deposited: ${data.itemCount} items, ${data.goldEarned}g`,
  });
});
```

**Note:** Some of these events may already exist in the codebase under slightly different names. Match the actual event names used in your systems. If an event doesn't exist yet (e.g., `mobKilled` with killer attribution), add the emit to the appropriate system.

### 3D. Combat Log Panel (`CombatLogPanel.js`)

A toggleable overlay that shows the scrollable log. Opened from a new button on the HUD.

**HUD Button:** Add a 📜 (scroll) button to the HUD button cluster. Tapping toggles the log panel open/closed. The log is a **semi-transparent overlay** that does NOT pause the game — the player can watch combat happen while reading the log.

**Layout:**

```
┌─────────────────────────────────────┐
│ 📜 Activity Log          [ ✕ ]     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ 12:04  Agent killed Wolf (+8g)  ││ ← Scrollable
│ │ 12:04  Caught Large Fish        ││
│ │ 12:03  Agent CRIT Bat for 11!   ││ ← Gold text
│ │ 12:03  Agent hit Bat for 6      ││
│ │ 12:02  Extracted Iron Ore       ││
│ │ 12:02  Skeleton dodged attack   ││ ← Gray text
│ │ 12:01  Harvested Wheat ×2       ││
│ │ 12:01  Cooking Lv.3!            ││ ← Teal text
│ │ 12:00  Buff: Basic Stew +3 ATK  ││ ← Purple text
│ │ 11:59  You killed Slime (+5g)   ││
│ │ ...                             ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Specifications:**

- **Size:** Full width, bottom 40% of screen. Semi-transparent dark background (`#1A1A2E` at 80% opacity).
- **Scrolling:** Phaser scroll zone or masked container. Auto-scrolls to newest entry. Player can scroll up to read history. Scrolling up pauses auto-scroll; new entries resume auto-scroll when the player is at the bottom.
- **Timestamps:** Show as MM:SS relative to session start (or just minutes elapsed). Keep it compact.
- **Entry formatting:** Each entry is one line. Timestamp in dim gray, then the message in its type-appropriate color.
- **Font:** 10px, same parchment color family as other UI text. Keep it small — this is a secondary information channel.
- **Max visible:** Show last 20 entries in the visible area. Player can scroll to see up to 100 total.
- **Performance:** Only render visible entries. Don't create Phaser text objects for all 100 entries — use a virtual scroll or re-render visible rows on scroll.

**Mini Log (optional but recommended):**

When the full log panel is closed, show the last 2-3 entries as small fading text lines at the bottom of the game viewport. Each line appears, holds for 3 seconds, then fades out. This gives ambient awareness without needing to open the panel.

```
┌─────────────────────────────────────┐
│                                     │
│          GAME VIEWPORT              │
│                                     │
│                                     │
│  Agent killed Wolf (+8g)            │ ← Fades after 3s
│  Caught Large Fish                  │ ← Fades after 3s
├─────────────────────────────────────┤
│        BOTTOM CONTROLS              │
└─────────────────────────────────────┘
```

These mini-log lines should not interfere with gameplay — position them above the control area, use 9px font, 60% opacity, and fade to 0 over 1 second after the 3-second hold.

---

## 4. Power Score

### Overview

A single number that represents total combat effectiveness. Shows on the Equipment Panel for both player and agent. Gives the player an instant sense of progression and makes gear comparison trivial ("this item raises my power score by 12").

### 4A. Calculation

```js
// In StatCalculator.js
export function calculatePowerScore(entity, activeBuffs = []) {
  const stats = getEffectiveStats(entity, activeBuffs);

  // Weighted formula:
  // ATK is most impactful for kill speed
  // DEF reduces incoming damage
  // Max HP is survivability
  const score = Math.round(
    (stats.atk * 3) +
    (stats.def * 2.5) +
    (stats.maxHp * 0.5)
  );

  return score;
}
```

**Weight rationale:**

- **ATK × 3:** Each point of ATK directly increases damage per hit. Highest weight because kill speed drives gold/hr.
- **DEF × 2.5:** Each point of DEF reduces incoming damage by 1 per hit. Very impactful for survivability.
- **MaxHP × 0.5:** HP is a buffer — important but less impactful per point than ATK/DEF.

**Example power scores** (for reference during balance checks):

| State | Approx ATK | Approx DEF | Approx HP | Power Score |
|---|---|---|---|---|
| Fresh player (Lv.1, no gear) | 3 | 2 | 30 | ~29 |
| Early gear (Lv.3, common set) | 8 | 6 | 50 | ~64 |
| Mid gear (Lv.5, uncommon set) | 15 | 12 | 80 | ~115 |
| Endgame (Lv.8, rare+ set) | 25 | 20 | 120 | ~185 |
| Boss-ready (Lv.10, epic set, elixir buff) | 40 | 30 | 160 | ~275 |

### 4B. Equipment Panel Display

Add the power score prominently to both the Player and Agent tabs of the Equipment Panel:

```
┌─────────────────────────────────────┐
│  [You]     │  [Agent]              │
├──────────┴──────────────────────────┤
│                                     │
│  Player Name          Lv. 5        │
│  ⚔️ Power Score: 115               │ ← NEW: Large, gold-colored
│                                     │
│  ATK: 15  (+7)                      │
│  DEF: 12  (+6)                      │
│  HP:  80  (+20)                     │
│                                     │
│  ┌─────────┐                        │
│  │ HELMET  │                        │
│  ...                                │
```

- Power score displayed in gold (`#DAA520`), larger font than stat lines (14px vs 11px)
- Include the active buff contribution. If a buff is active, show: `⚔️ Power Score: 115 (+24 from buff)`
- When comparing gear in the tooltip, show the power score delta: "Equipping this: Power Score 115 → 127 (+12)"

### 4C. Gear Comparison with Power Score

When the player taps a gear item in the inventory/equipment grid, the comparison tooltip should include a power score preview:

```
┌──────────────────────────────┐
│  Rare Iron Helm              │  Blue text (rare)
│  ─────────────────────────── │
│  DEF: +5                     │
│  HP:  +8                     │
│                              │
│  Currently equipped:         │
│  Common Leather Cap          │
│  DEF: +1   HP: +3            │
│  ─────────────────────────── │
│  Power: 115 → 127 (▲12)     │ ← Green if upgrade
│                              │
│  [EQUIP]       [SELL 14g]    │
└──────────────────────────────┘
```

- **▲ green** if power score increases
- **▼ red** if power score decreases
- **= gray** if neutral

The power score delta is computed by temporarily simulating the equip (swap the gear in a copy of the equipment state, recalculate) — do not actually modify equipment state during preview.

---

## New Files

```
src/
├── systems/
│   └── CombatLog.js          # Log data model, entry storage, listeners
├── ui/
│   └── CombatLogPanel.js     # Scrollable log overlay UI + mini-log feed
```

## Modified Files

| File | Changes |
|---|---|
| CombatSystem.js | Replace damage calculation with `calculateDamage()` function. Emit typed events (combatHit, combatCrit, combatMiss, combatDodge, combatLogEntry). |
| Agent.js | Add `this.config` (zonePreference, retreatThreshold). Add `checkRetreat()` in COMBAT state. Add `this.sessionStats`. Modify zone selection to respect config. Add healing on return to town. |
| StatCalculator.js | Add `calculatePowerScore()` function. |
| GameScene.js | Instantiate CombatLog. Wire all game events into log entries. |
| HUDScene.js | Add 📜 log button. Add agent status text display. Update on FSM state changes. |
| EquipmentPanel.js | Add Agent Config section (zone lock, retreat threshold). Add power score display. Add power score delta to gear comparison tooltip. |
| JuiceSystem.js | Add combatCrit, combatMiss, combatDodge visual handlers. |
| AudioSystem.js | Add crit hit, miss whoosh, dodge swish sounds. |
| SaveSystem.js | Persist agent config (zonePreference, retreatThreshold). |

---

## Sound & Juice Integration

### New Sounds (add to `AudioSystem.js`)

| Event | Sound Character | Duration |
|---|---|---|
| crit_hit | Sharp metallic impact + high chime | ~200ms |
| miss_whoosh | Soft air swish, low volume | ~150ms |
| dodge_swish | Quick lateral air movement | ~150ms |

Use the same procedural Web Audio API pattern as existing Phase 7c sounds. These three sounds fire frequently during combat, so keep them short and non-fatiguing. The crit should feel satisfying but not overwhelming after the 50th time.

### New Visual Effects (add to `JuiceSystem.js`)

| Event | Method | Effect |
|---|---|---|
| combatCrit | `critEffect(defender, damage)` | Gold floating damage (1.5× scale), white hit flash (200ms), screen shake (3px, 200ms), "CRIT!" label above damage number |
| combatMiss | `missEffect(attacker, defender)` | Gray "MISS" text at defender, attacker whiff tween (2px forward-back, 150ms) |
| combatDodge | `dodgeEffect(defender)` | White "DODGE" text at defender, defender lateral tween (3px sidestep, 200ms snap back) |

---

## Save/Load Integration

Add agent config to the save schema:

```js
// In save schema — inside the agent data section
agentConfig: {
  zonePreference: 'auto',   // 'auto' | 'forest' | 'caves' | 'swamp' | 'volcanic'
  retreatThreshold: 0.25,   // 0.10 | 0.25 | 0.40 | 0.50
},
```

**On Save:**

```js
if (scene.agent) {
  saveData.agentConfig = { ...scene.agent.config };
}
```

**On Load:**

```js
if (saveData.agentConfig && scene.agent) {
  scene.agent.config = { ...saveData.agentConfig };
}
```

**Schema Migration:**

```js
if (data.version < NEW_VERSION) {
  data.agentConfig = data.agentConfig || { zonePreference: 'auto', retreatThreshold: 0.25 };
  data.version = NEW_VERSION;
}
```

Combat log is NOT persisted. It resets each session. Session stats on the agent also reset. These are ephemeral by design.

---

## What NOT to Build

- **Do NOT** add new gear, mobs, zones, items, or recipes. This pass is purely about improving existing system feel.
- **Do NOT** change damage formulas beyond the additions specified (variance, crit, miss/dodge). Base damage `max(1, ATK - DEF)` remains the foundation.
- **Do NOT** add gear set bonuses, critChance as a gear stat, or dodge as a gear stat. The system is future-proofed for these, but they're not in this pass.
- **Do NOT** let the player control the agent in real-time (direct movement, target selection). The agent remains autonomous with configurable preferences.
- **Do NOT** persist the combat log. It's session-only.
- **Do NOT** modify any texture or BootScene. All UI for this pass uses Phaser text objects and the existing UI textures/panel backgrounds.
- **Do NOT** change the mobile layout or add new panels that overlap with existing ones. The combat log is a toggleable overlay. Agent config lives inside the existing Equipment Panel.
- **Do NOT** change save schema in a way that breaks existing saves. Always migrate forward with defaults.

---

## Success Criteria

### Combat System Upgrade (6)

1. Damage varies ±20% per hit — consecutive hits against the same enemy deal different amounts
2. Critical hits occur at ~5% rate, deal 1.5× damage, display gold "CRIT!" text at 1.5× size, trigger white flash and stronger screen shake
3. Dodge triggers when defender DEF significantly exceeds attacker ATK — "DODGE" text appears, defender does sidestep tween, no damage dealt
4. Miss triggers at 8% rate when base damage would be 1 (minimum) — "MISS" text appears, attacker whiffs, no damage dealt
5. All four outcomes (normal hit, crit, miss, dodge) have distinct sounds
6. Average DPS over 50+ combat ticks is within 5% of the pre-patch value (variance adds excitement, not power creep)

### Agent AI (5)

7. Agent zone preference can be set to Auto, Forest, Caves, Swamp, or Volcanic from the Equipment Panel Agent tab
8. Agent retreat threshold can be set to 10%, 25%, 40%, or 50% — agent breaks combat and returns to town when HP falls below threshold
9. Agent heals to full over 3 seconds upon reaching town
10. Agent status text on HUD updates in real-time showing current FSM state, zone, and mob name during combat
11. Agent config (zone preference + retreat threshold) persists across save/load

### Combat Log (5)

12. Combat log captures events from all systems: combat hits/crits/misses/dodges, kills, loot drops, fishing catches, mining extractions, farming harvests, cooking, buff activation/expiry, skill level-ups, boss events, agent actions
13. 📜 button on HUD toggles the log panel open/closed
14. Log panel is scrollable, shows timestamps, color-codes entries by type, and auto-scrolls to newest
15. Mini-log shows last 2-3 entries as fading text at the bottom of the viewport when the panel is closed
16. Log panel does not noticeably impact performance on mobile (virtual scroll, max 100 entries)

### Power Score (4)

17. `calculatePowerScore()` returns a single number based on ATK×3 + DEF×2.5 + MaxHP×0.5
18. Power score displays on both Player and Agent tabs of the Equipment Panel, in gold, with buff contribution shown separately
19. Gear comparison tooltip shows power score delta with green ▲ / red ▼ / gray = indicator
20. Power score updates immediately when gear is equipped/unequipped or buff activates/expires

---

**End of QOL Pass A spec. After all 20 criteria pass, proceed to QOL Pass B (Inventory QOL, minimap, farm/mining timers, Cook Max).**
