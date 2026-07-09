export const MapId = Object.freeze({
  FOREST: "forest",
  BEACH: "beach",
});
export class GameMap {
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   */
  drawBackground(ctx, canvas) {}

  /**
   *
   * @param {{x:number}} player
   * @param {HTMLCanvasElement} canvas
   * @returns {{mapId: string, spawnX: number} | null}
   */
  checkExit(player, canvas) {
    return null;
  }
}
