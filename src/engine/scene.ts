import * as PIXI from "pixi.js";
import { Game } from "./game";
import { Actor } from "./actor";
import { Input } from "./input";

export class Scene {
  public displayObject: PIXI.Container;
  protected actors: Actor[] = [];

  constructor(protected game: Game) {
    this.displayObject = new PIXI.Container();
  }

  update(input: Input | null) {
    this.actors.forEach((actor) => {
      actor.update(input);
    });
  }

  addActor(actor: Actor) {
    this.actors.push(actor);
    this.displayObject.addChild(actor.displayObject);
  }

  removeActor(actor: Actor) {
    const index = this.actors.indexOf(actor);
    if (index !== -1) {
      this.actors.splice(index, 1);
      this.displayObject.removeChild(actor.displayObject);
      actor.destroy();
    }
  }

  destroy() {
    [...this.actors].forEach((actor) => this.removeActor(actor));
    this.displayObject.destroy();
  }
}
