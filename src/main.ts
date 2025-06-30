import { Game } from "./engine";

const game = new Game();
game
  .init({
    width: 320,
    height: 240,
    backgroundColor: 0xcccccc,
    resolution: 4,
  })
  .then(() => {
    // Start the game
  });
