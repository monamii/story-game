import { Entity } from "./Entity.js";

export class Item extends Entity {
  constructor(id, x, y, width, height) {
    super(x, y, width, height);
    this.id = id;
  }
}
