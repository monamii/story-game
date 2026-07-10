import { GameMap, MapId } from "./GameMap.js";

export class Shore extends GameMap {
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   */
  drawBackground(ctx, canvas) {
    // sand
    ctx.fillStyle = "#e8d5a3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // water
    ctx.fillStyle = "#4a9eda";
    ctx.fillRect(0, 240, canvas.width, canvas.height);

    const rocks = /** @type {[number, number][]} */ ([
      [80, 180],
      [160, 200],
      [320, 170],
      [400, 190],
    ]);
    rocks.forEach(([rx, ry]) => {
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.ellipse(rx, ry, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   *
   * @param {{x:number}} player
   * @param {HTMLCanvasElement} canvas
   * @returns {{mapId: string, spawnX: number} | null}
   */
  checkExit(player, canvas) {
    if (player.x <= 0) {
      return { mapId: MapId.BEACH, spawnX: canvas.width - 33 };
    }
    return null;
  }
}
