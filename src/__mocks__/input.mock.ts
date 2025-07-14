import { Point2D } from "../engine";

// 入力イベントの型定義
export interface KeyEvent {
  frame: number;
  key: string;
  action: "press" | "release";
}

export interface MouseEvent {
  frame: number;
  x: number;
  y: number;
  action: "press" | "release" | "move";
}

export interface InputEvent {
  frame: number;
  type: "key" | "mouse";
  data: any;
}

export class MockInput {
  private keyStates: Map<string, number> = new Map();
  private mouseState: number = 0;
  private mousePosition: Point2D = { x: 0, y: 0 };
  private frame: number = 0;

  // フレームベースの入力スケジュール
  private keySchedule: Map<number, KeyEvent[]> = new Map();
  private mouseSchedule: Map<number, MouseEvent[]> = new Map();

  // 現在押されているキー（スケジュール処理用）
  private pressedKeys: Set<string> = new Set();
  private mousePressed: boolean = false;

  constructor(events?: InputEvent[]) {
    if (events) {
      this.scheduleEvents(events);
    }
  }

  private scheduleEvents(events: InputEvent[]): void {
    for (const event of events) {
      if (event.type === "key") {
        const keyEvents = this.keySchedule.get(event.frame) || [];
        keyEvents.push(event.data as KeyEvent);
        this.keySchedule.set(event.frame, keyEvents);
      } else if (event.type === "mouse") {
        const mouseEvents = this.mouseSchedule.get(event.frame) || [];
        mouseEvents.push(event.data as MouseEvent);
        this.mouseSchedule.set(event.frame, mouseEvents);
      }
    }
  }

  update(): void {
    // 現在のフレームのスケジュールされたイベントを処理
    this.processScheduledEvents();

    // キーボードの状態を更新（実装と同じロジック）
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

    // フレームカウンタを進める
    this.frame++;
  }

  private processScheduledEvents(): void {
    // キーイベントの処理
    const keyEvents = this.keySchedule.get(this.frame);
    if (keyEvents) {
      for (const event of keyEvents) {
        if (event.action === "press") {
          this.pressedKeys.add(event.key);
        } else if (event.action === "release") {
          this.pressedKeys.delete(event.key);
        }
      }
    }

    // マウスイベントの処理
    const mouseEvents = this.mouseSchedule.get(this.frame);
    if (mouseEvents) {
      for (const event of mouseEvents) {
        if (event.action === "press") {
          this.mousePressed = true;
          this.mousePosition = { x: event.x, y: event.y };
        } else if (event.action === "release") {
          this.mousePressed = false;
          this.mousePosition = { x: event.x, y: event.y };
        } else if (event.action === "move") {
          this.mousePosition = { x: event.x, y: event.y };
        }
      }
    }
  }

  // 即座に状態を変更するシミュレーションメソッド
  simulateKeyPress(key: string): void {
    this.pressedKeys.add(key);
    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, 0);
    }
  }

  simulateKeyRelease(key: string): void {
    this.pressedKeys.delete(key);
    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, 0);
    }
  }

  simulateMouseClick(x: number, y: number): void {
    this.mousePressed = true;
    this.mousePosition = { x, y };
  }

  simulateMouseRelease(x: number, y: number): void {
    this.mousePressed = false;
    this.mousePosition = { x, y };
  }

  setMousePosition(x: number, y: number): void {
    this.mousePosition = { x, y };
  }

  // スケジューリングメソッド
  scheduleKeyPress(frame: number, key: string): void {
    const events = this.keySchedule.get(frame) || [];
    events.push({ frame, key, action: "press" });
    this.keySchedule.set(frame, events);
  }

  scheduleKeyRelease(frame: number, key: string): void {
    const events = this.keySchedule.get(frame) || [];
    events.push({ frame, key, action: "release" });
    this.keySchedule.set(frame, events);
  }

  scheduleMouseEvent(frame: number, event: MouseEvent): void {
    const events = this.mouseSchedule.get(frame) || [];
    events.push(event);
    this.mouseSchedule.set(frame, events);
  }

  // 状態取得メソッド（実装と同じインターフェース）
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

  // テスト用メソッド
  getCurrentFrame(): number {
    return this.frame;
  }

  resetMockState(): void {
    this.keyStates.clear();
    this.mouseState = 0;
    this.mousePosition = { x: 0, y: 0 };
    this.frame = 0;
    this.pressedKeys.clear();
    this.mousePressed = false;
    this.keySchedule.clear();
    this.mouseSchedule.clear();
  }

  // デバッグ用メソッド
  getDebugState(): any {
    return {
      frame: this.frame,
      keyStates: Object.fromEntries(this.keyStates),
      mouseState: this.mouseState,
      mousePosition: this.mousePosition,
      pressedKeys: Array.from(this.pressedKeys),
      mousePressed: this.mousePressed,
    };
  }
}