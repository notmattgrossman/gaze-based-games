import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Ring } from '../objects/Ring';
import { RingSpawner } from '../systems/RingSpawner';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private rings!: Phaser.GameObjects.Group;
  private spawner!: RingSpawner;
  private hud!: HUD;
  private score = 0;
  private misses = 0;
  private maxMisses = 3;
  private isGameOver = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    // no external assets; generate textures in create()
  }

  create(): void {
    this.score = 0;
    this.misses = 0;
    this.isGameOver = false;

    this.rings = this.add.group({ classType: Ring, runChildUpdate: true });

    this.player = new Player(this, this.scale.width / 2, this.scale.height / 2);

    // Pointer-driven target updates
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.player.setTarget(p.worldX, p.worldY);
    });
    this.input.on('pointerdown', () => this.player.tryDash());

    // Overlap: player with rings
    this.physics.add.overlap(this.player.bodyGameObject, this.rings, (_p, r) => {
      const ring = r as Ring;
      if (!ring.collected) {
        ring.collect();
        this.score += 1;
        this.hud.updateScore(this.score);
      }
    });

    this.hud = new HUD(this);
    this.hud.updateScore(this.score);

    // Spawner
    this.spawner = new RingSpawner(this, (ring: Ring) => this.onRingExpired(ring));
    this.spawner.start();
  }

  private onRingExpired(ring: Ring): void {
    const wasCollected = ring.collected;
    ring.destroy();
    if (!wasCollected) {
      this.misses += 1;
      if (this.misses >= this.maxMisses) {
        this.gameOver();
      }
    }
  }

  private gameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.spawner.stop();
    this.hud.showGameOver(this.score);

    this.input.once('pointerdown', () => this.scene.restart());
    this.input.keyboard?.once('keydown', () => this.scene.restart());
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return;
    this.player.update(delta / 1000);
  }
}


