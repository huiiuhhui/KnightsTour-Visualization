const DEFAULT_BOARD_SIZE = 8;
const MIN_BOARD_SIZE = 5;
const MAX_BOARD_SIZE = 12;
const BOARD_PIXEL_TARGET = 520;
const MIN_CELL_SIZE = 34;
const MAX_CELL_SIZE = 72;
const DEFAULT_MANUAL_BOARD_SIZE = 8;

const knightMoves = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

const createMatrix = (size, initialValue = 0) =>
  Array.from({ length: size }, () => Array(size).fill(initialValue));

let boardSize = DEFAULT_BOARD_SIZE;
let board = createMatrix(boardSize, 0);
let manualBoardSize = DEFAULT_MANUAL_BOARD_SIZE;

class State {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.opts = null;
    this.nextIdx = 0;
  }
}

const isSafe = (x, y) =>
  x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[x][y] === 0;

const solveKnightTour = (startX, startY) => {
  board = createMatrix(boardSize, 0);
  const stack = [];
  const path = [];
  const totalCells = boardSize * boardSize;

  board[startX][startY] = 1;
  stack.push(new State(startX, startY, 0));
  path.push([startX, startY]);

  const getDegree = (x, y) => {
    let count = 0;
    for (let k = 0; k < knightMoves.length; k++) {
      const nx = x + knightMoves[k][0];
      const ny = y + knightMoves[k][1];
      if (isSafe(nx, ny)) count++;
    }
    return count;
  };

  while (stack.length > 0) {
    if (stack.length === totalCells) return path;

    const cur = stack[stack.length - 1];
    const { x, y } = cur;

    if (!cur.opts) {
      const opts = [];
      for (let k = 0; k < knightMoves.length; k++) {
        const nx = x + knightMoves[k][0];
        const ny = y + knightMoves[k][1];
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
const infoBox = document.querySelector(".info");
const btnDisplayByStops = document.querySelector(".display_bysteps");
const btnStartPosition = document.querySelector(".start_position");
const btnStart = document.querySelector(".start");
const btnReset = document.querySelector(".reset");
const btnPause = document.querySelector(".pause");
const btnApplyBoardSize = document.querySelector(".apply_board_size");
const inputStartPositionX = document.querySelector(".form__input--x");
const inputStartPositionY = document.querySelector(".form__input--y");
const inputBoardSize = document.querySelector(".form__input--size");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const docRoot = document.documentElement;

let animationSpeed = 100;
const animationState = {
  path: [],
  step: 0,
  isPaused: false,
  isReset: false,
  isRunning: false,
};

const setInfo = (message) => {
  if (infoBox) infoBox.textContent = message;
};

const getCellSize = () => {
  const target = Math.floor(BOARD_PIXEL_TARGET / boardSize);
  return Math.max(MIN_CELL_SIZE, Math.min(target, MAX_CELL_SIZE));
};

const updateBoardSizeStyles = () => {
  docRoot.style.setProperty("--board-size", boardSize);
  docRoot.style.setProperty("--cell-size", `${getCellSize()}px`);
};

const updateStartInputBounds = () => {
  inputStartPositionX.max = boardSize;
  inputStartPositionY.max = boardSize;
  if (Number(inputStartPositionX.value) > boardSize)
    inputStartPositionX.value = boardSize;
  if (Number(inputStartPositionY.value) > boardSize)
    inputStartPositionY.value = boardSize;
};

const createBoard = () => {
  itemBoard.innerHTML = "";
  updateBoardSizeStyles();
  const frag = document.createDocumentFragment();
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add(
        "cell",
        "auto-cell",
        (i + j) % 2 === 0 ? "white" : "black"
      );
      frag.appendChild(cell);
    }
  }
  itemBoard.appendChild(frag);
};

const displayBySteps = () => {
  const cells = itemBoard.querySelectorAll(".auto-cell");
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      cells[i * boardSize + j].textContent = board[i][j] || "";
    }
  }
};

const resetBoard = (message = "棋盘已重置，请重新设置起点。") => {
  board = createMatrix(boardSize, 0);
  const cells = itemBoard.querySelectorAll(".auto-cell");
  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.classList.remove("active");
    const x = Math.floor(index / boardSize);
    const y = index % boardSize;
    cell.style.backgroundColor = "";
    cell.classList.toggle("white", (x + y) % 2 === 0);
    cell.classList.toggle("black", (x + y) % 2 !== 0);
  });
  animationState.path = [];
  animationState.step = 0;
  animationState.isRunning = false;
  animationState.isReset = true;
  animationState.isPaused = false;
  btnPause.textContent = "暂停";
  setInfo(message);
};

