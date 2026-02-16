// ── Helpers ──────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const $ = (sel) => document.querySelector(sel);

// ── State ────────────────────────────────────────────────────────────
let currentLevel = 0;
let selectedBase = null;
let selectedSupports = new Set();
let cookingTime = 0.5;
let lastOutcome = null;

// ── Outcome computation (PRD formulas) ──────────────────────────────
function computeOutcome() {
    const ingredients = [];
    if (selectedBase) ingredients.push(INGREDIENTS[selectedBase]);
    for (const id of selectedSupports) ingredients.push(INGREDIENTS[id]);

    if (ingredients.length === 0) return null;

    const avg = (prop) =>
        ingredients.reduce((s, ing) => s + ing[prop], 0) / ingredients.length;

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
    const level = LEVELS[currentLevel];
    let constraint = 1;
    if (level.constraint === "vegetarian") {
        const allSelected = [selectedBase, ...selectedSupports];
        constraint = allSelected.some((id) => INGREDIENTS[id].isMeat) ? 0 : 1;
    } else if (level.constraint === "lowfat") {
        constraint = clamp(1 - fat_total, 0, 1);
    }

    return { taste, texture, doneness, constraint };
}

// ── Progression check ───────────────────────────────────────────────
function canAdvance(outcome) {
    if (!outcome) return false;
    const level = LEVELS[currentLevel];
    const meetsConstraint = level.constraint === null || outcome.constraint >= 0.8;
    return outcome.taste >= 0.65 && outcome.doneness >= 0.65 && meetsConstraint;
}

// ── Rendering ───────────────────────────────────────────────────────
function render() {
    const level = LEVELS[currentLevel];
    const app = $("#app");

    // ── Level header
    let html = `
    <header class="level-header">
      <h1>${level.title}</h1>
      <p class="level-desc">${level.description}</p>
    </header>
  `;

    // ── Ingredient panel
    html += `<section class="panel ingredient-panel">
    <h2>Choose Ingredients</h2>
    <div class="base-group">
      <h3>Base <span class="hint">(pick one)</span></h3>
      <div class="ingredient-options">`;

    for (const id of level.availableIngredients) {
        const ing = INGREDIENTS[id];
        const checked = selectedBase === id ? "checked" : "";
        html += `
      <label class="ingredient-card base-card ${selectedBase === id ? "selected" : ""}">
        <input type="radio" name="base" value="${id}" ${checked}>
        <span class="ingredient-name">${ing.name}</span>
        <span class="ingredient-stats">F${ing.fat} · A${ing.acid} · M${ing.moisture} · D${ing.density}</span>
      </label>`;
    }

    html += `</div></div>`;

    // Supports
    html += `<div class="support-group">
    <h3>Supporting <span class="hint">(optional)</span></h3>
    <div class="ingredient-options">`;

    for (const id of level.availableIngredients) {
        if (id === selectedBase) continue; // can't be both
        const ing = INGREDIENTS[id];
        const checked = selectedSupports.has(id) ? "checked" : "";
        html += `
      <label class="ingredient-card support-card ${selectedSupports.has(id) ? "selected" : ""}">
        <input type="checkbox" name="support" value="${id}" ${checked}>
        <span class="ingredient-name">${ing.name}</span>
        <span class="ingredient-stats">F${ing.fat} · A${ing.acid} · M${ing.moisture} · D${ing.density}</span>
      </label>`;
    }

    html += `</div></div></section>`;

    // ── Time slider
    html += `
    <section class="panel time-panel">
      <h2>Cooking Time</h2>
      <div class="slider-wrap">
        <span class="slider-label">Raw</span>
        <input type="range" id="timeSlider" min="0" max="100" value="${Math.round(cookingTime * 100)}">
        <span class="slider-label">Well-done</span>
      </div>
      <p class="time-value">${Math.round(cookingTime * 100)}%</p>
    </section>
  `;

    // ── Cook button
    html += `<button id="cookBtn" class="cook-btn" ${selectedBase ? "" : "disabled"}>🍳  Cook</button>`;

    // ── Result bars
    if (lastOutcome) {
        const bars = [
            { label: "Taste", value: lastOutcome.taste, color: "#f59e0b" },
            { label: "Texture", value: lastOutcome.texture, color: "#8b5cf6" },
            { label: "Doneness", value: lastOutcome.doneness, color: "#ef4444" },
        ];
        if (level.constraint !== null) {
            bars.push({ label: "Meets Constraint", value: lastOutcome.constraint, color: "#10b981" });
        }

        html += `<section class="panel results-panel"><h2>Results</h2>`;
        for (const bar of bars) {
            const pct = Math.round(bar.value * 100);
            const good = bar.value >= 0.65;
            html += `
        <div class="result-row">
          <span class="result-label">${bar.label}</span>
          <div class="bar-track">
            <div class="bar-fill ${good ? "bar-good" : "bar-low"}" style="width:${pct}%;background:${bar.color}"></div>
          </div>
          <span class="result-pct">${pct}%</span>
        </div>`;
        }
        html += `</section>`;

        // ── Next Level
        if (canAdvance(lastOutcome) && currentLevel < LEVELS.length - 1) {
            html += `<button id="nextBtn" class="next-btn">Next Level →</button>`;
        } else if (canAdvance(lastOutcome) && currentLevel === LEVELS.length - 1) {
            html += `<p class="congrats">🎉 You've completed all levels! You've built a solid mental model of cooking principles.</p>`;
        }
    }

    app.innerHTML = html;

    // ── Bind events
    // Base radios
    app.querySelectorAll('input[name="base"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            selectedBase = e.target.value;
            selectedSupports.delete(selectedBase);
            lastOutcome = null;
            render();
        });
    });

    // Support checkboxes
    app.querySelectorAll('input[name="support"]').forEach((cb) => {
        cb.addEventListener("change", (e) => {
            if (e.target.checked) selectedSupports.add(e.target.value);
            else selectedSupports.delete(e.target.value);
            lastOutcome = null;
            render();
        });
    });

    // Slider
    const slider = $("#timeSlider");
    if (slider) {
        slider.addEventListener("input", (e) => {
            cookingTime = parseInt(e.target.value, 10) / 100;
            $(".time-value").textContent = `${Math.round(cookingTime * 100)}%`;
        });
    }

    // Cook
    const cookBtn = $("#cookBtn");
    if (cookBtn) {
        cookBtn.addEventListener("click", () => {
            lastOutcome = computeOutcome();
            render();
        });
    }

    // Next Level
    const nextBtn = $("#nextBtn");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentLevel++;
            selectedBase = null;
            selectedSupports.clear();
            cookingTime = 0.5;
            lastOutcome = null;
            render();
        });
    }
}

// ── Boot ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", render);
