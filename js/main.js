const imageNames = [
  '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
  '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg',
  '11.jpg',
  '12.jpg',
  '13.jpg',
  '14.jpg',
  '15.jpg',
  '16.jpg',
  '17.jpg',
  '18.jpg',
  '19.jpg',
  '20.jpg',
  '21.jpg',
  '22.jpg',
  '23.jpg',
  '24.jpg',
  '25.jpg',
  '26.jpg'  
];
const moveSpeed = 10; // px per keypress
const eaterGrowBy = 10; // px

const gameArea = document.getElementById('game-area');
const eater = document.getElementById('eater');
const gameOverText = document.getElementById('game-over');
let keysPressed = {};
let intervalId = null;
let targets = [];
let currentDirection = 'right'; // default

document.addEventListener('DOMContentLoaded', () => {
  scatterImages();
  setupMovement();
});

function scatterImages() {
  const eatenArea = new Set();

  imageNames.forEach((name, idx) => {
    const img = document.createElement('img');
    img.src = `images/${name}`;
    img.classList.add('eatable');

    let pos = getNonOverlappingPosition(img);
    img.style.left = `${pos.left}px`;
    img.style.top = `${pos.top}px`;

    gameArea.appendChild(img);
    targets.push(img);
  });
}

function getNonOverlappingPosition(img) {
  const maxAttempts = 1000;
  const imgWidth = 100, imgHeight = 100;
  const gameRect = gameArea.getBoundingClientRect();
  let tries = 0;

  while (tries < maxAttempts) {
    const left = Math.floor(Math.random() * (gameRect.width - imgWidth));
    const top = Math.floor(Math.random() * (gameRect.height - imgHeight - 80)); // -80 for eater height buffer

    const testRect = {
      left, top,
      right: left + imgWidth,
      bottom: top + imgHeight
    };

    const overlaps = targets.some(existing => {
      const rect = existing.getBoundingClientRect();
      return !(testRect.right < rect.left || testRect.left > rect.right ||
               testRect.bottom < rect.top || testRect.top > rect.bottom);
    });

    if (!overlaps) return { left, top };
    tries++;
  }

  return { left: 0, top: 0 }; // fallback
}

function setupMovement() {
  document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;

    if (!intervalId) {
      intervalId = setInterval(moveEater, 50);
    }
  });

  document.addEventListener('keyup', (e) => {
    delete keysPressed[e.key];
    if (Object.keys(keysPressed).length === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
}

function moveEater() {
  const eaterRect = eater.getBoundingClientRect();
  const parentRect = gameArea.getBoundingClientRect();
  let moved = false;

  const previousLeft = eater.offsetLeft;
  const previousTop = eater.offsetTop;

  if (keysPressed['ArrowUp'] && eaterRect.top > parentRect.top) {
    eater.style.top = `${Math.max(0, eater.offsetTop - moveSpeed)}px`;
    setEaterDirection('up');
    moved = true;
  }
  if (keysPressed['ArrowDown'] && eaterRect.bottom < parentRect.bottom) {
    eater.style.top = `${Math.min(parentRect.height - eater.offsetHeight, eater.offsetTop + moveSpeed)}px`;
    setEaterDirection('down');
    moved = true;
  }
  if (keysPressed['ArrowLeft'] && eaterRect.left > parentRect.left) {
    eater.style.left = `${Math.max(0, eater.offsetLeft - moveSpeed)}px`;
    setEaterDirection('left');
    moved = true;
  }
  if (keysPressed['ArrowRight'] && eaterRect.right < parentRect.right) {
    eater.style.left = `${Math.min(parentRect.width - eater.offsetWidth, eater.offsetLeft + moveSpeed)}px`;
    setEaterDirection('right');
    moved = true;
  }

  if (moved) {
    dropDot(previousLeft, previousTop);
    checkCollision();
  }
}

function setEaterDirection(direction) {
  if (currentDirection !== direction) {
    currentDirection = direction;
    eater.src = `images/eater-${direction}.gif`;
  }
}

function checkCollision() {
  const eaterRect = eater.getBoundingClientRect();

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const rect = target.getBoundingClientRect();

    const x_overlap = Math.max(
      0, Math.min(eaterRect.right, rect.right) - Math.max(eaterRect.left, rect.left)
    );
    const y_overlap = Math.max(
      0, Math.min(eaterRect.bottom, rect.bottom) - Math.max(eaterRect.top, rect.top)
    );

    const overlapArea = x_overlap * y_overlap;
    const targetArea = rect.width * rect.height;

    if (overlapArea >= 0.25 * targetArea) {
      // Eat it
      target.remove();
      targets.splice(i, 1);
      growEater();
      checkGameOver();
      break;
    }
  }
}

function growEater() {
  const currWidth = eater.offsetWidth;
  const currHeight = eater.offsetHeight;

  eater.style.width = `${currWidth + eaterGrowBy}px`;
  eater.style.height = `${currHeight + eaterGrowBy}px`;
}

function checkGameOver() {
  if (targets.length === 0) {
    gameOverText.style.display = 'block';
    launchConfetti();
    fadeTrailDots();
    resetEaterPosition();
  }
}
function dropDot(x, y) {
  const dot = document.createElement('div');
  dot.classList.add('dot');

  // Center the dot behind eater
  const eaterWidth = eater.offsetWidth;
  const eaterHeight = eater.offsetHeight;
  const dotSize = 5;

  dot.style.left = `${x + eaterWidth / 2 - dotSize / 2}px`;
  dot.style.top = `${y + eaterHeight / 2 - dotSize / 2}px`;

  gameArea.appendChild(dot);
}
function launchConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      }
    }));
  }, 250);
}
function fadeTrailDots() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach(dot => dot.classList.add('faded'));
}

function resetEaterPosition() {
  eater.style.left = '0px';
  eater.style.top = `${gameArea.offsetHeight - eater.offsetHeight}px`;
}
