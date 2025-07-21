# test05.ts エンジン機能追加分析

## 目的
test05.tsの実装から、engineに汎用機能として追加できる部分と、ゲーム固有で追加すべきでない部分を洗い出す。

## 分析対象
色の混合パズルゲーム（test05.ts）の実装から、再利用可能な汎用機能を抽出する。

## engineに追加すべき機能

### 1. 色関連ユーティリティ (helpers.ts)

#### 1.1 ColorUtils クラス
```typescript
export class ColorUtils {
  // 色のブレンド処理
  static blendColors(baseColor: number, colors: number[]): number
  
  // 色成分の抽出
  static extractRGB(color: number): { r: number; g: number; b: number }
  
  // RGB値から色を構築
  static createColor(r: number, g: number, b: number): number
  
  // 輝度計算
  static calculateBrightness(color: number): number
  
  // 色の比較
  static isSameColor(color1: number, color2: number): boolean
  
  // 色の補間
  static interpolateColor(color1: number, color2: number, t: number): number
}
```

**理由**: 色計算は多くのゲームで共通して使用される基本機能

#### 1.2 追加のヘルパー関数
```typescript
// 矩形の範囲内判定
export function isPointInRect(point: Point2D, rect: Rectangle): boolean

// 座標変換
export function screenToGrid(
  screenPos: Point2D, 
  gridSize: number, 
  offset: Point2D
): Point2D

export function gridToScreen(
  gridPos: Point2D, 
  gridSize: number, 
  offset: Point2D
): Point2D
```

### 2. グリッドシステム (新規ファイル: grid.ts)

#### 2.1 GridActor クラス
```typescript
export class GridActor extends Actor {
  protected gridWidth: number;
  protected gridHeight: number;
  protected cellSize: number;
  protected offsetX: number;
  protected offsetY: number;
  
  constructor(width: number, height: number, cellSize: number)
  
  // グリッド描画
  protected drawGrid(color: number = 0x888888, alpha: number = 0.5): void
  
  // 座標変換
  protected screenToGrid(screenX: number, screenY: number): Point2D | null
  protected gridToScreen(gridX: number, gridY: number): Point2D
  
  // 範囲チェック
  protected isValidGridPosition(x: number, y: number): boolean
  
  // 中央揃え計算
  protected calculateCenterOffset(containerWidth: number, containerHeight: number): Point2D
}
```

**理由**: グリッドベースのゲームは一般的で、座標変換や描画は共通化できる

### 3. ドラッグ&ドロップシステム (新規ファイル: drag.ts)

#### 3.1 DragHandler クラス
```typescript
export interface DragConfig {
  threshold: number;
  cooldownFrames: number;
  gridSnap: boolean;
  gridSize?: number;
}

export interface DragEvent {
  type: 'start' | 'move' | 'end';
  startPos: Point2D;
  currentPos: Point2D;
  deltaPos: Point2D;
  target?: any;
}

export class DragHandler {
  private isDragging: boolean = false;
  private dragStartPos: Point2D | null = null;
  private cooldownFrames: number = 0;
  private config: DragConfig;
  
  constructor(config: DragConfig)
  
  update(input: Input): DragEvent | null
  
  // ドラッグ状態の取得
  isDragActive(): boolean
  getCooldownRemaining(): number
  
  // 設定の変更
  updateConfig(config: Partial<DragConfig>): void
}
```

**理由**: ドラッグ操作は多くのゲームで使用される基本的なUI機能

### 4. UIコンポーネント (新規ファイル: ui.ts)

#### 4.1 Button クラス
```typescript
export class Button extends Actor {
  private rect: Rectangle;
  private text: string;
  private isPressed: boolean = false;
  private onClick?: () => void;
  
  constructor(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick?: () => void
  )
  
  update(input: Input | null): void
  
  // 状態管理
  setEnabled(enabled: boolean): void
  setVisible(visible: boolean): void
  
  // 外観設定
  setStyle(style: ButtonStyle): void
}

interface ButtonStyle {
  backgroundColor: number;
  textColor: number;
  borderColor: number;
  borderWidth: number;
  fontSize: number;
}
```

#### 4.2 TextDisplay クラス
```typescript
export class TextDisplay extends Actor {
  private textObject: PIXI.Text;
  
  constructor(
    text: string,
    x: number,
    y: number,
    style?: Partial<PIXI.TextStyle>
  )
  
  // テキスト更新
  setText(text: string): void
  setStyle(style: Partial<PIXI.TextStyle>): void
  
  // 位置調整
  setPosition(x: number, y: number): void
  centerOn(x: number, y: number): void
}
```

