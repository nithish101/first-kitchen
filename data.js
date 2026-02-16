// ── Ingredient definitions with Emojis & Timing Logic ───────────────
const INGREDIENTS = {
  chicken: {
    name: "Chicken", emoji: "🍗",
    fat: 0.4, acid: 0.0, moisture: 0.6, density: 0.6, isMeat: true,
    tags: ["Base", "Meat"],
    idealBaseTime: 0.72, // Heavy, needs time
    timeModifier: 0.0
  },
  tofu: {
    name: "Tofu", emoji: "🧈",
    fat: 0.2, acid: 0.0, moisture: 0.7, density: 0.4, isMeat: false,
    tags: ["Base", "Veg"],
    idealBaseTime: 0.55, // Lighter
    timeModifier: 0.0
  },
  lemon: {
    name: "Lemon", emoji: "🍋",
    fat: 0.0, acid: 0.9, moisture: 0.4, density: 0.1, isMeat: false,
    tags: ["Acid"],
    idealBaseTime: 0.0,
    timeModifier: 0.0 // Just flavor
  },
  oil: {
    name: "Oil", emoji: "🫒",
    fat: 0.9, acid: 0.0, moisture: 0.0, density: 0.1, isMeat: false,
    tags: ["Fat"],
    idealBaseTime: 0.0,
    timeModifier: -0.05 // Conducts heat, speeds up cooking slightly
  },
  tomato: {
    name: "Tomato", emoji: "🍅",
    fat: 0.0, acid: 0.6, moisture: 0.7, density: 0.2, isMeat: false,
    tags: ["Veg", "Acid"],
    idealBaseTime: 0.0,
    timeModifier: 0.05 // High moisture slows browning
  },
  mushroom: {
    name: "Mushroom", emoji: "🍄",
    fat: 0.1, acid: 0.1, moisture: 0.8, density: 0.3, isMeat: false,
    tags: ["Veg"],
    idealBaseTime: 0.0,
    timeModifier: 0.03 // Spongy, absorbs heat
  },
};

// ── Level definitions ───────────────────────────────────────────────
const LEVELS = [
  {
    id: 0,
    title: "Level 1 – Simple Cooking",
    description: "Pick a base ingredient and find its ideal cooking time.",
    availableIngredients: ["chicken", "tofu", "oil"],
    constraint: null,
  },
  {
    id: 1,
    title: "Level 2 – Introducing Acidity",
    description: "Lemon is now available. Can you balance fat and acid to improve taste?",
    availableIngredients: ["chicken", "tofu", "oil", "lemon"],
    constraint: null,
  },
  {
    id: 2,
    title: "Level 3 – Texture & Moisture",
    description: "Moisture-rich ingredients affect how fast things cook. Adjust your time!",
    availableIngredients: ["tofu", "mushroom", "tomato", "oil"],
    constraint: null,
  },
  {
    id: 3,
    title: "Level 4 – Vegetarian Constraint",
    description: "Your dish must be vegetarian. Avoid meat products!",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "vegetarian",
  },
  {
    id: 4,
    title: "Level 5 – Low-Fat Constraint",
    description: "Keep the fat content low while hitting 3 stars on quality.",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "lowfat",
  },
];
