import { Actor, Game, Scene } from "../engine";
import * as PIXI from "pixi.js";

const WIDTH = 128;
const HEIGHT = 128;

class BlinkingCharacter extends Actor {
  private eyeTexture: PIXI.Texture;
  private sprite: PIXI.Sprite;
  private frameCount: number = 0;
  private blinkSequence: number[] = [0, 1, 2, 3, 2, 1, 0];
  private currentSequenceIndex: number = 0;
  private animationSpeed: number = 4; // フレーム数
  private waitFrames: number = 0; // 待機フレーム数
  private currentWaitTime: number = 0; // 現在の待機時間
  private game: Game;

  constructor(game: Game) {
    super();
    this.game = game;
    this.setupSprite();
    this.setRandomWaitTime();
  }

  private setRandomWaitTime() {
    // 60〜300フレーム（1〜5秒）のランダムな待機時間を設定
    this.currentWaitTime = Math.floor(Math.random() * 150) + 30;
    this.waitFrames = 0;
  }

  private setupSprite() {
    // Gameクラスでロード済みのテクスチャを取得
    this.eyeTexture = this.game.getAsset("eye")!;

    // ピクセルアートのためのフィルタリング設定
    this.eyeTexture.source.scaleMode = "nearest";

    // 最初のフレーム(0,0,64,64)の矩形を作成
    const rect = new PIXI.Rectangle(0, 0, 64, 64);
    const frameTexture = new PIXI.Texture({
      source: this.eyeTexture.source,
      frame: rect,
    });

    // スプライトを作成
    this.sprite = new PIXI.Sprite(frameTexture);

    // 2倍表示に設定
    this.sprite.scale.set(2, 2);

    // 画面中央に配置
    this.sprite.x = (WIDTH - 128) / 2;
    this.sprite.y = (HEIGHT - 128) / 2;

    this.displayObject.addChild(this.sprite);
  }

  update(input: any) {
    super.update(input);

    if (!this.sprite || !this.eyeTexture) return;

    // 瞬きアニメーション中でない場合は待機時間をカウント
    if (this.currentSequenceIndex === 0) {
      this.waitFrames++;

      // 待機時間が経過したら瞬きアニメーションを開始
      if (this.waitFrames >= this.currentWaitTime) {
        this.currentSequenceIndex = 1; // アニメーション開始
        this.frameCount = 0;
      }
    } else {
      // 瞬きアニメーション中
      this.frameCount++;

      // アニメーション速度に達したらフレームを更新
      if (this.frameCount >= this.animationSpeed) {
        this.frameCount = 0;

        // 現在のシーケンスインデックスから目のフレーム番号を取得
        const frameNumber = this.blinkSequence[this.currentSequenceIndex];

        // スプライトの矩形を更新 (横に64ピクセルずつずらす)
        const rect = new PIXI.Rectangle(frameNumber * 64, 0, 64, 64);
        this.sprite.texture = new PIXI.Texture({
          source: this.eyeTexture.source,
          frame: rect,
        });

        // 次のシーケンスインデックスに進む
        this.currentSequenceIndex =
          (this.currentSequenceIndex + 1) % this.blinkSequence.length;

        // アニメーションが終了したら次の待機時間を設定
        if (this.currentSequenceIndex === 0) {
          this.setRandomWaitTime();
        }
      }
    }
  }
}

class GameScene extends Scene {
  constructor(game: Game) {
    super(game);
    const character = new BlinkingCharacter(game);
    character.addTo(this);
  }
}

async function main() {
  const game = new Game();

  await game.init({
    width: WIDTH,
    height: HEIGHT,
    backgroundAlpha: 0, // 背景を透明にする
  });

  // アセットをロード
  await game.loadAsset("eye", "img/eye.png");
  
  const scene = new GameScene(game);
  game.changeScene(scene);
}

main().catch(console.error);
