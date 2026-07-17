// FlashMaster — data layer, types, seed, helpers
export type Difficulty = "easy" | "medium" | "hard" | "learned";
export type QuizType = "mcq" | "tf" | "fill";
export type Subject = "Science" | "Math" | "History" | "Language" | "Programming" | "Art" | "Business" | "Other";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  image?: string; // data URL
  difficulty: Difficulty;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  lastReviewed?: number;
  reviewCount: number;
}

export interface Deck {
  id: string;
  name: string;
  subject: Subject;
  category: string;
  icon: string; // emoji
  color: string; // gradient key
  description?: string;
  cards: Flashcard[];
  createdAt: number;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  deckId?: string;
  cardsStudied: number;
  correct: number;
  total: number;
  xpGained: number;
  durationSec: number;
  mode: "study" | "quiz";
}

export interface Settings {
  darkMode: boolean;
  notifications: boolean;
  sound: boolean;
  tts: boolean;
  dailyGoal: number;
  reminderTime: string;
}

export interface AppState {
  version: 1;
  userName: string;
  onboardingDone: boolean;
  decks: Deck[];
  sessions: StudySession[];
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  totalStudySeconds: number;
  badges: string[]; // achievement ids unlocked
  settings: Settings;
  createdAt: number;
}

export const STORAGE_KEY = "flashmaster.data.v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const today = () => new Date().toISOString().slice(0, 10);

export const SUBJECTS: Subject[] = ["Science", "Math", "History", "Language", "Programming", "Art", "Business", "Other"];
export const CATEGORIES: Record<Subject, string[]> = {
  Science: ["Physics", "Chemistry", "Biology", "Astronomy"],
  Math: ["Algebra", "Calculus", "Geometry", "Statistics"],
  History: ["World", "Ancient", "Modern", "Local"],
  Language: ["Vocabulary", "Grammar", "Phrases", "Literature"],
  Programming: ["JavaScript", "Python", "Algorithms", "Web"],
  Art: ["Design", "Painting", "Music", "Film"],
  Business: ["Marketing", "Finance", "Strategy", "Leadership"],
  Other: ["General", "Trivia", "Misc"],
};
export const DECK_ICONS = ["⚛️", "🧬", "🏆", "", "💼", "🎨", "", "🧮", "🌍", "", "", "🚀"];
export const DECK_COLORS = ["indigo", "violet", "sky", "teal", "fuchsia", "emerald", "amber", "rose"];

export const QUOTES = [
  { q: "The expert in anything was once a beginner.", a: "Helen Hayes" },
  { q: "Learning is not attained by chance, it must be sought for with ardor.", a: "Abigail Adams" },
  { q: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
  { q: "The beautiful thing about learning is that no one can take it away from you.", a: "B.B. King" },
  { q: "Small daily improvements over time lead to stunning results.", a: "Robin Sharma" },
  { q: "Tell me and I forget, teach me and I may remember, involve me and I learn.", a: "Benjamin Franklin" },
];

export const ACHIEVEMENTS: { id: string; name: string; emoji: string; desc: string; check: (s: AppState) => boolean }[] = [
  { id: "first_deck", name: "Deck Builder", emoji: "🗂️", desc: "Create your first deck", check: (s) => s.decks.length >= 1 },
  { id: "five_decks", name: "Librarian", emoji: "📚", desc: "Create 5 decks", check: (s) => s.decks.length >= 5 },
  { id: "ten_cards", name: "Card Collector", emoji: "🃏", desc: "Add 10 flashcards", check: (s) => totalCards(s) >= 10 },
  { id: "fifty_cards", name: "Knowledge Hoarder", emoji: "💎", desc: "Add 50 flashcards", check: (s) => totalCards(s) >= 50 },
  { id: "first_study", name: "First Steps", emoji: "👣", desc: "Complete a study session", check: (s) => s.sessions.length >= 1 },
  { id: "streak_3", name: "On Fire", emoji: "🔥", desc: "3-day study streak", check: (s) => s.streak >= 3 },
  { id: "streak_7", name: "Unstoppable", emoji: "⚡", desc: "7-day study streak", check: (s) => s.streak >= 7 },
  { id: "streak_30", name: "Legendary", emoji: "👑", desc: "30-day study streak", check: (s) => s.streak >= 30 },
  { id: "master_10", name: "Sharp Mind", emoji: "🎯", desc: "Master 10 cards", check: (s) => masteredCount(s) >= 10 },
  { id: "master_50", name: "Memory Master", emoji: "🧠", desc: "Master 50 cards", check: (s) => masteredCount(s) >= 50 },
  { id: "quiz_perfect", name: "Perfectionist", emoji: "🏅", desc: "Score 100% on a quiz", check: (s) => s.sessions.some((x) => x.mode === "quiz" && x.total > 0 && x.correct === x.total) },
  { id: "xp_500", name: "Rising Star", emoji: "⭐", desc: "Earn 500 XP", check: (s) => s.xp >= 500 },
  { id: "xp_2000", name: "Scholar", emoji: "🎓", desc: "Earn 2000 XP", check: (s) => s.xp >= 2000 },
];

export function totalCards(s: AppState) { return s.decks.reduce((a, d) => a + d.cards.length, 0); }
export function masteredCount(s: AppState) { return s.decks.reduce((a, d) => a + d.cards.filter((c) => c.difficulty === "learned").length, 0); }
export function favoriteCount(s: AppState) { return s.decks.reduce((a, d) => a + d.cards.filter((c) => c.favorite).length, 0); }

export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const base = (level - 1) ** 2 * 50;
  const next = level ** 2 * 50;
  return { level, base, next, progress: Math.min(1, (xp - base) / Math.max(1, next - base)) };
}

