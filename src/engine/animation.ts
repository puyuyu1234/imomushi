import * as PIXI from "pixi.js";
import { Actor } from "./actor";
import { Input } from "./input";

// アニメーションシーケンス定義
export interface FrameSequence {
  frames: number[];           // フレーム番号の配列
  speed: number;             // フレーム間の待機時間
  loop: boolean;             // ループするかどうか
  next?: string;             // 終了後に再生するアニメーション名
}

// アニメーション設定
export interface AnimationConfig {
  [animationName: string]: FrameSequence;
}

// スプライトシート情報
export interface SpriteSheetInfo {
  texture: PIXI.Texture;
  frameWidth: number;
  frameHeight: number;
  framesPerRow?: number;     // 指定しない場合は自動計算
}

// アニメーション状態
interface AnimationState {
  currentAnimation: string;
  frameIndex: number;
  frameTimer: number;
  isPlaying: boolean;
  isComplete: boolean;
}

/**
 * スプライトアニメーション管理クラス
 * 単一のスプライトに対するアニメーション制御を行う
 */
export class SpriteAnimationManager {
  private sprite: PIXI.Sprite;
  private spriteSheetInfo: SpriteSheetInfo;
  private animations: Map<string, FrameSequence> = new Map();
  private state: AnimationState;
  
  // フレームテクスチャの事前生成（パフォーマンス最適化）
  private frameTextures: PIXI.Texture[] = [];
  private framesPerRow: number;
  
  constructor(
    sprite: PIXI.Sprite,
    spriteSheetInfo: SpriteSheetInfo,
    animationConfig: AnimationConfig
  ) {
    this.sprite = sprite;
    this.spriteSheetInfo = spriteSheetInfo;
    
    // フレーム数を計算
    this.framesPerRow = spriteSheetInfo.framesPerRow || 
      Math.floor(spriteSheetInfo.texture.width / spriteSheetInfo.frameWidth);
    
    // アニメーション設定を登録
    Object.entries(animationConfig).forEach(([name, sequence]) => {
      this.animations.set(name, sequence);
    });
    
    // 初期状態設定
    this.state = {
      currentAnimation: '',
      frameIndex: 0,
      frameTimer: 0,
      isPlaying: false,
      isComplete: false
    };
    
    // フレームテクスチャを事前生成
    this.preGenerateFrameTextures();
  }
  
  /**
   * フレームテクスチャを事前生成
   * 初期化時に一度だけ実行することでランタイムパフォーマンスを向上
   */
  private preGenerateFrameTextures(): void {
    const maxFrames = this.calculateMaxFrameNumber();
    
    for (let frameNumber = 0; frameNumber <= maxFrames; frameNumber++) {
      const x = (frameNumber % this.framesPerRow) * this.spriteSheetInfo.frameWidth;
      const y = Math.floor(frameNumber / this.framesPerRow) * this.spriteSheetInfo.frameHeight;
      
      const frameTexture = new PIXI.Texture({
        source: this.spriteSheetInfo.texture.source,
        frame: new PIXI.Rectangle(
          x, y, 
          this.spriteSheetInfo.frameWidth, 
          this.spriteSheetInfo.frameHeight
        )
      });
      
      this.frameTextures[frameNumber] = frameTexture;
    }
  }
  
  /**
   * アニメーション設定から最大フレーム番号を計算
   */
  private calculateMaxFrameNumber(): number {
    let maxFrame = 0;
    this.animations.forEach(sequence => {
      const sequenceMax = Math.max(...sequence.frames);
      maxFrame = Math.max(maxFrame, sequenceMax);
    });
    return maxFrame;
  }
  
  /**
   * アニメーションを再生
   * @param animationName アニメーション名
   * @param force 同じアニメーションでも強制的に最初から再生
   */
  play(animationName: string, force: boolean = false): boolean {
    const animation = this.animations.get(animationName);
    if (!animation) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
    }
    
    // 既に同じアニメーションが再生中で、強制フラグがない場合はスキップ
    if (!force && this.state.currentAnimation === animationName && this.state.isPlaying) {
      return true;
    }
    
    this.state.currentAnimation = animationName;
    this.state.frameIndex = 0;
    this.state.frameTimer = 0;
    this.state.isPlaying = true;
    this.state.isComplete = false;
    
    // 最初のフレームを即座に適用
    this.updateSpriteFrame();
    
