import { Entity } from "./Entity.js";

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 32, 32);
    this.speed = 3;
  }

  update(input, canvas) {
    if (input.isDown("ArrowUp")) this.y -= this.speed;
    if (input.isDown("ArrowDown")) this.y += this.speed;
    if (input.isDown("ArrowLeft")) this.x -= this.speed;
    if (input.isDown("ArrowRight")) this.x += this.speed;

    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
  }
}
