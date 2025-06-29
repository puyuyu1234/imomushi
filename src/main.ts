// PixiJSを読み込み
import * as PIXI from "pixi.js";

// ステージを作る
const createApp = async () => {
  // アプリケーションを初期化
  const app = new PIXI.Application();
  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0xcccccc, // 背景色(= #cccccc)
  });
  document.body.appendChild(app.canvas); // viewの代わりにcanvasを使用
  return app;
};

createApp();
