const TOTAL = 22;
const BOUTS = new Set([1, 21, 0]);
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

const setupScreen = document.getElementById('setup-screen');
const app = document.getElementById('app');
const namesInputs = document.getElementById('names-inputs');
const startBtn = document.getElementById('start-btn');
const grid = document.getElementById('grid');
const playersSections = document.getElementById('players-sections');
const fallenCountEl = document.getElementById('fallen-count');
const remainingCountEl = document.getElementById('remaining-count');
const highestEl = document.getElementById('highest-remaining');
const lowestEl = document.getElementById('lowest-remaining');
const excuseEl = document.getElementById('excuse-status');
const progressBar = document.getElementById('progress-bar');
const resetBtn = document.getElementById('reset-btn');
const endBtn = document.getElementById('end-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const selectOverlay = document.getElementById('select-overlay');
const selectTitle = document.getElementById('select-title');
const playerChips = document.getElementById('player-chips');
const cancelSelect = document.getElementById('cancel-select');
const modeToggle = document.getElementById('mode-toggle');
const modeToggleSetup = document.getElementById('mode-toggle-setup');

let players = [];
let assignments = {};
let selectedCardId = null;
let playerCount = 4;
let playerMode = true; // true = dispatch to players, false = simple crossed mode
let crossed = new Set(); // for simple mode

function loadState() {
  try {
    const p = localStorage.getItem('tarot-players');
    const a = localStorage.getItem('tarot-assignments');
    const m = localStorage.getItem('tarot-player-mode');
    const c = localStorage.getItem('tarot-crossed');
    if (p) players = JSON.parse(p);
    if (a) assignments = JSON.parse(a);
    if (m !== null) playerMode = m === 'true';
    if (c) crossed = new Set(JSON.parse(c));
  } catch (e) {
    players = [];
    assignments = {};
    crossed = new Set();
  }
  updateModeUI();
}

function saveState() {
  localStorage.setItem('tarot-players', JSON.stringify(players));
  localStorage.setItem('tarot-assignments', JSON.stringify(assignments));
  localStorage.setItem('tarot-player-mode', playerMode);
  localStorage.setItem('tarot-crossed', JSON.stringify([...crossed]));
}

function updateModeUI() {
  [modeToggle, modeToggleSetup].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle('on', playerMode);
    const label = btn.querySelector('.mode-label');
    if (label) label.textContent = playerMode ? 'Mode joueurs' : 'Mode simple';
  });
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
  updateEndButton();
}

function updateEndButton() {
  if (!endBtn) return;
  endBtn.style.display = playerMode ? '' : 'none';
}

function renderNameInputs() {
  namesInputs.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const input = document.createElement('input');
    input.className = 'name-input';
    input.placeholder = `Nom du joueur ${i + 1}`;
    input.value = players[i]?.name || '';
    input.maxLength = 16;
    namesInputs.appendChild(input);
  }
}

document.querySelectorAll('.count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playerCount = +btn.dataset.count;
    renderNameInputs();
  });
});

startBtn.addEventListener('click', () => {
  const inputs = namesInputs.querySelectorAll('.name-input');
  players = Array.from(inputs).map((input, i) => ({
    id: i,
    name: input.value.trim() || `Joueur ${i + 1}`,
    color: COLORS[i % COLORS.length]
  }));
  assignments = {};
  saveState();
  showApp();
});

function createCard(id, isExcuse = false) {
  const card = document.createElement('button');
  card.className = 'card';
  if (BOUTS.has(id)) card.classList.add('bout');
  card.dataset.id = id;
  card.type = 'button';

  const img = isExcuse ? 'mat' : id;
  card.style.backgroundImage = `url('images/${img}.jpg')`;

  const num = document.createElement('span');
  num.className = 'card-number';
  num.textContent = isExcuse ? 'E' : id;
  card.appendChild(num);

  return card;
}

