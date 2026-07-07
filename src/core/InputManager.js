export class InputManager {
  constructor() {
    this._down = {};
    this._justPressed = new Set();

    window.addEventListener("keydown", (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (!this._down[e.key]) this._justPressed.add(e.key);
      this._down[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
      this._down[e.key] = false;
    });
  }

  isDown(key) {
    return !!this._down[key];
  }

  consumePressed(key) {
    if (this._justPressed.has(key)) {
      this._justPressed.delete(key);
      return true;
    }
    return false;
  }
}
