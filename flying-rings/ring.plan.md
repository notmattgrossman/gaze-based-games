<!-- 5249fb27-fa06-4302-97e2-883ec0473a40 9bc30965-80e2-46b9-a25c-d7278f487e9c -->
# 2D Ring-Passing Game (Phaser + TypeScript) — Pointer Controls

### Tech + Goals

- Phaser 3 + TypeScript, built with Vite, browser-playable.
- Minimal visuals (Phaser Graphics): player dot, ring outlines, basic UI text.
- Core loop: hover to steer → pass through rings → score → difficulty ramps.
- Reference: [TV Tropes: Pass Through the Rings](https://tvtropes.org/pmwiki/pmwiki.php/VideoExamples/PassThroughTheRings)

### Project Structure

- `package.json` (deps: `phaser`, `vite`, `typescript`, `ts-node`, `@types/node`)
- `tsconfig.json`
- `index.html`
- `vite.config.ts`
- `src/main.ts` (Phaser bootstrap)
- `src/scenes/GameScene.ts` (gameplay)
- `src/objects/Player.ts`
- `src/objects/Ring.ts`
- `src/systems/RingSpawner.ts`
- `src/ui/HUD.ts`
- `public/` (optional assets)

### Core Mechanics (Updated)

- **Pointer-Follow Movement**: Player seeks the pointer position.
  - Computes vector to `pointer.worldX/Y`, applies acceleration towards it.
  - Deadzone radius (e.g., 8–16 px) to prevent jitter near the target.
  - Drag/friction and max speed clamp to keep motion controllable.
  - Screen-bounded playfield (no camera follow).
- **Optional Click Interaction**:
  - Dash/boost towards pointer while mouse/touch is down; short cooldown.
  - Alternative: single-click burst (tap-friendly) if continuous hold isn’t desired.
- **Rings**: Drawn via `Graphics`; overlap via Arcade Physics circle sensor.
- **Scoring**: +1 per ring; brief pulse/flash feedback.
- **Difficulty**: spawn interval decreases; ring radius shrinks; occasional moving rings.
- **Fail/Retry**: Miss threshold or timer; press/click to restart.

### Implementation Steps (Revised)

1) Bootstrap Vite + TS + Phaser; start `GameScene` with 800×600 playfield.

2) Implement `Player` pointer-follow seek: target from `pointermove`, acceleration/drag/max speed, deadzone, bounds clamp.

3) Implement `Ring` as `Graphics` ring with Arcade sensor body; `collect()` to mark and destroy.

4) Implement `RingSpawner` timed spawns with random on-screen positions (avoid HUD margins).

5) Overlap handling in `GameScene`: on player overlap → increment score, destroy ring, play feedback.

6) `HUD`: score text and optional dash-cooldown indicator.

7) Difficulty ramp: adjust spawnRate and ringRadius every N seconds.

8) Game over: miss limit or countdown ends; restart on key or click/tap.

9) Optional: level JSON for pre-seeded waves; default to procedural.

### Essential Code Skeletons

- Phaser bootstrap (`src/main.ts`):
```ts
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0d0f1a',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [GameScene]
});
```

- Pointer target + seek (inside `GameScene` and `Player`):
```ts
// GameScene create()
this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
  this.player.setTarget(p.worldX, p.worldY);
});
this.input.on('pointerdown', () => this.player.tryDash()); // optional

// Player.update(dt)
const to = Phaser.Math.Vector2.subtract(this.target, this.body.position);
const distance = to.length();
if (distance > this.deadzone) {
  to.normalize().scale(this.accel * dt);
  this.body.velocity.add(to).limit(this.maxSpeed);
} else {
  // gentle brake near target
  this.body.velocity.scale(0.95);
}
// clamp to bounds
this.x = Phaser.Math.Clamp(this.x, 8, this.scene.scale.width - 8);
this.y = Phaser.Math.Clamp(this.y, 8, this.scene.scale.height - 8);
```


### Run Commands

- Dev server:
```bash
npm run dev
```

- Build / Preview:
```bash
npm run build && npm run preview
```


### Acceptance Criteria (Updated)

- Player follows mouse/touch hover smoothly without keyboard.
- Optional click/touch dash gives a short controlled speed burst with cooldown.
- Rings spawn; passing through increases score with clear feedback.
- UI shows score (and dash readiness if enabled).
- Difficulty ramps over time; game can be restarted after fail.

### To-dos

- [ ] Initialize Vite + TS project and add Phaser dependency
- [ ] Create Phaser config and bootstrap GameScene in src/main.ts
- [ ] Implement Player with Arcade physics, input, drag, clamp speed
- [ ] Create Ring graphics + Arcade sensor body and collect() behavior
- [ ] Add RingSpawner timed spawns with on-screen random positions
- [ ] Wire overlap to increment score, destroy ring, play flash
- [ ] Add HUD to display score and subtle feedback
- [ ] Ramp difficulty over time: spawn rate up, ring size down
- [ ] Add miss threshold/timer, display game-over, restart flow
- [ ] Optional: JSON level/wave config and parser fallback to procedural
- [ ] Add brief effects: ring pulse, screen flash on collect
- [ ] Build production bundle and preview locally