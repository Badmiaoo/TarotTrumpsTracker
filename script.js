const TOTAL = 22;
const BOUTS = new Set([1, 21, 0]);
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

const setupScreen = document.getElementById('setup-screen');
const app = document.getElementById('app');
const namesInputs = document.getElementById('names-inputs');
const startBtn = document.getElementById('start-btn');
const grid = document.getElementById('grid');
const playersSections = document.getElementById('players-sections');
const fallenCountEl = document.getElementById('fallen-count');
const remainingCountEl = document.getElementById('remaining-count');
const progressBar = document.getElementById('progress-bar');
const resetBtn = document.getElementById('reset-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const selectOverlay = document.getElementById('select-overlay');
const playerChips = document.getElementById('player-chips');
const cancelSelect = document.getElementById('cancel-select');

let players = [];
let assignments = {}; // cardId -> playerId
let selectedCardId = null;
let playerCount = 4;

function loadState() {
  try {
    const savedPlayers = localStorage.getItem('tarot-players');
    const savedAssign = localStorage.getItem('tarot-assignments');
    if (savedPlayers) players = JSON.parse(savedPlayers);
    if (savedAssign) assignments = JSON.parse(savedAssign);
  } catch (e) {
    players = [];
    assignments = {};
  }
}

function saveState() {
  localStorage.setItem('tarot-players', JSON.stringify(players));
  localStorage.setItem('tarot-assignments', JSON.stringify(assignments));
}

function showSetup() {
  setupScreen.style.display = 'flex';
  app.hidden = true;
  renderNameInputs();
}

function showApp() {
  setupScreen.style.display = 'none';
  app.hidden = false;
  renderAll();
}

function renderNameInputs() {
  namesInputs.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const input = document.createElement('input');
    input.className = 'name-input';
    input.placeholder = `Joueur ${i + 1}`;
    input.value = players[i]?.name || '';
    input.dataset.index = i;
    namesInputs.appendChild(input);
  }
}

document.querySelectorAll('.count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playerCount = parseInt(btn.dataset.count);
    renderNameInputs();
  });
});

startBtn.addEventListener('click', () => {
  const inputs = namesInputs.querySelectorAll('.name-input');
  players = [];
  inputs.forEach((input, i) => {
    const name = input.value.trim() || `Joueur ${i + 1}`;
    players.push({
      id: i,
      name,
      color: COLORS[i % COLORS.length]
    });
  });
  assignments = {};
  saveState();
  showApp();
});

function createCard(id, isExcuse = false) {
  const card = document.createElement('button');
  card.className = 'card';
  if (BOUTS.has(id)) card.classList.add('bout');
  if (isExcuse) card.classList.add('excuse');
  card.dataset.id = id;
  card.type = 'button';

  const imgName = isExcuse ? 'mat' : id;
  card.style.backgroundImage = `url('images/${imgName}.jpg')`;

  const number = document.createElement('span');
  number.className = 'card-number';
  number.textContent = isExcuse ? 'E' : id;
  card.appendChild(number);

  return card;
}

function renderRemaining() {
  grid.innerHTML = '';
  const remaining = [];
  for (let i = 1; i <= 21; i++) {
    if (!(i in assignments)) remaining.push(i);
  }
  if (!(0 in assignments)) remaining.push(0);

  remaining.forEach(id => {
    const isExcuse = id === 0;
    const card = createCard(id, isExcuse);
    card.addEventListener('click', () => openSelect(id));
    grid.appendChild(card);
  });
}

function renderPlayers() {
  playersSections.innerHTML = '';
  players.forEach(player => {
    const section = document.createElement('div');
    section.className = 'player-section';

    const header = document.createElement('div');
    header.className = 'player-header';

    const dot = document.createElement('div');
    dot.className = 'player-dot';
    dot.style.background = player.color;

    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name;

    const cardsOfPlayer = Object.entries(assignments)
      .filter(([cid, pid]) => pid === player.id)
      .map(([cid]) => parseInt(cid))
      .sort((a, b) => b - a); // high to low

    const count = document.createElement('div');
    count.className = 'player-count';
    count.textContent = cardsOfPlayer.length;

    header.appendChild(dot);
    header.appendChild(name);
    header.appendChild(count);
    section.appendChild(header);

    const pGrid = document.createElement('div');
    pGrid.className = 'player-grid';

    cardsOfPlayer.forEach(id => {
      const isExcuse = id === 0;
      const card = createCard(id, isExcuse);
      card.classList.add('assigned');
      card.style.setProperty('--player-color', player.color);
      pGrid.appendChild(card);
    });

    section.appendChild(pGrid);
    playersSections.appendChild(section);
  });
}

function renderAll() {
  renderRemaining();
  renderPlayers();
  updateStats();
}

function updateStats() {
  const fallen = Object.keys(assignments).length;
  fallenCountEl.textContent = fallen;
  remainingCountEl.textContent = TOTAL - fallen;
  progressBar.style.width = ((fallen / TOTAL) * 100) + '%';
}

function openSelect(cardId) {
  selectedCardId = cardId;
  playerChips.innerHTML = '';
  players.forEach(player => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.innerHTML = `<div class="chip-dot" style="background:${player.color}"></div>${player.name}`;
    chip.addEventListener('click', () => assignTo(player.id));
    playerChips.appendChild(chip);
  });
  selectOverlay.hidden = false;
}

function assignTo(playerId) {
  if (selectedCardId !== null) {
    assignments[selectedCardId] = playerId;
    saveState();
    renderAll();
  }
  closeSelect();
}

function closeSelect() {
  selectOverlay.hidden = true;
  selectedCardId = null;
}

cancelSelect.addEventListener('click', closeSelect);
selectOverlay.addEventListener('click', (e) => {
  if (e.target === selectOverlay) closeSelect();
});

function resetAssignments() {
  assignments = {};
  saveState();
  renderAll();
}

resetBtn.addEventListener('click', () => {
  modalOverlay.hidden = false;
});
modalCancel.addEventListener('click', () => modalOverlay.hidden = true);
modalConfirm.addEventListener('click', () => {
  resetAssignments();
  modalOverlay.hidden = true;
});
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.hidden = true;
});

// Init
loadState();
if (players.length === 0) {
  showSetup();
} else {
  showApp();
}
