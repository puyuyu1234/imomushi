import { Actor, Game, Scene, createText, Input, createRect } from "../engine";
import * as PIXI from "pixi.js";

const WIDTH = 240;
const HEIGHT = 320;

// ブロックタイプの定義
type BlockType = " " | "1" | "2" | "3" | "G";

// 色計算クラス
class ColorCalculator {
  constructor(private colors: StageColors) {}

  calculateBlendedColor(
    x: number,
    y: number,
    type: BlockType,
    field: string[][]
  ): number {
    const baseColor = this.colors[type as keyof StageColors];
    if (baseColor === undefined) return 0x000000;

    const adjacentBlocks = this.getAdjacentBlocks(x, y, field);
    if (adjacentBlocks.length === 0) return baseColor;

    return this.blendColors(baseColor, adjacentBlocks);
  }

  private blendColors(baseColor: number, adjacentBlocks: BlockType[]): number {
    let r = (baseColor >> 16) & 0xff;
    let g = (baseColor >> 8) & 0xff;
    let b = baseColor & 0xff;

    for (const adjType of adjacentBlocks) {
      if (adjType !== " ") {
        const adjColor = this.colors[adjType as keyof StageColors];
        if (adjColor !== undefined) {
          r += (adjColor >> 16) & 0xff;
          g += (adjColor >> 8) & 0xff;
          b += adjColor & 0xff;
        }
      }
    }

    return (
      (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b)
    );
  }

  private getAdjacentBlocks(
    x: number,
    y: number,
    field: string[][]
  ): BlockType[] {
    const adjacent: BlockType[] = [];
    const directions = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (this.isValidPosition(nx, ny, field)) {
        const blockType = field[ny][nx] as BlockType;
        if (blockType !== " ") {
          adjacent.push(blockType);
        }
      }
    }
    return adjacent;
  }

  private isValidPosition(x: number, y: number, field: string[][]): boolean {
    return y >= 0 && y < field.length && x >= 0 && x < field[y].length;
  }

  calculateBrightness(color: number): number {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  isSameColor(color1: number, color2: number): boolean {
    return color1 === color2;
  }
}

// ブロック移動クラス
class BlockMover {
  constructor(private field: string[][]) {}

  tryMoveBlocks(blockType: BlockType, dx: number, dy: number): boolean {
    const positions = this.findBlockPositions(blockType);
    if (!this.canMoveToPositions(positions, dx, dy, blockType)) {
      return false;
    }
    this.executeMove(positions, dx, dy, blockType);
    return true;
  }

