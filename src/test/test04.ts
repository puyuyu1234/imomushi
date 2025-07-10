import { Actor, Game, Scene } from "../engine";
import * as PIXI from "pixi.js";

const WIDTH = 240;
const HEIGHT = 320;

// ゲームパラメータ定数
const GAME_CONFIG = {
  // 画面設定
  SCREEN: {
    WIDTH: 240,
    HEIGHT: 320,
    BACKGROUND_COLOR: 0xaaaaaa,
  },

  // 物理パラメータ
  PHYSICS: {
    GRAVITY: 0.15,
    THREAD_ATTRACTION_FORCE: 0.5,
    VELOCITY_DAMPING: 0.98,
    BLOCK_COLLISION_DAMPING: 0.3,
  },

  // プレイヤー設定
  PLAYER: {
    SPAWN_X: 120,
    SPAWN_Y: 320,
    BODY_LENGTH: 7,
    SEGMENT_DISTANCE: 4,
    HITBOX_SIZE: 6,
    BODY_ATTRACTION_DIVISOR: 3,
    BODY_DIRECTION_LENGTH: 4,
  },

  // 糸設定
  THREAD: {
    SPEED: 24,
    WIDTH: 1,
    COLOR: 0xffffff,
  },

  // ブロック設定
  BLOCK: {
    MIN_SIZE: 20,
    MAX_SIZE: 60,
    SPAWN_INTERVAL: 30, // フレーム数
    MIN_SPEED: 1,
    MAX_SPEED: 2.5,
  },

  // パーティクル設定
  PARTICLE: {
    VX_RANGE: 16,
    VY_MIN: -32,
    VY_MAX: -8,
    GRAVITY: 0.2,
    LIFETIME: 60,
    COUNT: 15,
    SIZE: 2,
  },

  // カメラ設定
  CAMERA: {
    THRESHOLD_RATIO: 0.4, // 画面の40%
  },

  // ゲームオーバー設定
  GAMEOVER: {
    FADE_DURATION: 90, // フレーム数
    RETRY_DELAY: 6, // フレーム数
  },

  // UI設定
  UI: {
    FONT_FAMILY: "MS Gothic",
    SCORE_SIZE: 16,
    TITLE_SIZE: 20,
    SUBTITLE_SIZE: 14,
    TEXT_COLOR: 0x000000,
    GAMEOVER_TEXT_COLOR: 0xffffff,
    GAMEOVER_BG_COLOR: 0x000000,
  },
} as const;
const game = new Game();
game
  .init({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0xaaaaaa,
    preference: "webgl",
    hello: true,
  })
  .then(async () => {
    // フレームレートを60fpsに制限
    game.app.ticker.maxFPS = 60;

    await game.loadAsset("player", "img/player.png");
    game.changeScene(new MainScene(game));
  });

class GameOverScene extends Scene {
  private gameOverText: PIXI.Text;
  private scoreText: PIXI.Text;
  private retryText: PIXI.Text;
  private frameCount: number = 0;
  private canRetry: boolean = false;
  private clickHandler: (event: MouseEvent) => void;

