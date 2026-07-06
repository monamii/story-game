import { Entity } from "./Entity.js";

export class Npc extends Entity {
  constructor(x, y) {
    super(x, y, 32, 32);
  }
}
