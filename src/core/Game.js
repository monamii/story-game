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
    };

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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.maps[this.currentMap].drawBackground(this.ctx, this.canvas);

    // bakezaru - player
    drawBakezaru(this.ctx, this.player.x, this.player.y);

    if (
      this.currentMap === MapId.BEACH ||
      this.flags.has(StoryFlag.BECAME_COMPANIONS)
    ) {
      // hikarigumo
      drawHikarigumo(this.ctx, this.npc.x, this.npc.y);

      // Hikarigumo's bag
      if (!this.inventory.has(this.item.id)) {
        this.item.drawInWorld(this.ctx);
      }

      // Hint above bag
      if (
        !this.inventory.has(this.item.id) &&
        !this.dialogue.isActive() &&
        this.player.isNear(this.item, 30)
      ) {
        this.hud.drawHint(
          this.ctx,
          this.item.x + this.item.width / 2,
          this.item.y - 8,
        );
      }

      // Hint when near Hikarigumo
      if (
        !this.dialogue.isActive() &&
        !this.flags.has(StoryFlag.BECAME_COMPANIONS) &&
        this.player.isNear(this.npc)
      ) {
        this.hud.drawHint(
          this.ctx,
          this.npc.x + this.npc.width / 2,
          this.npc.y - 10,
        );
      }
    }

    this.dialogue.draw(this.ctx, this.canvas);
    this.inventory.drawPanel(this.ctx, this.canvas);
    this.hud.drawMessage(this.ctx, this.canvas);
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
