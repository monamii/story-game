const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const lines = ["...", "Someone is here.", "What do you do?"];
let index = 0;
let phase = "dialogue"; // 'dialogue' | 'choice' | 'result'
let result = "";

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4ade80";
  ctx.fillRect(220, 220, 40, 60);

  ctx.fillStyle = "white";
  ctx.font = "20px monospace";

  if (phase === "dialogue") {
    ctx.fillText(lines[index], 40, 60);
  } else if (phase === "choice") {
    ctx.fillText("What do you do?", 40, 60);
    ctx.fillText("[A] Say hello", 80, 160);
    ctx.fillText("[B] Stay silent", 80, 200);
  } else if (phase === "result") {
    ctx.fillText(result, 40, 60);
  }
}

draw();

window.addEventListener("keydown", (e) => {
  if (phase === "dialogue") {
    if (index < lines.length - 1) {
      index++;
    } else {
      phase = "choice";
    }
    draw();
  } else if (phase === "choice") {
    if (e.key === "a" || e.key === "A") {
      result = "You said hello. They smiled.";
      phase = "result";
      draw();
    } else if (e.key === "b" || e.key === "B") {
      result = "You stayed silent. They walked away.";
      phase = "result";
      draw();
    }
  }
});
