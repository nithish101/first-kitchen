// ── Helpers ──────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const $ = (sel) => document.querySelector(sel);

// ── State ────────────────────────────────────────────────────────────
const STATE = {
  TITLE: 'TITLE',
  MENU: 'MENU',
  PLAY: 'PLAY',
  RESULT: 'RESULT'
};

let currentState = STATE.TITLE;
let currentLevelIndex = 0;
let completedLevels = new Set(); // Stores level IDs that are passed

// Game Session State
let selectedBase = null;
let selectedSupports = new Set();
let cookingTime = 0.5; // 0.0 to 1.0
let lastOutcome = null;

// ── Outcome Logic ───────────────────────────────────────────────────
function computeOutcome() {
  const ingredients = [];
  if (selectedBase) ingredients.push(INGREDIENTS[selectedBase]);
  for (const id of selectedSupports) ingredients.push(INGREDIENTS[id]);

  if (ingredients.length === 0) return null;

  const avg = (prop) => ingredients.reduce((s, ing) => s + ing[prop], 0) / ingredients.length;

  const fat_total = avg("fat");
  const acid_total = avg("acid");
  const moisture_total = avg("moisture");
  const density_total = avg("density");

  const t = cookingTime;

  // Doneness
  const ideal_time = clamp(0.3 + 0.5 * density_total + 0.2 * moisture_total, 0, 1);
  const doneness = clamp(1 - Math.abs(t - ideal_time), 0, 1);

  // Taste
  const balance = clamp(1 - Math.abs(fat_total - acid_total), 0, 1);
  const taste = clamp(0.6 * balance + 0.4 * doneness, 0, 1);

  // Texture
  const texture_ideal = clamp(0.4 + 0.4 * moisture_total, 0, 1);
  const texture = clamp(1 - Math.abs(t - texture_ideal), 0, 1);

  // Constraint
  const level = LEVELS[currentLevelIndex];
  let constraintScore = 1;
  if (level.constraint === "vegetarian") {
    const allSelected = [selectedBase, ...selectedSupports];
    constraintScore = allSelected.some((id) => INGREDIENTS[id].isMeat) ? 0 : 1;
  } else if (level.constraint === "lowfat") {
    constraintScore = clamp(1 - fat_total, 0, 1);
  }

  return { taste, texture, doneness, constraint: constraintScore };
}

function checkWin(outcome) {
  if (!outcome) return false;
  const level = LEVELS[currentLevelIndex];
  const constraintPass = level.constraint === null || outcome.constraint >= 0.9;
  return outcome.taste >= 0.9 && outcome.doneness >= 0.9 && outcome.texture >= 0.9 && constraintPass;
}

// ── Rendering & Interaction ──────────────────────────────────────────

function init() {
  render();
}

function render() {
  const app = $("#app");
  app.className = currentState.toLowerCase(); // handy for CSS scoping

  switch (currentState) {
    case STATE.TITLE:
      renderTitle(app);
      break;
    case STATE.MENU:
      renderMenu(app);
      break;
    case STATE.PLAY:
      renderPlay(app);
      break;
    case STATE.RESULT:
      renderResult(app);
      break;
  }
}

// ── Title Screen
function renderTitle(app) {
  app.innerHTML = `
    <div class="screen title-screen">
      <div class="logo-area">
        <div class="logo-icon">🍳</div>
        <h1>First Kitchen</h1>
        <p>Master the art of heat and ingredients.</p>
      </div>
      <div class="instructions">
        <p>No recipes. just experimentation.</p>
        <p>Balance <strong>Fat</strong> & <strong>Acid</strong>.</p>
        <p>Match <strong>Time</strong> to <strong>Density</strong>.</p>
      </div>
      <button class="btn-primary" onclick="setState('${STATE.MENU}')">Start Cooking</button>
    </div>
  `;
}

