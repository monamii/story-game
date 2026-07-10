import {
  hikarigumoDialogue,
  selectHikarigumoNode,
} from "../content/hikarigumo.js";
import { InputManager } from "../core/InputManager.js";
import { buildLines } from "../core/TextUtils.js";
import { DialogueRunner } from "../dialogue/DialogueRunner.js";
import { DialogueSystem } from "../dialogue/DialogueSystem.js";
import { Item } from "../entities/Item.js";
import { Npc } from "../entities/Npc.js";
import { Player } from "../entities/Player.js";
import { Inventory } from "../inventory/Inventory.js";
import { Beach } from "../maps/Beach.js";
import { Forest } from "../maps/Forest.js";
import { MapId } from "../maps/GameMap.js";
import { Shore } from "../maps/Shore.js";
import { drawBakezaru } from "../sprites/bakezaru.js";
import { drawHikarigumo } from "../sprites/hikarigumo.js";
import { HUD } from "./HUD.js";
import { StoryFlag, StoryFlags } from "./StoryFlags.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext("2d")
    );
    this.player = new Player(30, 30);
    this.npc = new Npc(340, 230);

    this.item = new Item("bag", 80, 200, 16, 16);
    this.inventory = new Inventory();

    /** @type {string} */
    this.currentMap = MapId.FOREST;

    this.flags = new StoryFlags();

    this.maps = {
      [MapId.FOREST]: new Forest(),
      [MapId.BEACH]: new Beach(),
      [MapId.SHORE]: new Shore(),
    };

    this.npc.drawFn = drawHikarigumo;
    this.maps[MapId.BEACH].npcs.push(this.npc);
    this.maps[MapId.SHORE].items.push(this.item);

    this.input = new InputManager();
    this.dialogue = new DialogueSystem();
    this.hud = new HUD();

    this.runner = new DialogueRunner(this.dialogue, this.flags, (text) =>
      buildLines(this.ctx, text, this.canvas.width - 80),
    );
  }

  update() {
    this.dialogue.handleInput(this.input);

    if (!this.dialogue.isActive()) {
      this.player.update(this.input, this.canvas);
      this._handleMapTransition();
      this._handleInteraction();
    }

    this.npc.update(this.player, this.flags.has(StoryFlag.BECAME_COMPANIONS));
    this.hud.update();
  }

  _handleMapTransition() {
    const exit = this.maps[this.currentMap].checkExit(this.player, this.canvas);
    if (!exit) return;
    this.currentMap = exit.mapId;
    this.player.x = exit.spawnX;
    if (this.flags.has(StoryFlag.BECAME_COMPANIONS)) {
      this.npc.x = this.player.x + (exit.mapId === MapId.BEACH ? 10 : -10);
      this.npc.y = this.player.y;
    }
  }

  _handleInteraction() {
    if (!this.input.consumePressed(" ")) return;
    if (this.player.isNear(this.npc)) {
      const nodeId = selectHikarigumoNode(this.flags, this.inventory);
      this.runner.start(hikarigumoDialogue, nodeId);
    } else if (
      !this.inventory.has(this.item.id) &&
      this.player.isNear(this.item, 30)
    ) {
      this.inventory.add(this.item);
      this.hud.showMessage("You found Hikarigumo's bag!", 180);
    }
  }

  draw() {
    const { ctx, canvas } = this;
    const map = this.maps[this.currentMap];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.drawBackground(ctx, canvas);
    drawBakezaru(ctx, this.player.x, this.player.y);

    // Static map NPCs (not yet following)
    map.npcs.filter((n) => !n.isFollowing).forEach((n) => n.draw(ctx));

    // Uncollected map items
    map.items
      .filter((i) => !this.inventory.has(i.id))
      .forEach((i) => i.drawInWorld(ctx));

    // Companion follows player across all maps
    if (this.npc.isFollowing) this.npc.draw(ctx);

    // NPC hints
    map.npcs
      .filter(
        (n) =>
          !n.isFollowing && !this.dialogue.isActive() && this.player.isNear(n),
      )
      .forEach((n) => this.hud.drawHint(ctx, n.x + n.width / 2, n.y - 10));

    // Item hints
    map.items
      .filter(
        (i) =>
          !this.inventory.has(i.id) &&
          !this.dialogue.isActive() &&
          this.player.isNear(i, 30),
      )
      .forEach((i) => this.hud.drawHint(ctx, i.x + i.width / 2, i.y - 8));

    this.dialogue.draw(ctx, canvas);
    this.inventory.drawPanel(ctx, canvas);
    this.hud.drawMessage(ctx, canvas);
  }

  start() {
    const loop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };

    loop();
  }
}
