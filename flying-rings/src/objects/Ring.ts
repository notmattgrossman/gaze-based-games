import Phaser from 'phaser';

type RingMode = 'flat' | 'perspective';

interface PerspectiveParams {
  mode: 'perspective';
  centerX: number;
  centerY: number;
  x3d: number; // lateral offset in 3D units
  y3d: number; // vertical offset in 3D units
  baseRadius3D?: number; // ring radius in 3D units
  zStart?: number; // far plane z
  zEnd?: number;   // near plane z
  focal?: number;  // focal length
  lifetimeMs?: number;
}

interface FlatParams {
  mode?: 'flat';
  x: number;
  y: number;
  radius?: number;
  lifetimeMs?: number;
}

type RingParams = PerspectiveParams | FlatParams;

export class Ring extends Phaser.GameObjects.Container {
  public collected = false;
  public radius: number;
  private graphics: Phaser.GameObjects.Graphics;
  private lifetimeMs: number;
  private bornAt: number;
  private mode: RingMode;

  // flat mode
  private startRadius = 0;
  private endRadius = 0;

  // perspective mode
  private cx = 0;
  private cy = 0;
  private x3d = 0;
  private y3d = 0;
  private baseRadius3D = 60;
  private zStart = 1400;
  private zEnd = 160;
  private focal = 340;

  constructor(scene: Phaser.Scene, params: RingParams) {
    super(scene, 0, 0);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.mode = params.mode === 'perspective' ? 'perspective' : 'flat';

    if (this.mode === 'perspective') {
      const p = params as PerspectiveParams;
      this.cx = p.centerX;
      this.cy = p.centerY;
      this.x3d = p.x3d;
      this.y3d = p.y3d;
      this.baseRadius3D = p.baseRadius3D ?? 60;
      this.zStart = p.zStart ?? 1400;
      this.zEnd = p.zEnd ?? 160;
      this.focal = p.focal ?? 340;
      this.lifetimeMs = p.lifetimeMs ?? 4000;
      this.bornAt = scene.time.now;
      this.radius = 1;
    } else {
      const p = params as FlatParams;
      const radius = p.radius ?? 40;
      this.lifetimeMs = p.lifetimeMs ?? 4000;
      this.bornAt = scene.time.now;
      this.startRadius = Math.max(10, Math.floor(radius * 0.55));
      this.endRadius = radius;
      this.radius = this.startRadius;
      this.setPosition(p.x, p.y);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.radius, -this.radius, -this.radius);
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.moves = false;
    body.setEnable(true);

    this.drawRing(3, 1);
  }

  private drawRing(thickness = 3, alpha = 1): void {
    const r = this.radius;
    this.graphics.clear();
    const color = this.collected ? 0x36d972 : 0xffd34d;
    this.graphics.lineStyle(thickness, color, alpha);
    this.graphics.strokeCircle(0, 0, r);
  }

  public collect(): void {
    if (this.collected) return;
    this.collected = true;
    // subtle pulse when collected; keep ring alive to finish its path
    this.scene.tweens.add({
      targets: this,
      scale: 1.08,
      yoyo: true,
      duration: 120,
      ease: 'quad.out'
    });
    // redraw immediately to reflect new color
    this.drawRing();
  }

  private flashThenDestroy(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 1.2,
      alpha: 0,
      duration: 160,
      ease: 'quad.out',
      onComplete: () => this.destroy()
    });
  }

  preUpdate(_time: number, _delta: number): void {
    const elapsed = this.scene.time.now - this.bornAt;
    const t = Phaser.Math.Clamp(elapsed / this.lifetimeMs, 0, 1);

    if (this.mode === 'perspective') {
      const z = Phaser.Math.Linear(this.zStart, this.zEnd, t);
      const scale = this.focal / Math.max(1, z);
      const sx = this.cx + this.x3d * scale;
      const sy = this.cy + this.y3d * scale;
      const newRadius = this.baseRadius3D * scale;
      const thickness = Phaser.Math.Linear(1.2, 4.2, t);
      const alpha = Phaser.Math.Linear(0.35, 1, t);

      this.radius = newRadius;
      this.setPosition(sx, sy);
      this.drawRing(thickness, alpha);

      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setCircle(this.radius, -this.radius, -this.radius);
    } else {
      const eased = Phaser.Math.Easing.Quadratic.Out(t);
      const newRadius = Phaser.Math.Linear(this.startRadius, this.endRadius, eased);
      if (Math.abs(newRadius - this.radius) >= 0.5) {
        this.radius = newRadius;
        this.drawRing(3, 1);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(this.radius, -this.radius, -this.radius);
      }
    }

    if (elapsed > this.lifetimeMs) this.emit('expired', this);
  }
}