// ── Menu Screen
function renderMenu(app) {
  let gridHtml = '<div class="level-grid">';

  LEVELS.forEach((level, idx) => {
    const isLocked = idx > 0 && !completedLevels.has(idx - 1);
    const isCompleted = completedLevels.has(idx);
    const statusClass = isLocked ? 'locked' : (isCompleted ? 'completed' : 'unlocked');

    gridHtml += `
      <div class="level-card ${statusClass}" onclick="${isLocked ? '' : `startLevel(${idx})`}">
        <div class="level-num">${idx + 1}</div>
        <div class="level-info">
          <h3>${level.title}</h3>
          ${isCompleted ? '<span class="star">★ Completed</span>' : ''}
          ${isLocked ? '<span class="lock">🔒 Locked</span>' : ''}
        </div>
      </div>
    `;
  });
  gridHtml += '</div>';

  app.innerHTML = `
    <div class="screen menu-screen">
      <header>
        <h2>Select a Challenge</h2>
      </header>
      ${gridHtml}
    </div>
  `;
}

// ── Play Screen (The Kitchen)
function renderPlay(app) {
  const level = LEVELS[currentLevelIndex];

  // Ingredients List
  let ingredientsHtml = '<div class="shelf">';
  level.availableIngredients.forEach(id => {
    const ing = INGREDIENTS[id];
    const isBase = selectedBase === id;
    const isSupport = selectedSupports.has(id);
    const inSkillet = isBase || isSupport;

    ingredientsHtml += `
      <div class="ingredient-item ${inSkillet ? 'in-use' : ''}" onclick="toggleIngredient('${id}')">
        <div class="emoji">${ing.emoji}</div>
        <div class="name">${ing.name}</div>
        <div class="stats">F${ing.fat} A${ing.acid} D${ing.density}</div>
      </div>
    `;
  });
  ingredientsHtml += '</div>';

  // Skillet Visualization
  let skilletContents = '';
  if (selectedBase) skilletContents += `<div class="skillet-item base">${INGREDIENTS[selectedBase].emoji}</div>`;
  selectedSupports.forEach(id => {
    skilletContents += `<div class="skillet-item support">${INGREDIENTS[id].emoji}</div>`;
  });

  // Clock Visualization
  const rotation = cookingTime * 360;
  const timeColor = cookingTime < 0.4 ? '#3b82f6' : (cookingTime > 0.8 ? '#ef4444' : '#f59e0b');

  app.innerHTML = `
    <div class="screen play-screen">
      <header class="play-header">
        <button class="btn-icon" onclick="setState('${STATE.MENU}')">← Menu</button>
        <div class="level-text">
          <h3>${level.title}</h3>
          <p>${level.description}</p>
        </div>
      </header>
      
      <div class="kitchen-area">
        <div class="skillet-container">
          <div class="skillet">
            <div class="skillet-inner">${skilletContents}</div>
            <div class="handle"></div>
          </div>
        </div>
        
        <div class="clock-container">
          <div class="clock-face">
             ${[0, 90, 180, 270].map(d => `<div class="tick" style="transform: rotate(${d}deg)"></div>`).join('')}
             <div class="hand-container" style="transform: rotate(${rotation}deg)">
                <div class="hand"></div>
                <div class="knob"></div>
             </div>
          </div>
          <input type="range" class="clock-slider" min="0" max="100" value="${cookingTime * 100}" oninput="updateTime(this.value)">
          <div class="time-label" style="color: ${timeColor}">${Math.round(cookingTime * 100)}% Heat</div>
        </div>
      </div>

      <div class="pantry-area">
        <h4>Pantry</h4>
        ${ingredientsHtml}
      </div>

      <button class="btn-cook" onclick="cook()">🔥 COOK!</button>
    </div>
  `;
}

