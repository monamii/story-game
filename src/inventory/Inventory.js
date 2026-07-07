export class Inventory {
  constructor() {
    this.itemIds = [];
  }

  add(item) {
    if (!this.has(item.id)) this.itemIds.push(item.id);
  }

  has(id) {
    return this.itemIds.includes(id);
  }

  drawPanel(ctx, canvas) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width - 50, 10, 40, 40);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 50, 10, 40, 40);

    if (this.has("bag")) {
      const bx = canvas.width - 42;
      const by = 18;
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(bx, by, 14, 14);
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(bx + 2, by - 3, 10, 4);
      ctx.fillStyle = "black";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BAG", canvas.width - 30, 56);
      ctx.textAlign = "left";
    }
  }
}
