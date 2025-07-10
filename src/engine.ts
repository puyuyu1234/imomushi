import * as PIXI from "pixi.js";

export class Game {
  public app: PIXI.Application;
  private currentScene: Scene | null = null;
  private assets: Map<string, PIXI.Texture> = new Map();

  constructor() {
    this.app = new PIXI.Application();
  }

  async init(
    options: Partial<PIXI.ApplicationOptions> | undefined
  ): Promise<void> {
    await this.app.init(options);
    this.app.ticker.add(this.update.bind(this));
    const canvasContainer = document.getElementById("canvasContainer");
    if (!canvasContainer) {
      throw new Error("Canvas container not found");
    }
    canvasContainer.appendChild(this.app.canvas);
  }

  async loadAsset(key: string, path: string): Promise<PIXI.Texture> {
    if (this.assets.has(key)) {
      return this.assets.get(key)!;
    }
    
    const texture = await PIXI.Assets.load(path);
    this.assets.set(key, texture);
    return texture;
  }

  getAsset(key: string): PIXI.Texture | undefined {
    return this.assets.get(key);
  }

  changeScene(newScene: Scene) {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.app.stage.removeChild(this.currentScene.displayObject);
    }
    this.currentScene = newScene;
    this.app.stage.addChild(this.currentScene.displayObject);
  }

  update() {
    if (this.currentScene) {
      this.currentScene.update();
    }
  }
}

export class Scene {
  public displayObject: PIXI.Container;
  protected actors: Actor[] = [];

  constructor(protected game: Game) {
    this.displayObject = new PIXI.Container();
  }

  update() {
    this.actors.forEach((actor) => {
      actor.update();
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
    this.actors.forEach((actor) => this.removeActor(actor));
    this.displayObject.destroy();
  }
}

export class Actor {
  public displayObject: PIXI.Container;

  constructor() {
    this.displayObject = new PIXI.Container();
  }

  addTo(scene: Scene) {
    scene.addActor(this);
    return this;
  }

  update() {}

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