  constructor(game: Game, finalScore: number) {
    super(game);

    // 黒背景
    const background = new PIXI.Graphics();
    background.rect(0, 0, WIDTH, HEIGHT);
    background.fill(0x000000);
    this.displayObject.addChild(background);

    // Game Over テキスト
    this.gameOverText = new PIXI.Text({
      text: "GAME OVER",
      style: {
        fontFamily: "MS Gothic",
        fontSize: 20,
        fill: 0xffffff,
      },
    });
    this.gameOverText.anchor.set(0.5);
    this.gameOverText.x = WIDTH / 2;
    this.gameOverText.y = HEIGHT / 2 - 50;
    this.displayObject.addChild(this.gameOverText);

    // スコア表示
    this.scoreText = new PIXI.Text({
      text: `Score: ${finalScore}`,
      style: {
        fontFamily: "MS Gothic",
        fontSize: 16,
        fill: 0xffffff,
      },
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.x = WIDTH / 2;
    this.scoreText.y = HEIGHT / 2;
    this.displayObject.addChild(this.scoreText);

    // リトライ案内（最初は非表示）
    this.retryText = new PIXI.Text({
      text: "Click to Retry",
      style: {
        fontFamily: "MS Gothic",
        fontSize: 14,
        fill: 0xffffff,
      },
    });
    this.retryText.anchor.set(0.5);
    this.retryText.x = WIDTH / 2;
    this.retryText.y = HEIGHT / 2 + 50;
    this.retryText.visible = false;
    this.displayObject.addChild(this.retryText);

    // mousedownイベント
    this.clickHandler = this.onCanvasClick.bind(this);
    this.game.app.canvas.addEventListener("mousedown", this.clickHandler);
  }

  update() {
    super.update();

    this.frameCount++;
    if (this.frameCount >= 6) {
      this.canRetry = true;
      this.retryText.visible = true;
    }
  }

  private onCanvasClick() {
    if (this.canRetry) {
      // 新しいメインシーンに遷移
      this.game.changeScene(new MainScene(this.game));
    }
  }

  destroy() {
    // イベントリスナーを削除（保存したハンドラーを使用）
    this.game.app.canvas.removeEventListener("mousedown", this.clickHandler);
    super.destroy();
  }
}

class Block extends Actor {
  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;
  public vx: number;
  public vy: number;
  private attachedThread: Thread | null = null;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    vx: number,
    vy: number = 0
  ) {
    super();

    this.width = width;
    this.height = height;
    this.vx = vx;
    this.vy = vy;

    this.graphics = new PIXI.Graphics();
    this.graphics.rect(0, 0, width, height);
    this.graphics.fill(0xffffff);
    this.graphics.stroke({ width: 1, color: 0x000000 });

    this.displayObject.addChild(this.graphics);
    this.displayObject.x = x;
    this.displayObject.y = y;
  }

  update() {
    super.update();
    this.displayObject.x += this.vx;
    this.displayObject.y += this.vy;

    // 画面外に出たか判定
    if (this.displayObject.x < -this.width || this.displayObject.x > WIDTH) {
      if (this.attachedThread) {
        // Sceneから削除してから破棄
        const scene = this.attachedThread.scene as MainScene;
        scene.removeActor(this.attachedThread);
      }
      // 自身も削除（Sceneからは自動で削除される）
    }
  }

  attachThread(thread: Thread) {
    this.attachedThread = thread;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.displayObject.x,
      y: this.displayObject.y,
      width: this.width,
      height: this.height,
    };
  }
}

