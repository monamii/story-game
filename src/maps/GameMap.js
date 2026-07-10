export const MapId = Object.freeze({
  FOREST: "forest",
  BEACH: "beach",
  SHORE: "shore",
});
export class GameMap {
  constructor() {
    this.npcs = [];
    this.items = [];
  }
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