export function timeOfDayGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return { text: `Good Morning, ${name}`, emoji: "☀️" };
  if (h < 18) return { text: `Hi, ${name}`, emoji: "👋" };
  return { text: `Welcome back, ${name}`, emoji: "📚" };
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
export function daysAgoLabel(date: string) {
  const d = new Date(date); const t = new Date();
  const diff = Math.floor((t.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === 1) return migrate(parsed);
    }
  } catch {}
  return seedState();
}

export function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function migrate(s: AppState): AppState {
  return {
    version: 1,
    userName: s.userName ?? "Ayomide",
    onboardingDone: !!s.onboardingDone,
    decks: s.decks ?? [],
    sessions: s.sessions ?? [],
    xp: s.xp ?? 0,
    streak: s.streak ?? 0,
    lastStudyDate: s.lastStudyDate ?? null,
    totalStudySeconds: s.totalStudySeconds ?? 0,
    badges: s.badges ?? [],
    settings: { ...(s.settings || {}), darkMode: s.settings?.darkMode ?? false, notifications: s.settings?.notifications ?? true, sound: s.settings?.sound ?? true, tts: s.settings?.tts ?? true, dailyGoal: s.settings?.dailyGoal ?? 20, reminderTime: s.settings?.reminderTime ?? "08:00" },
    createdAt: s.createdAt ?? Date.now(),
  };
}

export function seedState(): AppState {
  const now = Date.now();
  const mk = (front: string, back: string, difficulty: Difficulty = "medium", tags: string[] = []): Flashcard => ({
    id: uid(), front, back, difficulty, favorite: false, tags, createdAt: now, reviewCount: 0,
  });
  const quantum: Deck = {
    id: uid(), name: "Quantum Physics", subject: "Science", category: "Physics", icon: "⚛️", color: "indigo",
    description: "Core principles and postulates of quantum mechanics.",
    cards: [
      mk("Planck's constant (h)", "6.626 × 10⁻³⁴ J·s — relates energy of a photon to its frequency.", "learned", ["constant"]),
      mk("Wave-Particle Duality", "Quantum entities exhibit both wave-like and particle-like properties.", "easy", ["concept"]),
      mk("Heisenberg Uncertainty", "Δx · Δp ≥ ħ/2 — position and momentum cannot both be known precisely.", "medium", ["principle"]),
      mk("Schrödinger Equation", "iħ ∂ψ/∂t = Ĥψ — governs time evolution of quantum states.", "hard", ["equation"]),
      mk("Superposition", "A system can exist in multiple states simultaneously until measured.", "easy", ["concept"]),
      mk("Quantum Entanglement", "Correlated particles share state instantaneously across distance.", "medium", ["concept"]),
    ],
    createdAt: now - 86400000 * 6,
  };
  const vocab: Deck = {
    id: uid(), name: "French Vocabulary", subject: "Language", category: "Vocabulary", icon: "🇫🇷", color: "violet",
    description: "Essential everyday French words and phrases.",
    cards: [
      mk("Bonjour", "Hello / Good morning", "learned", ["greeting"]),
      mk("Merci", "Thank you", "learned", ["polite"]),
      mk("Bibliothèque", "Library", "medium", ["place"]),
      mk("Papillon", "Butterfly", "easy", ["animal"]),
      mk("Aujourd'hui", "Today", "medium", ["time"]),
    ],
    createdAt: now - 86400000 * 4,
  };
  const js: Deck = {
    id: uid(), name: "JavaScript Basics", subject: "Programming", category: "JavaScript", icon: "💻", color: "sky",
    description: "Fundamentals of modern JavaScript.",
    cards: [
      mk("let vs const", "let is reassignable; const is a binding that cannot be reassigned.", "learned", ["syntax"]),
      mk("Closure", "A function that remembers its lexical scope even when executed outside it.", "medium", ["concept"]),
      mk("Promise states", "Pending, Fulfilled, Rejected", "medium", ["async"]),
      mk("=== operator", "Strict equality — compares value AND type without coercion.", "easy", ["operator"]),
    ],
    createdAt: now - 86400000 * 2,
  };

  const sessions: StudySession[] = [];
  const days = [6, 5, 4, 3, 2, 1, 0];
  const daily = [18, 22, 12, 28, 20, 24, 16];
  days.forEach((d, i) => {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    sessions.push({
      id: uid(), date, deckId: [quantum.id, vocab.id, js.id][i % 3],
      cardsStudied: daily[i], correct: Math.round(daily[i] * 0.75), total: daily[i],
      xpGained: daily[i] * 5, durationSec: daily[i] * 45 + 120, mode: i % 3 === 0 ? "quiz" : "study",
    });
  });

  return {
    version: 1,
    userName: "Ayomide",
    onboardingDone: true,
    decks: [quantum, vocab, js],
    sessions,
    xp: 642,
    streak: 7,
    lastStudyDate: today(),
    totalStudySeconds: 60 * 60 * 4 + 12 * 60,
    badges: ["first_deck", "ten_cards", "first_study", "streak_3", "streak_7", "master_10", "xp_500"],
    settings: { darkMode: false, notifications: true, sound: true, tts: true, dailyGoal: 20, reminderTime: "08:00" },
    createdAt: now - 86400000 * 30,
  };
}