**理由**: ボタンやテキスト表示は基本的なUI要素として汎用性が高い

### 5. アニメーションシステム (新規ファイル: animation.ts)

#### 5.1 Tween クラス
```typescript
export class Tween {
  private startValue: number;
  private endValue: number;
  private duration: number;
  private elapsed: number = 0;
  private easingFunction: (t: number) => number;
  
  constructor(
    startValue: number,
    endValue: number,
    duration: number,
    easing?: (t: number) => number
  )
  
  update(): number
  isComplete(): boolean
  reset(): void
}

// イージング関数
export class Easing {
  static linear(t: number): number
  static easeInOut(t: number): number
  static easeIn(t: number): number
  static easeOut(t: number): number
  static bounce(t: number): number
}
```

#### 5.2 PulseEffect クラス
```typescript
export class PulseEffect {
  private frames: number = 0;
  private speed: number;
  private amplitude: number;
  
  constructor(speed: number = 0.3, amplitude: number = 0.3)
  
  update(): number // 0.0 〜 1.0 の値を返す
  reset(): void
}
```

**理由**: 脈動効果やアニメーションは多くのゲームで使用される

## engineに追加すべきでない機能

### 1. ゲーム固有のロジック

#### 1.1 BlockType とステージデータ
```typescript
// ❌ engine に追加すべきでない
type BlockType = " " | "1" | "2" | "3" | "G";
interface StageData { ... }
const STAGES: StageData[] = [ ... ];
```

**理由**: 特定のゲームにのみ適用される定義

#### 1.2 色の混合ルール
```typescript
// ❌ engine に追加すべきでない
class ColorCalculator {
  calculateBlendedColor(x: number, y: number, type: BlockType, field: string[][]): number
  private getAdjacentBlocks(x: number, y: number, field: string[][]): BlockType[]
}
```

**理由**: 特定のゲームのルールに依存する処理

#### 1.3 ブロック移動ロジック
```typescript
// ❌ engine に追加すべきでない
class BlockMover {
  tryMoveBlocks(blockType: BlockType, dx: number, dy: number): boolean
  private findBlockPositions(blockType: BlockType): Array<{ x: number; y: number }>
}
```

**理由**: 特定のゲームのルールに依存する処理

### 2. 特定のゲーム状態管理

#### 2.1 クリア判定
```typescript
// ❌ engine に追加すべきでない
private checkClearCondition(): void
private countBlocksWithColor(targetColor: number): number
private getCurrentGoalColor(): number
```

**理由**: 特定のゲームの勝利条件に依存

#### 2.2 ステージ管理
```typescript
// ❌ engine に追加すべきでない
class GameScene {
  private currentStageIndex: number;
  private loadStage(stageIndex: number): void
  private nextStage(): void
}
```

**理由**: 特定のゲームの進行システムに依存

### 3. 特定のUI表示

#### 3.1 ゲーム固有のUI
```typescript
// ❌ engine に追加すべきでない
private createUI(): void // ノルマ表示など
private showClearMessage(): void // "CLEAR!" メッセージ
```

**理由**: 特定のゲームのUI設計に依存

## 実装優先度

### 優先度A（高）: 基本的な汎用機能
1. **ColorUtils** - 色計算は多くのゲームで必要
2. **GridActor** - グリッドベースのゲームは一般的
3. **DragHandler** - ドラッグ操作は基本的なUI機能

### 優先度B（中）: 便利な汎用機能
1. **Button/TextDisplay** - 基本的なUI要素
2. **座標変換ヘルパー** - グリッドシステムと組み合わせて使用

### 優先度C（低）: 拡張的な機能
1. **Tween/PulseEffect** - アニメーション機能
2. **範囲判定ヘルパー** - 特定の状況でのみ使用

## 実装時の注意点

### 1. 汎用性の確保
- 特定のゲームに依存しない設計
- 設定可能なパラメータの提供
- 拡張可能なインターフェース

### 2. 既存engineとの整合性
- 既存のActor、Scene、Input との連携
- 一貫した命名規則
- 同じ設計パターンの適用

### 3. テスト駆動開発への対応
- 各機能を独立してテスト可能
- モックフレンドリーな設計
- 副作用の最小化

## 結論

test05.tsから抽出すべき汎用機能は、主に以下の3つの分野：

1. **基本ユーティリティ**: 色計算、座標変換、範囲判定
2. **UI・入力システム**: ドラッグ操作、ボタン、テキスト表示
3. **描画・アニメーション**: グリッド描画、アニメーション効果

これらの機能をengineに追加することで、今後のゲーム開発が効率化され、コードの再利用性が向上します。