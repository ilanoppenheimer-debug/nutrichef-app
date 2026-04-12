/**
 * learningEngine.js — Structured preference learning for NutriChef.
 *
 * Replaces the old learnedPreferences string array with a weighted,
 * time-decaying signal system.  The engine learns passively from user
 * actions (tweaks, saves, regenerations) and injects context into
 * Gemini prompts so recipes improve over time.
 *
 * Storage key: nutrichef_learning_v1 (localStorage)
 */

const STORAGE_KEY = 'nutrichef_learning_v1';
const MAX_RECENT_RECIPES = 20;
const MAX_TWEAK_HISTORY = 50;

// ── Decay constants ─────────────────────────────────────────────────────────

const DECAY_HALF_LIFE_DAYS = 14; // signal weight halves every 14 days

// ── Default state ───────────────────────────────────────────────────────────

function defaultState() {
  return {
    /** { [ingredient]: { count, lastSeen (ISO), weight } } */
    likes: {},
    /** { [ingredient]: { count, lastSeen (ISO), weight, permanent } } */
    dislikes: {},
    /** [{ type, value, ts (ISO) }]  — e.g. { type:'sin_carne', value:1, ts } */
    tweakHistory: [],
    /** [{ title, date (ISO), intent }] — most recent first */
    recentRecipes: [],
  };
}

// ── Persistence ─────────────────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silently degrade */ }
}

// ── Weight decay ────────────────────────────────────────────────────────────

function daysSince(isoDate) {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function decayedWeight(baseWeight, lastSeen) {
  const days = daysSince(lastSeen);
  return baseWeight * Math.pow(0.5, days / DECAY_HALF_LIFE_DAYS);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Record a positive signal for an ingredient or tag.
 * @param {string} key — ingredient name or tag (lowercase, trimmed)
 * @param {number} [strength=0.3] — signal strength (0.1 = light, 0.5 = strong)
 */
export function recordLike(key, strength = 0.3) {
  if (!key) return;
  const k = key.toLowerCase().trim();
  const state = load();
  const existing = state.likes[k] || { count: 0, lastSeen: new Date().toISOString(), weight: 0 };
  existing.count += 1;
  existing.weight = Math.min(1, existing.weight + strength);
  existing.lastSeen = new Date().toISOString();
  state.likes[k] = existing;
  save(state);
}

/**
 * Record a negative signal for an ingredient.
 * @param {string} key
 * @param {number} [strength=0.3]
 * @param {boolean} [permanent=false] — true = user explicitly said "never"
 */
export function recordDislike(key, strength = 0.3, permanent = false) {
  if (!key) return;
  const k = key.toLowerCase().trim();
  const state = load();
  const existing = state.dislikes[k] || { count: 0, lastSeen: new Date().toISOString(), weight: 0, permanent: false };
  existing.count += 1;
  existing.weight = Math.min(1, existing.weight + strength);
  existing.lastSeen = new Date().toISOString();
  if (permanent) existing.permanent = true;
  state.dislikes[k] = existing;
  save(state);
}

/**
 * Record a tweak action (e.g. "sin_carne", "mas_proteina").
 * If the same tweak appears 3+ times in a week, it becomes a soft preference.
 */
export function recordTweak(tweakType) {
  if (!tweakType) return;
  const state = load();
  state.tweakHistory.push({ type: tweakType, value: 1, ts: new Date().toISOString() });
  // Trim old entries
  if (state.tweakHistory.length > MAX_TWEAK_HISTORY) {
    state.tweakHistory = state.tweakHistory.slice(-MAX_TWEAK_HISTORY);
  }
  save(state);
}

/**
 * Record a recipe that was generated (for no-repeat & pattern detection).
 */
export function recordGeneratedRecipe(title, intent) {
  if (!title) return;
  const state = load();
  state.recentRecipes.unshift({
    title,
    date: new Date().toISOString(),
    intent: intent || 'inspirame',
  });
  if (state.recentRecipes.length > MAX_RECENT_RECIPES) {
    state.recentRecipes = state.recentRecipes.slice(0, MAX_RECENT_RECIPES);
  }
  save(state);
}

/**
 * Get the N most recent recipe titles (for no-repeat injection).
 */
export function getRecentRecipeTitles(n = 5) {
  const state = load();
  return state.recentRecipes.slice(0, n).map(r => r.title);
}

/**
 * Detect tweak patterns — returns tweaks that should auto-apply.
 * A tweak is "promoted" if it appeared 3+ times in the last 7 days.
 */
export function getAutoTweaks() {
  const state = load();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentTweaks = state.tweakHistory.filter(t => new Date(t.ts).getTime() > oneWeekAgo);

  const counts = {};
  for (const t of recentTweaks) {
    counts[t.type] = (counts[t.type] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([type]) => type);
}

/**
 * Build a learning context block for injection into Gemini prompts.
 * Returns a string (empty if no signals exist).
 */
export function buildLearningPromptBlock() {
  const state = load();
  const parts = [];

  // Permanent dislikes (always enforce)
  const permanentDislikes = Object.entries(state.dislikes)
    .filter(([, v]) => v.permanent)
    .map(([k]) => k);
  if (permanentDislikes.length > 0) {
    parts.push(`NUNCA usar estos ingredientes: ${permanentDislikes.join(', ')}`);
  }

  // Strong dislikes (decayed weight > 0.3)
  const strongDislikes = Object.entries(state.dislikes)
    .filter(([, v]) => !v.permanent && decayedWeight(v.weight, v.lastSeen) > 0.3)
    .map(([k]) => k);
  if (strongDislikes.length > 0) {
    parts.push(`Evitar si es posible: ${strongDislikes.join(', ')}`);
  }

  // Strong likes (decayed weight > 0.3)
  const strongLikes = Object.entries(state.likes)
    .filter(([, v]) => decayedWeight(v.weight, v.lastSeen) > 0.3)
    .sort((a, b) => decayedWeight(b[1].weight, b[1].lastSeen) - decayedWeight(a[1].weight, a[1].lastSeen))
    .slice(0, 8)
    .map(([k]) => k);
  if (strongLikes.length > 0) {
    parts.push(`Le gusta: ${strongLikes.join(', ')}`);
  }

  // Auto-tweaks (promoted patterns)
  const autoTweaks = getAutoTweaks();
  if (autoTweaks.length > 0) {
    const labels = {
      mas_simple: 'prefiere recetas simples',
      mas_economico: 'prefiere opciones baratas',
      mas_proteina: 'busca alta proteína',
      sin_carne: 'evita la carne',
      mas_fibra: 'busca más fibra',
    };
    const descriptions = autoTweaks.map(t => labels[t] || t).join(', ');
    parts.push(`Tendencia reciente: ${descriptions}`);
  }

  // Recent recipes (no-repeat)
  const recent = getRecentRecipeTitles(5);
  if (recent.length > 0) {
    parts.push(`NO repetir recetas recientes: ${recent.join(', ')}`);
  }

  return parts.length > 0 ? `\nAprendizaje del usuario:\n${parts.join('\n')}` : '';
}

/**
 * Clear all learning data (settings reset).
 */
export function clearLearningData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
