import { Game } from "./core/Game.js";

const game = new Game(document.getElementById("game"));
game.start();

// Required for running Playwright
// @ts-ignore
window.game = game;
