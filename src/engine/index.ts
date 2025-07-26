// 型定義
export type { Point2D, Velocity2D, Rectangle, Size2D } from "./types";

// メインクラス
export { Game } from "./game";
export { Scene } from "./scene";
export { Actor, ParticleActor, PhysicsActor } from "./actor";
export { Input } from "./input";

// アニメーションシステム
export { 
  SpriteAnimationManager, 
  AnimatedActor,
  createSimpleAnimation,
  createSequentialAnimation, 
  createPingPongAnimation 
} from "./animation";
export type { FrameSequence, AnimationConfig, SpriteSheetInfo } from "./animation";

// ヘルパー関数
export { createText, createRect } from "./helpers";