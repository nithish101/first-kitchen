// ── Version Verification ──────────────────────────────────────────────
console.log("First Kitchen v3.0 - Gameplay Refinement Initialized");

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
// levelStars: stores { 0: 2, 1: 3 } etc.
let levelStars = {};

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

  const base = INGREDIENTS[selectedBase];

  // Calculate Target Time
  let timeModifier = 0;
  for (const id of selectedSupports) {
    timeModifier += INGREDIENTS[id].timeModifier || 0;
  }

  const targetTime = clamp(base.idealBaseTime + timeModifier, 0.1, 0.9);

  // Properties
  const avg = (prop) => ingredients.reduce((s, ing) => s + ing[prop], 0) / ingredients.length;
  const fat_total = avg("fat");
  const acid_total = avg("acid");
  const moisture_total = avg("moisture");

  const t = cookingTime;

  // Doneness: Peaks at targetTime
  // 85% requirement -> within ~0.15
  const doneness = clamp(1 - Math.abs(t - targetTime), 0, 1);

  // Taste: Balance of fat and acid
  const balance = clamp(1 - Math.abs(fat_total - acid_total), 0, 1);
  // Taste score is heavily weighted on balance, but slightly on doneness
  const taste = clamp(0.7 * balance + 0.3 * doneness, 0, 1);

  // Texture: Peaks near targetTime but shifted by moisture
  // High moisture -> needs slightly MORE time to firm up? Or less? 
  // Let's say: More moisture shifts ideal texture time slightly later (+ offset)
  // Low moisture (dry) shifts slightly earlier (- offset)
  const textureOffset = (moisture_total - 0.5) * 0.15;
  const textureTarget = clamp(targetTime + textureOffset, 0, 1);
  const texture = clamp(1 - Math.abs(t - textureTarget), 0, 1);

  // Constraint Check
  const level = LEVELS[currentLevelIndex];
  let constraintPassed = true;
  if (level.constraint === "vegetarian") {
    const allSelected = [selectedBase, ...selectedSupports];
    constraintPassed = !allSelected.some((id) => INGREDIENTS[id].isMeat);
  } else if (level.constraint === "lowfat") {
    constraintPassed = fat_total < 0.4; // simpler threshold
  }

  // Star Calculation
  let stars = 0;
  if (taste >= 0.85) stars++;
  if (texture >= 0.85) stars++;
  if (doneness >= 0.85) stars++;

  // If constraint fails, you get 0 stars (hard fail)
  if (!constraintPassed) stars = 0;

  return { taste, texture, doneness, stars, constraintPassed };
}

function checkWin(outcome) {
  if (!outcome) return false;
  // Pass condition: 2 Stars AND Constraint Passed
  return outcome.stars >= 2 && outcome.constraintPassed;
}

// ── Rendering & Interaction ──────────────────────────────────────────

function init() {
  // Load saved progress if any
  const saved = localStorage.getItem('firstKitchen_stars');
  if (saved) {
    try { levelStars = JSON.parse(saved); } catch (e) { }
  }
  render();
}

function saveProgress() {
  localStorage.setItem('firstKitchen_stars', JSON.stringify(levelStars));
}

