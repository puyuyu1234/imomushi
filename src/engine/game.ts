import * as PIXI from "pixi.js";
import { Scene } from "./scene";
import { Input } from "./input";

export class Game {
  public app: PIXI.Application;
  public input: Input | null = null;
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
    
    // Input初期化
    this.input = new Input(this.app.canvas as HTMLCanvasElement);
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
    if (this.input) {
      this.input.update();
    }
    if (this.currentScene) {
      this.currentScene.update(this.input);
    }
  }
}