  private findBlockPositions(
    blockType: BlockType
  ): Array<{ x: number; y: number }> {
    const positions = [];
    for (let y = 0; y < this.field.length; y++) {
      for (let x = 0; x < this.field[y].length; x++) {
        if (this.field[y][x] === blockType) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  private canMoveToPositions(
    positions: Array<{ x: number; y: number }>,
    dx: number,
    dy: number,
    blockType: BlockType
  ): boolean {
    return positions.every((pos) => {
      const newX = pos.x + dx;
      const newY = pos.y + dy;
      if (!this.isValidPosition(newX, newY)) return false;
      const targetCell = this.field[newY][newX];
      return targetCell === " " || targetCell === blockType;
    });
  }

  private executeMove(
    positions: Array<{ x: number; y: number }>,
    dx: number,
    dy: number,
    blockType: BlockType
  ): void {
    // まず古い位置をクリア
    for (const pos of positions) {
      this.field[pos.y][pos.x] = " ";
    }
    // 新しい位置に配置
    for (const pos of positions) {
      this.field[pos.y + dy][pos.x + dx] = blockType;
    }
  }

  private isValidPosition(x: number, y: number): boolean {
    return (
      y >= 0 && y < this.field.length && x >= 0 && x < this.field[y].length
    );
  }
}

// ステージごとの色設定
interface StageColors {
  "1": number;
  "2": number;
  "3": number;
  "4"?: number; // オプションで4番目の色
  G: number;
  background: number;
}

// ステージデータの型定義
interface StageData {
  field: string[];
  colors: StageColors;
  quota: number;
  name: string;
}

// ステージ1: RGB → 白
const STAGE1_COLORS: StageColors = {
  "1": 0xff0000, // 赤
  "2": 0x00ff00, // 緑
  "3": 0x0000ff, // 青
  G: 0xffffff, // 白（ゴール）
  background: 0xe0e0e0,
};

// ステージ2: RGR → 紫
const STAGE2_COLORS: StageColors = {
  "1": 0xff0000, // 赤
  "2": 0x00ff00, // 緑
  "3": 0xff0000, // 赤
  G: 0xff00ff, // 紫（ゴール）
  background: 0xe0e0e0,
};

// ステージ3: RGB → 白
const STAGE3_COLORS: StageColors = {
  "1": 0xff0000, // 赤
  "2": 0x00ff00, // 緑
  "3": 0x0000ff, // 青
  G: 0xffffff, // 白（ゴール）
  background: 0xe0e0e0,
};

// ステージ4: RGB → 黒
const STAGE4_COLORS: StageColors = {
  "1": 0xff0000, // 赤
  "2": 0x00ff00, // 緑
  "3": 0x00ffff, // 青
  "4": 0x000000, // 黒
  G: 0x000000, // 黒（ゴール）
  background: 0xe0e0e0,
};

// 全ステージデータ
const STAGES: StageData[] = [
  {
    field: [
      //
      "  333",
      "11   ",
      "1 G 2",
      "   22",
      "     ",
    ],
    colors: STAGE1_COLORS,
    quota: 6,
    name: "ステージ1",
  },
  {
    field: [
      //
      " 333 ",
      "G    ",
      "   2 ",
      "11 2 ",
      " 11  ",
    ],
    colors: STAGE2_COLORS,
    quota: 4,
    name: "ステージ2",
  },
  {
    field: [
      //
      "  3  ",
      " 3 G ",
      "1 3 2",
      " 1 2 ",
      "  1  ",
    ],
    colors: STAGE3_COLORS,
    quota: 6,
    name: "ステージ3",
  },
  {
    field: [
      //
      " 33  ",
      " 3   ",
      "1 G 2",
      "1   2",
      " 44  ",
    ],
    colors: STAGE4_COLORS,
    quota: 8,
    name: "ステージ4",
  },
];

class GameField extends Actor {
  private field: string[][];
  private blockSize: number;
  private colors: StageColors;
  private offsetX: number;
  private offsetY: number;
  private quota: number;
  private goalColor: number;
  private stageName: string;
  private onNextStage?: () => void;

  // 分離されたコンポーネント
  private colorCalculator: ColorCalculator;
  private blockMover: BlockMover;

  // ドラッグ関連
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private selectedBlockType: BlockType | null = null;
  private lastMoveThreshold: number = 20;
  private cooldownFrames: number = 0;

  // ゲーム状態
  private isCleared: boolean = false;
  private highlightFrames: number = 0;

  // UI要素
  private quotaText: PIXI.Text | null = null;
  private stageNameText: PIXI.Text | null = null;
  private nextStageButton: PIXI.Graphics | null = null;

  constructor(
    stageData: StageData,
    blockSize: number = 40,
    onNextStage?: () => void
  ) {
    super();
    // 文字列配列を2次元配列に変換
    this.field = stageData.field.map((row) => row.split(""));
    this.blockSize = blockSize;
    this.colors = stageData.colors;
    this.quota = stageData.quota;
    this.goalColor = stageData.colors.G;
    this.stageName = stageData.name;
    this.onNextStage = onNextStage;

    // コンポーネント初期化
    this.colorCalculator = new ColorCalculator(stageData.colors);
    this.blockMover = new BlockMover(this.field);

    // フィールドを中央に配置するためのオフセット計算
    const fieldWidth = this.getMaxWidth() * blockSize;
    const fieldHeight = stageData.field.length * blockSize;
    this.offsetX = (WIDTH - fieldWidth) / 2;
    this.offsetY = (HEIGHT - fieldHeight) / 2 + 50; // UI用のスペースを確保

    this.drawField();
    this.createUI();
  }

  private getMaxWidth(): number {
    return Math.max(...this.field.map((row) => row.length));
  }

  private drawField() {
    // 背景を描画
    const bg = createRect(WIDTH, HEIGHT, this.colors.background);
    this.displayObject.addChild(bg);

    // グリッドを描画
    this.drawGrid();

    // 各ブロックを描画
    this.field.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const blockType = row[x] as BlockType;
        if (blockType !== " ") {
          this.drawBlock(x, y, blockType);
        }
      }
    });
  }

