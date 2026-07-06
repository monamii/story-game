import { Entity } from "./Entity.js";

export class Item extends Entity {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.collected = false;
  }
}
