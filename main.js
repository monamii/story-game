const canvas = /** @type {HTMLCanvasElement}*/ (
  document.getElementById("game")
);
const ctx = /** @type {CanvasRenderingContext2D}*/ (canvas.getContext("2d"));

const player = {
  x: 30,
  y: 30,
  width: 32,
  height: 32,
  speed: 3,
};
const npc = {
  x: 340,
  y: 230,
  width: 32,
  height: 32,
};

const item = {
  x: 80,
  y: 200,
  width: 16,
  height: 16,
  collected: false,
};

let selectedOption = 0;
let visited = [false, false];

let message = "";
let messageTimer = 0;

let currentMap = 1;

const questions = [
  {
    q: "Where did you from?",
    a: "I fell from the clouds. I'm trying to get back. I miss my mom and dad.",
  },
  {
    q: "Who are you?",
    a: "I'm Hikarigumo. I'm from a town up above the cloud.I'm Hikarigumo. I'm from a town up above the cloud.I'm Hikarigumo. I'm from a town up above the cloud.",
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

const keys = {};

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;

  if (e.key === " " && gameState === "walking") {
    if (isNear(player, npc)) {
      gameState = "talking";
      dialogueIndex = 0;
      if (storyPhase === 1 && !item.collected) {
        dialogueLines = ["Did you find my bag?", "My knee really hurts..."];

        dialogueCallback = () => {
          gameState = "walking";
        };
        gameState = "talking";
      } else if (storyPhase === 1 && item.collected) {
        dialogueLines = [
          "That's my bag! Thank you!",
          "Let me put on this bandaid...",
          "There! Good as new.",
          "Want to look around together?",
        ];
        dialogueCallback = () => {
          storyPhase = 3;
          gameState = "walking";
        };
        gameState = "talking";
      } else {
        gameState = "talking";
      }
    } else if (!item.collected && isNear(player, item, 30)) {
      item.collected = true;
      message = "You found Hikarigumo's bag!";
      messageTimer = 180; // show for 3 seconds (60 frames x 3)
    }
  } else if (e.key === " " && gameState === "talking") {
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
  } else if (gameState === "asking") {
    if (e.key === "ArrowUp") {
      selectedOption = (selectedOption + 2) % 3;
    } else if (e.key === "ArrowDown") {
      selectedOption = (selectedOption + 1) % 3;
    } else if (e.key === " ") {
      if (selectedOption === 2) {
        if (storyPhase === 0) {
          dialogueLines = [
            "Ouch...",
            "My knee hurts a little.",
            "I have a bandaid in my bag...",
            "Wait, where is my bag?",
            "I must have dropped it when I fell.",
            "Bakezaru: I'll look for it.",
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
          gameState = "walking";
          selectedOption = 0;
          visited = [false, false];
        }
      } else {
        visited[selectedOption] = true;
        answerLines = buildLines(questions[selectedOption].a);
        answerPage = 0;
        gameState = "answering";
      }
    }
  } else if (e.key === " " && gameState === "answering") {
    const totalPages = Math.ceil(answerLines.length / 2);
    if (answerPage < totalPages - 1) {
      answerPage++;
    } else {
      gameState = "asking";
    }
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function update() {
  if (gameState === "walking") {
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    if (currentMap === 1 && player.x >= canvas.width - player.width) {
      currentMap = 2;
      player.x = 10;
      if (storyPhase >= 3) {
        npc.x = player.x + 10;
        npc.y = player.y;
      }
    }
    if (currentMap === 2 && player.x <= 0) {
      currentMap = 1;
      player.x = canvas.width - player.width - 1;

      if (storyPhase >= 3) {
        npc.x = player.x - 10;
        npc.y = player.y;
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

function isNear(a, b, distance = 40) {
  const dx = a.x + a.width / 2 - (b.x + b.width / 2);
  const dy = a.y + a.height / 2 - (b.y + b.height / 2);
  return Math.sqrt(dx * dx + dy * dy) < distance;
}

//#b5651d
function drawBakezaru(x, y) {
  const cx = x + 16;
  const cy = y + 14;
  const scale = 1.1; // adjust this number until heights match

  ctx.save();
  ctx.translate(cx, cy); // move origin to character center
  ctx.scale(scale, scale); // scale up
  ctx.translate(-cx, -cy); // move origin back

  // Swirling tail
  ctx.strokeStyle = "#d17c32";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 6);
  ctx.bezierCurveTo(cx + 42, cy + 16, cx + 58, cy - 2, cx + 48, cy - 20);
  ctx.bezierCurveTo(cx + 40, cy - 34, cx + 22, cy - 34, cx + 18, cy - 20);
  ctx.bezierCurveTo(cx + 14, cy - 8, cx + 24, cy - 4, cx + 30, cy - 10);
  ctx.bezierCurveTo(cx + 34, cy - 14, cx + 28, cy - 20, cx + 24, cy - 18);
  ctx.stroke();

  // Left wing
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 2);
  ctx.bezierCurveTo(cx - 16, cy - 10, cx - 26, cy - 5, cx - 22, cy + 6);
  ctx.bezierCurveTo(cx - 18, cy + 12, cx - 12, cy + 8, cx - 8, cy + 2);
  ctx.fill();
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx - 20, cy + 4, 3, 0, Math.PI * 1.5);
  ctx.stroke();

  // Right wing
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 2);
  ctx.bezierCurveTo(cx + 16, cy - 10, cx + 26, cy - 5, cx + 22, cy + 6);
  ctx.bezierCurveTo(cx + 18, cy + 12, cx + 12, cy + 8, cx + 8, cy + 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 20, cy + 4, 3, Math.PI * 1.5, Math.PI * 3);
  ctx.stroke();

  // Head (rounded heart with round bottom)
  ctx.fillStyle = "#d17c32";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.bezierCurveTo(cx + 2, cy - 14, cx + 14, cy - 14, cx + 13, cy - 5);
  ctx.bezierCurveTo(cx + 14, cy + 2, cx + 9, cy + 8, cx + 7, cy + 8);
  ctx.arc(cx, cy + 8, 8, 0, Math.PI, false);
  ctx.bezierCurveTo(cx - 9, cy + 8, cx - 14, cy + 2, cx - 13, cy - 5);
  ctx.bezierCurveTo(cx - 14, cy - 14, cx - 2, cy - 14, cx, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Forehead wrinkles (two-bump shape, following heart)
  ctx.strokeStyle = "#60341e";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 5);
  ctx.quadraticCurveTo(cx - 3, cy - 9, cx, cy - 6);
  ctx.quadraticCurveTo(cx + 3, cy - 9, cx + 7, cy - 5);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Beak (open, center of face, below eyes)
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 4);
  ctx.lineTo(cx + 4, cy + 4);
  ctx.lineTo(cx + 2, cy + 2);
  ctx.lineTo(cx, cy + 1);
  ctx.lineTo(cx - 2, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Feet (small round blobs)
  ctx.fillStyle = "#ffa500";
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy + 15, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 15, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHikarigumo(x, y) {
  const cx = x + 16;
  const cy = y + 16;

  // Legs
  ctx.fillStyle = "white";
  ctx.fillRect(cx - 5, cy + 18, 3, 7);
  ctx.fillRect(cx + 2, cy + 18, 3, 7);

  // Dress (triangle)
  ctx.fillStyle = "#f9a8d4";
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 2);
  ctx.lineTo(cx + 2, cy + 2);
  ctx.lineTo(cx + 8, cy + 18);
  ctx.lineTo(cx - 8, cy + 18);
  ctx.closePath();
  ctx.fill();

  // Arms (tilted to follow dress slope)
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 3);
  ctx.lineTo(cx - 5, cy + 3);
  ctx.lineTo(cx - 9, cy + 14);
  ctx.lineTo(cx - 7, cy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 3);
  ctx.lineTo(cx + 5, cy + 3);
  ctx.lineTo(cx + 9, cy + 14);
  ctx.lineTo(cx + 7, cy + 14);
  ctx.closePath();
  ctx.fill();

  // White collar
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 2);
  ctx.lineTo(cx, cy + 7);
  ctx.lineTo(cx - 1, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy + 2);
  ctx.lineTo(cx, cy + 7);
  ctx.lineTo(cx + 1, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Buttons
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + 14, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Cloud head (lowered to attach to dress)
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 6, cy - 3, 8, 0, Math.PI * 2);
  ctx.fill();

  // Unicorn horn (shifted down with head)
  ctx.fillStyle = "#e8c070";
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 11);
  ctx.lineTo(cx, cy - 22);
  ctx.lineTo(cx + 3, cy - 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c8a050";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 20);
  ctx.lineTo(cx + 1, cy - 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 16);
  ctx.lineTo(cx + 2, cy - 12);
  ctx.stroke();

  // Eyes (large oval, Mametchi-style)
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy - 3, 4, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy - 3, 4, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // White highlight (upper right of each pupil)
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 7, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentMap === 1) {
    // Forest background
    ctx.fillStyle = "#2d5a1b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Ground
    ctx.fillStyle = "#4a7c3f";
    ctx.fillRect(0, 200, canvas.width, canvas.height);
    // House
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(40, 140, 70, 70);
    ctx.fillStyle = "#5c2d0a";
    ctx.beginPath();
    ctx.moveTo(30, 140);
    ctx.lineTo(75, 100);
    ctx.lineTo(120, 140);
    ctx.closePath();
    ctx.fill();
    // Trees
    [
      [180, 120],
      [280, 100],
      [350, 130],
      [420, 110],
      [60, 220],
      [200, 230],
    ].forEach(([tx, ty]) => {
      ctx.fillStyle = "#1a3d0a";
      ctx.beginPath();
      ctx.arc(tx, ty, 28, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Beach (existing drawing)
    ctx.fillStyle = "#f5deb3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(0, 260, canvas.width, 60);
  }

  // bakezaru - player
  drawBakezaru(player.x, player.y);

  if (currentMap === 2 || storyPhase >= 3) {
    // hikarigumo
    drawHikarigumo(npc.x, npc.y);

    // Hikarigumo's bag
    if (!item.collected) {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(item.x + 3, item.y - 3, 10, 4);
    }

    // Hint above bag
    if (
      !item.collected &&
      gameState === "walking" &&
      isNear(player, item, 30)
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
    if (gameState === "walking" && storyPhase < 3 && isNear(player, npc)) {
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
    ctx.fillText(dialogueLines[dialogueIndex], 35, 265);
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
}

function buildLines(text) {
  ctx.font = "16px monospace";
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const text = line + word + " ";
    if (ctx.measureText(text).width > canvas.width - 80 && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = text;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
