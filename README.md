# First Kitchen — Cooking Game Prototype

A small, playable web game designed to demonstrate how players construct mental models of cooking principles (ingredient roles and cooking time interactions) through experimentation.

## 🚀 Live Demo
**[Play First Kitchen here!](https://nithish101.github.io/first-kitchen/)**

![First Kitchen Logo](https://img.shields.io/badge/First-Kitchen-fbbf24?style=for-the-badge&logo=chef)

## 🍳 Overview
"First Kitchen" is an educational prototype that focuses on cognitive learning rather than memorization. Players experiment with base ingredients, support ingredients, and cooking times to achieve the perfect balance of taste, texture, and doneness.

### New in v2.0: Visual Upgrade!
-   **Interactive Skillet**: Visualize your ingredients as they are tossed into the pan.
-   **Analog Clock**: Set cooking time with a rotating clock hand.
-   **Menu System**: Track your progress with a level select screen.
-   **Emoji Ingredients**: Fun, clear visuals for all food items.

### Learning Objectives
1.  **Understand Interactions**: Recognize how ingredient properties (fat, acid, moisture, density) interact with cooking time.
2.  **Strategic Adjustment**: Learn to adjust inputs based on previous outcomes.
3.  **Mental Model Construction**: Build an internal model of balance (fat vs. acid), moisture-time relationships, and specific dietary constraints.

## 🎮 Gameplay Loop
1.  **Select Base**: Pick exactly one base ingredient (e.g., Chicken 🍗, Tofu 🧈).
2.  **Add Support**: choose optional support ingredients (e.g., Lemon 🍋, Oil 🫒) to balance the dish.
3.  **Adjust Time**: Drag the clock hand to set the cooking duration. Watch the background shift from cool to hot!
4.  **Cook**: Evaluate the results via four outcome bars (Taste, Texture, Doneness, and Constraints).
5.  **Iterate**: Adjust and retry until you score **≥ 90%** on all metrics to unlock the next level.

## 🛠️ Tech Stack
-   **HTML5 / CSS3**: Vanilla structure and styling with a modern dark theme and CSS animations.
-   **JavaScript (ES6)**: No frameworks, pure logic for outcome computation, state machine, and drag interactions.
-   **GitHub Pages**: Hosted as a static site.

## 📂 Project Structure
-   `index.html`: Main page structure.
-   `style.css`: Visual design, animations, and responsive layout.
-   `game.js`: Core game logic, state machine, and progression system.
-   `data.js`: Ingredient stats and level definitions.

## 📜 Educational Context
This prototype was developed following cognitive learning principles:
-   **Knowledge Construction**: No recipes or instructions are provided; players learn by doing.
-   **Active Learning**: Mastery comes through direct experimentation.
-   **Zone of Proximal Development (ZPD)**: Scaffolding through 5 levels, each introducing new variables or constraints.