class Thread extends Actor {
  private line: PIXI.Graphics;
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private directionX: number;
  private directionY: number;
  private speed: number = GAME_CONFIG.THREAD.SPEED;
  private currentLength: number = 0;
  private isAttached: boolean = false;
  private attachedBlock: Block | null = null;
  private attachPointX: number = 0;
  private attachPointY: number = 0;
  private targetX: number; // 元々のクリック位置
  private targetY: number;

  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    public scene: Scene
  ) {
    super();

    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;
    this.targetX = targetX;
    this.targetY = targetY;

    // 方向を正規化
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.directionX = dx / distance;
    this.directionY = dy / distance;

    this.line = new PIXI.Graphics();
    this.displayObject.addChild(this.line);

    this.drawLine();
  }

  update() {
    super.update();

    if (!this.isAttached) {
      // 通常の伸長処理（最大長制限なし）
      this.currentLength += this.speed;

      // 現在の開始位置から目標方向に伸ばす
      const dx = this.targetX - this.startX;
      const dy = this.targetY - this.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        this.directionX = dx / distance;
        this.directionY = dy / distance;
      }

      this.endX = this.startX + this.directionX * this.currentLength;
      this.endY = this.startY + this.directionY * this.currentLength;

      // 衝突判定
      this.checkCollision();
    } else if (this.attachedBlock) {
      // ブロックに追従
      this.endX = this.attachedBlock.displayObject.x + this.attachPointX;
      this.endY = this.attachedBlock.displayObject.y + this.attachPointY;
    }

    this.drawLine();
  }

  private checkCollision() {
    const actors = (this.scene as MainScene).getActors();
    for (const actor of actors) {
      if (actor instanceof Block) {
        const bounds = actor.getBounds();
        if (
          this.endX >= bounds.x &&
          this.endX <= bounds.x + bounds.width &&
          this.endY >= bounds.y &&
          this.endY <= bounds.y + bounds.height
        ) {
          // 衝突した
          this.isAttached = true;
          this.attachedBlock = actor;
          this.attachPointX = this.endX - bounds.x;
          this.attachPointY = this.endY - bounds.y;
          actor.attachThread(this);
          break;
        }
      }
    }
  }

  private drawLine() {
    this.line.clear();
    this.line.moveTo(this.startX, this.startY);
    this.line.lineTo(this.endX, this.endY);
    this.line.stroke({ width: 1, color: 0xffffff });
  }

  isAttachedToBlock(): boolean {
    return this.isAttached;
  }

  getEndPosition(): { x: number; y: number } {
    return { x: this.endX, y: this.endY };
  }

  updateStartPosition(x: number, y: number) {
    this.startX = x;
    this.startY = y;
  }
}

class Particle extends Actor {
  private graphics: PIXI.Graphics;
  private vx: number;
  private vy: number;
  private life: number;
  private maxLife: number;

  constructor(x: number, y: number) {
    super();

    this.graphics = new PIXI.Graphics();
    this.graphics.circle(0, 0, 2);
    this.graphics.fill(0x000000);
    this.displayObject.addChild(this.graphics);

    this.displayObject.x = x;
    this.displayObject.y = y;

    // ランダムな速度（上向きに飛ぶように調整）
    this.vx = (Math.random() - 0.5) * GAME_CONFIG.PARTICLE.VX_RANGE;
    this.vy =
      -Math.random() *
        (GAME_CONFIG.PARTICLE.VY_MIN - GAME_CONFIG.PARTICLE.VY_MAX) +
      GAME_CONFIG.PARTICLE.VY_MAX;
    this.maxLife = GAME_CONFIG.PARTICLE.LIFETIME;
    this.life = this.maxLife;
  }

  update() {
    super.update();

    // 重力
    this.vy += GAME_CONFIG.PARTICLE.GRAVITY;

    // 位置更新
    this.displayObject.x += this.vx;
    this.displayObject.y += this.vy;

    // ライフ減少
    this.life--;

    // フェードアウト
    this.displayObject.alpha = this.life / this.maxLife;

    // 寿命が尽きたら削除フラグを立てる
    if (this.life <= 0) {
      this.markForDestroy = true;
    }
  }

  markForDestroy: boolean = false;
}

class Floor extends Actor {
  private graphics: PIXI.Graphics;
  private width: number;
  private height: number;

  constructor(x: number, y: number, width: number, height: number) {
    super();

    this.width = width;
    this.height = height;

    this.graphics = new PIXI.Graphics();
    this.graphics.rect(0, 0, width, height);
    this.graphics.fill(0xffffff);
    this.graphics.stroke({ width: 1, color: 0x000000 });

    this.displayObject.addChild(this.graphics);
    this.displayObject.x = x;
    this.displayObject.y = y;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.displayObject.x,
      y: this.displayObject.y,
      width: this.width,
      height: this.height,
    };
  }
}

class BodySegment extends Actor {
  private sprite: PIXI.Sprite;
  private x: number;
  private y: number;
  public vx: number = 0;
  public vy: number = 0;
  private headDirectionAngle: number = 0;

