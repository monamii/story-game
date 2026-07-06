/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 */
export function drawHikarigumo(ctx, x, y) {
  const cx = x + 16;
  const cy = y + 16;

  // Legs
  ctx.fillStyle = "white";
  ctx.fillRect(cx - 5, cy + 18, 3, 7);
  ctx.fillRect(cx + 2, cy + 18, 3, 7);

  // Dress (triangle)
  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 2);
  ctx.lineTo(cx + 2, cy + 2);
  ctx.lineTo(cx + 8, cy + 18);
  ctx.lineTo(cx - 8, cy + 18);
  ctx.closePath();
  ctx.fill();

  // Arms (tilted to follow dress slope)
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 3);
  ctx.lineTo(cx - 5, cy + 3);
  ctx.lineTo(cx - 9, cy + 14);
  ctx.lineTo(cx - 7, cy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 3);
  ctx.lineTo(cx + 5, cy + 3);
  ctx.lineTo(cx + 9, cy + 14);
  ctx.lineTo(cx + 7, cy + 14);
  ctx.closePath();
  ctx.fill();

  // White collar
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 2);
  ctx.lineTo(cx, cy + 7);
  ctx.lineTo(cx - 1, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 2);
  ctx.lineTo(cx, cy + 7);
  ctx.lineTo(cx + 1, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Buttons
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Cloud head (lowered to attach to dress)
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 6, cy - 3, 8, 0, Math.PI * 2);
  ctx.fill();

  // Unicorn horn (shifted down with head)
  ctx.fillStyle = "#e8c070";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 11);
  ctx.lineTo(cx, cy - 22);
  ctx.lineTo(cx + 3, cy - 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c8a050";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 20);
  ctx.lineTo(cx + 1, cy - 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 16);
  ctx.lineTo(cx + 2, cy - 12);
  ctx.stroke();

  // Eyes (large oval, Mametchi-style)
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy - 3, 4, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy - 3, 4, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // White highlight (upper right of each pupil)
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 7, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}