  private drawGrid() {
    const fieldWidth = this.getMaxWidth();
    const fieldHeight = this.field.length;

    // 縦線を描画
    for (let x = 0; x <= fieldWidth; x++) {
      const line = new PIXI.Graphics();
      line.moveTo(this.offsetX + x * this.blockSize, this.offsetY);
      line.lineTo(
        this.offsetX + x * this.blockSize,
        this.offsetY + fieldHeight * this.blockSize
      );
      line.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
      this.displayObject.addChild(line);
    }

    // 横線を描画
    for (let y = 0; y <= fieldHeight; y++) {
      const line = new PIXI.Graphics();
      line.moveTo(this.offsetX, this.offsetY + y * this.blockSize);
      line.lineTo(
        this.offsetX + fieldWidth * this.blockSize,
        this.offsetY + y * this.blockSize
      );
      line.stroke({ width: 1, color: 0x888888, alpha: 0.5 });
      this.displayObject.addChild(line);
    }
  }

  private drawBlock(x: number, y: number, type: BlockType) {
    const baseColor = this.colors[type as keyof StageColors];
    if (baseColor === undefined) return;

    // 隣接ブロックの色を計算
    const blendedColor = this.colorCalculator.calculateBlendedColor(
      x,
      y,
      type,
      this.field
    );

    // クリア時のゴール色ブロックハイライト
    const isGoal = this.isGoalColor(blendedColor);
    let finalColor = blendedColor;
    let strokeColor = 0x666666;
    let strokeWidth = 1;

    if (this.isCleared && isGoal) {
      // 脈動効果（サイン波で明度を変化）
      const pulse = Math.sin(this.highlightFrames * 0.3) * 0.3 + 0.7;
      const r = Math.min(
        255,
        Math.round(((finalColor >> 16) & 0xff) * pulse + 255 * (1 - pulse))
      );
      const g = Math.min(
        255,
        Math.round(((finalColor >> 8) & 0xff) * pulse + 255 * (1 - pulse))
      );
      const b = Math.min(
        255,
        Math.round((finalColor & 0xff) * pulse + 255 * (1 - pulse))
      );
      finalColor = (r << 16) | (g << 8) | b;
      strokeColor = 0xffff00; // 黄色の枠線
      strokeWidth = 3;
    }

    const block = createRect(
      this.blockSize - 2, // 少し小さくして隙間を作る
      this.blockSize - 2,
      finalColor,
      this.offsetX + x * this.blockSize + 1,
      this.offsetY + y * this.blockSize + 1,
      { width: strokeWidth, color: strokeColor } // 枠線
    );

    this.displayObject.addChild(block);

    // ゴールには"G"の文字を表示
    if (type === "G") {
      // ブロックの色に応じてテキスト色を決定
      const blockColor = this.colorCalculator.calculateBlendedColor(
        x,
        y,
        type,
        this.field
      );
      const brightness = this.colorCalculator.calculateBrightness(blockColor);
      const textColor = brightness > 128 ? 0x000000 : 0xffffff; // 明るい背景なら黒、暗い背景なら白

      const goalText = createText(
        "G",
        20,
        textColor,
        0, // 後で中央揃えするため初期値は0
        0
      );

      // テキストの中央揃え
      goalText.x =
        this.offsetX +
        x * this.blockSize +
        (this.blockSize - goalText.width) / 2;
      goalText.y =
        this.offsetY +
        y * this.blockSize +
        (this.blockSize - goalText.height) / 2;

      this.displayObject.addChild(goalText);
    }
  }

  private createUI() {
    // ステージ名表示
    this.stageNameText = createText(this.stageName, 16, 0x333333, 10, 10);
    this.displayObject.addChild(this.stageNameText);

    // ノルマ表示
    this.quotaText = createText(
      `ノルマ: 0 / ${this.quota}`,
      14,
      0x333333,
      10,
      35
    );
    this.displayObject.addChild(this.quotaText);
  }