  constructor(game: Game, x: number, y: number, isBody1: boolean) {
    super();

    const texture = game.getAsset("player");
    if (!texture) {
      throw new Error("Player texture not loaded");
    }

    // Body1は[16,0,16,16], Body2は[32,0,16,16]
    const frameX = isBody1 ? 16 : 32;
    const frame = new PIXI.Rectangle(frameX, 0, 16, 16);
    const bodyTexture = new PIXI.Texture({
      source: texture.source,
      frame: frame,
    });

    this.sprite = new PIXI.Sprite(bodyTexture);
    this.sprite.anchor.set(0.5, 0.5);
    this.displayObject.addChild(this.sprite);

    this.x = x;
    this.y = y;
    this.updateSpritePosition();
  }

  update() {
    super.update();

    // 位置更新（速度はHeadクラスで設定される）
    this.x += this.vx;
    this.y += this.vy;

    this.updateSpritePosition();
  }

  private updateSpritePosition() {
    this.sprite.x = Math.round(this.x); // 描画時のみ整数化
    this.sprite.y = Math.round(this.y); // 描画時のみ整数化

    // 向きに応じてスプライトを反転
    if (this.headDirectionAngle === 180) {
      this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
    } else {
      this.sprite.scale.x = Math.abs(this.sprite.scale.x);
    }
  }

  setHeadDirection(angle: number) {
    this.headDirectionAngle = angle;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}

class Head extends Actor {
  public currentThread: Thread | null = null;
  private sprite: PIXI.Sprite;
  private x: number = GAME_CONFIG.PLAYER.SPAWN_X;
  private y: number = GAME_CONFIG.PLAYER.SPAWN_Y;
  private vx: number = 0;
  private vy: number = 0;
  private bodySegments: BodySegment[] = [];
  private bodyPositionHistory: { x: number; y: number }[] = [];
  private readonly BODY_LENGTH = GAME_CONFIG.PLAYER.BODY_LENGTH;
  private readonly SEGMENT_DISTANCE = GAME_CONFIG.PLAYER.SEGMENT_DISTANCE;
  private directionAngle: number = 0; // 主人公の向き（度数法）
  private ridingBlock: Block | null = null; // 乗っているブロック

  constructor(private game: Game, private scene: Scene) {
    super();
    this.init();
  }

  private init() {
    const texture = this.game.getAsset("player");
    if (!texture) {
      throw new Error("Player texture not loaded");
    }

    const frame = new PIXI.Rectangle(0, 0, 16, 16);
    const headTexture = new PIXI.Texture({
      source: texture.source,
      frame: frame,
    });

    this.sprite = new PIXI.Sprite(headTexture);
    this.sprite.anchor.set(0.5, 0.5);
    this.displayObject.addChild(this.sprite);
    this.updateSpritePosition();

    // マウスイベントリスナーを追加
    this.game.app.canvas.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this)
    );
    this.game.app.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.game.app.canvas.addEventListener(
      "mouseleave",
      this.onMouseUp.bind(this)
    );

