// ── Global Constants ────────────────────────────────────────────────
const MAX_COOK_TIME = 30; // Minutes

// ── Ingredient definitions with Emojis & Timing Logic (Minutes) ──────
const INGREDIENTS = {
  // Bases
  chicken: {
    name: "Chicken", emoji: "🍗",
    fat: 0.4, acid: 0.0, moisture: 0.6, density: 0.6, isMeat: true,
    tags: ["Base", "Meat"],
    idealBaseTime: 25,
    timeModifier: 0,
    minSafeTime: 20,
    safetyWarning: "Undercooked Chicken! High risk of Salmonella."
  },
  tofu: {
    name: "Tofu", emoji: "🧈",
    fat: 0.2, acid: 0.0, moisture: 0.7, density: 0.4, isMeat: false,
    tags: ["Base", "Veg"],
    idealBaseTime: 15,
    timeModifier: 0
  },
  beef: {
    name: "Beef", emoji: "🥩",
    fat: 0.5, acid: 0.0, moisture: 0.5, density: 0.8, isMeat: true,
    tags: ["Base", "Meat"],
    idealBaseTime: 12,
    timeModifier: 0,
    minSafeTime: 5,
    safetyWarning: "Undercooked Beef! While rare is okay, this is too raw."
  },
  eggs: {
    name: "Eggs", emoji: "🍳",
    fat: 0.3, acid: 0.0, moisture: 0.8, density: 0.2, isMeat: false,
    tags: ["Base", "Veg"],
    idealBaseTime: 4,
    timeModifier: 0
  },

  // Acids
  lemon: {
    name: "Lemon", emoji: "🍋",
    fat: 0.0, acid: 0.9, moisture: 0.4, density: 0.1, isMeat: false,
    tags: ["Acid"],
    idealBaseTime: 0,
    timeModifier: 0
  },
  vinegar: {
    name: "Vinegar", emoji: "🧴",
    fat: 0.0, acid: 0.8, moisture: 0.8, density: 0.1, isMeat: false,
    tags: ["Acid", "Liquid"],
    idealBaseTime: 0,
    timeModifier: 1
  },
  orange: {
    name: "Orange", emoji: "🍊",
    fat: 0.0, acid: 0.6, moisture: 0.7, density: 0.3, isMeat: false,
    tags: ["Acid", "Fruit"],
    idealBaseTime: 0,
    timeModifier: 3
  },

  // Fats
  oil: {
    name: "Oil", emoji: "🫒",
    fat: 0.9, acid: 0.0, moisture: 0.0, density: 0.1, isMeat: false,
    tags: ["Fat"],
    idealBaseTime: 0,
    timeModifier: -2
  },
  butter: {
    name: "Butter", emoji: "🧈",
    fat: 0.8, acid: 0.0, moisture: 0.1, density: 0.2, isMeat: false,
    tags: ["Fat", "Dairy"],
    idealBaseTime: 0,
    timeModifier: -2
  },

  // Veg / Moisture
  tomato: {
    name: "Tomato", emoji: "🍅",
    fat: 0.0, acid: 0.6, moisture: 0.7, density: 0.2, isMeat: false,
    tags: ["Veg", "Acid", "Moisture"], // Juicy!
    idealBaseTime: 0,
    timeModifier: 5
  },
  mushroom: {
    name: "Mushroom", emoji: "🍄",
    fat: 0.1, acid: 0.1, moisture: 0.8, density: 0.3, isMeat: false,
    tags: ["Veg", "Moisture"],
    idealBaseTime: 0,
    timeModifier: 3
  },
  spinach: {
    name: "Spinach", emoji: "🥬",
    fat: 0.0, acid: 0.1, moisture: 0.9, density: 0.1, isMeat: false,
    tags: ["Veg", "Moisture"],
    idealBaseTime: 0,
    timeModifier: 4
  },
};

// ── Level definitions ───────────────────────────────────────────────
const LEVELS = [
  {
    id: 0,
    title: "Level 1 – Simple Cooking",
    description: "Pick a base ingredient. Set the timer to match its ideal cooking time.",
    availableIngredients: ["chicken", "tofu", "beef", "eggs", "oil", "butter"],
    constraint: null,
    requiredTags: []
  },
  {
    id: 1,
    title: "Level 2 – Introducing Acidity",
    description: "Balance is key. Use an Acid to cut through the fat.",
    availableIngredients: ["chicken", "tofu", "beef", "eggs", "oil", "butter", "lemon", "vinegar", "orange", "tomato"],
    constraint: null,
    requiredTags: ["Acid"]
  },
  {
    id: 2,
    title: "Level 3 – Moisture & Time",
    description: "Moisture slows down cooking. Add some veggies or liquids!",
    availableIngredients: ["tofu", "beef", "eggs", "mushroom", "tomato", "spinach", "oil", "butter"],
    constraint: null,
    requiredTags: ["Moisture"]
  },
  {
    id: 3,
    title: "Level 4 – Vegetarian Chef",
    description: "Your dish must be vegetarian. No meat allowed!",
    availableIngredients: ["tofu", "eggs", "mushroom", "tomato", "spinach", "oil", "lemon", "orange"],
    constraint: "vegetarian",
    requiredTags: []
  },
  {
    id: 4,
    title: "Level 5 – Light & Healthy",
    description: "Keep fat low (< 40%) while aiming for perfection.",
    availableIngredients: ["chicken", "tofu", "beef", "eggs", "mushroom", "tomato", "spinach", "oil", "lemon", "vinegar"],
    constraint: "lowfat",
    requiredTags: []
  },
];