export function recomputeBadges(s: AppState): string[] {
  const unlocked = new Set(s.badges || []);
  for (const a of ACHIEVEMENTS) if (a.check(s)) unlocked.add(a.id);
  return [...unlocked];
}

export function updateStreak(s: AppState): AppState {
  const t = today();
  if (s.lastStudyDate === t) return s;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = s.lastStudyDate === y ? s.streak + 1 : 1;
  return { ...s, streak, lastStudyDate: t };
}

export function weeklyStudy(s: AppState): { day: string; minutes: number; date: string }[] {
  const out: { day: string; minutes: number; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const date = d.toISOString().slice(0, 10);
    const day = d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
    const minutes = Math.round(s.sessions.filter((x) => x.date === date).reduce((a, b) => a + b.durationSec, 0) / 60);
    out.push({ day, minutes, date });
  }
  return out;
}

export function subjectDistribution(s: AppState): { subject: string; count: number; color: string }[] {
  const map: Record<string, number> = {};
  const colorMap: Record<string, string> = { Science: "#6366f1", Language: "#a855f7", Programming: "#06b6d4", Math: "#f59e0b", History: "#ef4444", Art: "#10b981", Business: "#ec4899", Other: "#64748b" };
  for (const d of s.decks) map[d.subject] = (map[d.subject] || 0) + d.cards.length;
  return Object.entries(map).map(([subject, count]) => ({ subject, count, color: colorMap[subject] || "#6366f1" }));
}

// Quiz generation
export interface QuizQuestion {
  type: QuizType;
  prompt: string;
  options?: string[];
  answer: string; // canonical answer (for fill) or correct option text
  correctIndex?: number; // for mcq/tf
  cardId: string;
}

export function generateQuiz(cards: Flashcard[], count = 8): QuizQuestion[] {
  const pool = cards.filter((c) => c.front && c.back);
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  const allBacks = pool.map((c) => c.back);
  const allFronts = pool.map((c) => c.front);
  const out: QuizQuestion[] = [];
  shuffled.forEach((card, i) => {
    const mode = i % 3;
    if (mode === 0) {
      // MCQ on back
      const wrongs = allBacks.filter((b) => b !== card.back).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...wrongs, card.back].sort(() => Math.random() - 0.5);
      out.push({ type: "mcq", prompt: card.front, options, answer: card.back, correctIndex: options.indexOf(card.back), cardId: card.id });
    } else if (mode === 1) {
      // True/False
      const isTrue = Math.random() > 0.5;
      const shown = isTrue ? card.back : allBacks.filter((b) => b !== card.back)[Math.floor(Math.random() * Math.max(1, allBacks.length - 1))] || "—";
      out.push({ type: "tf", prompt: `${card.front} → ${shown}`, options: ["True", "False"], answer: isTrue ? "True" : "False", correctIndex: isTrue ? 0 : 1, cardId: card.id });
    } else {
      // Fill in the blank (use front as clue)
      out.push({ type: "fill", prompt: `Define in your own words: ${card.front}`, answer: card.back, cardId: card.id });
    }
  });
  // Also add reverse MCQ sometimes
  if (shuffled.length > 2) {
    const card = shuffled[0];
    const wrongs = allFronts.filter((b) => b !== card.front).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...wrongs, card.front].sort(() => Math.random() - 0.5);
    out.push({ type: "mcq", prompt: `Which term matches: "${card.back}"?`, options, answer: card.front, correctIndex: options.indexOf(card.front), cardId: card.id });
  }
  return out;
}

export function gradeFill(user: string, correct: string) {
  const a = user.trim().toLowerCase();
  const b = correct.trim().toLowerCase();
  if (!a) return false;
  if (a === b) return true;
  // keyword overlap
  const words = b.split(/\s+/).filter((w) => w.length > 3);
  if (words.length === 0) return b.includes(a);
  const hit = words.filter((w) => a.includes(w)).length;
  return hit / words.length >= 0.5;
}
