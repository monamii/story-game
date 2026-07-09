import { GameMap, MapId } from "./GameMap.js";

export class Beach extends GameMap {
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   */
  drawBackground(ctx, canvas) {
    ctx.fillStyle = "#f5deb3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(0, 260, canvas.width, 60);
  }

  /**
   *
   * @param {{x:number}} player
   * @param {HTMLCanvasElement} canvas
   * @returns {{mapId: string, spawnX: number} | null}
   */
  checkExit(player, canvas) {
    if (player.x <= 0) {
      return { mapId: MapId.FOREST, spawnX: canvas.width - 33 };
    }
    return null;
  }
}
