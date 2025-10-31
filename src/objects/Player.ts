import Phaser from 'phaser';

export class Player {
  private scene: Phaser.Scene;
  public bodyGameObject: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private target: Phaser.Math.Vector2;
  private readonly acceleration = 900; // px/s^2
  private readonly maxSpeed = 320; // px/s
  private readonly deadzone = 12; // px
  private readonly dashSpeed = 520; // px/s
  private readonly dashCooldownMs = 700; // ms
  private lastDashAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.ensurePlayerTexture();
    this.bodyGameObject = this.scene.physics.add.image(x, y, 'player-dot');
    this.bodyGameObject.setCircle(6, -6, -6); // 12px diameter
    this.bodyGameObject.setDrag(420, 420);
    this.bodyGameObject.setMaxVelocity(this.maxSpeed, this.maxSpeed);
    this.bodyGameObject.setCollideWorldBounds(true);
    this.bodyGameObject.setBounce(0, 0);
    this.bodyGameObject.setDepth(10);

    this.target = new Phaser.Math.Vector2(x, y);
  }

  private ensurePlayerTexture(): void {
    const key = 'player-dot';
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0x47d3ff, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture(key, 12, 12);
    g.destroy();
  }

  public setTarget(x: number, y: number): void {
    this.target.set(x, y);
  }

  public tryDash(): void {
    const now = this.scene.time.now;
    if (now - this.lastDashAt < this.dashCooldownMs) return;
    this.lastDashAt = now;

    const dir = new Phaser.Math.Vector2(this.target.x - this.bodyGameObject.x, this.target.y - this.bodyGameObject.y);
    if (dir.lengthSq() > 1) {
      dir.normalize().scale(this.dashSpeed);
      this.bodyGameObject.setVelocity(dir.x, dir.y);
    }
  }

  public update(dtSeconds: number): void {
    const pos = new Phaser.Math.Vector2(this.bodyGameObject.x, this.bodyGameObject.y);
    const to = this.target.clone().subtract(pos);
    const distance = to.length();
    if (distance > this.deadzone) {
      to.normalize().scale(this.acceleration * dtSeconds);
      this.bodyGameObject.body.velocity.add(to);
      const v = this.bodyGameObject.body.velocity;
      if (v.length() > this.maxSpeed) v.setLength(this.maxSpeed);
    } else {
      // gentle brake
      this.bodyGameObject.body.velocity.scale(0.95);
    }
  }
}


