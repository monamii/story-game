import { buildLines } from "../core/TextUtils.js";

export class DialogueSystem {
  constructor() {
    this._state = "idle"; // idle, talking, asking, answering
    this._lines = [];
    this._index = 0;
    this._onComplete = null;
    this._options = [];
    this._visited = [];
    this._selectedOption = 0;
    this._answerLines = [];
    this._answerPage = 0;
    this._onSelect = null;
  }

  startLines(lines, onComplete) {
    this._lines = lines;
    this._index = 0;
    this._onComplete = onComplete;
    this._state = "talking";
  }

  startMenu(options, onSelect) {
    this._options = options;
    this._visited = options.map(() => false);
    this._selectedOption = 0;
    this._onSelect = onSelect;
    this._state = "asking";
  }

  showAnswer(lines) {
    this._answerLines = lines;
    this._answerPage = 0;
    this._state = "answering";
  }

  isActive() {
    return this._state != "idle";
  }

  handleInput(input) {
    if (this._state === "talking") {
      if (input.consumePressed(" ")) {
        if (this._index < this._lines.length - 1) {
          this._index++;
        } else {
          const cb = this._onComplete;
          this._onComplete = null;
          this._state = "idle";
          if (cb) cb();
        }
      }
    } else if (this._state === "asking") {
      const n = this._options.length;
      if (input.consumePressed("ArrowUp")) {
        this._selectedOption = (this._selectedOption + n - 1) % n;
      } else if (input.consumePressed("ArrowDown")) {
        this._selectedOption = (this._selectedOption + 1) % n;
      } else if (input.consumePressed(" ")) {
        this._visited[this._selectedOption] = true;
        if (this._onSelect) this._onSelect(this._selectedOption);
      }
    } else if (this._state === "answering") {
      if (input.consumePressed(" ")) {
        const totalPages = Math.ceil(this._answerLines.length / 2);
        if (this._answerPage < totalPages - 1) {
          this._answerPage++;
        } else {
          this._state = "asking";
        }
      }
    }
  }

  draw(ctx, canvas) {
    if (this._state === "idle") {
      return;
    }

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(20, 240, canvas.width - 40, 70);

    if (this._state === "talking") {
      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      const wrapped = buildLines(
        ctx,
        this._lines[this._index],
        canvas.width - 80,
      );
      wrapped.forEach((line, i) => {
        ctx.fillText(line, 35, 262 + i * 20);
      });
    } else if (this._state === "asking") {
      ctx.font = "16px monospace";
      this._options.forEach((opt, i) => {
        ctx.fillStyle = this._visited[i] ? "#888" : "white";
        const cursor = this._selectedOption === i ? "> " : "  ";
        ctx.fillText(cursor + opt.q, 35, 265 + i * 20);
      });
    } else if (this._state === "answering") {
      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      const start = this._answerPage * 2;
      this._answerLines.slice(start, start + 2).forEach((line, i) => {
        ctx.fillText(line, 35, 265 + i * 20);
      });
    }
  }
}
