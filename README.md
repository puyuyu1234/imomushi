# imomushi

TypeScript + PIXI.js + Viteを使用したゲームエンジンプロジェクト。
Game/Scene/Actor アーキテクチャパターンを採用し、モジュール設計とテスト駆動開発（TDD）を重視。

## 技術スタック

- **フロントエンド**: TypeScript, PIXI.js 8.10.2
- **ビルドツール**: Vite 7.0.0
- **パッケージマネージャー**: npm
- **開発手法**: テスト駆動開発（TDD）

## プロジェクト構成

### ルートディレクトリ
```
imomushi/
├── package.json          # プロジェクト設定と依存関係
├── vite.config.js        # Viteビルド設定
├── index.html            # メインHTML
├── test0X.html           # 実行例ページ群
├── dist/                 # ビルド成果物
├── node_modules/         # 依存関係
├── public/               # 静的アセット
│   └── img/              # 画像リソース
├── src/                  # メインソースコード
└── summary/              # 設計ドキュメント
```

### src/ ディレクトリ構成

#### メインファイル
- `main.ts` - アプリケーションエントリーポイント
- `game.css` - ゲーム用CSS
- `engine_old.ts` - レガシーエンジン（互換性のため保持）

#### engine/ ディレクトリ（メインエンジン）
```
engine/
├── index.ts          # エクスポート統合
├── types.ts          # 型定義
├── game.ts           # Gameクラス
├── scene.ts          # Sceneクラス
├── actor.ts          # Actor関連クラス
├── input.ts          # Inputクラス
└── helpers.ts        # ヘルパー関数
```

#### __mocks__/ ディレクトリ（エンジン開発用モック）
```
__mocks__/
├── index.ts          # モックエクスポート
├── game.mock.ts      # MockGameクラス
└── input.mock.ts     # MockInputクラス
```

#### test/ ディレクトリ（エンジン実行例）
```
test/
├── test01.ts         # 基本図形描画例
├── test02.ts         # 機能拡張例
├── test03.ts         # 統合機能例
├── test04.ts         # エンジン拡張例
├── test05.ts         # 最新機能例
└── test06.ts         # 追加機能例
```

## アーキテクチャパターン

### Game/Scene/Actor構造
- **Game**: 時間・入力・シーンの管理を担う薄い制御層
- **Scene**: 状態変化の本体、Actorたちを束ねる
- **Actor**: プレイヤー、敵、ギミックなどの個別要素

### クラス階層
```
Actor (基底クラス)
├── ParticleActor (パーティクル用)
└── PhysicsActor (物理演算用、抽象クラス)
```

### 依存関係
```
Game → Scene → Actor
  ↓      ↓
Input → フレーム更新
```

## 型定義（types.ts）

### 基本型
- `Point2D`: 2D座標 `{x: number, y: number}`
- `Velocity2D`: 2D速度 `{vx: number, vy: number}`
- `Rectangle`: 矩形 `{x, y, width, height}`
- `Size2D`: サイズ `{width, height}`

## Input仕様

### 状態管理
キー・マウスの状態を数値で管理：
- `0`: 未使用
- `1以上`: 押下中（1=押した瞬間、2以上=継続）
- `-1以下`: 離した状態（-1=離した瞬間、-2以下=継続）

### 主要メソッド
- `isKeyPressed(key)`: キーが押されているか
- `isKeyJustPressed(key)`: キーを押した瞬間か
- `isKeyJustReleased(key)`: キーを離した瞬間か
- `getMousePosition()`: マウス座標取得

## 実行例

プロジェクトには、エンジンの機能を実際に使用した実行例が含まれています：

- **test01**: 基本図形描画とActor使用例
- **test02-06**: 段階的な機能拡張とエンジン活用例

各実行例は `testXX.html` をブラウザで開くことで確認できます。

## エンジン開発用モック

エンジン自体の開発には、PIXI.js依存を排除したモッククラスを使用：

### MockGame特徴
- PIXI依存を排除したテスト環境
- updateCallCount等のテスト用プロパティ
- ダミーTextureによる軽量アセット読み込み

### MockInput特徴
- フレームベースの入力スケジューリング
- 即座の状態変更メソッド
- デバッグ用状態取得機能

## 開発ガイドライン

### インポート方法
```typescript
// エンジン使用（実行例やゲーム開発で使用）
import { Game, Scene, Actor } from "./engine";

// エンジン開発（エンジン自体のテスト開発で使用）
import { MockGame, MockInput } from "./__mocks__";

// ⚠️ レガシー（互換性のためのみ保持、新規開発では使用しない）
import { Game } from "./engine_old";
```

### エンジン開発（TDD）
1. MockGameとMockInputを使用したエンジンテスト
2. フレーム単位でのテスト実行
3. 状態の観測可能性を重視
4. 副作用の排除

### ファイル命名規則
- `*.ts`: TypeScriptソース
- `*.mock.ts`: エンジン開発用モック実装
- `test*.ts`: エンジン使用例・実行例
- `index.ts`: エクスポート統合

## ビルド・実行

### 開発サーバー
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## 設計ドキュメント
`summary/` ディレクトリに以下の設計資料を格納：

- `test_mock_implementation_plan.md`: モック実装方針
- `test04_engine_extensions.md`: エンジン拡張仕様
- `test04_refactoring.md`: リファクタリング履歴
- `test04_structure.md`: 構造設計
- `engine_todo.md`: エンジン開発TODO

## 注意事項

### エンジン開発方針
- **メイン開発**: `engine/`ディレクトリ配下のファイル群を使用・更新
- **レガシー**: `engine_old.ts`は互換性のためのみ保持（更新しない）
- **新機能**: 必ず`engine/`ディレクトリ内で開発

### ゲーム・実行例開発方針
- エンジンを使用したゲームや機能例は `test/` ディレクトリに配置
- 各実行例には対応する `testXX.html` ファイルを作成
- エンジンの機能拡張や新機能の実証に活用

### エンジン開発時のテスト方針
- 描画とロジックの分離
- 状態の予測可能性・注入可能性・観測可能性を重視
- フレーム単位での制御とテスト

### エラーハンドリング
- Canvas要素の存在確認
- アセット読み込み失敗時の処理
- 入力イベントの適切な処理

## 今後の拡張予定

### エンジン機能
- Jest設定とエンジンテストスイート構築
- リプレイ機能の実装
- パフォーマンス計測機能
- より高度な物理演算システム
- サウンド管理システム

### 実行例・デモ
- より複雑なゲーム実装例
- パーティクルシステムのデモ
- 物理演算を活用したゲーム例
- UI・メニューシステムの実装例