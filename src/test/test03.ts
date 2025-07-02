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

    new Particles().addTo(this);
  }
}

class Particles extends Actor {
  private points: { graphic: PIXI.Graphics; vx: number; vy: number }[];
  private line: PIXI.Graphics;
  constructor() {
    super();

    this.points = new Array(300).fill(0).map(() => {
      const graphic = new PIXI.Graphics()
        .setFillStyle({ color: 0x000000 })
        .circle(0, 0, 2)
        .fill();
      graphic.x = Math.random() * WIDTH;
      graphic.y = Math.random() * HEIGHT;
      this.displayObject.addChild(graphic);
      return {
        graphic,
        vx: 0,
        vy: 0,
      };
    });
    this.line = new PIXI.Graphics().setStrokeStyle({
      width: 1,
      color: 0xffffff,
    });
    this.displayObject.addChild(this.line);
  }

  update() {
    const nearestPoints = [{ original: { x: 0, y: 0 }, other: { x: 0, y: 0 } }];
    for (const point of this.points) {
      const velocity = 0.05;
      point.vx += (Math.random() - 0.5) * velocity;
      point.vy += (Math.random() - 0.5) * velocity;
      point.vx *= 0.99; // 摩擦
      point.vy *= 0.99; // 摩擦
      point.graphic.x += point.vx;
      point.graphic.y += point.vy;

      // 画面外に出たら反対側に戻す
      if (point.graphic.x < 0) {
        point.graphic.x += WIDTH;
      } else if (point.graphic.x > WIDTH) {
        point.graphic.x -= WIDTH;
      }
      if (point.graphic.y < 0) {
        point.graphic.y += HEIGHT;
      } else if (point.graphic.y > HEIGHT) {
        point.graphic.y -= HEIGHT;
      }

      let minDist = Infinity;
      let nearestPoint = { x: 0, y: 0 };
      for (const other of this.points) {
        if (point === other) continue;
        const dx = point.graphic.x - other.graphic.x;
        const dy = point.graphic.y - other.graphic.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestPoint = { x: other.graphic.x, y: other.graphic.y };
        }
      }
      nearestPoints.push({
        original: { x: point.graphic.x, y: point.graphic.y },
        other: nearestPoint,
      });
    }
    this.line.clear();
    for (const pair of nearestPoints) {
      this.line
        .moveTo(pair.original.x, pair.original.y)
        .lineTo(pair.other.x, pair.other.y);
    }
    this.line.stroke();
  }
}
