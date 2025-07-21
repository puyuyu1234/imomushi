# test05.ts リファクタリング分析

## 概要
test05.tsは色の混合パズルゲームの実装で、ブロックを移動させて隣接による色の混合を行い、指定された色を作るゲームです。

## 現在の実装状況

### 良い点
1. **単一責任の原則を適用**: ColorCalculator、BlockMoverクラスで責務を分離
2. **明確な型定義**: BlockType、StageData、StageColorsなど
3. **コンポーネント化**: GameField、GameSceneの役割分担
4. **設定データの分離**: STAGESの外部データ化

### 課題分析

#### 1. GameFieldクラスの肥大化
**問題**: GameFieldクラスが788行中268行（34%）を占め、複数の責務を持つ

**責務の混在**:
- フィールドの描画・再描画
- UI要素の管理（ノルマ、ステージ名、ボタン）
- ドラッグ&ドロップ操作
- ゲーム状態管理（クリア判定、ハイライト）
- 入力処理

#### 2. 描画処理の複雑性
**問題**: 描画とゲームロジックが密結合

**具体的な問題**:
- `drawField()`, `drawBlock()`, `redrawField()`の重複処理
- ハイライト効果の描画ロジックが散在
- UI要素の位置計算がハードコーディング

#### 3. 入力処理の複雑性
**問題**: update()メソッドに多くの処理が集約（110行）

**処理内容**:
- ドラッグ開始/終了
- 移動方向の計算
- クールダウン管理
- ボタンクリック判定

#### 4. 設定値の散在
**問題**: マジックナンバーや固定値がコード全体に散在

**例**:
- `lastMoveThreshold: 20`
- `cooldownFrames: 3`
- UI座標の計算式

## 提案するリファクタリング

### 1. GameFieldクラスの分割

#### 1.1 FieldRenderer クラス
```typescript
class FieldRenderer {
  private blockSize: number;
  private offsetX: number;
  private offsetY: number;
  private colors: StageColors;
  
  drawField(field: string[][], colorCalculator: ColorCalculator): void
  drawBlock(x: number, y: number, type: BlockType): void
  drawGrid(): void
  updateHighlight(isCleared: boolean, highlightFrames: number): void
}
```

#### 1.2 UIManager クラス
```typescript
class UIManager {
  private quotaText: PIXI.Text | null = null;
  private stageNameText: PIXI.Text | null = null;
  private nextStageButton: PIXI.Graphics | null = null;
  
  createUI(stageName: string, quota: number): void
  updateQuotaDisplay(current: number, total: number): void
  showClearMessage(): void
  createNextStageButton(): void
  isClickOnButton(x: number, y: number): boolean
}
```

#### 1.3 InputHandler クラス
```typescript
class InputHandler {
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private selectedBlockType: BlockType | null = null;
  private cooldownFrames: number = 0;
  
  handleInput(input: Input): InputAction
  private processDragStart(mousePos: Point2D): boolean
  private processDragMove(mousePos: Point2D): MoveAction | null
  private processDragEnd(): void
}
```

#### 1.4 GameStateManager クラス
```typescript
class GameStateManager {
  private isCleared: boolean = false;
  private highlightFrames: number = 0;
  
  checkClearCondition(field: string[][], colorCalculator: ColorCalculator): boolean
  updateHighlight(): void
  getCurrentGoalColor(field: string[][]): number
  countBlocksWithColor(field: string[][], targetColor: number): number
}
```

### 2. 設定クラスの導入

#### 2.1 GameConfig クラス
```typescript
class GameConfig {
  static readonly MOVE_THRESHOLD = 20;
  static readonly COOLDOWN_FRAMES = 3;
  static readonly HIGHLIGHT_SPEED = 0.3;
  static readonly GRID_COLOR = 0x888888;
  static readonly GRID_ALPHA = 0.5;
  
  static readonly UI = {
    STAGE_NAME_POS: { x: 10, y: 10 },
    QUOTA_POS: { x: 10, y: 35 },
    CLEAR_TEXT_OFFSET: { x: -30, y: -80 },
    BUTTON_SIZE: { width: 120, height: 30 }
  };
}
```

### 3. 型定義の強化

#### 3.1 入力アクション型
```typescript
interface InputAction {
  type: 'none' | 'drag_start' | 'drag_move' | 'drag_end' | 'button_click';
  data?: any;
}

interface MoveAction {
  direction: { x: number; y: number };
  blockType: BlockType;
}
```

#### 3.2 レンダリング状態型
```typescript
interface RenderState {
  isCleared: boolean;
  highlightFrames: number;
  selectedBlock: { x: number; y: number } | null;
}
```

### 4. ファイル構成の提案

#### 4.1 ゲームコンポーネント
```
src/game/
├── components/
│   ├── FieldRenderer.ts
│   ├── UIManager.ts
│   ├── InputHandler.ts
│   └── GameStateManager.ts
├── config/
│   ├── GameConfig.ts
│   └── StageData.ts
├── types/
│   ├── BlockTypes.ts
│   ├── InputTypes.ts
│   └── RenderTypes.ts
└── GameField.ts (リファクタリング後)
```

#### 4.2 リファクタリング後のGameField
```typescript
class GameField extends Actor {
  private field: string[][];
  private stageData: StageData;
  
  // 分離されたコンポーネント
  private renderer: FieldRenderer;
  private uiManager: UIManager;
  private inputHandler: InputHandler;
  private stateManager: GameStateManager;
  private colorCalculator: ColorCalculator;
  private blockMover: BlockMover;
  
  constructor(stageData: StageData, onNextStage?: () => void) {
    super();
    this.initializeComponents();
  }
  
  update(input: Input | null) {
    const action = this.inputHandler.handleInput(input);
    this.processAction(action);
    this.updateGameState();
    this.updateRendering();
  }
  
  private processAction(action: InputAction): void
  private updateGameState(): void
  private updateRendering(): void
}
```

## 期待される効果

### 1. 保守性の向上
- 各クラスの責務が明確化
- 変更の影響範囲が限定的
- テストが容易になる

### 2. 拡張性の向上
- 新しい描画効果の追加が容易
- UI要素の追加・変更が簡単
- 入力方式の変更に対応しやすい

### 3. 再利用性の向上
- 各コンポーネントを他のゲームでも利用可能
- 設定値の一元管理により調整が容易

### 4. テスト駆動開発への対応
- 各コンポーネントを独立してテスト可能
- モックを使用した単体テストが容易
- 統合テストの作成が簡単

## 実装優先順位

### Phase 1: 設定値の分離
1. GameConfigクラスの作成
2. マジックナンバーの置換

### Phase 2: 描画処理の分離
1. FieldRendererクラスの実装
2. 描画ロジックの移行

### Phase 3: UI管理の分離
1. UIManagerクラスの実装
2. UI要素の管理移行

### Phase 4: 入力処理の分離
1. InputHandlerクラスの実装
2. 入力ロジックの移行

### Phase 5: 状態管理の分離
1. GameStateManagerクラスの実装
2. ゲーム状態ロジックの移行

### Phase 6: 統合とテスト
1. 全コンポーネントの統合
2. 単体テストの作成
3. 統合テストの作成

## 注意事項

### 1. 段階的な実装
- 一度に全てを変更せず、段階的にリファクタリング
- 各段階で動作確認を実施

### 2. 既存機能の保持
- 現在の機能を損なわないよう注意
- 動作テストの自動化推奨

### 3. パフォーマンス考慮
- 描画処理の最適化
- 不要な再描画の削減

このリファクタリングにより、test05.tsはより保守性が高く、拡張しやすいコードになります。