  private checkClearCondition() {
    // 現在のGブロックの色を取得
    const currentGoalColor = this.getCurrentGoalColor();
    const blockCount = this.countBlocksWithColor(currentGoalColor);

    // ノルマ表示を更新
    if (this.quotaText) {
      this.quotaText.text = `ノルマ: ${blockCount} / ${this.quota}`;
    }

    // クリア判定
    if (!this.isCleared && blockCount >= this.quota) {
      this.isCleared = true;
      this.showClearMessage();
    }
  }

  private countBlocksWithColor(targetColor: number): number {
    let count = 0;

    for (let y = 0; y < this.field.length; y++) {
      for (let x = 0; x < this.field[y].length; x++) {
        const blockType = this.field[y][x] as BlockType;
        if (blockType !== " ") {
          const blockColor = this.colorCalculator.calculateBlendedColor(
            x,
            y,
            blockType,
            this.field
          );
          // 指定された色かチェック
          if (this.colorCalculator.isSameColor(blockColor, targetColor)) {
            count++;
          }
        }
      }
    }

    return count;
  }

  private getCurrentGoalColor(): number {
    // Gブロックの位置を探す
    for (let y = 0; y < this.field.length; y++) {
      for (let x = 0; x < this.field[y].length; x++) {
        if (this.field[y][x] === "G") {
          // Gブロックの現在の色を計算
          return this.colorCalculator.calculateBlendedColor(
            x,
            y,
            "G",
            this.field
          );
        }
      }
    }
    return this.goalColor; // 見つからない場合はデフォルト
  }

  private isGoalColor(color: number): boolean {
    // 現在のGブロックの色を取得して比較
    const currentGoalColor = this.getCurrentGoalColor();
    return this.colorCalculator.isSameColor(color, currentGoalColor);
  }

  private showClearMessage() {
    const clearText = createText(
      "CLEAR!",
      24,
      0xff6600,
      WIDTH / 2 - 30,
      HEIGHT / 2 - 80
    );
    this.displayObject.addChild(clearText);

    // 次のステージボタン
    this.createNextStageButton();
  }

  private createNextStageButton() {
    // ボタンの背景
    this.nextStageButton = createRect(
      120,
      30,
      0x4caf50,
      WIDTH / 2 - 60,
      HEIGHT / 2 - 20,
      { width: 2, color: 0x2e7d2e }
    );
    this.displayObject.addChild(this.nextStageButton);

    // ボタンのテキスト
    const buttonText = createText(
      "次のステージ",
      14,
      0xffffff,
      WIDTH / 2 - 45,
      HEIGHT / 2 - 12
    );
    this.displayObject.addChild(buttonText);
  }

  private isClickOnNextStageButton(x: number, y: number): boolean {
    if (!this.nextStageButton || !this.isCleared) return false;

    const buttonX = WIDTH / 2 - 60;
    const buttonY = HEIGHT / 2 - 20;
    const buttonWidth = 120;
    const buttonHeight = 30;

    return (
      x >= buttonX &&
      x <= buttonX + buttonWidth &&
      y >= buttonY &&
      y <= buttonY + buttonHeight
    );
  }

  update(input: Input | null) {
    super.update(input);
    if (!input) return;

    const mousePos = input.getMousePosition();

    // クリア時のハイライト演出更新
    if (this.isCleared) {
      this.highlightFrames++;
      // 定期的に再描画してハイライト効果を更新
      if (this.highlightFrames % 3 === 0) {
        this.redrawField();
        this.checkClearCondition(); // 再描画後にUIを正しく更新
      }

      // 次のステージボタンのクリック判定
      if (
        input.isMouseJustPressed() &&
        this.isClickOnNextStageButton(mousePos.x, mousePos.y)
      ) {
        if (this.onNextStage) {
          this.onNextStage();
        }
        return;
      }
    }

    // ドラッグ開始
    if (input.isMouseJustPressed()) {
      const gridPos = this.screenToGrid(mousePos.x, mousePos.y);
      if (gridPos && this.isValidGridPosition(gridPos.x, gridPos.y)) {
        const blockType = this.field[gridPos.y][gridPos.x] as BlockType;
        if (blockType !== " ") {
          this.isDragging = true;
          this.dragStartPos = gridPos;
          this.selectedBlockType = blockType;
          this.cooldownFrames = 0; // リセット
        }
      }
    }

    // クールダウンを減らす
    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
    }