function renderRemaining() {
  grid.innerHTML = '';

  if (playerMode) {
    // Player mode: only unassigned cards
    const ids = [];
    for (let i = 21; i >= 1; i--) if (!(i in assignments)) ids.push(i);
    if (!(0 in assignments)) ids.push(0);

    ids.forEach(id => {
      const card = createCard(id, id === 0);
      card.addEventListener('click', () => openSelect(id, false));
      grid.appendChild(card);
    });
  } else {
    // Simple mode: all cards, crossed if marked
    const ids = [];
    for (let i = 21; i >= 1; i--) ids.push(i);
    ids.push(0);

    ids.forEach(id => {
      const card = createCard(id, id === 0);
      if (crossed.has(id)) card.classList.add('crossed');
      card.addEventListener('click', () => {
        if (crossed.has(id)) crossed.delete(id);
        else crossed.add(id);
        saveState();
        renderAll();
      });
      grid.appendChild(card);
    });
  }
}

function renderPlayers() {
  if (!playerMode) return;
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

    const cards = Object.entries(assignments)
      .filter(([, pid]) => pid === player.id)
      .map(([cid]) => +cid)
      .sort((a, b) => b - a);

    const count = document.createElement('div');
    count.className = 'player-count';
    count.textContent = cards.length;

    header.append(dot, name, count);
    section.appendChild(header);

    const pGrid = document.createElement('div');
    pGrid.className = 'player-grid';

    cards.forEach(id => {
      const card = createCard(id, id === 0);
      card.classList.add('assigned');
      card.style.setProperty('--player-color', player.color);
      card.addEventListener('click', () => openSelect(id, true));
      pGrid.appendChild(card);
    });

    section.appendChild(pGrid);
    playersSections.appendChild(section);
  });
}

function renderAll() {
  renderRemaining();
  if (playerMode) {
    playersSections.style.display = '';
    renderPlayers();
  } else {
    playersSections.style.display = 'none';
    playersSections.innerHTML = '';
  }
  updateStats();
  updateEndButton();
}

function updateStats() {
  let fallen, isPlayed;

  if (playerMode) {
    fallen = Object.keys(assignments).length;
    isPlayed = (id) => id in assignments;
  } else {
    fallen = crossed.size;
    isPlayed = (id) => crossed.has(id);
  }

  if (fallenCountEl) fallenCountEl.textContent = fallen;
  if (remainingCountEl) remainingCountEl.textContent = TOTAL - fallen;
  if (progressBar) progressBar.style.width = (fallen / TOTAL * 100) + '%';

  // Only 1-21 for highest/lowest
  const remainingNumbers = [];
  for (let i = 1; i <= 21; i++) {
    if (!isPlayed(i)) remainingNumbers.push(i);
  }

  if (remainingNumbers.length === 0) {
    if (highestEl) highestEl.textContent = '—';
    if (lowestEl) lowestEl.textContent = '—';
  } else {
    if (highestEl) highestEl.textContent = Math.max(...remainingNumbers);
    if (lowestEl) lowestEl.textContent = Math.min(...remainingNumbers);
  }

  // Excuse status
  if (excuseEl) {
    const played = isPlayed(0);
    excuseEl.textContent = 'E';
    excuseEl.classList.toggle('played', played);
  }
}

function openSelect(cardId, isReassign) {
  selectedCardId = cardId;
  selectTitle.textContent = isReassign ? 'Réassigner à…' : 'Qui a joué cette carte ?';
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
selectOverlay.addEventListener('click', e => {
  if (e.target === selectOverlay) closeSelect();
});

function resetAssignments() {
  assignments = {};
  saveState();
  renderAll();
}

function endGame() {
  if (confirm('Terminer la partie et revenir au choix des joueurs ?')) {
    players = [];
    assignments = {};
    saveState();
    showSetup();
  }
}

resetBtn.addEventListener('click', () => modalOverlay.hidden = false);
endBtn.addEventListener('click', endGame);
modalCancel.addEventListener('click', () => modalOverlay.hidden = true);
modalConfirm.addEventListener('click', () => {
  resetAssignments();
  modalOverlay.hidden = true;
});
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) modalOverlay.hidden = true;
});

// Mode toggle (both places)
function handleModeToggle() {
  playerMode = !playerMode;
  updateModeUI();
  saveState();
  if (playerMode && players.length === 0) {
    showSetup();
  } else {
    showApp();
  }
}

if (modeToggle) modeToggle.addEventListener('click', handleModeToggle);
if (modeToggleSetup) modeToggleSetup.addEventListener('click', handleModeToggle);

// Init
loadState();
if (playerMode && players.length === 0) showSetup();
else showApp();
