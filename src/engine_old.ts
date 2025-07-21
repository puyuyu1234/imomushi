import * as PIXI from "pixi.js";

/**
 * ⚠️ 【重要】このファイルは使用しないでください ⚠️
 * 
 * このファイル（engine_old.ts）は互換性のためのみ保持されています。
 * 新規開発では必ず engine/ ディレクトリ配下のファイル群を使用してください。
 * 
 * 正しいインポート方法:
 * import { Game, Scene, Actor } from "./engine";
 * 
 * 詳細は CLAUDE.md の開発ガイドライン を参照してください。
 */

// 共通型定義
export type Point2D = { x: number; y: number };
export type Velocity2D = { vx: number; vy: number };
export type Rectangle = { x: number; y: number; width: number; height: number };
export type Size2D = { width: number; height: number };

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

// ヘルパー関数
export function createText(
  text: string,
  fontSize: number,
  color: number,
  x: number,
  y: number
): PIXI.Text {
  const textObject = new PIXI.Text({
    text,
    style: {
      fontFamily: "MS Gothic",
      fontSize,
      fill: color,
    },
  });
  textObject.x = x;
  textObject.y = y;
  return textObject;
}

export function createRect(
  width: number,
  height: number,
  color: number,
  x: number = 0,
  y: number = 0,
  stroke?: { width: number; color: number }
): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, width, height);
  graphics.fill(color);
  if (stroke) {
    graphics.stroke(stroke);
  }
  graphics.x = x;
  graphics.y = y;
  return graphics;
}

/**
 * Inputクラス仕様:
 * - クリックやキー入力の状態を管理
 * - 各キーの状態は数値で表現される
 *   - 0: ゲーム開始時から一度も押されていない
 *   - 正の値: 押されている（1=押した瞬間、2以上=押し続けている）
 *   - 負の値: 離されている（-1=離した瞬間、-2以下=離し続けている）
 * - updateメソッドで毎フレーム状態を更新
 *   - 押下中: 値を+1（最小1）
 *   - 押上中: 値を-1（最大-1）
 * 
 * 使用例:
 * - キーを押した瞬間: keyState === 1
 * - キーを離した瞬間: keyState === -1
 * - 10フレーム長押し: keyState === 10
 * - 離してから10フレーム: keyState === -10
 */
export class Input {
  private keyStates: Map<string, number> = new Map();
  private mouseState: number = 0;
  private mousePosition: Point2D = { x: 0, y: 0 };
  private pressedKeys: Set<string> = new Set();
  private mousePressed: boolean = false;

  constructor(private target: HTMLCanvasElement) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // キーボードイベント
    this.target.addEventListener('keydown', (e) => {
      e.preventDefault();
      this.pressedKeys.add(e.code);
    });

    this.target.addEventListener('keyup', (e) => {
      e.preventDefault();
      this.pressedKeys.delete(e.code);
    });

    // ポインターイベント（マウス・タッチ・ペンを統合）
    this.target.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.mousePressed = true;
      this.updatePointerPosition(e);
    });

    this.target.addEventListener('pointerup', (e) => {
      e.preventDefault();
      this.mousePressed = false;
      this.updatePointerPosition(e);
    });

    this.target.addEventListener('pointermove', (e) => {
      this.updatePointerPosition(e);
    });

    // ポインターキャプチャを解放（ブラウザ外でのpointerupを確実に検知）
    this.target.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      this.mousePressed = false;
    });

    // マウスがcanvasの外に出た時の処理
    this.target.addEventListener('pointerleave', (e) => {
      e.preventDefault();
      this.mousePressed = false;
    });
  }

  private updatePointerPosition(e: PointerEvent) {
    const rect = this.target.getBoundingClientRect();
    // CSS変形を考慮した座標計算
    const scaleX = this.target.width / rect.width;
    const scaleY = this.target.height / rect.height;
    
    this.mousePosition = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  update() {
    // キーボードの状態を更新
    for (const [key, state] of this.keyStates) {
      if (this.pressedKeys.has(key)) {
        // 押下中: 正の値を増やす（最小1）
        this.keyStates.set(key, state <= 0 ? 1 : state + 1);
      } else {
        // 押上中: 負の値を減らす（最大-1）
        this.keyStates.set(key, state >= 0 ? -1 : state - 1);
      }
    }

    // 新しく押されたキーを追加
    for (const key of this.pressedKeys) {
      if (!this.keyStates.has(key)) {
        this.keyStates.set(key, 1);
      }
    }

    // マウスの状態を更新
    if (this.mousePressed) {
      this.mouseState = this.mouseState <= 0 ? 1 : this.mouseState + 1;
    } else {
      this.mouseState = this.mouseState >= 0 ? -1 : this.mouseState - 1;
    }
  }

  getKeyState(key: string): number {
    return this.keyStates.get(key) || 0;
  }

  getMouseState(): number {
    return this.mouseState;
  }

  getMousePosition(): Point2D {
    return { ...this.mousePosition };
  }

  isKeyPressed(key: string): boolean {
    return this.getKeyState(key) > 0;
  }

  isKeyJustPressed(key: string): boolean {
    return this.getKeyState(key) === 1;
  }

  isKeyJustReleased(key: string): boolean {
    return this.getKeyState(key) === -1;
  }

  isMousePressed(): boolean {
    return this.mouseState > 0;
  }

  isMouseJustPressed(): boolean {
    return this.mouseState === 1;
  }

  isMouseJustReleased(): boolean {
    return this.mouseState === -1;
  }
}
