import { GameMap, MapId } from "./GameMap.js";

export class Forest extends GameMap {
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   */
  drawBackground(ctx, canvas) {
    ctx.fillStyle = "#2d5a1b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground
    ctx.fillStyle = "#4a7c3f";
    ctx.fillRect(0, 200, canvas.width, canvas.height);
    // House
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(40, 140, 70, 70);
    ctx.fillStyle = "#5c2d0a";
    ctx.beginPath();
    ctx.moveTo(30, 140);
    ctx.lineTo(75, 100);
    ctx.lineTo(120, 140);
    ctx.closePath();
    ctx.fill();
    // Trees
    [
      [180, 120],
      [280, 100],
      [350, 130],
      [420, 110],
      [60, 220],
      [200, 230],
    ].forEach(([tx, ty]) => {
      ctx.fillStyle = "#1a3d0a";
      ctx.beginPath();
      ctx.arc(tx, ty, 28, 0, Math.PI * 2);
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
    if (player.x >= canvas.width - 32) {
      return { mapId: MapId.BEACH, spawnX: 10 };
    }
    return null;
  }
}