    // 体のセグメントを作成
    this.initBodySegments();
  }

  private initBodySegments() {
    // 初期位置から体のセグメントを作成
    for (let i = 0; i < this.BODY_LENGTH; i++) {
      const isBody1 = i % 2 === 0; // 交互にBody1とBody2
      const segmentX = this.x;
      const segmentY = this.y + (i + 1) * this.SEGMENT_DISTANCE; // 下方向に配置

      const segment = new BodySegment(this.game, segmentX, segmentY, isBody1);
      this.bodySegments.push(segment);
      this.scene.addActor(segment);
    }

    // 初期位置履歴を作成
    for (let i = 0; i <= this.BODY_LENGTH; i++) {
      this.bodyPositionHistory.push({ x: this.x, y: this.y });
    }
  }

  update() {
    super.update();

    // 糸がブロックに刺さっている場合、引力を計算
    if (this.currentThread && this.currentThread.isAttachedToBlock()) {
      // 糸がまだ存在するかチェック
      const actors = (this.scene as MainScene).getActors();
      const threadExists = actors.includes(this.currentThread);

      if (threadExists) {
        const threadEnd = this.currentThread.getEndPosition();
        const dx = threadEnd.x - this.x;
        const dy = threadEnd.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // 引力の強さ（距離に比例）
          const force = GAME_CONFIG.PHYSICS.THREAD_ATTRACTION_FORCE;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          this.vx += fx;
          this.vy += fy;
        }
      } else {
        // 糸が消えた場合、参照をクリア
        this.currentThread = null;
      }
    }

    // 重力を追加
    this.vy += GAME_CONFIG.PHYSICS.GRAVITY;

    // 速度減衰
    this.vx *= GAME_CONFIG.PHYSICS.VELOCITY_DAMPING;
    this.vy *= GAME_CONFIG.PHYSICS.VELOCITY_DAMPING;

    // 位置更新
    this.x += this.vx;
    this.y += this.vy;

    // 床との衝突判定
    this.checkFloorCollision();

    // ブロックとの衝突判定
    this.checkBlockCollision();

    // ブロックに乗っているかチェック
    this.checkRidingBlock();

    // 画面端の制限（左右のみ）
    this.x = Math.max(8, Math.min(WIDTH - 8, this.x));
    // 上方向の制限を削除、下方向は別途ゲームオーバー判定するため制限なし

    // 向きの更新
    this.updateDirection();

    this.updateSpritePosition();
    this.updateBodySegments();

    // 糸の開始位置を主人公の口に更新
    if (this.currentThread) {
      const mouthX = this.x + 7 - 8;
      const mouthY = this.y + 12 - 8;
      this.currentThread.updateStartPosition(mouthX, mouthY);
    }
  }

  private checkRidingBlock() {
    this.ridingBlock = null;
    const actors = (this.scene as MainScene).getActors();

    for (const actor of actors) {
      if (actor instanceof Block) {
        const bounds = actor.getBounds();
        // 主人公の足元が少しでもブロックの上面に触れているかチェック
        const headBottom = this.y + 8;
        const headLeft = this.x - 6;
        const headRight = this.x + 6;

        if (
          headBottom >= bounds.y - 2 && // 少し余裕を持たせる
          headBottom <= bounds.y + 4 &&
          headRight > bounds.x &&
          headLeft < bounds.x + bounds.width
        ) {
          this.ridingBlock = actor;
          // ブロックと一緒に移動
          this.x += actor.vx;
          this.y += actor.vy;
          break;
        }
      }
    }
  }

  private updateDirection() {
    // 水平速度に基づいて向きとスケールを更新
    if (this.vx > 0) {
      this.sprite.scale.x = 1;
      this.directionAngle = 0;
    } else if (this.vx < 0) {
      this.sprite.scale.x = -1;
      this.directionAngle = 180;
    }
    // vx = 0の場合は現在の向きを維持
  }

  private updateBodySegments() {
    const k = GAME_CONFIG.PLAYER.BODY_ATTRACTION_DIVISOR;
    const directionLength = GAME_CONFIG.PLAYER.BODY_DIRECTION_LENGTH;

    // 糸の方向を基準に体の方向を決定
    let directionX = 0;
    let directionY = directionLength; // デフォルトは下向き

    if (this.currentThread && this.currentThread.isAttachedToBlock()) {
      // 糸がある場合は糸の方向の反対
      const threadEnd = this.currentThread.getEndPosition();
      const dx = threadEnd.x - this.x;
      const dy = threadEnd.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // 糸の方向の反対に体を配置
        directionX = -(dx / distance) * directionLength;
        directionY = -(dy / distance) * directionLength;
      }
    } else {
      // 糸がない場合は主人公の向きの反対
      directionX =
        directionLength * Math.cos((this.directionAngle * Math.PI) / 180);
      directionY =
        directionLength * Math.sin((this.directionAngle * Math.PI) / 180);
    }

    // 各セグメントの速度を計算（逆順で処理）
    for (let i = this.bodySegments.length - 1; i >= 0; i--) {
      const currentSegment = this.bodySegments[i];
      let targetX: number, targetY: number;

      if (i === this.bodySegments.length - 1) {
        // 最後のセグメント（headに最も近い）は頭を追従
        targetX = this.x - directionX;
        targetY = this.y - directionY;
      } else {
        // 他のセグメントは次のセグメントを追従
        const nextSegment = this.bodySegments[i + 1];
        const nextPos = nextSegment.getPosition();
        targetX = nextPos.x - directionX;
        targetY = nextPos.y - directionY;
      }

      // 引力ベースの速度計算
      const currentPos = currentSegment.getPosition();
      currentSegment.vx = (targetX - currentPos.x) / k;
      currentSegment.vy = (targetY - currentPos.y) / k;

      // 頭の向きを体に伝える
      currentSegment.setHeadDirection(this.directionAngle);
    }
  }

  private checkFloorCollision() {
    const actors = (this.scene as MainScene).getActors();
    for (const actor of actors) {
      if (actor instanceof Floor) {
        const bounds = actor.getBounds();
        // 主人公の下端が床の上端に当たった場合
        if (
          this.x - 8 < bounds.x + bounds.width &&
          this.x + 8 > bounds.x &&
          this.y + 8 >= bounds.y &&
          this.y - 8 < bounds.y + bounds.height
        ) {
          // 床の上に配置
          this.y = bounds.y - 8;
          this.vy = 0; // 垂直速度をリセット
          break;
        }
      }
    }
  }

  private checkBlockCollision() {
    const actors = (this.scene as MainScene).getActors();
    for (const actor of actors) {
      if (actor instanceof Block) {
        const bounds = actor.getBounds();
        // 主人公の当たり判定（中心から±6pxの範囲）
        const headLeft = this.x - 6;
        const headRight = this.x + 6;
        const headTop = this.y - 6;
        const headBottom = this.y + 6;

        // 衝突判定
        if (
          headRight > bounds.x &&
          headLeft < bounds.x + bounds.width &&
          headBottom > bounds.y &&
          headTop < bounds.y + bounds.height
        ) {
          // ブロックから押し出す（改良版）
          const overlapX = Math.min(
            headRight - bounds.x,
            bounds.x + bounds.width - headLeft
          );
          const overlapY = Math.min(
            headBottom - bounds.y,
            bounds.y + bounds.height - headTop
          );

          // より小さい重複方向に押し出し、その方向の速度のみ調整
          if (overlapX < overlapY) {
            // 横方向の押し出し - Y速度は保持
            if (this.x < bounds.x + bounds.width / 2) {
              this.x = bounds.x - 6;
            } else {
              this.x = bounds.x + bounds.width + 6;
            }
            // X方向の移動のみ制限
            if (
              (this.vx > 0 && this.x < bounds.x) ||
              (this.vx < 0 && this.x > bounds.x + bounds.width)
            ) {
              this.vx = 0;
            }
          } else {
            // 縦方向の押し出し - X速度は保持
            if (this.y < bounds.y + bounds.height / 2) {
              this.y = bounds.y - 6;
            } else {
              this.y = bounds.y + bounds.height + 6;
            }
            // Y方向の移動のみ制限
            if (
              (this.vy > 0 && this.y < bounds.y) ||
              (this.vy < 0 && this.y > bounds.y + bounds.height)
            ) {
              this.vy = 0;
            }
          }
          break;
        }
      }
    }
  }

  private updateSpritePosition() {
    this.sprite.x = Math.round(this.x); // 描画時のみ整数化
    this.sprite.y = Math.round(this.y); // 描画時のみ整数化
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  private onMouseDown(event: MouseEvent) {
    // ゲームオーバー中は糸を発射しない
    const mainScene = this.scene as MainScene;
    if (mainScene.isGameOver) {
      return;
    }

    // キャンバスのスケールを考慮した座標変換
    const rect = this.game.app.canvas.getBoundingClientRect();
    const scaleX = this.game.app.canvas.width / rect.width;
    const scaleY = this.game.app.canvas.height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // カメラのオフセットを考慮
    const cameraY = mainScene.getCameraY();
    const worldClickY = clickY + cameraY;

    // 口の位置（7,12）から糸を発射
    const mouthX = this.x + 7 - 8; // 現在位置 + 口の相対位置(7) - スプライト中心オフセット(8)
    const mouthY = this.y + 12 - 8; // 現在位置 + 口の相対位置(12) - スプライト中心オフセット(8)

    this.currentThread = new Thread(
      mouthX,
      mouthY,
      clickX,
      worldClickY,
      this.scene
    );
    this.scene.addActor(this.currentThread);
  }

  private onMouseUp() {
    if (this.currentThread) {
      this.scene.removeActor(this.currentThread);
      this.currentThread = null;
    }
  }
}

