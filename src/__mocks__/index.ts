export { MockGame } from "./game.mock";
export { MockInput, InputEvent, KeyEvent, MouseEvent } from "./input.mock";

// エンジンの型定義を再エクスポート（テストで使いやすくするため）
export type { Point2D, Velocity2D, Rectangle, Size2D } from "../engine";