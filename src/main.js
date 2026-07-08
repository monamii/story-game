import { InputManager } from "./core/InputManager.js";
import { buildLines } from "./core/TextUtils.js";
import { DialogueSystem } from "./dialogue/DialogueSystem.js";
import { Item } from "./entities/Item.js";
import { Npc } from "./entities/Npc.js";
import { Player } from "./entities/Player.js";
import { Inventory } from "./inventory/Inventory.js";
import { Beach } from "./maps/Beach.js";
import { Forest } from "./maps/Forest.js";
import { drawBakezaru } from "./sprites/bakezaru.js";
import { drawHikarigumo } from "./sprites/hikarigumo.js";

const canvas = /** @type {HTMLCanvasElement}*/ (
  document.getElementById("game")
);
const ctx = /** @type {CanvasRenderingContext2D}*/ (canvas.getContext("2d"));

const player = new Player(30, 30);

const npc = new Npc(340, 230);

const item = new Item("bag", 80, 200, 16, 16);
const inventory = new Inventory();

let message = "";
let messageTimer = 0;

let currentMap = 1;

const questions = [
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

let storyPhase = 0; // 0:questions, 1: find bag, 3: companion

const maps = {
  1: new Forest(),
  2: new Beach(),
};

const input = new InputManager();
const dialogue = new DialogueSystem();

function update() {
  if (!dialogue.isActive()) {
    if (input.isDown("ArrowUp")) player.y -= player.speed;
    if (input.isDown("ArrowDown")) player.y += player.speed;
    if (input.isDown("ArrowLeft")) player.x -= player.speed;
    if (input.isDown("ArrowRight")) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    const exit = maps[currentMap].checkExit(player, canvas);
    if (exit) {
      currentMap = exit.mapId;
      player.x = exit.spawnX;
      if (storyPhase >= 3) {
        npc.x = player.x + (exit.mapId === 2 ? 10 : -10);
        npc.y = player.y;
      }
    }

    if (input.consumePressed(" ")) {
      if (player.isNear(npc)) {
        if (storyPhase === 1 && !inventory.has(item.id)) {
          dialogue.startLines(
            ["Did you find my bag?", "My knee really hurts..."],
            null,
          );
        } else if (storyPhase === 1 && inventory.has(item.id)) {
          dialogue.startLines(
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
              storyPhase = 3;
            },
          );
        } else {
          dialogue.startLines(["..."], () => {
            dialogue.startMenu(questions, (i) => {
              if (i === questions.length - 1) {
                if (storyPhase === 0) {
                  dialogue.startLines(
                    [
                      "Ah...",
                      "My knee. I hurt it when I landed.",
                      "I have a bandaid in my bag...",
                      "...Wait. Where is my bag?",
                      "I had it when I fell. It must be somewhere on the beach.",
                      "Bakezaru: I will find it.",
                    ],
                    () => {
                      storyPhase = 1;
                    },
                  );
                } else {
                  dialogue.startLines(
                    [
                      "You are still looking?",
                      "Take your time. I am not going anywhere like this.",
                    ],
                    null,
                  );
                }
              } else {
                dialogue.showAnswer(
                  buildLines(ctx, questions[i].a, canvas.width - 80),
                );
              }
            });
          });
        }
      } else if (!inventory.has(item.id) && player.isNear(item, 30)) {
        inventory.add(item);
        message = "You found Hikarigumo's bag!";
        messageTimer = 180; // show for 3 seconds (60 frames x 3)
      }
    }
  }

  dialogue.handleInput(input);

  if (messageTimer > 0) messageTimer--;
  if (messageTimer === 0) message = "";

  if (storyPhase === 3) {
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 40) {
      npc.x += dx * 0.05;
      npc.y += dy * 0.05;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  maps[currentMap].drawBackground(ctx, canvas);

  // bakezaru - player
  drawBakezaru(ctx, player.x, player.y);

  if (currentMap === 2 || storyPhase >= 3) {
    // hikarigumo
    drawHikarigumo(ctx, npc.x, npc.y);

    // Hikarigumo's bag
    if (!inventory.has(item.id)) {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(item.x + 3, item.y - 3, 10, 4);
    }

    // Hint above bag
    if (
      !inventory.has(item.id) &&
      !dialogue.isActive() &&
      player.isNear(item, 30)
    ) {
      ctx.fillStyle = "black";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Press Space", item.x + item.width / 2, item.y - 8);
      ctx.textAlign = "left";
    }

    // Pickup message
    if (message) {
      ctx.fillStyle = "black";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(message, canvas.width / 2, 220);
      ctx.textAlign = "left";
    }

    // Hint when near Hikarigumo
    if (!dialogue.isActive() && storyPhase < 3 && player.isNear(npc)) {
      ctx.fillStyle = "Black";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Press Space", npc.x + npc.width / 2, npc.y - 10);
      ctx.textAlign = "left";
    }
  }

  // Diplay dialogue
  dialogue.draw(ctx, canvas);

  inventory.drawPanel(ctx, canvas);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