class MainScene extends Scene {
  private blockSpawnTimer: number = 0;
  private blockSpawnInterval: number = GAME_CONFIG.BLOCK.SPAWN_INTERVAL;
  private head: Head;
  private cameraY: number = 0;
  private cameraThreshold: number = HEIGHT * GAME_CONFIG.CAMERA.THRESHOLD_RATIO;
  private scoreText: PIXI.Text;
  private maxScore: number = 0;
  public isGameOver: boolean = false;
  private gameOverTimer: number = 0;
  private fadeOverlay: PIXI.Graphics | null = null;

  constructor(game: Game) {
    super(game);

    // 床を作成
    const floor = new Floor(0, 320, WIDTH, 20); // 画面下部に床を配置
    this.addActor(floor);

    // 主人公を作成（体のセグメントが先に追加される）
    this.head = new Head(game, this);

    // スコア表示
    this.scoreText = new PIXI.Text({
      text: "Score: 0",
      style: {
        fontFamily: "MS Gothic",
        fontSize: 16,
        fill: 0x000000,
      },
    });
    this.scoreText.x = 10;
    this.scoreText.y = 10;
  }

  update() {
    super.update();

    this.blockSpawnTimer++;
    if (this.blockSpawnTimer >= this.blockSpawnInterval) {
      this.blockSpawnTimer = 0;
      this.spawnBlock();
    }

    // 初回のみ主人公を追加（最上位レイヤーに配置するため）
    if (!this.actors.includes(this.head)) {
      // 主人公の頭を最後に追加（最上位レイヤー）
      this.addActor(this.head);
      // スコアテキストを追加（UIレイヤー）
      this.game.app.stage.addChild(this.scoreText);
    }

    // カメラ制御
    const headPos = this.head.getPosition();
    const screenY = headPos.y - this.cameraY;

    // 主人公が画面上部に行ったらカメラを上げる
    if (screenY < this.cameraThreshold) {
      this.cameraY = headPos.y - this.cameraThreshold;
    }

    // 主人公が画面下に出たら死亡開始
    if (screenY > HEIGHT && !this.isGameOver) {
      this.isGameOver = true;
      this.gameOverTimer = 0;

      // パーティクルエフェクトを生成
      this.spawnDeathParticles(headPos.x, headPos.y);

      // 暗転オーバーレイを作成
      this.createFadeOverlay();
    }

    // 糸で復活チェック
    if (
      this.isGameOver &&
      this.head.currentThread &&
      this.head.currentThread.isAttachedToBlock()
    ) {
      // 糸がブロックに刺さったら復活
      this.isGameOver = false;
      this.gameOverTimer = 0;

      // 暗転オーバーレイを削除
      if (this.fadeOverlay) {
        if (this.fadeOverlay.parent) {
          this.fadeOverlay.parent.removeChild(this.fadeOverlay);
        }
        this.fadeOverlay.destroy();
        this.fadeOverlay = null;
      }
    }

    // ゲームオーバー処理
    if (this.isGameOver) {
      this.gameOverTimer++;

      // パーティクルを削除
      this.actors = this.actors.filter((actor) => {
        if (actor instanceof Particle && actor.markForDestroy) {
          this.removeActor(actor);
          return false;
        }
        return true;
      });

      // 暗転エフェクト
      if (this.fadeOverlay) {
        const fadeProgress =
          this.gameOverTimer / GAME_CONFIG.GAMEOVER.FADE_DURATION;
        this.fadeOverlay.alpha = Math.min(fadeProgress, 1.0);
      }

      // 90フレーム（1.5秒）後にゲームオーバー画面へ
      if (this.gameOverTimer >= GAME_CONFIG.GAMEOVER.FADE_DURATION) {
        // スコアテキストを削除
        if (this.scoreText.parent) {
          this.scoreText.parent.removeChild(this.scoreText);
        }
        this.game.changeScene(new GameOverScene(this.game, this.maxScore));
        return;
      }
    }

    // スコア更新（Y座標の負の値が高さ）
    const currentScore = Math.max(0, Math.floor(-(headPos.y - 240)));
    this.maxScore = Math.max(this.maxScore, currentScore);
    this.scoreText.text = `Score: ${this.maxScore}`;

    // カメラのオフセットを適用
    this.displayObject.y = -this.cameraY;
  }

