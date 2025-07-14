import * as PIXI from "pixi.js";
import { Scene } from "./scene";
import { Input } from "./input";
import { Point2D } from "./types";

export class Actor {
  public displayObject: PIXI.Container;

  constructor() {
    this.displayObject = new PIXI.Container();
  }

  addTo(scene: Scene) {
    scene.addActor(this);
    return this;
  }

  update(input: Input | null) {}

  destroy() {
    this.displayObject.destroy({ children: true });
  }
}

export class ParticleActor extends Actor {
  public displayObject: PIXI.ParticleContainer;
  constructor(options?: PIXI.ParticleContainerOptions) {
    super();
    this.displayObject = new PIXI.ParticleContainer(options);
  }
}

export abstract class PhysicsActor extends Actor {
  protected x: number = 0;
  protected y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  
  update(input: Input | null) {
    super.update(input);
    this.x += this.vx;
    this.y += this.vy;
    this.updateDisplayPosition();
  }
  
  protected abstract updateDisplayPosition(): void;
  
  getPosition(): Point2D {
    return { x: this.x, y: this.y };
  }
}