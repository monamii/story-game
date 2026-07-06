export class Entity {
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   *
   * @param {Entity} other
   * @param {number} distance
   * @returns {boolean}
   */
  isNear(other, distance = 40) {
    const dx = this.x + this.width / 2 - (other.x + other.width / 2);
    const dy = this.y + this.height / 2 - (other.y + other.height / 2);
    return Math.sqrt(dx * dx + dy * dy) < distance;
  }
}