// ── Result Screen
function renderResult(app) {
  const outcome = computeOutcome(); // Recompute or use cached
  const won = checkWin(outcome);
  const level = LEVELS[currentLevelIndex];

  // Save progress if won
  if (won) {
    completedLevels.add(currentLevelIndex);
  }

  const renderBar = (label, val, limit = 0.9) => {
    const pct = Math.round(val * 100);
    const passed = val >= limit;
    return `
      <div class="result-row">
        <span class="label">${label}</span>
        <div class="bar-bg">
          <div class="bar-fill ${passed ? 'pass' : 'fail'}" style="width: ${pct}%"></div>
        </div>
        <span class="score">${pct}%</span>
      </div>
    `;
  };

  let html = `
    <div class="screen result-screen">
      <div class="result-card ${won ? 'win' : 'lose'}">
        <h2>${won ? 'Delicious! 🌟' : 'Needs Work... 🤔'}</h2>
        
        <div class="bars">
          ${renderBar('Taste', outcome.taste)}
          ${renderBar('Texture', outcome.texture)}
          ${renderBar('Doneness', outcome.doneness)}
          ${level.constraint ? renderBar('Dietary', outcome.constraint) : ''}
        </div>

        <div class="feedback">
          ${won
      ? "<p>Perfect balance! You've mastered this dish.</p>"
      : "<p>Check the red bars. Try adjusting time or ingredients.</p>"}
        </div>

        <div class="actions">
          <button class="btn-secondary" onclick="retryLevel()">Try Again</button>
          ${won
      ? `<button class="btn-primary" onclick="nextLevel()">Next Level →</button>`
      : ''}
          <button class="btn-text" onclick="setState('${STATE.MENU}')">Back to Menu</button>
        </div>
      </div>
    </div>
  `;
  app.innerHTML = html;
}


// ── Actions ──────────────────────────────────────────────────────────

window.setState = (newState) => {
  currentState = newState;
  render();
};

window.startLevel = (idx) => {
  currentLevelIndex = idx;
  // Reset session
  selectedBase = null;
  selectedSupports.clear();
  cookingTime = 0.5;
  setState(STATE.PLAY);
};

window.toggleIngredient = (id) => {
  // logic: if it's a base ingredient, swap it. if support, toggle it.
  // wait, we need to know if the clicked ID is intended as base or support?
  // Easier: if no base selected, first click becomes base (if valid?). 
  // Actually, let's keep it simple: Click logic based on type?

  // Re-reading PRD: Player selects one base, any supports.
  // My Logic: If I click chicken (base), it sets base. If I click lemon (support), it sets support.
  // But how does user know?
  // Let's infer: Bases are Meat/Tofu. Supports are Oil/Lemon/Veg? 
  // No, Tofu can be chunks. 
  // Let's stick to the previous logic: We need to know what role interally.
  // But for UI simplicity, let's say: 
  // - If it's already selected, remove it.
  // - If it's not selected:
  //   - If current base is null, make it base.
  //   - If base exists, make it support.
  //   Wait, that's confusing.
  // Better: Just check if it's the current base -> deselect. If it's in support -> remove.
  // If adding: If base is null -> make base. Else add to support. (Player can swap base by deselecting first).

  if (selectedBase === id) {
    selectedBase = null;
  } else if (selectedSupports.has(id)) {
    selectedSupports.delete(id);
  } else {
    // Adding
    if (selectedBase === null) {
      selectedBase = id; // First pick is base
    } else {
      selectedSupports.add(id);
    }
  }
  render();
};

window.updateTime = (val) => {
  cookingTime = parseInt(val, 10) / 100;

  // Optimize: Update only the relevant DOM elements
  const rotation = cookingTime * 360;
  const timeColor = cookingTime < 0.4 ? '#3b82f6' : (cookingTime > 0.8 ? '#ef4444' : '#f59e0b');

  const hand = $(".hand-container");
  if (hand) hand.style.transform = `rotate(${rotation}deg)`;

  const label = $(".time-label");
  if (label) {
    label.innerText = `${Math.round(cookingTime * 100)}% Heat`;
    label.style.color = timeColor;
  }
};

window.cook = () => {
  if (!selectedBase) {
    alert("You need a base ingredient!");
    return;
  }
  setState(STATE.RESULT);
};

window.retryLevel = () => {
  // Keep settings, just go back
  setState(STATE.PLAY);
};

window.nextLevel = () => {
  if (currentLevelIndex < LEVELS.length - 1) {
    startLevel(currentLevelIndex + 1);
  } else {
    // Game Over / Win
    completedLevels.add(currentLevelIndex);
    setState(STATE.MENU);
  }
};

// ── Boot ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
