export const AVATARS = [
  { id: "bear", label: "🐻 Bear", color: "#fca5a5" },
  { id: "cat", label: "🐱 Cat", color: "#fde047" },
  { id: "fox", label: "🦊 Fox", color: "#fdba74" },
  { id: "frog", label: "🐸 Frog", color: "#86efac" },
  { id: "panda", label: "🐼 Panda", color: "#e2e8f0" }
];

export const AVATAR_EMOJIS: Record<string, string> = {
  bear: "🐻",
  cat: "🐱",
  fox: "🦊",
  frog: "🐸",
  panda: "🐼"
};

export const SUBJECTS = [
  { id: "math", title: "🧮 Mathematics", enabled: true, color: "#e0f2fe", border: "#38bdf8" },
  { id: "english", title: "📚 English", enabled: false, color: "#fef3c7", border: "#fbbf24" },
  { id: "science", title: "🔬 Science", enabled: false, color: "#dcfce7", border: "#4ade80" },
  { id: "coding", title: "💻 Coding", enabled: false, color: "#f3e8ff", border: "#c084fc" }
];

export const DIFFICULTY_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bg: string }> = {
  Easy: { symbol: "🌱", label: "Seedling", color: "#15803d", bg: "#d1fae5" },
  Medium: { symbol: "🌿", label: "Sapling", color: "#c2410c", bg: "#ffedd5" },
  Hard: { symbol: "🌳", label: "Big Tree", color: "#b91c1c", bg: "#fee2e2" }
};

export const THEME_PRESETS = {
  space: {
    name: "Space Voyage 🌌",
    prompt: "Use space travel theme, include colorful floating planets, count visual stars, astronaut guidance."
  },
  ocean: {
    name: "Deep Sea 🐠",
    prompt: "Deep sea background with colorful fish swimming, pop oxygen bubbles to count, submarine guidance."
  },
  dino: {
    name: "Dino World 🦖",
    prompt: "Dinosaur footprints and jungle theme, match correct counts to feed food to a happy baby T-Rex."
  },
  candy: {
    name: "Candy Land 🍬",
    prompt: "Delicious sweet candies and cupcakes theme, stack sweets or pop candy drops to answer math challenges."
  },
  custom: {
    name: "Custom Theme 🪄",
    prompt: ""
  }
};

export const LOADING_MESSAGES = [
  "🐸 Hopper the frog is jumping to get your game...",
  "🎨 Painting the canvas with beautiful colors...",
  "🎈 Blowing up shiny balloons for counting...",
  "✨ Adding a dash of magic math dust...",
  "💫 Gathering bright, happy stars...",
  "🦖 Prepping the code dinosaur for lift-off...",
  "🚀 Coding rocket is blasting into space...",
  "🍦 Scooping up some cool learning ice cream..."
];

export const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: Math.floor(Math.random() * 40) + 20, // 20px to 60px
  left: `${Math.floor(Math.random() * 90) + 5}%`,
  delay: `${i * 0.7}s`,
  duration: `${Math.floor(Math.random() * 4) + 6}s`, // 6s to 10s
  color: ["#fecdd3", "#fef9c3", "#d1fae5", "#e0f2fe", "#f3e8ff", "#ffedd5"][i % 6]
}));

export const DOT_COORDS = [
  { x: 50, y: 50 },   // 0
  { x: 150, y: 50 },  // 1
  { x: 250, y: 50 },  // 2
  { x: 50, y: 150 },  // 3
  { x: 150, y: 150 }, // 4
  { x: 250, y: 150 }, // 5
  { x: 50, y: 250 },  // 6
  { x: 150, y: 250 }, // 7
  { x: 250, y: 250 }  // 8
];

export const COLLISION_RADIUS = 26; // px radius to trigger dot selection

