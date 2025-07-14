import { Scene, Point2D, Size2D } from "../engine";
import { MockInput } from "./input.mock";

export class MockGame {
  public app: any;
  public input: MockInput | null = null;
  private currentScene: Scene | null = null;
  private assets: Map<string, any> = new Map();
  
  // テスト用プロパティ
  private updateCallCount: number = 0;
  private currentSceneName: string = "";
  private loadAssetCalls: Map<string, number> = new Map();

  constructor() {
    // PIXIを使わないダミー実装
    this.app = {
      stage: {
        addChild: jest.fn(),
        removeChild: jest.fn(),
      },
      ticker: {
        add: jest.fn(),
      },
      canvas: {
        width: 800,
        height: 600,
      },
    };
  }

  async init(options?: any): Promise<void> {
    // DOM操作を行わず、即座に解決
    this.input = new MockInput();
    return Promise.resolve();
  }

  async loadAsset(key: string, path: string): Promise<any> {
    // 呼び出し回数を記録
    const callCount = this.loadAssetCalls.get(key) || 0;
    this.loadAssetCalls.set(key, callCount + 1);

    // ダミーのTextureオブジェクトを返す
    const dummyTexture = {
      key,
      path,
      width: 32,
      height: 32,
      baseTexture: {
        valid: true,
      },
    };
    
    this.assets.set(key, dummyTexture);
    return Promise.resolve(dummyTexture);
  }

  getAsset(key: string): any | undefined {
    return this.assets.get(key);
  }

  changeScene(newScene: Scene): void {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.app.stage.removeChild(this.currentScene.displayObject);
    }
    
    this.currentScene = newScene;
    this.currentSceneName = newScene.constructor.name;
    this.app.stage.addChild(this.currentScene.displayObject);
  }

  update(): void {
    this.updateCallCount++;
    
    if (this.input) {
      this.input.update();
    }
    
    if (this.currentScene) {
      this.currentScene.update(this.input);
    }
  }

  // テスト用メソッド
  getUpdateCallCount(): number {
    return this.updateCallCount;
  }

  getCurrentSceneName(): string {
    return this.currentSceneName;
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  getLoadAssetCallCount(key: string): number {
    return this.loadAssetCalls.get(key) || 0;
  }

  resetMockState(): void {
    this.updateCallCount = 0;
    this.currentSceneName = "";
    this.loadAssetCalls.clear();
    this.assets.clear();
    
    if (this.input) {
      this.input.resetMockState();
    }
  }

  // Canvas関連のダミーメソッド
  getCanvasSize(): Size2D {
    return {
      width: this.app.canvas.width,
      height: this.app.canvas.height,
    };
  }

  setCanvasSize(width: number, height: number): void {
    this.app.canvas.width = width;
    this.app.canvas.height = height;
  }
}