btnReset.addEventListener("click", () => resetBoard("棋盘已重置。"));
btnDisplayByStops.addEventListener("click", displayBySteps);

btnApplyBoardSize.addEventListener("click", (e) => {
  e.preventDefault();
  const newSize = Number(inputBoardSize.value);
  if (!Number.isInteger(newSize))
    return alert("请输入整数的棋盘大小（5 ~ 12）。");
  if (newSize < MIN_BOARD_SIZE || newSize > MAX_BOARD_SIZE)
    return alert(`棋盘大小需在 ${MIN_BOARD_SIZE} 到 ${MAX_BOARD_SIZE} 之间。`);
  if (newSize === boardSize)
    return setInfo("棋盘大小未变化，继续使用当前尺寸。");

  boardSize = newSize;
  createBoard();
  resetBoard("棋盘大小已更新，请重新选择起点。");
  updateStartInputBounds();
});

createBoard();
resetBoard("等待选择起点…");
updateStartInputBounds();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const animatePath = async (path) => {
  const cells = itemBoard.querySelectorAll(".auto-cell");
  animationState.isPaused = false;
  animationState.isReset = false;
  animationState.isRunning = true;
  setInfo("演示中，可随时暂停或重置。");

  for (let step = animationState.step; step < path.length; step++) {
    if (animationState.isReset) break;
    while (animationState.isPaused) await sleep(60);

    const [x, y] = path[step];
    const index = x * boardSize + y;
    const cell = cells[index];
    cell.classList.add("active");
    await sleep(animationSpeed);
    cell.classList.remove("active");
    cell.textContent = step + 1;
    animationState.step++;
  }

  animationState.isRunning = false;
  if (!animationState.isReset) setInfo("演示结束，可更换起点或重置棋盘。");
};

btnStartPosition.addEventListener("click", (e) => {
  e.preventDefault();
  const x = Number(inputStartPositionX.value);
  const y = Number(inputStartPositionY.value);
  if (
    Number.isNaN(x) ||
    Number.isNaN(y) ||
    x < 1 ||
    x > boardSize ||
    y < 1 ||
    y > boardSize
  ) {
    return alert(`请输入正确的起点 (1 ~ ${boardSize})。`);
  }
  const path = solveKnightTour(x - 1, y - 1);
  if (!path) {
    animationState.path = [];
    setInfo("未找到可行路径，请尝试其他起点。");
    alert("该起点无解，请尝试其他位置。");
  } else {
    animationState.path = path;
    animationState.step = 0;
    setInfo(`共找到 ${path.length} 步的路径，点击“开始演示”查看过程。`);
  }
});

btnStart.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!animationState.path.length) return alert("请先计算路径，再开始演示。");
  if (animationState.isRunning) return;
  await animatePath(animationState.path);
});

btnPause.addEventListener("click", () => {
  if (!animationState.path.length) return;
  animationState.isPaused = !animationState.isPaused;
  btnPause.textContent = animationState.isPaused ? "继续" : "暂停";
  setInfo(animationState.isPaused ? "已暂停，点击“继续”恢复播放。" : "演示中…");
});

speedRange.addEventListener("input", () => {
  animationSpeed = Number(speedRange.value);
  speedValue.textContent = `${animationSpeed}ms`;
});

// Manual board module -------------------------------------------------------
const manualBoardEl = document.querySelector(".manual-board");
const manualInfoEl = document.querySelector(".manual-info");
const manualUndoBtn = document.querySelector(".manual-undo");
const manualResetBtn = document.querySelector(".manual-reset");
const manualSizeInput = document.querySelector(".manual-size-input");
const manualApplySizeBtn = document.querySelector(".manual-apply-size");
if (manualSizeInput) manualSizeInput.value = manualBoardSize;

const createManualState = () => ({
  path: [],
  visited: createMatrix(manualBoardSize, false),
  marks: createMatrix(manualBoardSize, 0),
});

let manualState = createManualState();

const updateManualBoardStyles = () => {
  docRoot.style.setProperty("--manual-board-size", manualBoardSize);
};

const resetManualMatrices = () => {
  manualState = createManualState();
};

