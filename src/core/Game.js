import { InputManager } from "../core/InputManager.js";
import { buildLines } from "../core/TextUtils.js";
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

    this.message = "";
    this.messageTimer = 0;

    /** @type {string} */
    this.currentMap = MapId.FOREST;

    this.questions = [
      {
        q: "Who are you?",
        a: "I am Hikarigumo. I am from the cloud people. We live where the sky turns white and soft. I have never been down here before.",
      },
      {
        q: "Where did you come from?",
        a: "I fell from up there, past the clouds. There is a town up there — that is where I am from. I was looking over the edge and then... I need to find a way back.",
      },
      {
        q: "Goodbye.",
        a: "",
      },
    ];

    this.flags = new StoryFlags();

    this.maps = {
      [MapId.FOREST]: new Forest(),
      [MapId.BEACH]: new Beach(),
    };

    this.input = new InputManager();
    this.dialogue = new DialogueSystem();
    this.hud = new HUD();
  }

  update() {
    if (!this.dialogue.isActive()) {
      if (this.input.isDown("ArrowUp")) this.player.y -= this.player.speed;
      if (this.input.isDown("ArrowDown")) this.player.y += this.player.speed;
      if (this.input.isDown("ArrowLeft")) this.player.x -= this.player.speed;
      if (this.input.isDown("ArrowRight")) this.player.x += this.player.speed;

      this.player.x = Math.max(
        0,
        Math.min(this.canvas.width - this.player.width, this.player.x),
      );
      this.player.y = Math.max(
        0,
        Math.min(this.canvas.height - this.player.height, this.player.y),
      );

      const exit = this.maps[this.currentMap].checkExit(
        this.player,
        this.canvas,
      );
      if (exit) {
        this.currentMap = exit.mapId;
        this.player.x = exit.spawnX;
        if (this.flags.has(StoryFlag.BECAME_COMPANIONS)) {
          this.npc.x = this.player.x + (exit.mapId === MapId.BEACH ? 10 : -10);
          this.npc.y = this.player.y;
        }
      }

      if (this.input.consumePressed(" ")) {
        if (this.player.isNear(this.npc)) {
          if (
            this.flags.has(StoryFlag.BAG_QUEST_STARTED) &&
            !this.flags.has(StoryFlag.BECAME_COMPANIONS) &&
            !this.inventory.has(this.item.id)
          ) {
            this.dialogue.startLines(
              ["Did you find my bag?", "My knee really hurts..."],
              null,
            );
          } else if (
            this.flags.has(StoryFlag.BAG_QUEST_STARTED) &&
            !this.flags.has(StoryFlag.BECAME_COMPANIONS) &&
            this.inventory.has(this.item.id)
          ) {
            this.dialogue.startLines(
              [
                "That is it! That is my bag!",
                "Thank you, Bakezaru.",
                "...",
                "Bandaid on. There.",
                "Good as new.",
                "Hey... do you want to walk together for a while?",
                "I do not know where I am going. But that is okay.",
              ],
              () => {
                this.flags.set(StoryFlag.BECAME_COMPANIONS);
              },
            );
          } else {
            this.dialogue.startLines(["..."], () => {
              this.dialogue.startMenu(this.questions, (i) => {
                if (i === this.questions.length - 1) {
                  if (!this.flags.has(StoryFlag.BAG_QUEST_STARTED)) {
                    this.dialogue.startLines(
                      [
                        "Ah...",
                        "My knee. I hurt it when I landed.",
                        "I have a bandaid in my bag...",
                        "...Wait. Where is my bag?",
                        "I had it when I fell. It must be somewhere on the beach.",
                        "Bakezaru: I will find it.",
                      ],
                      () => {
                        this.flags.set(StoryFlag.BAG_QUEST_STARTED);
                      },
                    );
                  } else {
                    this.dialogue.startLines(
                      [
                        "You are still looking?",
                        "Take your time. I am not going anywhere like this.",
                      ],
                      null,
                    );
                  }
                } else {
                  this.dialogue.showAnswer(
                    buildLines(
                      this.ctx,
                      this.questions[i].a,
                      this.canvas.width - 80,
                    ),
                  );
                }
              });
            });
          }
        } else if (
          !this.inventory.has(this.item.id) &&
          this.player.isNear(this.item, 30)
        ) {
          this.inventory.add(this.item);
          this.hud.showMessage("You found Hikarigumo's bag!", 180);
        }
      }
    }

    this.dialogue.handleInput(this.input);

    this.hud.update();

    if (this.flags.has(StoryFlag.BECAME_COMPANIONS)) {
      const dx = this.player.x - this.npc.x;
      const dy = this.player.y - this.npc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 40) {
        this.npc.x += dx * 0.05;
        this.npc.y += dy * 0.05;
      }
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
        this.ctx.fillStyle = "#8B4513";
        this.ctx.fillRect(
          this.item.x,
          this.item.y,
          this.item.width,
          this.item.height,
        );
        this.ctx.fillStyle = "#DAA520";
        this.ctx.fillRect(this.item.x + 3, this.item.y - 3, 10, 4);
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