function render() {
  const app = $("#app");
  app.className = currentState.toLowerCase();

  switch (currentState) {
    case STATE.TITLE: renderTitle(app); break;
    case STATE.MENU: renderMenu(app); break;
    case STATE.PLAY: renderPlay(app); break;
    case STATE.RESULT: renderResult(app); break;
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
        <p>Match <strong>Cooking Time</strong> to Ingredients.</p>
      </div>
      <button class="btn-primary" onclick="setState('${STATE.MENU}')">Start Cooking</button>
    </div>
  `;
}

// ── Menu Screen
function renderMenu(app) {
  let gridHtml = '<div class="level-grid">';

  LEVELS.forEach((level, idx) => {
    const prevLevelStars = levelStars[idx - 1];
    // Unlocked if first level (0) OR previous level passed (>= 2 stars)
    const isUnlocked = idx === 0 || (levelStars[idx - 1] >= 2);
    const earnedStars = levelStars[idx] || 0;

    let starDisplay = '';
    if (earnedStars > 0) {
      starDisplay = '⭐'.repeat(earnedStars);
    }

    // Status class
    let statusClass = isUnlocked ? 'unlocked' : 'locked';
    if (earnedStars >= 2) statusClass += ' passed';

    gridHtml += `
      <div class="level-card ${statusClass}" onclick="${isUnlocked ? `startLevel(${idx})` : ''}">
        <div class="level-num">${idx + 1}</div>
        <div class="level-info">
          <h3>${level.title}</h3>
          ${starDisplay ? `<div class="star-rating">${starDisplay}</div>` : ''}
          ${!isUnlocked ? '<span class="lock">🔒 Locked</span>' : ''}
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

// ── Play Screen
function renderPlay(app) {
  const level = LEVELS[currentLevelIndex];

  // Ingredients List with Tags
  let ingredientsHtml = '<div class="shelf">';
  level.availableIngredients.forEach(id => {
    const ing = INGREDIENTS[id];
    const isBase = selectedBase === id;
    const isSupport = selectedSupports.has(id);
    const inSkillet = isBase || isSupport;

    const tagsHtml = (ing.tags || []).map(t => `<span class="tag ${t.toLowerCase()}">${t}</span>`).join('');

    ingredientsHtml += `
      <div class="ingredient-item ${inSkillet ? 'in-use' : ''}" onclick="toggleIngredient('${id}')">
        <div class="emoji">${ing.emoji}</div>
        <div class="name">${ing.name}</div>
        <div class="tags">${tagsHtml}</div>
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
          <div class="time-label" style="color: ${timeColor}">Cooking Time matches Density</div>
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
  const outcome = computeOutcome();
  const won = checkWin(outcome);
  const level = LEVELS[currentLevelIndex];

  // Save progress if better score
  const currentBest = levelStars[currentLevelIndex] || 0;
  if (outcome.stars > currentBest) {
    levelStars[currentLevelIndex] = outcome.stars;
    saveProgress();
  }

  const renderBar = (label, val, passed) => {
    const pct = Math.round(val * 100);
    return `
      <div class="result-row">
        <span class="label">${label}</span>
        <div class="bar-bg">
          <div class="bar-fill ${passed ? 'pass' : 'fail'}" style="width: ${pct}%"></div>
        </div>
        <span class="score">${passed ? '⭐' : ''} ${pct}%</span>
      </div>
    `;
  };

  let feedback = "";
  if (outcome.stars === 3) feedback = "Perfection! A true chef's kiss. 👨‍🍳";
  else if (outcome.stars === 2) feedback = "Delicious! Good enough to serve.";
  else if (!outcome.constraintPassed) feedback = "Dish failed: Dietary constraint not met!";
  else feedback = "Undercooked or unbalanced. Check your timing and ingredients.";

  let html = `
    <div class="screen result-screen">
      <div class="result-card ${won ? 'win' : 'lose'}">
        <div class="stars-earned">
            ${'⭐'.repeat(outcome.stars)}${'☆'.repeat(3 - outcome.stars)}
        </div>
        <h2>${won ? 'Level Complete!' : 'Try Again'}</h2>
        
        <div class="bars">
          ${renderBar('Taste', outcome.taste, outcome.taste >= 0.85)}
          ${renderBar('Texture', outcome.texture, outcome.texture >= 0.85)}
          ${renderBar('Doneness', outcome.doneness, outcome.doneness >= 0.85)}
        </div>
        
        ${!outcome.constraintPassed ? `<div class="constraint-fail">⚠️ Failed Constraint: ${level.constraint}</div>` : ''}

        <div class="feedback"><p>${feedback}</p></div>

        <div class="actions">
          ${won
      ? `<button class="btn-primary" onclick="nextLevel()">Next Level →</button>`
      : `<button class="btn-primary" onclick="retryLevel()">Try Again</button>`}
          <button class="btn-secondary" onclick="setState('${STATE.MENU}')">Back to Menu</button>
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
  selectedBase = null;
  selectedSupports.clear();
  cookingTime = 0.5;
  setState(STATE.PLAY);
};

window.toggleIngredient = (id) => {
  const ing = INGREDIENTS[id];
  const isBaseType = (ing.tags || []).includes('Base');

  if (isBaseType) {
    // If it's a Base type, select it as the Base (replacing previous)
    // If clicking the current base, maybe deselect? Or just keep it selected?
    // Let's allow deselecting
    if (selectedBase === id) {
      selectedBase = null;
    } else {
      selectedBase = id;
    }
  } else {
    // It's a support ingredient
    if (selectedSupports.has(id)) {
      selectedSupports.delete(id);
    } else {
      selectedSupports.add(id);
    }
  }
  render();
};

window.updateTime = (val) => {
  cookingTime = parseInt(val, 10) / 100;

  const rotation = cookingTime * 360;
  const timeColor = cookingTime < 0.4 ? '#3b82f6' : (cookingTime > 0.8 ? '#ef4444' : '#f59e0b');

  const hand = $(".hand-container");
  if (hand) hand.style.transform = `rotate(${rotation}deg)`;

  const label = $(".time-label");
  /* Keep generic label, maybe update color only? */
  // label.innerText = `${Math.round(cookingTime * 100)}% Heat`; // Removed percent as requested
};

window.cook = () => {
  if (!selectedBase) {
    alert("You need a base ingredient!");
    return;
  }
  setState(STATE.RESULT);
};

window.retryLevel = () => {
  setState(STATE.PLAY); // Keep ingredients selected for quick retry
};

window.nextLevel = () => {
  if (currentLevelIndex < LEVELS.length - 1) {
    startLevel(currentLevelIndex + 1);
  } else {
    setState(STATE.MENU);
  }
};

document.addEventListener("DOMContentLoaded", init);
