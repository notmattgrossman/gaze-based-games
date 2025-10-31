import Phaser from 'phaser';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.scoreText = scene.add.text(12, 8, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setDepth(1000).setScrollFactor(0);
  }

  updateScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);
    this.scene.tweens.add({ targets: this.scoreText, scale: 1.1, yoyo: true, duration: 100 });
  }

  showGameOver(score: number): void {
    this.gameOverText?.destroy();
    const msg = `Game Over\nScore: ${score}\nClick or Press Any Key to Restart`;
    this.gameOverText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2, msg, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffd34d',
      align: 'center'
    }).setOrigin(0.5).setDepth(2000);
  }
}


