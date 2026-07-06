/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string[]}
 */
export function buildLines(ctx, text, maxWidth) {
  ctx.font = "16px monospace";
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const text = line + word + " ";
    if (ctx.measureText(text).width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = text;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
