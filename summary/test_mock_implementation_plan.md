# テスト用モック実装方針

## 概要
imomushiプロジェクトにおいて、テスト駆動開発（TDD）を実現するために必要なGameクラスとInputクラスのモック実装方針を定義する。

## 設計思想

### 1. 責務の分離
- **Game**: 薄い制御層として機能し、テスト対象にはしない
- **Scene**: 状態変化の本体でTDDの核となる部分
- **Actor**: 観測可能な状態を持ち、テストから検証可能にする
- **Input**: DOM依存を排除し、状態のみを保持する受動的なクラスとする

### 2. モックの設計原則
- PIXIなどの外部依存を完全に排除
- 状態の予測可能性・注入可能性・観測可能性を確保
- フレーム単位での制御を可能にする
- 副作用を排除し、純粋な状態管理に集中

## MockGameクラス

### 基本構造
```typescript
export class MockGame {
  public input: MockInput | null = null;
  private currentScene: Scene | null = null;
  private updateCallCount: number = 0;
  private currentSceneName: string = '';
  
  // PIXIを使わないダミー実装
  public app = {
    stage: {
      addChild: jest.fn(),
      removeChild: jest.fn()
    },
    ticker: {
      add: jest.fn()
    }
  };
}
```

### 主要メソッド

#### init()
- DOM操作を行わず、Promise.resolve()を返すのみ
- inputにMockInputインスタンスを設定

#### loadAsset()
- 実際のアセット読み込みは行わない
- テスト用のダミーTextureオブジェクトを即座に返す
- アセットキーと呼び出し回数を記録

#### changeScene()
- シーン切り替えロジックのみを実行
- currentSceneNameを更新（テスト検証用）

#### update()
- updateCallCountをインクリメント
- input.update()とcurrentScene.update()を呼び出し

### テスト用追加機能
- `getUpdateCallCount()`: update呼び出し回数を取得
- `getCurrentSceneName()`: 現在のシーン名を取得
- `resetMockState()`: モック状態をリセット

## MockInputクラス

### 基本構造
```typescript
export class MockInput {
  private keyStates: Map<string, number> = new Map();
  private mouseState: number = 0;
  private mousePosition: Point2D = { x: 0, y: 0 };
  private frame: number = 0;
  
  // フレームベースの入力スケジュール
  private keySchedule: Map<number, Set<string>> = new Map();
  private mouseSchedule: Map<number, MouseEvent> = new Map();
}
```

### 主要メソッド

#### コンストラクタ
```typescript
constructor(events?: InputEvent[]) {
  // InputEvent: { frame: number, type: 'key' | 'mouse', data: any }
  // 入力イベントをフレーム単位でスケジュール
}
```

#### update()
- 現在のフレームに応じて入力状態を更新
- keyScheduleとmouseScheduleから該当フレームのイベントを適用
- 実装と同じ数値ベースの状態管理ロジックを維持

#### シミュレーションメソッド
- `simulateKeyPress(key: string)`: 即座にキーを押下状態にする
- `simulateKeyRelease(key: string)`: 即座にキーを離す
- `simulateMouseClick(x: number, y: number)`: マウスクリックをシミュレート
- `setMousePosition(x: number, y: number)`: マウス位置を直接設定

#### スケジューリングメソッド
- `scheduleKeyPress(frame: number, key: string)`: 特定フレームでキー押下
- `scheduleKeyRelease(frame: number, key: string)`: 特定フレームでキー離す
- `scheduleMouseEvent(frame: number, event: MouseEvent)`: マウスイベントをスケジュール

### 状態取得メソッド
実装と同じインターフェースを維持：
- `getKeyState(key: string): number`
- `getMouseState(): number`
- `getMousePosition(): Point2D`
- `isKeyPressed(key: string): boolean`
- `isKeyJustPressed(key: string): boolean`
- `isKeyJustReleased(key: string): boolean`
- `isMousePressed(): boolean`
- `isMouseJustPressed(): boolean`
- `isMouseJustReleased(): boolean`

## ファイル構成

```
src/
  __mocks__/
    game.mock.ts       # MockGameクラス
    input.mock.ts      # MockInputクラス
    index.ts          # エクスポート用
  __tests__/
    mocks/
      game.mock.test.ts   # MockGameのテスト
      input.mock.test.ts  # MockInputのテスト
```

## 使用例

### 基本的なシーンテスト
```typescript
describe('GameScene', () => {
  test('10フレーム後にプレイヤーが生存し、120フレーム後に死亡', () => {
    const input = new MockInput([
      { frame: 5, type: 'key', data: { key: 'ArrowRight', action: 'press' } },
      { frame: 20, type: 'key', data: { key: 'ArrowRight', action: 'release' } }
    ]);
    
    const game = new MockGame();
    const scene = new GameScene(game);
    game.changeScene(scene);
    
    // 120フレーム実行
    for (let i = 0; i < 120; i++) {
      game.update();
      
      if (i === 10) {
        expect(scene.player.alive).toBe(true);
      }
      if (i === 119) {
        expect(scene.player.alive).toBe(false);
      }
    }
  });
});
```

### 入力シミュレーションテスト
```typescript
test('右キーを押したらプレイヤーが右に移動', () => {
  const input = new MockInput();
  const game = new MockGame();
  game.input = input;
  
  const scene = new GameScene(game);
  const initialX = scene.player.x;
  
  // 右キーを押す
  input.simulateKeyPress('ArrowRight');
  
  // 10フレーム更新
  for (let i = 0; i < 10; i++) {
    game.update();
  }
  
  expect(scene.player.x).toBeGreaterThan(initialX);
});
```

## 実装時の注意点

1. **型の互換性**: Mockクラスはオリジナルのインターフェースと互換性を保つ
2. **状態の観測可能性**: すべての内部状態をテストから確認できるようにする
3. **決定的な動作**: ランダム性や時間依存を排除し、再現可能な動作を保証
4. **エラーハンドリング**: モック特有のエラー（未実装メソッドなど）を明確にする

## 今後の拡張

- リプレイ機能の追加（入力記録と再生）
- デバッグ用の状態ダンプ機能
- パフォーマンス計測機能（updateの実行時間など）
- より高度な入力パターンのプリセット