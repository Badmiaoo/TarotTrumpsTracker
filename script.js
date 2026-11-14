const TOTAL = 22;
const BOUTS = new Set([1, 21, 0]); // 0 = Excuse

const grid = document.getElementById('grid');
const fallenCountEl = document.getElementById('fallen-count');
const remainingCountEl = document.getElementById('remaining-count');
const progressBar = document.getElementById('progress-bar');
const resetBtn = document.getElementById('reset-btn');
const modalOverlay = document.getElementById('modal-overlay');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

let fallen = new Set();

function loadState() {
  try {
    const saved = localStorage.getItem('tarot-atouts-fallen');
    if (saved) {
      fallen = new Set(JSON.parse(saved));
    }
  } catch (e) {
    fallen = new Set();
  }
}

function saveState() {
  localStorage.setItem('tarot-atouts-fallen', JSON.stringify([...fallen]));
}

function createCard(id, label, isBout, isExcuse = false) {
  const card = document.createElement('button');
  card.className = 'card';
  if (isBout) card.classList.add('bout');
  if (isExcuse) card.classList.add('excuse');
  card.dataset.id = id;
  card.type = 'button';
  card.setAttribute('aria-pressed', 'false');

  // Set background image
  const imgName = isExcuse ? 'mat' : id;
  card.style.backgroundImage = `url('images/${imgName}.jpg')`;

  const number = document.createElement('span');
  number.className = 'card-number';
  number.textContent = isExcuse ? 'E' : id;

  card.appendChild(number);

  card.addEventListener('click', () => toggle(id, card));

  return card;
}

function renderGrid() {
  grid.innerHTML = '';

  // 1 to 21
  for (let i = 1; i <= 21; i++) {
    const isBout = BOUTS.has(i);
    const card = createCard(i, isBout ? 'bout' : '', isBout);
    if (fallen.has(i)) {
      card.classList.add('fallen');
      card.setAttribute('aria-pressed', 'true');
    }
    grid.appendChild(card);
  }

  // Excuse
  const excuseCard = createCard(0, 'excuse', true, true);
  if (fallen.has(0)) {
    excuseCard.classList.add('fallen');
    excuseCard.setAttribute('aria-pressed', 'true');
  }
  grid.appendChild(excuseCard);
}

function toggle(id, card) {
  if (fallen.has(id)) {
    fallen.delete(id);
    card.classList.remove('fallen');
    card.setAttribute('aria-pressed', 'false');
  } else {
    fallen.add(id);
    card.classList.add('fallen');
    card.setAttribute('aria-pressed', 'true');
  }
  saveState();
  updateStats();
}

function updateStats() {
  const count = fallen.size;
  fallenCountEl.textContent = count;
  remainingCountEl.textContent = TOTAL - count;
  const pct = (count / TOTAL) * 100;
  progressBar.style.width = pct + '%';
}

function reset() {
  fallen.clear();
  saveState();
  renderGrid();
  updateStats();
}

function showModal() {
  modalOverlay.hidden = false;
}

function hideModal() {
  modalOverlay.hidden = true;
}

resetBtn.addEventListener('click', showModal);
modalCancel.addEventListener('click', hideModal);
modalConfirm.addEventListener('click', () => {
  reset();
  hideModal();
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) hideModal();
});

// Init
loadState();
renderGrid();
updateStats();
