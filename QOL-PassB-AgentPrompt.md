# QOL Pass B: Inventory, Information & Usability — Agent Prompt

## Directive

You are implementing **QOL Pass B** for AgentQuest — a mobile-first browser RPG built with Phaser 3 + Vite. This pass focuses on inventory usability, information clarity, and quality-of-life improvements across existing systems. No new content or mechanics — this is pure polish on what's already built.

**Prerequisites:** Phases 1–9 and QOL Pass A must be fully implemented and working. QOL Pass A's combat log, power score, agent zone lock/retreat, damage variance, crits, and dodge are all in place.

**Scope:** 6 improvements across inventory, information display, and activity QOL. Do NOT build new items, new zones, new mobs, new skills, or any new gameplay systems.

---

## Context: What Already Exists

### Inventory (Phase 2, expanded through Phase 9)

- `InventoryPanel.js` — full-screen overlay with 4 category tabs: Materials, Gear, Seeds, Food
- Materials, seeds, and food stack by type with quantity display
- Gear is unique instances (never stacks) — each piece has rolled stats
- Gear shows: name, rarity color, slot, and stat values
- "Sell All Common" button exists for gear (added Phase 2)
- Shop (`ShopScene.js`) handles selling with category tabs

### Equipment & Power Score (Phase 2, QOL Pass A)

- `EquipmentPanel.js` — player and agent tabs, 5 gear slots each (weapon, helmet, chest, boots, accessory)
- Power score displayed per entity (ATK×3 + DEF×2.5 + MaxHP×0.5) from QOL Pass A
- Tapping a gear piece in inventory shows its stats but NO comparison to currently equipped
- No way to see stat deltas before equipping

### Combat Log (QOL Pass A)