    // ドラッグ中の移動処理
    if (
      this.isDragging &&
      input.isMousePressed() &&
      this.dragStartPos &&
      this.cooldownFrames === 0
    ) {
      const startScreenX =
        this.offsetX +
        this.dragStartPos.x * this.blockSize +
        this.blockSize / 2;
      const startScreenY =
        this.offsetY +
        this.dragStartPos.y * this.blockSize +
        this.blockSize / 2;

      const deltaX = mousePos.x - startScreenX;
      const deltaY = mousePos.y - startScreenY;

      // 上下左右の最も大きい方向を決定
      let moveDir = { x: 0, y: 0 };
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 横方向の移動
        if (Math.abs(deltaX) > this.lastMoveThreshold) {
          moveDir.x = deltaX > 0 ? 1 : -1;
        }
      } else {
        // 縦方向の移動
        if (Math.abs(deltaY) > this.lastMoveThreshold) {
          moveDir.y = deltaY > 0 ? 1 : -1;
        }
      }

      // 移動を試行
      if ((moveDir.x !== 0 || moveDir.y !== 0) && this.selectedBlockType) {
        if (
          this.blockMover.tryMoveBlocks(
            this.selectedBlockType,
            moveDir.x,
            moveDir.y
          )
        ) {
          // 移動成功時は新しい開始位置を更新
          this.dragStartPos = {
            x: this.dragStartPos.x + moveDir.x,
            y: this.dragStartPos.y + moveDir.y,
          };
          this.cooldownFrames = 3; // 3フレームのクールダウン
          this.redrawField();
          this.checkClearCondition(); // クリア判定
        } else {
          // 移動失敗時もクールダウンを設定（振動防止）
          this.cooldownFrames = 5;
        }
      }
    }

    // ドラッグ終了
    if (input.isMouseJustReleased() && this.isDragging) {
      this.isDragging = false;
      this.dragStartPos = null;
      this.selectedBlockType = null;
      this.cooldownFrames = 0;
    }
  }

  private screenToGrid(
    screenX: number,
    screenY: number
  ): { x: number; y: number } | null {
    const x = Math.floor((screenX - this.offsetX) / this.blockSize);
    const y = Math.floor((screenY - this.offsetY) / this.blockSize);
    return { x, y };
  }

  private isValidGridPosition(x: number, y: number): boolean {
    return (
      y >= 0 && y < this.field.length && x >= 0 && x < this.field[y].length
    );
  }

  private redrawField() {
    // 全てのグラフィックを削除
    this.displayObject.removeChildren();

    // フィールドを再描画
    this.drawField();
    this.createUI();

    // クリア済みならメッセージも再表示
    if (this.isCleared) {
      this.showClearMessage();
    }
  }
}

class GameScene extends Scene {
  private currentStageIndex: number = 0;
  private currentGameField: GameField | null = null;

  constructor(game: Game, startStage: number = 0) {
    super(game);
    this.currentStageIndex = startStage;
    this.loadStage(this.currentStageIndex);
  }

  private loadStage(stageIndex: number) {
    // 現在のゲームフィールドを削除
    if (this.currentGameField) {
      this.removeActor(this.currentGameField);
    }

    // 新しいステージをロード
    if (stageIndex < STAGES.length) {
      this.currentStageIndex = stageIndex;
      this.currentGameField = new GameField(STAGES[stageIndex], 40, () =>
        this.nextStage()
      );
      this.currentGameField.addTo(this);
    } else {
      // 全ステージクリア
      console.log("全ステージクリア！");
    }
  }

  private nextStage() {
    this.loadStage(this.currentStageIndex + 1);
  }
}

async function main() {
  const game = new Game();

  await game.init({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x1a1a1a,
  });

  // テスト用: ステージ4から開始（ステージ1:0, ステージ2:1, ステージ3:2, ステージ4:3）
  const scene = new GameScene(game, 0);
  game.changeScene(scene);
}

main().catch(console.error);
