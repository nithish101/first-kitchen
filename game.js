// ── Version Verification ──────────────────────────────────────────────
console.log("First Kitchen v5.0 - Safety First Initialized");

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
let levelStars = {};

// Game Session State
let selectedBase = null;
let selectedSupports = new Set();
let cookingTime = 15; // Minutes (0 to 30)
let showingHint = false;

// ── Outcome Logic ───────────────────────────────────────────────────
function computeOutcome() {
  const ingredients = [];
  if (selectedBase) ingredients.push(INGREDIENTS[selectedBase]);
  for (const id of selectedSupports) ingredients.push(INGREDIENTS[id]);

  if (ingredients.length === 0) return null;

  const base = INGREDIENTS[selectedBase];

  // Calculate Target Time (Base + Modifiers)
  let timeModifier = 0;
  for (const id of selectedSupports) timeModifier += INGREDIENTS[id].timeModifier || 0;
  const targetTime = clamp(base.idealBaseTime + timeModifier, 5, MAX_COOK_TIME - 5);

  // Properties
  const avg = (prop) => ingredients.reduce((s, ing) => s + ing[prop], 0) / ingredients.length;
  const fat_total = avg("fat");
  const acid_total = avg("acid");
  const moisture_total = avg("moisture");

  const t = cookingTime;
  let safetyFailure = null;

  // SAFETY CHECK: Undercooked Meat
  if (base.minSafeTime && t < base.minSafeTime) {
    safetyFailure = base.safetyWarning || "Undercooked! Unsafe to eat.";
  }

  // Scoring Logic
  const calcScore = (target) => {
    const error = Math.abs(t - target);
    if (error <= 2) return 1.0;
    return Math.max(0, 1.0 - (error - 2) * 0.05);
  };

  // Doneness: 
  // If safety failure -> Doneness is 0 automatically.
  let doneness = safetyFailure ? 0 : calcScore(targetTime);

  // Taste: Balance + Doneness
  const balance = clamp(1 - Math.abs(fat_total - acid_total), 0, 1);
  const taste = clamp(0.6 * balance + 0.4 * doneness, 0, 1);

  // Texture: 
  const textureOffset = (moisture_total - 0.5) * 5;
  const textureTarget = targetTime + textureOffset;
  const texture = calcScore(textureTarget);

  // Constraint Check
  const level = LEVELS[currentLevelIndex];
  let constraintPassed = true;
  if (level.constraint === "vegetarian") {
    const allSelected = [selectedBase, ...selectedSupports];
    constraintPassed = !allSelected.some((id) => INGREDIENTS[id].isMeat);
  } else if (level.constraint === "lowfat") {
    constraintPassed = fat_total < 0.4;
  }

  // Star Calculation
  let stars = 0;
  if (!safetyFailure && constraintPassed) {
    if (taste >= 0.85) stars++;
    if (texture >= 0.85) stars++;
    if (doneness >= 0.85) stars++;
  } else {
    stars = 0; // Fail if unsafe or constraint broken
  }

  return { taste, texture, doneness, stars, constraintPassed, targetTime, safetyFailure };
}

function checkWin(outcome) {
  if (!outcome) return false;
  return outcome.stars >= 2 && outcome.constraintPassed && !outcome.safetyFailure;
}

// ── Rendering ────────────────────────────────────────────────────────

