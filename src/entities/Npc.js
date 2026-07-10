import { Entity } from "./Entity.js";

export class Npc extends Entity {
  constructor(x, y) {
    super(x, y, 32, 32);
    this.drawFn = null;
    this.isFollowing = false;
  }

  update(target, shouldFollow) {
    this.isFollowing = shouldFollow;
    if (!shouldFollow) return;

    if (!this.isNear(target, 40)) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      this.x += dx * 0.05;
      this.y += dy * 0.05;
    }
  }

  draw(ctx) {
    if (this.drawFn) this.drawFn(ctx, this.x, this.y);
  }
}
