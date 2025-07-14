import { Point2D } from "./types";

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