  private spawnBlock() {
    // ランダムなサイズ
    const width = 20 + Math.random() * 40; // 20〜60px
    const height = 20 + Math.random() * 40; // 20〜60px

    // 左右どちらから出現するか
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -width : WIDTH;
    // カメラを考慮したY座標（画面上半分 + 画面上の見えない部分）
    const y = this.cameraY - HEIGHT / 2 + Math.random() * HEIGHT;

    // スコアに応じて斜め移動を追加
    const difficulty = Math.min(this.maxScore / 5000, 1.0); // スコア5000で最大難易度

    // 速度にランダムなばらつきを追加
    const baseSpeed = 1 + Math.random() * 1; // 1〜3の範囲でランダム速度
    let vx = fromLeft ? baseSpeed : -baseSpeed; // 基本の横移動
    let vy = 0; // 縦移動

    // 難易度に応じて斜め移動を追加
    if (difficulty > 0.3) {
      vy = (Math.random() - 0.5) * difficulty * 2; // -1 〜 1 の範囲で縦移動
    }

    const block = new Block(x, y, width, height, vx, vy);
    // ブロックを先に追加（下のレイヤー）
    const headIndex = this.actors.indexOf(this.head);
    if (headIndex !== -1) {
      // 主人公の前に挿入
      this.actors.splice(headIndex, 0, block);
      this.displayObject.addChildAt(block.displayObject, headIndex);
    } else {
      this.addActor(block);
    }
  }

  getActors() {
    return this.actors;
  }

  getCameraY() {
    return this.cameraY;
  }

  private spawnDeathParticles(x: number, y: number) {
    // パーティクルを生成
    for (let i = 0; i < GAME_CONFIG.PARTICLE.COUNT; i++) {
      const particle = new Particle(x, y);
      this.addActor(particle);
    }
  }

  private createFadeOverlay() {
    this.fadeOverlay = new PIXI.Graphics();
    this.fadeOverlay.rect(0, 0, WIDTH, HEIGHT);
    this.fadeOverlay.fill(0x000000);
    this.fadeOverlay.alpha = 0;

    // カメラの影響を受けないように直接gameのstageに追加
    this.game.app.stage.addChild(this.fadeOverlay);
  }

  destroy() {
    // fadeOverlayを削除
    if (this.fadeOverlay && this.fadeOverlay.parent) {
      this.fadeOverlay.parent.removeChild(this.fadeOverlay);
      this.fadeOverlay.destroy();
      this.fadeOverlay = null;
    }
    super.destroy();
  }
}
