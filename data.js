// ── Ingredient definitions ──────────────────────────────────────────
const INGREDIENTS = {
  chicken:  { name: "Chicken",  fat: 0.4, acid: 0.0, moisture: 0.6, density: 0.6, isMeat: true  },
  tofu:     { name: "Tofu",     fat: 0.2, acid: 0.0, moisture: 0.7, density: 0.4, isMeat: false },
  lemon:    { name: "Lemon",    fat: 0.0, acid: 0.9, moisture: 0.4, density: 0.1, isMeat: false },
  oil:      { name: "Oil",      fat: 0.9, acid: 0.0, moisture: 0.0, density: 0.1, isMeat: false },
  tomato:   { name: "Tomato",   fat: 0.0, acid: 0.6, moisture: 0.7, density: 0.2, isMeat: false },
  mushroom: { name: "Mushroom", fat: 0.1, acid: 0.1, moisture: 0.8, density: 0.3, isMeat: false },
};

// ── Level definitions ───────────────────────────────────────────────
const LEVELS = [
  {
    title: "Level 1 – Simple Cooking",
    description: "Pick a base ingredient and adjust the cooking time. How does density affect how long things need to cook?",
    availableIngredients: ["chicken", "tofu", "oil"],
    constraint: null,
  },
  {
    title: "Level 2 – Introducing Acidity",
    description: "Lemon is now available. Can you balance fat and acid to improve taste?",
    availableIngredients: ["chicken", "tofu", "oil", "lemon"],
    constraint: null,
  },
  {
    title: "Level 3 – Texture & Moisture",
    description: "Moisture-rich ingredients change texture. Find the right cooking time for a good bite.",
    availableIngredients: ["tofu", "mushroom", "tomato", "oil"],
    constraint: null,
  },
  {
    title: "Level 4 – Vegetarian Constraint",
    description: "Your dish must be vegetarian. Choose wisely — some ingredients are off-limits.",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "vegetarian",
  },
  {
    title: "Level 5 – Low-Fat Constraint",
    description: "Keep the fat content low while still achieving great taste, texture, and doneness.",
    availableIngredients: ["chicken", "tofu", "mushroom", "tomato", "oil", "lemon"],
    constraint: "lowfat",
  },
];
