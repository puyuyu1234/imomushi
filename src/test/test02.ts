import { Actor, Game, ParticleActor, Scene } from "../engine";
import * as PIXI from "pixi.js";

const WIDTH = 320;
const HEIGHT = 240;
const game = new Game();
game
  .init({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0xaaaaaa,
  })
  .then(() => {
    game.changeScene(new MainScene(game));
  });

class MainScene extends Scene {
  public clickPos: { x: number; y: number } | null = null;

  constructor(game: Game) {
    super(game);

    // クリックイベントをMainSceneで管理
    this.setupClickEvents();

    new Particles(this).addTo(this);
  }

  private setupClickEvents() {
    console.log("Setting up click event listener in MainScene");

    // アプリ全体でイベントを有効化
    game.app.stage.eventMode = "static";
    game.app.stage.hitArea = game.app.screen;

    // PIXIイベント
    game.app.stage.on("pointerdown", (event) => {
      console.log("pointerdown detected at:", event.global.x, event.global.y);
      this.clickPos = {
        x: event.global.x,
        y: event.global.y,
      };
    });
  }
}
class Particles extends ParticleActor {
  private particles: Array<{
    sprite: PIXI.Particle;
    vx: number;
    vy: number;
  }> = [];
  private scene: MainScene;

  constructor(scene: MainScene) {
    super({
      dynamicProperties: {
        position: true,
        color: true,
      },
    });

    this.scene = scene;

    const dot = new PIXI.Graphics().circle(0, 0, 1).fill(0xffffff);
    const texture = game.app.renderer.generateTexture({
      target: dot,
    });

    for (let i = 0; i < 10000; i++) {
      const particle = new PIXI.Particle({
        texture: texture,
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        tint: Math.random() * 0xffffff,
      });

      this.particles.push({
        sprite: particle,
        vx: 0,
        vy: 0,
      });

      this.displayObject.addParticle(particle);
    }
  }

  update() {
    // クリック時の力の適用
    if (this.scene.clickPos) {
      console.log(
        "Applying force from click at:",
        this.scene.clickPos.x,
        this.scene.clickPos.y
      );
      this.particles.forEach((p) => {
        const dx = p.sprite.x - this.scene.clickPos!.x;
        const dy = p.sprite.y - this.scene.clickPos!.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const force = 50 / (distance + 1); // 距離に応じた力
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
        }
      });
      this.scene.clickPos = null; // クリック処理完了
    }

    // パーティクルの移動と減衰
    this.particles.forEach((p) => {
      p.sprite.x += p.vx;
      p.sprite.y += p.vy;

      // 摩擦による減衰
      p.vx *= 0.98;
      p.vy *= 0.98;

      // 画面境界での跳ね返り
      if (p.sprite.x < 0 || p.sprite.x > WIDTH) p.vx *= -0.8;
      if (p.sprite.y < 0 || p.sprite.y > HEIGHT) p.vy *= -0.8;

      // 境界内に収める
      p.sprite.x = Math.max(0, Math.min(WIDTH, p.sprite.x));
      p.sprite.y = Math.max(0, Math.min(HEIGHT, p.sprite.y));
    });
  }
}
