import * as PIXI from "pixi.js";

// ヘルパー関数
export function createText(
  text: string,
  fontSize: number,
  color: number,
  x: number,
  y: number
): PIXI.Text {
  const textObject = new PIXI.Text({
    text,
    style: {
      fontFamily: "MS Gothic",
      fontSize,
      fill: color,
    },
  });
  textObject.x = x;
  textObject.y = y;
  return textObject;
}

export function createRect(
  width: number,
  height: number,
  color: number,
  x: number = 0,
  y: number = 0,
  stroke?: { width: number; color: number }
): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  graphics.rect(0, 0, width, height);
  graphics.fill(color);
  if (stroke) {
    graphics.stroke(stroke);
  }
  graphics.x = x;
  graphics.y = y;
  return graphics;
}