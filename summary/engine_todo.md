# engine.ts 拡張TODOリスト

## 保留中の機能

### 衝突判定関連
- **CollisionUtils**: 衝突判定のユーティリティ関数群
  - `checkRectCollision`: 矩形同士の衝突判定
  - `checkPointInRect`: 点と矩形の衝突判定
  - 難しさ: ゲームによって必要な判定方法が異なるため、汎用化が難しい
  
### BoundableActor
- `getBounds()`を持つ基底クラス
- 保留理由: anchorや原点の扱いが複雑になる可能性がある
- 各ゲームで個別に実装した方が柔軟性が高いかも

### VectorUtils
- ベクトル演算のユーティリティ関数群
  - `normalize`: ベクトルの正規化
  - `distance`: 2点間の距離
  - `angle`: 2点間の角度
- 保留理由: 現時点では必要性が低い、使用頻度次第で検討

## 実装済み

### ✅ 型定義
- `Point2D`: 座標用
- `Velocity2D`: 速度用  
- `Rectangle`: 矩形領域用
- `Size2D`: サイズ用

### ✅ PhysicsActor
- 物理演算を持つActorの基底クラス
- 位置(x, y)と速度(vx, vy)を管理
- `updateDisplayPosition()`を実装する必要あり

### ✅ ヘルパー関数
- `createText()`: シンプルなテキスト生成
- `createRect()`: 矩形グラフィックス生成（デバッグに便利）

## 今後の検討事項

1. **ストローク付き矩形オプション**
   - createRectにストロークオプションを追加するか検討
   - 使用頻度を見てから判断

2. **アニメーション関連**
   - Tweenライブラリの統合
   - 基本的なアニメーション機能の追加

3. **サウンド管理**
   - 音声アセットの管理機能
   - BGM/SE再生の統一インターフェース