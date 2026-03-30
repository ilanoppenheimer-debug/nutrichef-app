import { buildBrandContext } from './brandDatabase.js';

export const GEMINI_API_ENDPOINT = '/api/gemini';
export const GEMINI_COOLDOWN_KEY = 'nutrichef_gemini_cooldown_until';
export const GEMINI_COOLDOWN_MS = 5 * 1000;
export const GENERATOR_SUGGESTIONS_CACHE_KEY = 'nutrichef_generator_suggestions_cache';
export const GENERATOR_RECIPE_CACHE_KEY = 'nutrichef_generator_recipe_cache';
export const EXPLORE_CACHE_KEY = 'nutrichef_explore_cache';
export const MEALPLAN_CACHE_KEY = 'nutrichef_mealplan_cache';
export const SHOPPING_CACHE_KEY = 'nutrichef_shopping_cache';

// ── LocalStorage helpers ─────────────────────────────────────────────────────
export function readStoredJson(key, fallbackValue) {
  if (typeof window === 'undefined') return fallbackValue;
  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return fallbackValue;
  try { return JSON.parse(storedValue); }
  catch { return fallbackValue; }
}

export function writeStoredJson(key, value) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.error(`No se pudo guardar ${key}:`, e); }
}

// ── TDEE mejorado para deportes de fuerza ────────────────────────────────────
export function calculateTDEE(profile) {
  const w = parseFloat(profile.weight) || 0;
  const h = parseFloat(profile.height) || 0;
  const a = parseFloat(profile.age) || 0;
  if (!w || !h || !a) return null;

  let bmr = (10 * w) + (6.25 * h) - (5 * a) + (profile.gender === 'Masculino' ? 5 : -161);
  let activityMultiplier = parseFloat(profile.activityLevel) || 1.2;
  const sport = profile.sportType || 'Ninguno';
  const duration = parseFloat(profile.trainingDuration) || 60;
  const days = parseFloat(profile.trainingDaysPerWeek) || 3;

  let extraCaloriesPerWeek = 0;
  if (sport === 'Fuerza/Powerlifting') extraCaloriesPerWeek = days * (duration / 60) * 180;
  else if (sport === 'Crossfit' || sport === 'HIIT') extraCaloriesPerWeek = days * (duration / 60) * 280;
  else if (sport === 'Cardio') extraCaloriesPerWeek = days * (duration / 60) * 350;
  else if (sport === 'Deportes de equipo') extraCaloriesPerWeek = days * (duration / 60) * 250;

  let tdee = bmr * activityMultiplier + extraCaloriesPerWeek / 7;
  let calTarget = tdee;
  let proteinFactor = 1.6;
  let carbFactor = 3.5;
  const goals = profile.goals || '';

  if (goals.includes('Déficit')) {
    calTarget -= 400;
    proteinFactor = sport === 'Fuerza/Powerlifting' ? 2.4 : 2.0;
  } else if (goals.includes('Superávit')) {
    calTarget += 350;
    proteinFactor = sport === 'Fuerza/Powerlifting' ? 2.5 : 2.2;
    carbFactor = 4.5;
  } else if (sport === 'Fuerza/Powerlifting') {
    proteinFactor = 2.2;
    carbFactor = 4.0;
  }

  return {
    calories: Math.round(calTarget),
    protein: Math.round(w * proteinFactor),
    fiber: Math.round((calTarget / 1000) * 14),
    carbs: Math.round(w * carbFactor),
  };
}

