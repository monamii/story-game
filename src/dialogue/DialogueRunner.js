export class DialogueRunner {
  constructor(dialogueSystem, flags, buildLinesFn) {
    this._dialogue = dialogueSystem;
    this._flags = flags;
    this._buildLines = buildLinesFn;
    this._nodes = null;
  }

  start(nodes, startId) {
    this._nodes = nodes;
    this._runNode(startId);
  }

  _runNode(nodeId) {
    const node = this._nodes[nodeId];
    if (!node) return;
    if (node.lines) {
      this._dialogue.startLines(node.lines, () => {
        if (node.setFlags) {
          node.setFlags.forEach((flag) => this._flags.set(flag));
        }
        if (node.next) {
          this._runNode(node.next);
        }
      });
    } else if (node.menu) {
      const options = node.menu.map((item) => ({ q: item.label }));
      this._dialogue.startMenu(options, (i) => {
        const item = node.menu[i];
        if (item.answer) {
          this._dialogue.showAnswer(this._buildLines(item.answer));
        } else if (item.next) {
          const nextId =
            typeof item.next === "function"
              ? item.next(this._flags)
              : item.next;
          this._runNode(nextId);
        }
      });
    }
  }
}
