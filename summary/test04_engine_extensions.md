# engine.ts 拡張提案

## テキスト関連の拡張

### 1. 静的テキスト生成ヘルパー関数
シンプルなテキスト作成用のユーティリティ関数
```typescript
// engine.ts に追加
export function createText(options: {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: number;
  x?: number;
  y?: number;
  anchor?: { x: number; y: number };
}): PIXI.Text {
  const textObject = new PIXI.Text({
    text: options.text,
    style: {
      fontFamily: options.fontFamily || "Arial",
      fontSize: options.fontSize || 16,
      fill: options.fill || 0x000000,
    },
  });
  
  if (options.anchor) {
    textObject.anchor.set(options.anchor.x, options.anchor.y);
  }
  
  textObject.x = options.x || 0;
  textObject.y = options.y || 0;
  
  return textObject;
}
```

### 2. 動的テキスト用のActorクラス
アニメーションや更新が必要なテキスト用
```typescript
// engine.ts に追加
export class TextActor extends Actor {
  protected text: PIXI.Text;
  
  constructor(options: {
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: number;
    x?: number;
    y?: number;
  }) {
    super();
    
    this.text = new PIXI.Text({
      text: options.text,
      style: {
        fontFamily: options.fontFamily || "Arial",
        fontSize: options.fontSize || 16,
        fill: options.fill || 0x000000,
      },
    });
    
    this.displayObject.addChild(this.text);
    this.displayObject.x = options.x || 0;
    this.displayObject.y = options.y || 0;
  }
  
  setText(newText: string) {
    this.text.text = newText;
  }
  
  setStyle(style: Partial<PIXI.TextStyle>) {
    Object.assign(this.text.style, style);
  }
}
```

### 3. アニメーション可能なテキストActorの例
```typescript
// 使用例として提供（実際にengine.tsに含めるかは検討）
export class AnimatedTextActor extends TextActor {
  private originalY: number;
  private time: number = 0;
  
  constructor(options: Parameters<typeof TextActor>[0]) {
    super(options);
    this.originalY = this.displayObject.y;
  }
  
  update() {
    super.update();
    this.time++;
    // 浮遊アニメーション例
    this.displayObject.y = this.originalY + Math.sin(this.time * 0.05) * 5;
  }
}
```

## グラフィックス関連の拡張

### 4. 矩形生成ヘルパー関数
```typescript
export function createRect(options: {
  width: number;
  height: number;
  fill: number;
  stroke?: { width: number; color: number };
  x?: number;
  y?: number;
}): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, options.width, options.height);
  graphics.fill(options.fill);
  
  if (options.stroke) {
    graphics.stroke(options.stroke);
  }
  
  graphics.x = options.x || 0;
  graphics.y = options.y || 0;
  
  return graphics;
}
```

### 5. 物理演算を持つ基底Actorクラス
```typescript
export abstract class PhysicsActor extends Actor {
  protected x: number = 0;
  protected y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  
  update() {
    super.update();
    this.x += this.vx;
    this.y += this.vy;
    this.updateDisplayPosition();
  }
  
  protected abstract updateDisplayPosition(): void;
  
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }
}
```

## 衝突判定関連の拡張

### 6. 基本的な衝突判定ユーティリティ
```typescript
export namespace CollisionUtils {
  export function checkRectCollision(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
  
  export function checkPointInRect(
    point: { x: number; y: number },
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }
}
```

### 7. Boundableインターフェースと実装
```typescript
export interface Boundable {
  getBounds(): { x: number; y: number; width: number; height: number };
}

export abstract class BoundableActor extends Actor implements Boundable {
  protected width: number;
  protected height: number;
  
  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }
  
  getBounds() {
    return {
      x: this.displayObject.x,
      y: this.displayObject.y,
      width: this.width,
      height: this.height,
    };
  }
}
```

## ベクトル演算関連の拡張

### 8. ベクトルユーティリティ
```typescript
export namespace VectorUtils {
  export function normalize(dx: number, dy: number): { x: number; y: number } {
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: 0, y: 0 };
    return { x: dx / distance, y: dy / distance };
  }
  
  export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  export function angle(from: { x: number; y: number }, to: { x: number; y: number }): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
}
```

## 型定義の追加

### 9. 共通型定義
```typescript
export type Point2D = { x: number; y: number };
export type Velocity2D = { vx: number; vy: number };
export type Rectangle = { x: number; y: number; width: number; height: number };
export type Size2D = { width: number; height: number };
```

## 実装優先度

1. **高優先度**（すぐに効果的）
   - 静的テキスト生成ヘルパー関数
   - TextActorクラス
   - 共通型定義

2. **中優先度**（多くの場面で有用）
   - PhysicsActorクラス
   - CollisionUtilsネームスペース
   - VectorUtilsネームスペース

3. **低優先度**（必要に応じて追加）
   - AnimatedTextActor（例示用）
   - BoundableActor
   - 矩形生成ヘルパー

## 使用例

```typescript
// 静的なスコア表示
const scoreText = createText({
  text: "Score: 0",
  fontSize: 16,
  fill: 0x000000,
  x: 10,
  y: 10
});
scene.displayObject.addChild(scoreText);

// 動的なテキスト（カウントダウンなど）
class CountdownText extends TextActor {
  private count: number = 60;
  
  update() {
    super.update();
    this.count--;
    this.setText(`Time: ${this.count}`);
  }
}
```