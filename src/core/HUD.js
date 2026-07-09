export class HUD {
  constructor() {
    this._message = "";
    this._messageTimer = 0;
  }

  showMessage(text, frames) {
    this._message = text;
    this._messageTimer = frames;
  }

  update() {
    if (this._messageTimer > 0) this._messageTimer--;
    if (this._messageTimer === 0) this._message = "";
  }

  drawMessage(ctx, canvas) {
    if (!this._message) return;
    ctx.fillStyle = "black";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this._message, canvas.width / 2, 220);
    ctx.textAlign = "left";
  }

  drawHint(ctx, x, y) {
    ctx.fillStyle = "black";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Press Space", x, y);
    ctx.textAlign = "left";
  }
}
