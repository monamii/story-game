import {
  hikarigumoDialogue,
  selectHikarigumoNode,
} from "../content/dialogue.js";
import { InputManager } from "../core/InputManager.js";
import { buildLines } from "../core/TextUtils.js";
import { DialogueRunner } from "../dialogue/DialogueRunner.js";
import { DialogueSystem } from "../dialogue/DialogueSystem.js";
import { Entity } from "../entities/Entity.js";
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
    this.player = new Player(60, 155);

    this.hikarigumo = new Npc(340, 230);
    this.hikarigumo.drawFn = drawHikarigumo;

    this.bag = new Item("bag", 300, 200, 16, 16);
    this.inventory = new Inventory();

    /** @type {string} */
    this.currentMap = MapId.FOREST;
    this.maps = {
      [MapId.FOREST]: new Forest(),
      [MapId.BEACH]: new Beach(),
      [MapId.SHORE]: new Shore(),
    };
    this.maps[MapId.BEACH].npcs.push(this.hikarigumo);
    this.maps[MapId.SHORE].items.push(this.bag);

    this.flags = new StoryFlags();

    this.input = new InputManager();
    this.dialogue = new DialogueSystem();
    this.hud = new HUD();

    this.runner = new DialogueRunner(this.dialogue, this.flags, (text) =>
      buildLines(this.ctx, text, this.canvas.width - 80),
    );

    this.house = new Entity(40, 140, 70, 70);
    this._ending = false;
    this._titleScreen = true;
  }

  update() {
    if (this._titleScreen) {
      if (this.input.consumePressed(" ")) {
        this._titleScreen = false;
        this.runner.start(hikarigumoDialogue, "intro");
      }
      return;
    }

    if (this._ending) return;

    if (this.flags.has(StoryFlag.ARRIVED_HOME) && !this.dialogue.isActive()) {
      this._ending = true;
      return;
    }

    this.dialogue.handleInput(this.input);

    if (!this.dialogue.isActive()) {
      this.player.update(this.input, this.canvas);
      this._handleMapTransition();
      this._handleInteraction();
    }

    this.hikarigumo.update(
      this.player,
      this.flags.has(StoryFlag.BECAME_COMPANIONS),
    );
    this.hud.update();
  }

  _handleMapTransition() {
    const exit = this.maps[this.currentMap].checkExit(this.player, this.canvas);
    if (!exit) return;
    this.currentMap = exit.mapId;
    this.player.x = exit.spawnX;
    if (this.flags.has(StoryFlag.BECAME_COMPANIONS)) {
      this.hikarigumo.x =
        this.player.x + (exit.mapId === MapId.BEACH ? 10 : -10);
      this.hikarigumo.y = this.player.y;
    }
  }

  _handleInteraction() {
    if (!this.input.consumePressed(" ")) return;
    if (
      this.currentMap === MapId.FOREST &&
      this.flags.has(StoryFlag.BECAME_COMPANIONS) &&
      !this.flags.has(StoryFlag.ARRIVED_HOME) &&
      this.player.isNear(this.house, 40)
    ) {
      this.runner.start(hikarigumoDialogue, "atHome");
    } else if (this.player.isNear(this.hikarigumo)) {
      const nodeId = selectHikarigumoNode(this.flags, this.inventory);
      this.runner.start(hikarigumoDialogue, nodeId);
    } else if (
      !this.inventory.has(this.bag.id) &&
      this.player.isNear(this.bag, 30)
    ) {
      this.inventory.add(this.bag);
      this.hud.showMessage("You found Hikarigumo's bag!", 100);
    }
  }

  draw() {
    const { ctx, canvas } = this;

    if (this._titleScreen) {
      this._drawTitle();
      return;
    }

    if (this._ending) {
      this._drawEnding();
      return;
    }
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
    if (this.hikarigumo.isFollowing) this.hikarigumo.draw(ctx);

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

    if (
      this.currentMap === MapId.FOREST &&
      this.flags.has(StoryFlag.BECAME_COMPANIONS) &&
      !this.flags.has(StoryFlag.ARRIVED_HOME) &&
      !this.dialogue.isActive() &&
      this.player.isNear(this.house, 50)
    ) {
      this.hud.drawHint(
        ctx,
        this.house.x + this.house.width / 2,
        this.house.y - 10,
      );
    }
    this.hud.drawMessage(ctx, canvas);
  }

  _drawTitle() {
    const { ctx, canvas } = this;
    this.maps[MapId.FOREST].drawBackground(ctx, canvas);
    drawBakezaru(ctx, this.player.x, this.player.y);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    const cx = canvas.width / 2;
    ctx.font = "24px monospace";
    ctx.fillText("Bakezaru and Hikarigumo", cx, 130);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Press Space", cx, 220);
  }

  _drawEnding() {
    const { ctx, canvas } = this;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.fillStyle = "#ffffcc";
    ctx.beginPath();
    ctx.arc(390, 50, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(400, 44, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,200,0.12)";
    ctx.beginPath();
    ctx.arc(390, 50, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    const cx = canvas.width / 2;
    ctx.font = "16px monospace";
    ctx.fillText("That night, they stayed up talking.", cx, 90);
    ctx.fillText("Both slept very well.", cx, 120);
    ctx.fillText("Tomorrow would be another adventure.", cx, 175);
    ctx.fillText("But that is another story.", cx, 205);
    ctx.font = "20px monospace";
    ctx.fillText("F i n .", cx, 265);
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