- `CombatLog.js` / `CombatLogPanel.js` — 100-entry scrollable feed, color-coded by system
- Mini-log (2-3 fading lines) at viewport bottom
- System colors established: combat red (#FF6B6B), loot gold (#DAA520), fishing blue (#5B8FA8), mining gray (#AAAAAA), farming green (#4CAF50), cooking orange (#FF9800), skill purple (#9C27B0), boss magenta (#FF00FF), agent cyan (#00BCD4)

### Activities (Phases 3, 6/9)

- `ActivityHUD.js` — persistent bars showing fishing/mining status
- Fishing: shows active pool, catch count, collect/stop buttons
- Mining: shows active node, extraction count, collect/stop buttons
- Farm plots: show growth as percentage bar per plot in `FarmingPanel.js`
- Cooking: `CookingPanel.js` with recipe list, ingredient check, cook button

### Map (Phase 5)

- 50×50 tile grid, 5 zones: Town, Forest, Caves, Swamp, Volcanic Rift
- No minimap — player navigates by memory and zone color differences
- No zone transition indicators beyond tile palette changes
- Buildings in town: Tavern, Shop, Forge, Kitchen, Farm area, Fishing dock

### HUD (all phases)

- `HUDScene.js` runs parallel — HP bar, gold counter, XP bar, agent toggle, zone name
- No gold income rate display
- Zone name updates when player crosses zone boundaries

---

## Improvements

### 1. Gear Comparison Tooltips

**The single highest-friction point in the game.** When a player finds a new piece of gear, they currently have to memorize its stats, open the equipment panel, look at the equipped piece, then mentally calculate whether the new one is better. This should be instant.

**Implementation:**

When tapping a gear item in the inventory panel, show an expanded tooltip that includes:

```
┌────────────────────────────┐
│  ★ Iron Longsword          │  ← item name in rarity color
│  Weapon · Uncommon         │  ← slot + rarity
│  ──────────────────────    │
│  ATK: 12   (+4 ▲)         │  ← green if upgrade
│  DEF: 2    (-1 ▼)         │  ← red if downgrade
│  HP:  0    (—)            │  ← gray dash if no change
│  ──────────────────────    │
│  Power: 42  (+8.5 ▲)      │  ← power score delta
│  ──────────────────────    │
│  Currently equipped:       │
│  Rusty Dagger (Common)     │  ← name + rarity of current
│  ATK: 8  DEF: 3  HP: 0    │
│  ──────────────────────    │
│  [ Equip ]  [ Sell: 5g ]  │  ← action buttons
└────────────────────────────┘
```

**Rules:**

- Comparison is always against the PLAYER's currently equipped gear in that slot (not agent's)
- If no gear is equipped in that slot, show "No gear equipped" and all deltas are pure positives
- Delta colors: green (#4CAF50) with ▲ for upgrades, red (#FF6B6B) with ▼ for downgrades, gray (#AAAAAA) with — for no change
- Power score delta uses the same green/red coloring
- "Equip" button equips on player immediately (same as current equip action)
- "Sell" button sells immediately with gold amount shown
- If viewing from Equipment Panel (not Inventory), show "Unequip" instead of "Equip"
- Long-press (500ms hold) on any gear piece in inventory opens this tooltip (in addition to regular tap)
- Tooltip dismisses on tap-outside or a small ✕ button in the top-right corner

**Modified files:** `InventoryPanel.js`, `EquipmentPanel.js`

**New file:** `src/ui/GearTooltip.js` — reusable tooltip component used by both panels

### 2. Inventory Quick Actions

**Reduce the number of taps to manage a full inventory after a long session.**

**2a. Category Sell-All Buttons**

Add a "Sell All" button to each inventory tab header (not just the gear tab's existing "Sell All Common"):

| Tab | Button text | Behavior |
|---|---|---|
| Materials | Sell All Materials | Sells entire material stack for standard sell values. Confirmation dialog: "Sell all materials for Xg?" |
| Gear | Sell All Common | Already exists — no change |
| Gear | Sell All ≤ Uncommon | New button. Sells Common + Uncommon gear. Confirmation dialog with count + total gold. |
| Seeds | (none) | Seeds are consumed, not sold — no sell button |
| Food | Sell All Food | Sells all food items. Confirmation dialog. |

**Confirmation dialogs** are simple Phaser text overlays (not DOM): dark panel with message + "Yes" / "No" buttons. Consistent with existing UI patterns.

**2b. Auto-Sort**

Add a sort button (icon: ↕) to the inventory panel header bar, next to the close button.

Sort logic per tab:

| Tab | Primary sort | Secondary sort |
|---|---|---|
| Materials | Sell value (high→low) | Alphabetical |
| Gear | Rarity (Epic→Common) | Power score (high→low) |
| Seeds | Growth time (slow→fast) | Alphabetical |
| Food | Buff potency (high→low) | Alphabetical |

Sort is applied in-place to the inventory array. Sort preference is NOT saved — defaults to unsorted on each panel open, player taps sort if desired.

**Modified files:** `InventoryPanel.js`, `ShopScene.js` (for sell-all pricing logic)

### 3. Minimap

**Spatial awareness on a 50×50 world where the player manages 4+ activity locations.**

**Implementation:** Small overlay in the top-right corner of the game viewport, always visible during gameplay (not inside panels). Rendered as a Phaser RenderTexture updated every 2 seconds.

**Size:** 80×80px on screen (each tile = 1.6px, representing the 50×50 grid)

**What's drawn:**

| Element | Representation | Color |
|---|---|---|
| Town zone tiles | Filled area | #8B7355 (warm stone) at 60% opacity |
| Forest zone tiles | Filled area | #2D5A27 (deep green) at 60% opacity |
| Caves zone tiles | Filled area | #36393F (charcoal) at 60% opacity |
| Swamp zone tiles | Filled area | #3A4A2A (murky green) at 60% opacity |
| Volcanic zone tiles | Filled area | #1A1A1A (black) at 60% opacity |
| Buildings | 2×2px squares | #DAA520 (gold) |
| Player | 3×3px dot | #FFFFFF (white), pulsing |
| Agent | 3×3px dot | #00BCD4 (cyan), pulsing |
| World Boss (when active) | 4×4px dot | #FF00FF (magenta), pulsing |
| Mobs | Not shown | — (too noisy at this scale) |
| Active fishing spot | 2×2px dot | #5B8FA8 (blue), only when fishing is active |
| Active mining node | 2×2px dot | #AAAAAA (gray), only when mining is active |

**Border:** 1px solid #DAA520 at 50% opacity

**Background:** #000000 at 70% opacity (so the map reads against any terrain)

**Interaction:**

- Tap on minimap → does nothing (too small for meaningful tap targets on mobile)
- Minimap respects panel layering — hidden when any full-screen panel is open
- Can be hidden via a toggle in Settings ("Show Minimap" — default ON)

**New file:** `src/ui/Minimap.js`

**Modified files:** `HUDScene.js` (instantiate and position minimap), `SettingsPanel.js` (add toggle), `SaveSystem.js` (persist minimap visibility preference)

### 4. Zone Transition Notifications

**Give the world structure and help players orient.**

When the player (or camera target during agent spectate) crosses a zone boundary, display a centered text notification:

```
━━  Entering the Sunless Caves  ━━
```

**Visual spec:**

- Centered horizontally, positioned at 20% from top of viewport
- Text: zone display name in #F5E6C8, 18px, bold
- Decorative dashes (━━) in #DAA520 flanking the name
- Subtle dark background pill behind text (#1A1A2E at 70% opacity, 8px padding, rounded)
- Fade in over 200ms, hold for 1.5 seconds, fade out over 500ms
- Does NOT block input — purely cosmetic overlay
- Cooldown: same zone transition cannot re-trigger for 5 seconds (prevents flicker when walking along a zone border)

**Zone display names:**

| Zone key | Display name |
|---|---|
| town | Town of Elderglen |
| forest | The Verdant Forest |
| caves | Sunless Caves |
| swamp | Blighted Swamp |
| volcanic | Volcanic Rift |

**Implementation:** Add to `HUDScene.js` as a persistent text object that's shown/hidden via tweens. Track `lastZone` to detect transitions. Check zone on player position update (already fires every frame).

**Modified files:** `HUDScene.js`, `config/constants.js` (add zone display names)

### 5. Activity Timers & Information

**Replace vague progress indicators with precise countdowns.**

**5a. Farm Plot Countdown Timers**

Currently farm plots show a percentage bar. Add a countdown timer below each plot's progress bar:

- Format: `Xm Ys` remaining (e.g., "1m 12s")
- When ≤10 seconds: text turns #4CAF50 (green) and pulses
- When ready: show "READY" in #DAA520, bouncing gently
- Timer updates every 1 second

**5b. Mining Node Respawn Indicators**

When a mining node is depleted, its world tile currently just shows the depleted texture. Add:

- Floating text above depleted nodes: countdown to respawn in #AAAAAA, 10px
- Format: `Xm Ys` (same as farm timers)
- When respawn is ≤10 seconds: text turns white
- Visible only when player is within 5 tiles of the node (performance — don't render for off-screen nodes)

**5c. Cook Max Button**

Add a "Cook Max" button next to the existing "Cook" button in `CookingPanel.js`:

- Calculates the maximum number of times the recipe can be crafted with current inventory
- Shows the count on the button: "Cook Max (×7)"
- Single tap cooks all at once (not animated per-cook — instant batch)
- Grants XP for each cook in the batch
- Play cook sound once (not 7 times)
- If count is 0 (insufficient ingredients), button is grayed out
- If count is 1, "Cook Max (×1)" is functionally identical to "Cook" — show it anyway for consistency

**Modified files:** `FarmingPanel.js` (countdown timers), `MiningSystem.js` + `GameScene.js` (respawn indicators), `CookingPanel.js` (Cook Max button)

### 6. Gold Rate Indicator

**Let players evaluate the effectiveness of their current strategy.**

Add a small gold-per-minute indicator to the HUD, next to the existing gold counter:

```
💰 1,247g  (+38g/min)
```

**Calculation:**

- Track gold earned over a rolling 3-minute window (not lifetime average — that would be meaningless after hours of play)
- Update display every 10 seconds
- `goldPerMinute = (goldEarnedInWindow / windowDurationSeconds) * 60`
- Only counts gold from kills, sells, and activity collection — not gold spent
- Display format: `+Xg/min` in #DAA520, smaller font (10px) below or beside the main gold counter
- If rate is 0 (player idle), show `+0g/min` in #AAAAAA
- Rolling window starts fresh on game load (no carryover from save)

**New tracking needed:** Array of `{ gold: Number, timestamp: Number }` entries in `GameScene` or a small `GoldTracker` utility. On each gold-gain event, push an entry. On each display update, filter entries older than 3 minutes.

**Modified files:** `HUDScene.js` (display), `GameScene.js` (tracking gold events)

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/ui/GearTooltip.js` | Reusable gear comparison tooltip with stat deltas and action buttons |
| `src/ui/Minimap.js` | 80×80px always-visible minimap rendered via RenderTexture |

---

## Modified Files Summary

| File | Changes |
|---|---|
| `InventoryPanel.js` | Gear tooltip integration, category sell-all buttons, auto-sort button and logic |
| `EquipmentPanel.js` | Gear tooltip integration (unequip variant) |
| `ShopScene.js` | Bulk sell pricing logic for sell-all buttons |
| `HUDScene.js` | Minimap instantiation, zone transition notification, gold rate display |
| `FarmingPanel.js` | Countdown timers on farm plots replacing/augmenting percentage bars |
| `CookingPanel.js` | Cook Max button with batch calculation |
| `MiningSystem.js` | Depleted node respawn countdown tracking |
| `GameScene.js` | Depleted node floating text rendering, gold rate tracking, zone transition detection |
| `SettingsPanel.js` | Minimap visibility toggle |
| `SaveSystem.js` | Persist minimap preference, bump schema version |
| `config/constants.js` | Zone display names, gold tracking window duration |

---

## Sound & Juice

No new sound effects in this pass. Existing sounds cover all actions (sell, equip, cook).

**New visual juice:**

| Effect | Location | Spec |
|---|---|---|
| Stat delta flash | Gear tooltip | Green/red numbers briefly scale to 120% then settle on appear |
| Sort ripple | Inventory grid | Items briefly flash in sequence (top-left to bottom-right, 30ms stagger) when sort is applied |
| Zone name entrance | Zone transition | Decorative dashes slide in from edges, text fades in from center |
| Timer pulse | Farm/mine countdowns | Text scales 1.0→1.1→1.0 when ≤10 seconds remain |
| Gold rate flash | HUD gold rate | Number briefly turns white when rate increases, briefly turns #FF6B6B when rate decreases |

---

## What NOT to Build

- **No inventory expansion / slots system.** Inventory remains unlimited stacking for non-gear items.
- **No gear locking / favorites.** Protect-from-sell is a future feature, not this pass.
- **No full-screen map.** The minimap is the only map feature in this pass.
- **No minimap tap-to-navigate.** Too small for reliable mobile touch targets.
- **No auto-sell rules.** Sell-all is manual per category, not an automated filter.
- **No recipe pinning or crafting queue.** Cook Max is the only cooking improvement.
- **No item tooltip for non-gear items.** Materials, seeds, and food show name + quantity only (no expanded tooltip). Gear is the priority because it has stat complexity.
- **No new settings beyond minimap toggle.** Sort preference is session-only.
- **No drag-and-drop inventory management.** Mobile tap-based interaction only.

---

## Performance Notes

- **Minimap:** RenderTexture redraws every 2 seconds, not every frame. Player/agent dots update position every frame but are simple rectangle draws (negligible cost). Total draw calls for minimap: ~60 filled rectangles per refresh.
- **Zone transition check:** Runs on player position update which already fires. Single tile lookup per frame — zero additional cost.
- **Gold rate tracking:** Rolling window array is capped at ~18 entries max (one per 10s over 3 min). Filter operation is trivial.
- **Farm timers:** Update once per second via a `scene.time.addEvent` loop, not per-frame. 9 plots max = 9 text updates/second.
- **Mining respawn text:** Only rendered for nodes within 5-tile radius. Worst case is 3-4 nodes. Updated once per second.

---

## Success Criteria

1. Tapping gear in inventory shows comparison tooltip with stat deltas vs currently equipped piece
2. Stat deltas show correct green ▲ / red ▼ / gray — coloring and symbols
3. Power score delta is shown and correctly calculated
4. "Equip" button in tooltip equips gear immediately
5. "Sell" button in tooltip sells gear and shows correct gold amount
6. Tooltip shows "No gear equipped" when slot is empty, with all-positive deltas
7. Tooltip dismisses on tap-outside or ✕ button
8. "Sell All Materials" button appears on Materials tab with confirmation dialog showing total gold
9. "Sell All ≤ Uncommon" button on Gear tab sells Common and Uncommon gear with confirmation
10. "Sell All Food" button on Food tab with confirmation dialog
11. Sort button (↕) sorts current tab by specified primary/secondary criteria
12. Sort is visual-only (session state, not persisted)
13. Minimap renders in top-right corner showing all 5 zones in correct colors
14. Player appears as white pulsing dot on minimap at correct position
15. Agent appears as cyan pulsing dot on minimap at correct position
16. World Boss appears as magenta dot on minimap only when boss is active
17. Active fishing/mining spots shown on minimap when those activities are running
18. Minimap is hidden when full-screen panels are open
19. Minimap visibility toggle works in Settings and persists across sessions
20. Zone transition text appears centered with correct display name when crossing zone boundaries
21. Zone transition has 5-second cooldown to prevent border flicker
22. Zone transitions fire during agent spectate mode (camera following agent)
23. Farm plots show countdown timers in `Xm Ys` format, updating every second
24. Farm timer text turns green and pulses when ≤10 seconds remain
25. Depleted mining nodes show floating respawn countdown within 5-tile range
26. Cook Max button shows correct batch count based on current ingredients
27. Cook Max cooks entire batch in one action, granting correct total XP
28. Cook Max button is grayed out when ingredients are insufficient
29. Gold rate indicator shows rolling 3-minute average in `+Xg/min` format
30. Gold rate updates every 10 seconds and resets on fresh game load
