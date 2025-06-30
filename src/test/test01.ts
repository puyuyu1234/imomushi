import { Actor, Game, Scene } from "../engine";
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
  constructor(game: Game) {
    super(game);
    const circle = new Circle(WIDTH / 2, HEIGHT / 2, 80).addTo(this);
  }
}

class Circle extends Actor {
  private time: number = 0;
  private point;
  private line: PIXI.Graphics;
  constructor(x, y, public r: number) {
    super();

    this.line = new PIXI.Graphics().setStrokeStyle({
      width: 1,
      color: 0xffffff,
    });
    this.displayObject.addChild(this.line);

    const circle = new PIXI.Graphics()
      .setStrokeStyle({
        width: 1,
        color: 0x000000,
      })
      .circle(0, 0, r)
      .stroke();

    this.displayObject.addChild(circle);
    this.displayObject.x = x;
    this.displayObject.y = y;

    const a = new PIXI.Graphics()
      .setFillStyle({ color: 0x0000ff })
      .circle(0, 0, 2)
      .fill();
    a.position.set(0, -r);
    this.displayObject.addChild(a);

    this.point = new Array(16).fill(0).map((_, i) => {
      const p = new PIXI.Graphics()
        .setFillStyle({ color: i * 0x001100 + 0xff00ff - i * 0x000011 })
        .circle(0, 0, 2)
        .fill();
      this.displayObject.addChild(p);
      return p;
    });
  }

  update() {
    this.time++;
    const angle = (0.1 * this.time) % 360;
    for (let i = 0; i < this.point.length; i++) {
      const p = this.angleToPoint((angle * (i + 1)) % 360);
      this.point[i].x = p.x;
      this.point[i].y = p.y;
    }

    let startPoint = this.angleToPoint(0);
    const angleDelta = angle;
    let nextAngle = angleDelta;
    let nextPoint = this.angleToPoint(nextAngle);
    this.line.clear().moveTo(startPoint.x, startPoint.y);
    let count = 0;
    while (
      angleDelta &&
      (startPoint.x !== nextPoint.x || startPoint.y !== nextPoint.y)
    ) {
      this.line.lineTo(nextPoint.x, nextPoint.y);
      nextAngle += angleDelta;
      nextPoint = this.angleToPoint(nextAngle);
      if (count++ > this.point.length - 2) {
        break;
      }
    }
    this.line.stroke();
  }

  angleToPoint(angle: number) {
    const radians = (angle * Math.PI) / 180;
    return {
      x: this.r * Math.sin(radians),
      y: -this.r * Math.cos(radians),
    };
  }
}
