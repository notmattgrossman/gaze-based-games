import Phaser from 'phaser';
import { Ring } from '../objects/Ring';

type ExpireHandler = (ring: Ring) => void;

export class RingSpawner {
  private scene: Phaser.Scene;
  private group: Phaser.GameObjects.Group;
  private timer?: Phaser.Time.TimerEvent;
  private spawnIntervalMs = 1400;
  private minIntervalMs = 650;
  private baseRadius3D = 64;
  private minBaseRadius3D = 28;
  private expireHandler: ExpireHandler;
  private ringLifetimeMs = 4200;

  // drifting path center (screen space)
  private anchor = { x: 0, y: 0 };
  private requiredTargets: Array<{ x: number; y: number }> = [];
  private cycleQueue: Array<{ x: number; y: number }> = [];
  private lastTarget?: { x: number; y: number };

  constructor(scene: Phaser.Scene, onExpire: ExpireHandler) {
    this.scene = scene;
    this.group = (scene as any).rings as Phaser.GameObjects.Group; // provided by GameScene
    this.expireHandler = onExpire;
    this.anchor.x = this.scene.scale.width / 2;
    this.anchor.y = this.scene.scale.height / 2;
  }

  start(): void {
    // Start path drift by periodically tweening the anchor to new targets
    this.scheduleAnchorDrift();

    this.timer = this.scene.time.addEvent({
      delay: this.spawnIntervalMs,
      loop: true,
      callback: () => {
        this.spawnOne();
        this.rampDifficulty();
      }
    });
  }

  stop(): void {
    this.timer?.remove(false);
    this.timer = undefined;
  }

  private scheduleAnchorDrift(): void {
    if (this.requiredTargets.length === 0) {
      this.buildRequiredTargets();
    }
    if (this.cycleQueue.length === 0) {
      this.buildCycleQueue();
    }

    const target = this.cycleQueue.shift()!;
    this.lastTarget = target;

    const duration = Phaser.Math.Between(6000, 8000);
    this.scene.tweens.add({
      targets: this.anchor,
      x: target.x,
      y: target.y,
      ease: 'sine.inOut',
      duration,
      onComplete: () => this.scheduleAnchorDrift()
    });
  }

  private buildRequiredTargets(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const m = 80; // margin from edges
    this.requiredTargets = [
      { x: m,     y: m },       // top-left
      { x: w - m, y: m },       // top-right
      { x: w - m, y: h - m },   // bottom-right
      { x: m,     y: h - m },   // bottom-left
      { x: w / 2, y: h / 2 }    // center
    ];
  }

  private buildCycleQueue(): void {
    // Shuffle required targets to create a non-circular order, avoiding immediate repeats
    const shuffled = this.shuffle(this.requiredTargets.slice());
    if (this.lastTarget && shuffled.length > 1 && shuffled[0].x === this.lastTarget.x && shuffled[0].y === this.lastTarget.y) {
      // rotate so we don't target the same point twice
      const first = shuffled.shift()!;
      shuffled.push(first);
    }
    this.cycleQueue = shuffled;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private spawnOne(): void {
    // Slight wobble inside the tube
    const wobble = 6;
    const x3d = Phaser.Math.Between(-wobble, wobble);
    const y3d = Phaser.Math.Between(-wobble, wobble);

    const ring = new Ring(this.scene, {
      mode: 'perspective',
      centerX: this.anchor.x,
      centerY: this.anchor.y,
      x3d,
      y3d,
      baseRadius3D: this.baseRadius3D,
      zStart: 1400,
      zEnd: 140,
      focal: 340,
      lifetimeMs: this.ringLifetimeMs
    });
    ring.once('expired', () => this.expireHandler(ring));
    (this.group as any).add(ring);
  }

  private rampDifficulty(): void {
    this.spawnIntervalMs = Math.max(this.minIntervalMs, Math.floor(this.spawnIntervalMs * 0.985));
    this.baseRadius3D = Math.max(this.minBaseRadius3D, Math.floor(this.baseRadius3D * 0.995));
    if (this.timer) {
      this.timer.remove(false);
      this.timer = this.scene.time.addEvent({
        delay: this.spawnIntervalMs,
        loop: true,
        callback: () => {
          this.spawnOne();
          this.rampDifficulty();
        }
      });
    }
  }
}


