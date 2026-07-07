import { InputManager } from "./core/InputManager.js";
import { buildLines } from "./core/TextUtils.js";
import { Item } from "./entities/Item.js";
import { Npc } from "./entities/Npc.js";
import { Player } from "./entities/Player.js";
import { Inventory } from "./inventory/inventory.js";
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

let selectedOption = 0;
let visited = [false, false];

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

let answerLines = [];
let answerPage = 0;

let dialogueLines = ["..."];
let dialogueIndex = 0;

let storyPhase = 0; // 0:questions, 1: find bag, 3: companion
let dialogueCallback = null;

let gameState = "walking"; // "walking" | "talking"

const maps = {
  1: new Forest(),
  2: new Beach(),
};

const input = new InputManager();

function update() {
  if (gameState === "walking") {
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
        dialogueIndex = 0;
        if (storyPhase === 1 && !inventory.has(item.id)) {
          dialogueLines = ["Did you find my bag?", "My knee really hurts..."];

          dialogueCallback = () => {
            gameState = "walking";
          };
        } else if (storyPhase === 1 && inventory.has(item.id)) {
          dialogueLines = [
            "That is it! That is my bag!",
            "Thank you, Bakezaru.",
            "...",
            "Bandaid on. There.",
            "Good as new.",
            "Hey... do you want to walk together for a while?",
            "I do not know where I am going. But that is okay.",
          ];
          dialogueCallback = () => {
            storyPhase = 3;
            gameState = "walking";
          };
        }
        gameState = "talking";
      } else if (!inventory.has(item.id) && player.isNear(item, 30)) {
        inventory.add(item);
        message = "You found Hikarigumo's bag!";
        messageTimer = 180; // show for 3 seconds (60 frames x 3)
      }
    }
  } else if (gameState === "talking") {
    if (input.consumePressed(" ")) {
      if (dialogueIndex < dialogueLines.length - 1) {
        dialogueIndex++;
      } else {
        if (dialogueCallback) {
          dialogueCallback();
          dialogueCallback = null;
        } else {
          gameState = "asking";
        }
      }
    }
  } else if (gameState === "asking") {
    if (input.consumePressed("ArrowUp")) {
      selectedOption = (selectedOption + 2) % 3;
    } else if (input.consumePressed("ArrowDown")) {
      selectedOption = (selectedOption + 1) % 3;
    } else if (input.consumePressed(" ")) {
      if (selectedOption === 2) {
        if (storyPhase === 0) {
          dialogueLines = [
            "Ah...",
            "My knee. I hurt it when I landed.",
            "I have a bandaid in my bag...",
            "...Wait. Where is my bag?",
            "I had it when I fell. It must be somewhere on the beach.",
            "Bakezaru: I will find it.",
          ];
          dialogueIndex = 0;
          dialogueCallback = () => {
            storyPhase = 1;
            gameState = "walking";
          };
          gameState = "talking";
          selectedOption = 0;
          visited = [false, false];
        } else {
          dialogueLines = [
            "You are still looking?",
            "Take your time. I am not going anywhere like this.",
          ];
          dialogueIndex = 0;
          gameState = "walking";
          selectedOption = 0;
          visited = [false, false];
        }
      } else {
        visited[selectedOption] = true;
        answerLines = buildLines(
          ctx,
          questions[selectedOption].a,
          canvas.width - 80,
        );
        answerPage = 0;
        gameState = "answering";
      }
    }
  } else if (gameState === "answering") {
    if (input.consumePressed(" ")) {
      const totalPages = Math.ceil(answerLines.length / 2);
      if (answerPage < totalPages - 1) {
        answerPage++;
      } else {
        gameState = "asking";
      }
    }
  }

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
      gameState === "walking" &&
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
    if (gameState === "walking" && storyPhase < 3 && player.isNear(npc)) {
      ctx.fillStyle = "Black";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Press Space", npc.x + npc.width / 2, npc.y - 10);
      ctx.textAlign = "left";
    }
  }

  // Diplay dialogue
  if (gameState === "talking") {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(20, 240, canvas.width - 40, 70);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    const wrapped = buildLines(
      ctx,
      dialogueLines[dialogueIndex],
      canvas.width - 80,
    );
    wrapped.forEach((line, i) => {
      ctx.fillText(line, 35, 262 + i * 20);
    });
  } else if (gameState === "asking") {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(20, 240, canvas.width - 40, 70);
    ctx.font = "16px monospace";
    questions.forEach((q, i) => {
      ctx.fillStyle = visited[i] ? "#888" : "white";
      const cursor = selectedOption === i ? "> " : "  ";
      ctx.fillText(cursor + q.q, 35, 265 + i * 20);
    });
  } else if (gameState === "answering") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(20, 240, canvas.width - 40, 70);
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    const start = answerPage * 2;
    answerLines.slice(start, start + 2).forEach((line, i) => {
      ctx.fillText(line, 35, 265 + i * 20);
    });
  }

  inventory.drawPanel(ctx, canvas);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
