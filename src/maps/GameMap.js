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
   * @param {CanvasRenderingContext2D} _ctx
   * @param {HTMLCanvasElement} _canvas
   */
  drawBackground(_ctx, _canvas) {}

  /**
   *
   * @param {{x:number}} _player
   * @param {HTMLCanvasElement} _canvas
   * @returns {{mapId: string, spawnX: number} | null}
   */
  checkExit(_player, _canvas) {
    return null;
  }
}
