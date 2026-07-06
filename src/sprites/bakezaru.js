/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 */
export function drawBakezaru(ctx, x, y) {
  const cx = x + 16;
  const cy = y + 14;
  const scale = 1.1; // adjust this number until heights match

  ctx.save();
  ctx.translate(cx, cy); // move origin to character center
  ctx.scale(scale, scale); // scale up
  ctx.translate(-cx, -cy); // move origin back

  // Swirling tail
  ctx.strokeStyle = "#d17c32";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 6);
  ctx.bezierCurveTo(cx + 42, cy + 16, cx + 58, cy - 2, cx + 48, cy - 20);
  ctx.bezierCurveTo(cx + 40, cy - 34, cx + 22, cy - 34, cx + 18, cy - 20);
  ctx.bezierCurveTo(cx + 14, cy - 8, cx + 24, cy - 4, cx + 30, cy - 10);
  ctx.bezierCurveTo(cx + 34, cy - 14, cx + 28, cy - 20, cx + 24, cy - 18);
  ctx.stroke();

  // Left wing
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 2);
  ctx.bezierCurveTo(cx - 16, cy - 10, cx - 26, cy - 5, cx - 22, cy + 6);
  ctx.bezierCurveTo(cx - 18, cy + 12, cx - 12, cy + 8, cx - 8, cy + 2);
  ctx.fill();
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx - 20, cy + 4, 3, 0, Math.PI * 1.5);
  ctx.stroke();

  // Right wing
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 2);
  ctx.bezierCurveTo(cx + 16, cy - 10, cx + 26, cy - 5, cx + 22, cy + 6);
  ctx.bezierCurveTo(cx + 18, cy + 12, cx + 12, cy + 8, cx + 8, cy + 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 20, cy + 4, 3, Math.PI * 1.5, Math.PI * 3);
  ctx.stroke();

  // Head (rounded heart with round bottom)
  ctx.fillStyle = "#d17c32";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.bezierCurveTo(cx + 2, cy - 14, cx + 14, cy - 14, cx + 13, cy - 5);
  ctx.bezierCurveTo(cx + 14, cy + 2, cx + 9, cy + 8, cx + 7, cy + 8);
  ctx.arc(cx, cy + 8, 8, 0, Math.PI, false);
  ctx.bezierCurveTo(cx - 9, cy + 8, cx - 14, cy + 2, cx - 13, cy - 5);
  ctx.bezierCurveTo(cx - 14, cy - 14, cx - 2, cy - 14, cx, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Forehead wrinkles (two-bump shape, following heart)
  ctx.strokeStyle = "#60341e";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 5);
  ctx.quadraticCurveTo(cx - 3, cy - 9, cx, cy - 6);
  ctx.quadraticCurveTo(cx + 3, cy - 9, cx + 7, cy - 5);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Beak (open, center of face, below eyes)
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 4);
  ctx.lineTo(cx + 4, cy + 4);
  ctx.lineTo(cx + 2, cy + 2);
  ctx.lineTo(cx, cy + 1);
  ctx.lineTo(cx - 2, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Feet (small round blobs)
  ctx.fillStyle = "#ffa500";
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy + 15, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 15, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
