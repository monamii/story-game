import { Entity } from "./Entity.js";

export class Item extends Entity {
  constructor(id, x, y, width, height) {
    super(x, y, width, height);
    this.id = id;
  }

  drawInWorld(ctx) {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#DAA520";
    ctx.fillRect(this.x + 3, this.y - 3, 10, 4);
  }

  drawIcon(ctx, x, y) {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x, y, 14, 14);
    ctx.fillStyle = "#DAA520";
    ctx.fillRect(x + 2, y - 3, 10, 4);
    ctx.fillStyle = "black";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.id.toUpperCase(), x + 7, y + 26);
    ctx.textAlign = "left";
  }
}