function init() {
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
    const isUnlocked = idx === 0 || (levelStars[idx - 1] >= 2);
    const earnedStars = levelStars[idx] || 0;

    let starDisplay = earnedStars > 0 ? '⭐'.repeat(earnedStars) : '';
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

  // Ingredients List
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
  const rotation = (cookingTime / MAX_COOK_TIME) * 360;
  const timeColor = cookingTime < 10 ? '#3b82f6' : (cookingTime > 20 ? '#ef4444' : '#f59e0b');

  // Hint Logic
  let hintHtml = '';
  if (showingHint && selectedBase) {
    let timeModifier = 0;
    for (const id of selectedSupports) timeModifier += INGREDIENTS[id].timeModifier || 0;
    const target = clamp(INGREDIENTS[selectedBase].idealBaseTime + timeModifier, 5, MAX_COOK_TIME - 5);

    const diff = cookingTime - target;
    const absDiff = Math.abs(diff);

    let arrowDir = diff < 0 ? '→' : '←';
    let arrowColor = '#22c55e';
    let arrowSize = '1.2rem';

    if (absDiff <= 2) {
      hintHtml = `<div class="hint-box success">✅ Good!</div>`;
    } else {
      if (absDiff > 10) { arrowColor = '#ef4444'; arrowSize = '2rem'; }
      else if (absDiff > 5) { arrowColor = '#eab308'; arrowSize = '1.6rem'; }

      hintHtml = `
        <div class="hint-arrow" style="color: ${arrowColor}; font-size: ${arrowSize}">
           ${arrowDir}
        </div>
      `;
    }
  } else if (showingHint && !selectedBase) {
    hintHtml = `<div class="hint-box">Pick a Base first!</div>`;
  }

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
          
          <div class="controls-row">
            <input type="range" class="clock-slider" min="0" max="${MAX_COOK_TIME}" step="1" value="${cookingTime}" oninput="updateTime(this.value)">
            <button class="btn-hint" onclick="toggleHint()" title="Need a hint?">💡</button>
          </div>
          
          <div class="time-label" style="color: ${timeColor}">${Math.round(cookingTime)} min</div>
          ${hintHtml}
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

  if (outcome.stars > (levelStars[currentLevelIndex] || 0)) {
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
  if (outcome.safetyFailure) feedback = outcome.safetyFailure;
  else if (!outcome.constraintPassed) feedback = "Dish failed: Dietary constraint not met!";
  else if (outcome.stars === 3) feedback = "Perfection! A true chef's kiss. 👨‍🍳";
  else if (outcome.stars === 2) feedback = "Delicious! Good enough to serve.";
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
        
        ${outcome.safetyFailure ? `<div class="constraint-fail">🚫 ${outcome.safetyFailure}</div>` : ''}
        ${!outcome.constraintPassed && !outcome.safetyFailure ? `<div class="constraint-fail">⚠️ Failed Constraint: ${level.constraint}</div>` : ''}

        <div class="feedback">
           <p>${feedback}</p>
           <p class="stats-detail">Target Time: ~${Math.round(outcome.targetTime)} min</p>
        </div>

        <div class="actions">
          ${won
      ? `<button class="btn-primary" onclick="nextLevel()">Next Level →</button>
               <button class="btn-secondary" onclick="retryLevel()">Replay Level ↺</button>`
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
  cookingTime = 15;
  showingHint = false;
  setState(STATE.PLAY);
};

window.toggleIngredient = (id) => {
  const ing = INGREDIENTS[id];
  const isBaseType = (ing.tags || []).includes('Base');

  if (isBaseType) {
    if (selectedBase === id) selectedBase = null;
    else selectedBase = id;
  } else {
    if (selectedSupports.has(id)) selectedSupports.delete(id);
    else selectedSupports.add(id);
  }
  render();
};

window.updateTime = (val) => {
  cookingTime = parseInt(val, 10); // Minutes

  const rotation = (cookingTime / MAX_COOK_TIME) * 360;
  const timeColor = cookingTime < 10 ? '#3b82f6' : (cookingTime > 20 ? '#ef4444' : '#f59e0b');

  const hand = $(".hand-container");
  if (hand) hand.style.transform = `rotate(${rotation}deg)`;

  const label = $(".time-label");
  if (label) {
    label.innerText = `${Math.round(cookingTime)} min`;
    label.style.color = timeColor;
  }

  if (showingHint) render();
};

window.toggleHint = () => {
  showingHint = !showingHint;
  render();
};

window.cook = () => {
  if (!selectedBase) {
    alert("You need a base ingredient!");
    return;
  }
  setState(STATE.RESULT);
};

window.retryLevel = () => {
  setState(STATE.PLAY);
};

window.nextLevel = () => {
  if (currentLevelIndex < LEVELS.length - 1) {
    startLevel(currentLevelIndex + 1);
  } else {
    setState(STATE.MENU);
  }
};

document.addEventListener("DOMContentLoaded", init);
