const board = Array.from({ length: 8 }, () => Array(8).fill(0));

const move = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

class State {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.opts = null;
    this.nextIdx = 0;
  }
}

const isSafe = (x, y) =>
  x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === 0;

// Warnsdorff 启发式求解（贪心）
const solveKnightTour = function (startX, startY) {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) board[i][j] = 0;
  const stack = [];
  const path = [];
  board[startX][startY] = 1;
  stack.push(new State(startX, startY, 0));
  path.push([startX, startY]);

  const getDegree = (x, y) => {
    let count = 0;
    for (let k = 0; k < 8; k++) {
      const nx = x + move[k][0],
        ny = y + move[k][1];
      if (isSafe(nx, ny)) count++;
    }
    return count;
  };

  while (stack.length > 0) {
    if (stack.length === 64) return path;

    const cur = stack[stack.length - 1];
    const { x, y } = cur;

    if (!cur.opts) {
      const opts = [];
      for (let k = 0; k < 8; k++) {
        const nx = x + move[k][0],
          ny = y + move[k][1];
        if (isSafe(nx, ny)) opts.push({ nx, ny, deg: getDegree(nx, ny) });
      }
      if (opts.length === 0) {
        board[x][y] = 0;
        path.pop();
        stack.pop();
        continue;
      }
      opts.sort((a, b) => a.deg - b.deg || Math.random() - 0.5);
      cur.opts = opts;
      cur.nextIdx = 0;
    }

    if (cur.nextIdx >= cur.opts.length) {
      board[x][y] = 0;
      path.pop();
      stack.pop();
      continue;
    }

    const { nx, ny } = cur.opts[cur.nextIdx++];
    board[nx][ny] = stack.length + 1;
    stack.push(new State(nx, ny, 0));
    path.push([nx, ny]);
  }
  return null;
};

const itemBoard = document.querySelector(".chessboard");
const btnDisplayByStops = document.querySelector(".display_bysteps");
const btnStartPosition = document.querySelector(".start_position");
const btnStart = document.querySelector(".start");
const btnReset = document.querySelector(".reset");
const btnPause = document.querySelector(".pause");
const inputStartPositionX = document.querySelector(".form__input--x");
const inputStartPositionY = document.querySelector(".form__input--y");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");

let animationSpeed = 100;
const animationState = {
  path: [],
  step: 0,
  isPaused: false,
  isReset: false,
  isRunning: false,
};

//  创建棋盘
const createBoard = function () {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell", (i + j) % 2 === 0 ? "white" : "black");
      itemBoard.appendChild(cell);
    }
  }
};
createBoard();

//  输出棋盘数字
const displayBySteps = function () {
  const cells = document.querySelectorAll(".cell");
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      cells[i * 8 + j].textContent = board[i][j] || "";
    }
  }
};
btnDisplayByStops.addEventListener("click", displayBySteps);

//  重置棋盘
const resetBoard = function () {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) board[i][j] = 0;
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.textContent = "";
    const x = Math.floor(index / 8);
    const y = index % 8;
    cell.style.backgroundColor = (x + y) % 2 === 0 ? "#fff" : "#000";
  });
  animationState.isRunning = false;
  animationState.isReset = true;
  animationState.step = 0;
  console.log("棋盘已重置");
};
btnReset.addEventListener("click", resetBoard);

// 动画播放
async function animatePath(path) {
  const cells = document.querySelectorAll(".cell");
  animationState.isPaused = false;
  animationState.isReset = false;
  animationState.isRunning = true;

  for (let step = animationState.step; step < path.length; step++) {
    if (animationState.isReset) break;
    while (animationState.isPaused) await new Promise((r) => setTimeout(r, 50));

    const [x, y] = path[step];
    const index = x * 8 + y;
    const cell = cells[index];
    //cell.style.backgroundColor = "#ffd633";
    cell.classList.add("active");
    await new Promise((r) => setTimeout(r, animationSpeed));
    cell.classList.remove("active");
    cell.textContent = step + 1;

    await new Promise((r) => setTimeout(r, animationSpeed));
    cell.style.backgroundColor = (x + y) % 2 === 0 ? "#fff" : "#000";
    animationState.step++;
  }

  animationState.isRunning = false;
}

// 确认起点
btnStartPosition.addEventListener("click", function (e) {
  e.preventDefault();
  const x = Number(inputStartPositionX.value);
  const y = Number(inputStartPositionY.value);
  if (x >= 1 && x <= 8 && y >= 1 && y <= 8) {
    const path = solveKnightTour(x - 1, y - 1);
    if (!path) alert("无解！");
    else {
      animationState.path = path;
    }
  } else alert("请输入正确的起点 (1–8)");
});

// 开始动画
btnStart.addEventListener("click", async function (e) {
  e.preventDefault();
  if (!animationState.path.length) return alert("请先确认初始位置！");
  await animatePath(animationState.path);
});

// 暂停 / 继续
btnPause.addEventListener("click", function () {
  animationState.isPaused = !animationState.isPaused;
  btnPause.textContent = animationState.isPaused ? "继续" : "暂停";
});

// 调节速度
speedRange.addEventListener("input", function () {
  animationSpeed = Number(speedRange.value);
  speedValue.textContent = `${animationSpeed}ms`;
});

// 作者信息窗口
const modal = document.getElementById("authorModal");
const btn = document.getElementById("authorBtn");
const span = document.querySelector(".close");

// 打开模态框
btn.onclick = function () {
  modal.style.display = "block";
};

// 点击关闭按钮
span.onclick = function () {
  modal.style.display = "none";
};

// 点击窗口外部关闭模态框
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};