const isKnightMoveValid = (from, to) => {
  return knightMoves.some(
    ([dx, dy]) => from[0] + dx === to[0] && from[1] + dy === to[1]
  );
};

const updateManualInfo = (message = "点击棋盘继续规划路径。") => {
  const progress = manualState.path.length;
  const total = manualBoardSize * manualBoardSize;
  manualInfoEl.textContent = `${message}（当前进度：${progress} / ${total}）`;
};

const updateManualBoardView = () => {
  const cells = manualBoardEl.querySelectorAll(".manual-cell");
  const lastIndex = manualState.path.length - 1;
  const lastStep = lastIndex >= 0 ? manualState.path[lastIndex] : null;
  cells.forEach((cell) => {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const row = manualState.marks[x] || [];
    const stepNo = row[y] || 0;
    cell.textContent = stepNo ? stepNo : "";
    cell.classList.toggle("manual-step", Boolean(stepNo));
    const isLast = Boolean(lastStep && lastStep[0] === x && lastStep[1] === y);
    cell.classList.toggle("manual-last", isLast);
    cell.classList.remove("active");
  });
};

const handleManualCellClick = (event) => {
  const cell = event.currentTarget;
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  if (manualState.visited[x][y]) {
    updateManualInfo("该格已访问过，请选择其他格。");
    return;
  }

  if (manualState.path.length > 0) {
    const last = manualState.path[manualState.path.length - 1];
    if (!isKnightMoveValid(last, [x, y])) {
      updateManualInfo("只能按照骑士走法移动，请重新选择。");
      return;
    }
  }

  manualState.path.push([x, y]);
  manualState.visited[x][y] = true;
  manualState.marks[x][y] = manualState.path.length;
  updateManualBoardView();

  if (manualState.path.length === manualBoardSize * manualBoardSize) {
    updateManualInfo("恭喜！你完成了整盘巡游。");
  } else if (manualState.path.length === 1) {
    updateManualInfo("起点记录成功，继续寻找下一步。");
  } else {
    updateManualInfo("下一步走向哪里？");
  }
};

const createManualBoard = () => {
  manualBoardEl.innerHTML = "";
  updateManualBoardStyles();
  const frag = document.createDocumentFragment();
  for (let i = 0; i < manualBoardSize; i++) {
    for (let j = 0; j < manualBoardSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add(
        "cell",
        "manual-cell",
        (i + j) % 2 === 0 ? "white" : "black"
      );
      cell.dataset.x = i;
      cell.dataset.y = j;
      cell.addEventListener("click", handleManualCellClick);
      frag.appendChild(cell);
    }
  }
  manualBoardEl.appendChild(frag);
};

const resetManualBoard = (
  message = "点击任意格开始你的路线。"
) => {
  resetManualMatrices();
  updateManualBoardView();
  updateManualInfo(message);
};

const undoManualStep = () => {
  if (!manualState.path.length) {
    updateManualInfo("还没有走子，无法撤销。");
    return;
  }
  const [x, y] = manualState.path.pop();
  manualState.visited[x][y] = false;
  manualState.marks[x][y] = 0;
  updateManualBoardView();

  if (manualState.path.length === 0) {
    updateManualInfo("起点已撤销，点击任意格重新开始。");
  } else {
    updateManualInfo("已撤销一步，继续尝试。");
  }
};

manualUndoBtn.addEventListener("click", undoManualStep);
manualResetBtn.addEventListener("click", () =>
  resetManualBoard("练习棋盘已清空，点击任意格重新开始。")
);

manualApplySizeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const newSize = Number(manualSizeInput.value);
  if (!Number.isInteger(newSize))
    return alert("请输入整数的棋盘大小（5 ~ 12）。");
  if (newSize < MIN_BOARD_SIZE || newSize > MAX_BOARD_SIZE)
    return alert(`棋盘大小需在 ${MIN_BOARD_SIZE} 到 ${MAX_BOARD_SIZE} 之间。`);
  if (newSize === manualBoardSize) {
    updateManualInfo("棋盘大小未发生变化，可继续当前尝试。");
    return;
  }
  manualBoardSize = newSize;
  createManualBoard();
  resetManualBoard("练习棋盘大小已更新，点击任意格重新开始。");
});

createManualBoard();
resetManualBoard();

// 作者信息弹窗
const modal = document.getElementById("authorModal");
const authorBtn = document.getElementById("authorBtn");
const modalClose = document.querySelector(".close");

authorBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

modalClose.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) modal.style.display = "none";
});