// ── Perfil compacto con deporte ───────────────────────────────────────────────
export function compactProfile(profile) {
  const parts = [];
  if (profile.goals) parts.push(`Obj:${profile.goals}`);
  if (profile.dailyCalories) parts.push(`Cal:${profile.dailyCalories}kcal`);
  if (profile.proteinTarget) parts.push(`Prot:${profile.proteinTarget}g`);
  if (profile.carbTarget) parts.push(`Carb:${profile.carbTarget}g`);
  if (profile.fiberTarget) parts.push(`Fibra:${profile.fiberTarget}g`);
  if (profile.weight) parts.push(`Peso:${profile.weight}kg`);
  if (profile.sportType && profile.sportType !== 'Ninguno') {
    parts.push(`Deporte:${profile.sportType}`);
    if (profile.trainingDuration) parts.push(`Dur:${profile.trainingDuration}min`);
    if (profile.trainingDaysPerWeek) parts.push(`Dias:${profile.trainingDaysPerWeek}/sem`);
  }
  if (profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna') parts.push(`Dieta:${profile.dietaryStyle}`);
  if (profile.religiousDiet && profile.religiousDiet !== 'Ninguna') parts.push(`Religion:${profile.religiousDiet}`);
  if (profile.allergies?.length) parts.push(`Alergias:${profile.allergies.join(',')}`);
  if (profile.dislikes?.length) parts.push(`Evitar:${profile.dislikes.join(',')}`);
  if (profile.learnedPreferences?.length) parts.push(`IA:${profile.learnedPreferences.join('|')}`);
  if (profile.useProteinPowder) parts.push('ProtPolvo:Si');
  if (profile.budgetFriendly) parts.push('Economico:Si');
  if (profile.preferredSupermarket) parts.push(`Super:${profile.preferredSupermarket}`);
  // Localización — guía a la IA para usar nombres locales de ingredientes y marcas
  if (profile.country && profile.country !== 'Chile') parts.push(`Pais:${profile.country}`);
  if (profile.language && profile.language !== 'es') parts.push(`Idioma:${profile.language}`);
  return parts.join(' | ');
}

// Mapa de nombres locales de ingredientes según país
export const LOCAL_INGREDIENT_NAMES = {
  Chile:    { aguacate: 'palta', maíz: 'choclo', durazno: 'duraznero', frijoles: 'porotos', papas: 'papas' },
  México:   { palta: 'aguacate', choclo: 'elote', porotos: 'frijoles', papas: 'papas' },
  España:   { palta: 'aguacate', choclo: 'maíz', porotos: 'alubias', papas: 'patatas' },
  Argentina:{ aguacate: 'palta', maíz: 'choclo', frijoles: 'porotos', papas: 'papas' },
  Colombia: { palta: 'aguacate', choclo: 'mazorca', porotos: 'fríjoles' },
};

// Instrucción de localización para el prompt
export function buildLocaleInstruction(profile) {
  const country = profile.country || 'Chile';
  const lang = profile.language || 'es';
  const langNames = { es: 'español', en: 'inglés', he: 'hebreo', pt: 'portugués', fr: 'francés' };
  const langName = langNames[lang] || 'español';
  const localNames = LOCAL_INGREDIENT_NAMES[country] || {};
  const nameExamples = Object.keys(localNames).length
    ? ` Usa nombres locales de ${country} (ej: ${Object.entries(localNames).slice(0,2).map(([k,v]) => `"${v}" en vez de "${k}"`).join(', ')}).`
    : '';
  return `Responde en ${langName}. Adapta ingredientes y marcas para ${country}.${nameExamples}`;
}

// ── Cooldown ─────────────────────────────────────────────────────────────────
export function getGeminiCooldownUntil() { return Number(readStoredJson(GEMINI_COOLDOWN_KEY, 0)) || 0; }
export function setGeminiCooldownUntil(t) { writeStoredJson(GEMINI_COOLDOWN_KEY, t); }
export function getCooldownMessage(cooldownUntil) {
  const ms = Math.max(0, cooldownUntil - Date.now());
  return `Gemini esta en pausa. Espera ${Math.max(1, Math.ceil(ms / 60000))} min.`;
}

// ── Cache ─────────────────────────────────────────────────────────────────────
export function getCache(k) { return readStoredJson(k, {}); }
export function setCache(k, d) { writeStoredJson(k, d); }
export function getCacheEntry(k, ek) { return getCache(k)[ek] ?? null; }
export function setCacheEntry(k, ek, v) { const c = getCache(k); c[ek] = v; setCache(k, c); }
export function getRecipeCache() { return getCache(GENERATOR_RECIPE_CACHE_KEY); }
export function setRecipeCache(c) { setCache(GENERATOR_RECIPE_CACHE_KEY, c); }

// ── Cache Keys ────────────────────────────────────────────────────────────────
export function buildGeneratorRecipeCacheKey({ suggestion, ingredients, profile }) {
  return JSON.stringify({ n: suggestion.name, i: ingredients.trim().toLowerCase(), g: profile.goals, d: profile.dietaryStyle, a: profile.allergies, cal: profile.dailyCalories });
}
export function buildGeneratorSuggestionsCacheKey({ ingredients, profile, dishType, difficulty, cuisine }) {
  return JSON.stringify({ i: ingredients.trim().toLowerCase(), g: profile.goals, d: profile.dietaryStyle, a: profile.allergies, dt: dishType || '', dif: difficulty || '', c: cuisine || '' });
}
export function buildExploreCacheKey({ query, mode, profile }) {
  return JSON.stringify({ q: query.trim().toLowerCase(), m: mode, g: profile.goals, d: profile.dietaryStyle });
}
export function buildMealPlanCacheKey({ planType, isTrainingDay, planPreferences, profile, savedMeals }) {
  return JSON.stringify({ t: planType, tr: isTrainingDay, p: planPreferences, g: profile.goals, d: profile.dietaryStyle, cal: profile.dailyCalories, saved: savedMeals.map(m => m.title) });
}
export function buildShoppingCacheKey(plan) {
  const names = plan?.days?.flatMap(d => d.meals?.flatMap(m => m.options?.map(o => o.name) ?? []) ?? []) ?? [];
  return JSON.stringify(names.sort());
}

// ── Schema JSON de receta (con marcas_sugeridas) ──────────────────────────────
export const RECIPE_JSON_SCHEMA = `{"title":"...","description":"...","prepTime":"...","cookTime":"...","cuisine":"...","ingredients":[{"name":"...","amount":"...","substitute":"..."}],"steps":["..."],"macros":{"calories":"...","protein":"...","carbs":"...","fat":"...","fiber":"..."},"tips":"...","marcas_sugeridas":[{"name":"...","category":"kosher|halal|vegan|powerlifting|vegetariana","note":"..."}]}`;

// ── Builder de prompt de receta con marcas ───────────────────────────────────
export function buildRecipePrompt({ name, description, ingredients, profileStr, profile }) {
  const brandCtx = buildBrandContext(profile);
  const needsBrands = brandCtx.length > 0;
  return `Receta completa para "${name}".${description ? ` Contexto: ${description}.` : ''}${ingredients ? ` Ingredientes: ${ingredients}.` : ''}
Perfil: ${profileStr}.${brandCtx}
${needsBrands ? 'Incluye marcas relevantes en "marcas_sugeridas" según la dieta del usuario.' : 'Devuelve "marcas_sugeridas" como array vacío.'}
Devuelve SOLO este JSON:
${RECIPE_JSON_SCHEMA}`;
}

// ── Fetch backend ─────────────────────────────────────────────────────────────
export async function fetchGeminiContent({ kind, payload }) {
  const cooldownUntil = getGeminiCooldownUntil();
  if (cooldownUntil > Date.now()) throw new Error(getCooldownMessage(cooldownUntil));
  const response = await fetch(GEMINI_API_ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || 'Error con Gemini';
    if (response.status === 429) setGeminiCooldownUntil(Date.now() + GEMINI_COOLDOWN_MS);
    throw new Error(message);
  }
  return data;
}

function extractJSON(text) {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
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
    generationConfig: { temperature: 0.7, responseMimeType: 'application/json' }
  };

  try {
    const data = await fetchGeminiContent({ kind: 'text', payload });
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) throw new Error('La IA no devolvio texto');
    let parsed;
    try { parsed = JSON.parse(extractJSON(textResult)); }
    catch { console.error('Respuesta cruda:', textResult); throw new Error('JSON malformado - intenta de nuevo'); }
    if (useNewMode && entryKey) setCacheEntry(storeCacheKey, entryKey, parsed);
    else if (!useNewMode && entryKey) { const c = getRecipeCache(); c[entryKey] = parsed; setRecipeCache(c); }
    return parsed;
  } catch (error) { console.error('Error Gemini:', error); throw error; }
}

export async function callGeminiVisionAPI(promptText, base64Image, mimeType) {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Image } }] }]
  };
  const data = await fetchGeminiContent({ kind: 'vision', payload });
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
