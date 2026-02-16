// ── Global Constants ────────────────────────────────────────────────
const MAX_COOK_TIME = 30; // Minutes

// ── Ingredient definitions with Emojis & Timing Logic (Minutes) ──────
const INGREDIENTS = {
  chicken: {
    name: "Chicken", emoji: "🍗",
    fat: 0.4, acid: 0.0, moisture: 0.6, density: 0.6, isMeat: true,
    tags: ["Base", "Meat"],
    idealBaseTime: 25, // Minutes
    timeModifier: 0,
    minSafeTime: 20, // Must cook for at least 20m
    safetyWarning: "Undercooked Chicken! High risk of Salmonella."
  },
  tofu: {
    name: "Tofu", emoji: "🧈",
    fat: 0.2, acid: 0.0, moisture: 0.7, density: 0.4, isMeat: false,
    tags: ["Base", "Veg"],
    idealBaseTime: 15, // Minutes
    timeModifier: 0
  },
  lemon: {
    name: "Lemon", emoji: "🍋",
    fat: 0.0, acid: 0.9, moisture: 0.4, density: 0.1, isMeat: false,
    tags: ["Acid"],
    idealBaseTime: 0,
    timeModifier: 0
  },
  oil: {
    name: "Oil", emoji: "🫒",
    fat: 0.9, acid: 0.0, moisture: 0.0, density: 0.1, isMeat: false,
    tags: ["Fat"],
    idealBaseTime: 0,
    timeModifier: -2
  },
  tomato: {
    name: "Tomato", emoji: "🍅",
    fat: 0.0, acid: 0.6, moisture: 0.7, density: 0.2, isMeat: false,
    tags: ["Veg", "Acid"],
    idealBaseTime: 0,
    timeModifier: 5
  },
  mushroom: {
    name: "Mushroom", emoji: "🍄",
    fat: 0.1, acid: 0.1, moisture: 0.8, density: 0.3, isMeat: false,
    tags: ["Veg"],
    idealBaseTime: 0,
    timeModifier: 3
  },
};

// ── Level definitions ───────────────────────────────────────────────
const LEVELS = [
  {
    id: 0,
    title: "Level 1 – Simple Cooking",
    description: "Pick a base ingredient. Set the timer to match its ideal cooking time.",
    availableIngredients: ["chicken", "tofu", "oil"],
    constraint: null,
  },
  {
    id: 1,
    title: "Level 2 – Introducing Acidity",
    description: "Lemon is available. Balance fat with acid for better taste!",
    availableIngredients: ["chicken", "tofu", "oil", "lemon"],
    constraint: null,
  },
  {
    id: 2,
    title: "Level 3 – Moisture & Time",
    description: "Wait... does moisture make things cook slower? Adjust your time!",
    availableIngredients: ["tofu", "mushroom", "tomato", "oil"],
    constraint: null,
  },
  {
    id: 3,
    title: "Level 4 – Vegetarian Chef",
    description: "Your dish must be vegetarian. No meat allowed!",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "vegetarian",
  },
  {
    id: 4,
    title: "Level 5 – Light & Healthy",
    description: "Keep fat low (< 40%) while aiming for perfection.",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "lowfat",
  },
];
