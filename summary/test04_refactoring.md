# test04.ts リファクタリング分析

## 共通化すべき処理パターン

### 1. PIXI.Text作成パターン
複数箇所でPIXI.Textの作成が繰り返されている（GameOverScene, MainScene）
```typescript
// 共通化候補
function createText(text: string, fontSize: number, color: number, x: number, y: number): PIXI.Text {
  const textObject = new PIXI.Text({
    text,
    style: {
      fontFamily: GAME_CONFIG.UI.FONT_FAMILY,
      fontSize,
      fill: color,
    },
  });
  textObject.anchor.set(0.5);
  textObject.x = x;
  textObject.y = y;
  return textObject;
}
```

### 2. PIXI.Graphics矩形描画パターン
Block、Floor、背景など複数箇所で同様の矩形描画
```typescript
// 共通化候補
function createRectGraphics(width: number, height: number, fillColor: number, strokeWidth?: number, strokeColor?: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, width, height);
  graphics.fill(fillColor);
  if (strokeWidth && strokeColor !== undefined) {
    graphics.stroke({ width: strokeWidth, color: strokeColor });
  }
  return graphics;
}
```

### 3. getBounds()メソッド実装パターン
Block、Floorで同じ実装
```typescript
// 共通化候補（基底クラスまたはmixin）
interface Boundable {
  displayObject: PIXI.DisplayObject;
  width: number;
  height: number;
}

function getBounds(this: Boundable) {
  return {
    x: this.displayObject.x,
    y: this.displayObject.y,
    width: this.width,
    height: this.height,
  };
}
```

### 4. 位置更新と速度適用パターン
複数のActorで似た処理
```typescript
// 共通化候補（基底クラスの拡張）
abstract class PhysicsActor extends Actor {
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
}
```

### 5. ベクトル正規化パターン
Threadクラスなどで繰り返される処理
```typescript
// 共通化候補（ユーティリティ関数）
function normalizeVector(dx: number, dy: number): { x: number; y: number } {
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return { x: 0, y: 0 };
  return { x: dx / distance, y: dy / distance };
}
```

### 6. イベントリスナー管理パターン
GameOverSceneとHeadで似たパターン
```typescript
// 共通化候補（mixin または trait）
class EventManager {
  private listeners: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];
  
  protected addEventListener(target: EventTarget, type: string, handler: EventListener) {
    target.addEventListener(type, handler);
    this.listeners.push({ target, type, handler });
  }
  
  protected removeAllListeners() {
    this.listeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this.listeners = [];
  }
}
```

### 7. 衝突判定パターン
checkFloorCollision、checkBlockCollision、checkRidingBlockで類似パターン
```typescript
// 共通化候補
function checkRectCollision(
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
```

### 8. スプライト位置更新パターン
HeadとBodySegmentで同じ処理
```typescript
// 共通化候補
function updateSpritePosition(sprite: PIXI.Sprite, x: number, y: number) {
  sprite.x = Math.round(x);
  sprite.y = Math.round(y);
}
```

## 個別実装が必要な部分

### 1. ゲーム固有のロジック
- **Head.update()の糸引力計算**: ゲーム特有の物理演算
- **updateBodySegments()**: イモムシの体の追従アルゴリズム
- **spawnBlock()の難易度計算**: ゲームバランスに関わる部分

### 2. 特殊な衝突処理
- **checkBlockCollision()の押し出し処理**: 複雑な衝突解決ロジック
- **checkRidingBlock()**: ブロックに乗る判定の特殊処理

### 3. アニメーション・エフェクト
- **Particleのランダム速度生成**: 視覚効果のための個別実装
- **フェードオーバーレイの処理**: ゲームオーバー演出

### 4. UI配置とレイアウト
- 各テキストの具体的な配置座標
- レイヤー順序の管理（MainSceneのactor追加順序）

### 5. 入力処理
- **onMouseDown()の座標変換**: カメラとキャンバススケール考慮
- 糸の発射位置計算（口の位置オフセット）

### 6. 状態管理
- ゲームオーバー判定と復活ロジック
- スコア計算式

## リファクタリング推奨事項

1. **共通基底クラスの作成**
   - `PhysicsActor`: 物理演算を持つActor
   - `BoundableActor`: getBounds()を持つActor

2. **ユーティリティモジュールの作成**
   - `VectorUtils`: ベクトル計算関数群
   - `CollisionUtils`: 衝突判定関数群
   - `PIXIHelpers`: PIXI.js関連のヘルパー関数

3. **設定の階層化**
   - GAME_CONFIGをさらに構造化し、関連する設定をグループ化

4. **イベント管理の改善**
   - EventManagerクラスまたはmixinの導入で、メモリリーク防止

5. **型定義の共通化**
   - `Point2D`: { x: number; y: number }
   - `Rectangle`: { x: number; y: number; width: number; height: number }
   - `Velocity2D`: { vx: number; vy: number }