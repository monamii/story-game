import { Entity } from "./Entity.js";

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 32, 32);
    this.speed = 3;
  }
}
