export const GEMINI_API_ENDPOINT = '/api/gemini';
export const GEMINI_COOLDOWN_KEY = 'nutrichef_gemini_cooldown_until';
export const GEMINI_COOLDOWN_MS = 5 * 1000;
export const GENERATOR_SUGGESTIONS_CACHE_KEY = 'nutrichef_generator_suggestions_cache';
export const GENERATOR_RECIPE_CACHE_KEY = 'nutrichef_generator_recipe_cache';
export const EXPLORE_CACHE_KEY = 'nutrichef_explore_cache';
export const MEALPLAN_CACHE_KEY = 'nutrichef_mealplan_cache';
export const SHOPPING_CACHE_KEY = 'nutrichef_shopping_cache';

export function readStoredJson(key, fallbackValue) {
  if (typeof window === 'undefined') return fallbackValue;
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return fallbackValue;
  try { return JSON.parse(storedValue); }
  catch (error) { console.error(`No se pudo leer ${key}:`, error); return fallbackValue; }
}

export function writeStoredJson(key, value) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.error(`No se pudo guardar ${key}:`, error); }
}

export function compactProfile(profile) {
  const parts = [];
  if (profile.goals) parts.push(`Obj:${profile.goals}`);
  if (profile.dailyCalories) parts.push(`Cal:${profile.dailyCalories}kcal`);
  if (profile.proteinTarget) parts.push(`Prot:${profile.proteinTarget}g`);
  if (profile.fiberTarget) parts.push(`Fibra:${profile.fiberTarget}g`);
  if (profile.weight) parts.push(`Peso:${profile.weight}kg`);
  if (profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna') parts.push(`Dieta:${profile.dietaryStyle}`);
  if (profile.religiousDiet && profile.religiousDiet !== 'Ninguna') parts.push(`Religion:${profile.religiousDiet}`);
  if (profile.allergies?.length) parts.push(`Alergias:${profile.allergies.join(',')}`);
  if (profile.dislikes?.length) parts.push(`Evitar:${profile.dislikes.join(',')}`);
  if (profile.learnedPreferences?.length) parts.push(`Aprendido:${profile.learnedPreferences.join('|')}`);
  if (profile.useProteinPowder) parts.push('ProtPolvo:Si');
  if (profile.budgetFriendly) parts.push('Economico:Si');
  return parts.join(' | ');
}

export function getGeminiCooldownUntil() {
  return Number(readStoredJson(GEMINI_COOLDOWN_KEY, 0)) || 0;
}
export function setGeminiCooldownUntil(timestamp) {
  writeStoredJson(GEMINI_COOLDOWN_KEY, timestamp);
}
export function getCooldownMessage(cooldownUntil) {
  const remainingMs = Math.max(0, cooldownUntil - Date.now());
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return `Gemini esta en pausa. Espera ${remainingMinutes} min.`;
}

export function getCache(cacheKey) { return readStoredJson(cacheKey, {}); }
export function setCache(cacheKey, data) { writeStoredJson(cacheKey, data); }
export function getCacheEntry(cacheKey, entryKey) {
  const cache = getCache(cacheKey);
  return cache[entryKey] ?? null;
}
export function setCacheEntry(cacheKey, entryKey, value) {
  const cache = getCache(cacheKey);
  cache[entryKey] = value;
  setCache(cacheKey, cache);
}
export function getRecipeCache() { return getCache(GENERATOR_RECIPE_CACHE_KEY); }
export function setRecipeCache(cache) { setCache(GENERATOR_RECIPE_CACHE_KEY, cache); }

export function buildGeneratorRecipeCacheKey({ suggestion, ingredients, profile }) {
  return JSON.stringify({
    n: suggestion.name,
    i: ingredients.trim().toLowerCase(),
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    cal: profile.dailyCalories
  });
}

export function buildGeneratorSuggestionsCacheKey({ ingredients, profile, dishType, difficulty, cuisine }) {
  return JSON.stringify({
    i: ingredients.trim().toLowerCase(),
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    dt: dishType || '',
    dif: difficulty || '',
    c: cuisine || '',
  });
}

export function buildExploreCacheKey({ query, mode, profile }) {
  return JSON.stringify({
    q: query.trim().toLowerCase(),
    m: mode,
    g: profile.goals,
    d: profile.dietaryStyle,
  });
}

export function buildMealPlanCacheKey({ planType, isTrainingDay, planPreferences, profile, savedMeals }) {
  return JSON.stringify({
    t: planType,
    tr: isTrainingDay,
    p: planPreferences,
    g: profile.goals,
    d: profile.dietaryStyle,
    cal: profile.dailyCalories,
    saved: savedMeals.map(m => m.title),
  });
}

export function buildShoppingCacheKey(plan) {
  const mealNames = plan?.days?.flatMap(
    d => d.meals?.flatMap(m => m.options?.map(o => o.name) ?? []) ?? []
  ) ?? [];
  return JSON.stringify(mealNames.sort());
}

export async function fetchGeminiContent({ kind, payload }) {
  const cooldownUntil = getGeminiCooldownUntil();
  if (cooldownUntil > Date.now()) throw new Error(getCooldownMessage(cooldownUntil));

  const response = await fetch(GEMINI_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error || 'Error con Gemini';
    if (response.status === 429) {
      setGeminiCooldownUntil(Date.now() + GEMINI_COOLDOWN_MS);
    }
    throw new Error(message);
  }

  return data;
}

function extractJSON(text) {
  const clean = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('La IA no devolvio un JSON valido');
  return clean.slice(start, end + 1);
}

export async function callGeminiAPI(promptText, cacheKeyOrEntryKey = null, storeCacheKey = null) {
  const useNewMode = storeCacheKey !== null;
  const entryKey = cacheKeyOrEntryKey;

  if (useNewMode && entryKey) {
    const cached = getCacheEntry(storeCacheKey, entryKey);
    if (cached) { console.log('CACHE HIT', storeCacheKey); return cached; }
  } else if (!useNewMode && entryKey) {
    const cache = getRecipeCache();
    if (cache[entryKey]) { console.log('CACHE HIT legacy'); return cache[entryKey]; }
  }

  const payload = {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    }
  };

  try {
    const data = await fetchGeminiContent({ kind: 'text', payload });
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) throw new Error('La IA no devolvio texto');

    let parsed;
    try {
      parsed = JSON.parse(extractJSON(textResult));
    } catch {
      console.error('Respuesta cruda:', textResult);
      throw new Error('La IA devolvio JSON malformado - intenta de nuevo');
    }

    if (useNewMode && entryKey) {
      setCacheEntry(storeCacheKey, entryKey, parsed);
    } else if (!useNewMode && entryKey) {
      const cache = getRecipeCache();
      cache[entryKey] = parsed;
      setRecipeCache(cache);
    }

    return parsed;

  } catch (error) {
    console.error('Error Gemini:', error);
    throw error;
  }
}

export async function callGeminiVisionAPI(promptText, base64Image, mimeType) {
  const payload = {
    contents: [{
      role: 'user',
      parts: [
        { text: promptText },
        { inlineData: { mimeType, data: base64Image } }
      ]
    }]
  };
  const data = await fetchGeminiContent({ kind: 'vision', payload });
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