    return true;
  }
  
  /**
   * アニメーションを停止
   */
  stop(): void {
    this.state.isPlaying = false;
  }
  
  /**
   * アニメーションを一時停止
   */
  pause(): void {
    this.state.isPlaying = false;
  }
  
  /**
   * アニメーションを再開
   */
  resume(): void {
    if (this.state.currentAnimation) {
      this.state.isPlaying = true;
    }
  }
  
  /**
   * 毎フレーム呼び出すアップデート処理
   * @returns アニメーションが完了した場合true
   */
  update(): boolean {
    if (!this.state.isPlaying || !this.state.currentAnimation) {
      return false;
    }
    
    const animation = this.animations.get(this.state.currentAnimation);
    if (!animation) return false;
    
    this.state.frameTimer++;
    
    // フレーム更新タイミング
    if (this.state.frameTimer >= animation.speed) {
      this.state.frameTimer = 0;
      this.state.frameIndex++;
      
      // アニメーション終了判定
      if (this.state.frameIndex >= animation.frames.length) {
        if (animation.loop) {
          this.state.frameIndex = 0;
        } else {
          this.state.frameIndex = animation.frames.length - 1;
          this.state.isPlaying = false;
          this.state.isComplete = true;
          
          // 次のアニメーションがある場合は自動再生
          if (animation.next) {
            this.play(animation.next);
          }
          
          return true; // アニメーション完了
        }
      }
      
      this.updateSpriteFrame();
    }
    
    return false;
  }
  
  /**
   * スプライトのフレームを更新
   */
  private updateSpriteFrame(): void {
    const animation = this.animations.get(this.state.currentAnimation);
    if (!animation) return;
    
    const frameNumber = animation.frames[this.state.frameIndex];
    
    // 事前生成されたテクスチャを使用
    if (this.frameTextures[frameNumber]) {
      this.sprite.texture = this.frameTextures[frameNumber];
    }
  }
  
  /**
   * 現在のアニメーション状態を取得
   */
  getCurrentAnimation(): string {
    return this.state.currentAnimation;
  }
  
  /**
   * アニメーションが再生中かどうか
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }
  
  /**
   * アニメーションが完了したかどうか
   */
  isComplete(): boolean {
    return this.state.isComplete;
  }
  
  /**
   * アニメーションの進行率を取得（0.0-1.0）
   */
  getProgress(): number {
    const animation = this.animations.get(this.state.currentAnimation);
    if (!animation) return 0;
    
    return this.state.frameIndex / animation.frames.length;
  }
  
  /**
   * リソースを解放
   */
  destroy(): void {
    this.frameTextures.forEach(texture => texture.destroy());
    this.frameTextures = [];
    this.animations.clear();
  }
}

/**
 * アニメーション対応のActor基底クラス
 * 簡単にスプライトアニメーションを使用できる
 */
export class AnimatedActor extends Actor {
  protected animationManager: SpriteAnimationManager;
  protected sprite: PIXI.Sprite;
  
  constructor(
    spriteSheetTexture: PIXI.Texture,
    frameWidth: number,
    frameHeight: number,
    animationConfig: AnimationConfig,
    framesPerRow?: number
  ) {
    super();
    
    // スプライトを作成
    this.sprite = new PIXI.Sprite();
    this.displayObject.addChild(this.sprite);
    
    // アニメーションマネージャーを初期化
    const spriteSheetInfo: SpriteSheetInfo = {
      texture: spriteSheetTexture,
      frameWidth,
      frameHeight,
      framesPerRow
    };
    
    this.animationManager = new SpriteAnimationManager(
      this.sprite,
      spriteSheetInfo,
      animationConfig
    );
  }
  
  update(input: Input | null) {
    super.update(input);
    this.animationManager.update();
  }
  
  /**
   * アニメーションを再生
   */
  protected playAnimation(name: string, force: boolean = false): boolean {
    return this.animationManager.play(name, force);
  }
  
  /**
   * アニメーション管理メソッドのプロキシ
   */
  protected stopAnimation(): void {
    this.animationManager.stop();
  }
  
  protected pauseAnimation(): void {
    this.animationManager.pause();
  }
  
  protected resumeAnimation(): void {
    this.animationManager.resume();
  }
  
  protected getCurrentAnimation(): string {
    return this.animationManager.getCurrentAnimation();
  }
  
  protected isAnimationPlaying(): boolean {
    return this.animationManager.isPlaying();
  }
  
  protected isAnimationComplete(): boolean {
    return this.animationManager.isComplete();
  }
  
  destroy() {
    this.animationManager.destroy();
    super.destroy();
  }
}

/**
 * ヘルパー関数: 簡単なアニメーション設定を作成
 */
export function createSimpleAnimation(
  frames: number[],
  speed: number = 8,
  loop: boolean = true
): FrameSequence {
  return { frames, speed, loop };
}

/**
 * ヘルパー関数: 連続フレームのアニメーション設定を作成
 */
export function createSequentialAnimation(
  startFrame: number,
  endFrame: number,
  speed: number = 8,
  loop: boolean = true
): FrameSequence {
  const frames: number[] = [];
  for (let i = startFrame; i <= endFrame; i++) {
    frames.push(i);
  }
  return { frames, speed, loop };
}

/**
 * ヘルパー関数: 往復アニメーション設定を作成
 */
export function createPingPongAnimation(
  frames: number[],
  speed: number = 8,
  loop: boolean = true
): FrameSequence {
  const pingPongFrames = [...frames, ...frames.slice(-2, 0).reverse()];
  return { frames: pingPongFrames, speed, loop };
}