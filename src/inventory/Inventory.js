export class Inventory {
  constructor() {
    this._items = [];
  }

  add(item) {
    if (!this.has(item.id)) this._items.push(item);
  }

  has(id) {
    return this._items.some((item) => item.id === id);
  }

  drawPanel(ctx, canvas) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width - 50, 10, 40, 40);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - 50, 10, 40, 40);

    this._items.forEach((item) => item.drawIcon(ctx, canvas.width - 42, 18));
  }
}
