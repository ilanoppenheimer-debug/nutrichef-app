import { buildAbsoluteGuardrail } from './brandDatabase.js';
import { fetchWithAuth } from './authUtils.js';
import { buildFoodPreferencePromptBlock, getFoodPreferenceCacheFragment, getFoodPreferenceSummaryLines, withFoodPreferences } from './foodPreferences.js';
import { normalizeRecipePayload } from './ingredientIntelligence.js';
import { buildOptionalPromptParts, inferSchemaByCacheKey } from '../helpers/geminiPromptHelpers.js';
export { buildAbsoluteGuardrail } from './brandDatabase.js';
export { buildFoodPreferencePromptBlock } from './foodPreferences.js';
export { normalizeRecipePayload } from './ingredientIntelligence.js';

export const GEMINI_API_ENDPOINT = '/api/gemini';
export const GEMINI_COOLDOWN_KEY = 'nutrichef_gemini_cooldown_until';
export const GEMINI_COOLDOWN_MS = 5 * 1000;
export const GENERATOR_SUGGESTIONS_CACHE_KEY = 'nutrichef_generator_suggestions_cache';
export const GENERATOR_RECIPE_CACHE_KEY = 'nutrichef_generator_recipe_cache';
export const EXPLORE_CACHE_KEY = 'nutrichef_explore_cache';
export const MEALPLAN_CACHE_KEY = 'nutrichef_mealplan_cache';
export const SHOPPING_CACHE_KEY = 'nutrichef_shopping_cache';

// ── Prompt-injection defense ────────────────────────────────────────────────
// Strips control sequences and caps length so user-supplied text cannot
// override system instructions when interpolated into prompts.
export function sanitizeUserInput(text, maxLength = 500) {
  if (typeof text !== 'string') return '';
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // strip control chars
    .replace(/```/g, '')                                    // no fenced blocks
    .slice(0, maxLength)
    .trim();
}

// ── JSON extraction (shared by cooking/meal-prep hooks) ─────────────────────
export function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

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
  const effectiveProfile = withFoodPreferences(profile, profile?.foodPreferences);
  const foodPreferenceLines = getFoodPreferenceSummaryLines(effectiveProfile);
  profile = effectiveProfile;
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
  if (foodPreferenceLines.length) parts.push(`FoodPrefs:${foodPreferenceLines.join(',')}`);
  if (profile.dislikes?.length) parts.push(`Evitar:${profile.dislikes.join(',')}`);
  if (profile.learnedPreferences?.length) parts.push(`IA:${profile.learnedPreferences.join('|')}`);
  if (profile.useProteinPowder) parts.push('ProtPolvo:Si');
  if (profile.budgetFriendly) parts.push('Economico:Si');
  // Multi-supermercado (array) con fallback a string legacy
  if (profile.preferredSupermarkets?.length) parts.push(`Supers:${profile.preferredSupermarkets.join(',')}`);
  else if (profile.preferredSupermarket) parts.push(`Super:${profile.preferredSupermarket}`);
  // Localización
  if (profile.country) parts.push(`Pais:${profile.country}`);
  if (profile.language && profile.language !== 'es') parts.push(`Idioma:${profile.language}`);
  // Pésaj
  if (profile.pesachMode) parts.push(`Pesaj:Si|Kitniot:${profile.allowsKitniot ? 'Si' : 'No'}`);
  return parts.join(' | ');
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
export function buildGeneratorRecipeCacheKey({ suggestion, ingredients, profile, timeLimit }) {
  const foodPreferences = getFoodPreferenceCacheFragment(profile);
  return JSON.stringify({
    v: 'recipe-safety-v2',
    n: suggestion.name,
    i: ingredients.trim().toLowerCase(),
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    dl: profile.dislikes,
    r: profile.religiousDiet,
    cal: profile.dailyCalories,
    t: timeLimit || 'none',
    p: profile.pesachMode || false,
    bf: profile.budgetFriendly || false,
    c: profile.country || 'Chile',
    s: (profile.preferredSupermarkets || []).slice().sort(),
    fp: foodPreferences,
  });
}
export function buildGeneratorSuggestionsCacheKey({ ingredients, profile, dishType, difficulty, cuisine }) {
  const foodPreferences = getFoodPreferenceCacheFragment(profile);
  return JSON.stringify({
    v: 'suggestions-safety-v2',
    i: ingredients.trim().toLowerCase(),
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    dl: profile.dislikes,
    r: profile.religiousDiet,
    dt: dishType || '',
    dif: difficulty || '',
    c: cuisine || '',
    bf: profile.budgetFriendly || false,
    country: profile.country || 'Chile',
    supers: (profile.preferredSupermarkets || []).slice().sort(),
    fp: foodPreferences,
  });
}
export function buildExploreCacheKey({ query, mode, profile }) {
  const foodPreferences = getFoodPreferenceCacheFragment(profile);
  return JSON.stringify({
    v: 'explore-safety-v2',
    q: query.trim().toLowerCase(),
    m: mode,
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    dl: profile.dislikes,
    r: profile.religiousDiet,
    fp: foodPreferences,
  });
}
export function buildMealPlanCacheKey({ planType, isTrainingDay, planPreferences, profile, savedMeals }) {
  const foodPreferences = getFoodPreferenceCacheFragment(profile);
  return JSON.stringify({
    v: 'mealplan-options-v3',
    t: planType,
    tr: isTrainingDay,
    p: planPreferences,
    g: profile.goals,
    d: profile.dietaryStyle,
    a: profile.allergies,
    dl: profile.dislikes,
    r: profile.religiousDiet,
    cal: profile.dailyCalories,
    bf: profile.budgetFriendly || false,
    country: profile.country || 'Chile',
    supers: (profile.preferredSupermarkets || []).slice().sort(),
    saved: savedMeals.map(m => m.title),
    fp: foodPreferences,
  });
}
export function buildShoppingCacheKey(plan, profile = {}) {
  const foodPreferences = getFoodPreferenceCacheFragment(profile);
  const meals = plan?.days?.flatMap(day =>
    day.meals?.flatMap(meal =>
      meal.options?.map(option => ({
        day: day.dayName,
        meal: meal.type,
        name: option.name,
        servings: option.selectedServings || option.servings || 1,
      })) ?? []
    ) ?? []
  ) ?? [];

  return JSON.stringify({
    v: 'shopping-safety-v2',
    meals: meals.sort((a, b) => `${a.day}-${a.meal}-${a.name}`.localeCompare(`${b.day}-${b.meal}-${b.name}`)),
    bf: profile.budgetFriendly || false,
    a: profile.allergies || [],
    dl: profile.dislikes || [],
    country: profile.country || 'Chile',
    supers: (profile.preferredSupermarkets || []).slice().sort(),
    fp: foodPreferences,
  });
}

export const CURRENCY_BY_COUNTRY = {
  Chile: { code: 'CLP', locale: 'es-CL' },
  Argentina: { code: 'ARS', locale: 'es-AR' },
  México: { code: 'MXN', locale: 'es-MX' },
  Colombia: { code: 'COP', locale: 'es-CO' },
  Perú: { code: 'PEN', locale: 'es-PE' },
  España: { code: 'EUR', locale: 'es-ES' },
  Uruguay: { code: 'UYU', locale: 'es-UY' },
  Ecuador: { code: 'USD', locale: 'es-EC' },
  Israel: { code: 'ILS', locale: 'he-IL' },
  'Estados Unidos': { code: 'USD', locale: 'en-US' },
  Brasil: { code: 'BRL', locale: 'pt-BR' },
  Venezuela: { code: 'USD', locale: 'es-VE' },
  Bolivia: { code: 'BOB', locale: 'es-BO' },
  Paraguay: { code: 'PYG', locale: 'es-PY' },
};

const SOUTHERN_HEMISPHERE_COUNTRIES = new Set([
  'Chile', 'Argentina', 'Uruguay', 'Paraguay', 'Bolivia', 'Brasil', 'Perú',
]);

export function getCurrencyForCountry(country) {
  return CURRENCY_BY_COUNTRY[country] || CURRENCY_BY_COUNTRY['Estados Unidos'];
}

export function formatCurrencyByCountry(value, country) {
  const { code, locale } = getCurrencyForCountry(country);
  const hasDecimals = !['CLP', 'COP', 'PYG'].includes(code);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: hasDecimals ? 0 : 0,
    maximumFractionDigits: hasDecimals ? 0 : 0,
  }).format(Number(value || 0));
}

export function getCurrentSeasonForCountry(country, referenceDate = new Date()) {
  const month = referenceDate.getMonth();
  const seasonsNorth = ['invierno', 'invierno', 'primavera', 'primavera', 'primavera', 'verano', 'verano', 'verano', 'otoño', 'otoño', 'otoño', 'invierno'];
  const seasonsSouth = ['verano', 'verano', 'otoño', 'otoño', 'otoño', 'invierno', 'invierno', 'invierno', 'primavera', 'primavera', 'primavera', 'verano'];
  return (SOUTHERN_HEMISPHERE_COUNTRIES.has(country) ? seasonsSouth : seasonsNorth)[month];
}

export function buildBudgetOptimizationInstruction(profile = {}) {
  if (!profile.budgetFriendly) return '';

  const country = profile.country || 'Chile';
  const goal = profile.goals || 'una alimentación equilibrada';
  const season = getCurrentSeasonForCountry(country);
  const selectedMarkets = profile.preferredSupermarkets?.length
    ? profile.preferredSupermarkets.join(', ')
    : getSupermarketsForCountry(country).slice(0, 3).join(', ');

  return `MODO "OPTIMIZAR PRESUPUESTO" ACTIVO:
- Diseña la receta con ingredientes de bajo costo relativo en ${country}, manteniendo el objetivo nutricional de ${goal}.
- Sustituye ingredientes caros por alternativas económicas equivalentes cuando sea posible (ejemplo: salmón por atún en conserva o jurel; quinoa por arroz integral).
- Prioriza frutas y verduras de temporada de ${season} en ${country}.
- Sugiere marcas blancas, formatos familiares o packs ahorro disponibles en: ${selectedMarkets}.`;
}

export function buildShoppingCostInstruction(profile = {}) {
  const country = profile.country || 'Chile';
  const { code } = getCurrencyForCountry(country);
  const selectedMarkets = profile.preferredSupermarkets?.length
    ? profile.preferredSupermarkets.join(', ')
    : getSupermarketsForCountry(country).slice(0, 3).join(', ');

  return `Usa ${code} como moneda. Estima rangos de precio realistas para ${country}, tomando como referencia: ${selectedMarkets}.
Devuelve precios mínimos y máximos NUMÉRICOS por ingrediente, más total semanal y ahorro estimado si aplica.`;
}

// ── Structured Outputs schemas (OpenAPI subset) ───────────────────────────────
export const Type = Object.freeze({
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  ARRAY: 'ARRAY',
  BOOLEAN: 'BOOLEAN',
  INTEGER: 'INTEGER',
  NUMBER: 'NUMBER',
});

function stringSchema(description, extra = {}) {
  return { type: Type.STRING, description, ...extra };
}

function booleanSchema(description, extra = {}) {
  return { type: Type.BOOLEAN, description, ...extra };
}

function integerSchema(description, extra = {}) {
  return { type: Type.INTEGER, description, ...extra };
}

function numberSchema(description, extra = {}) {
  return { type: Type.NUMBER, description, ...extra };
}

function arraySchema(items, description, extra = {}) {
  return { type: Type.ARRAY, items, description, ...extra };
}

const RECIPE_INGREDIENT_SCHEMA = {
  type: Type.OBJECT,
  description: 'Ingrediente normalizado de la receta.',
  properties: {
    cantidad: stringSchema('Cantidad del ingrediente.'),
    unidad: stringSchema('Unidad del ingrediente.'),
    nombre: stringSchema('Nombre del ingrediente, sin certificaciones ni texto extra.'),
    isDislike: booleanSchema('Marca si el ingrediente coincide con un dislike del usuario.'),
    allergyAlert: booleanSchema('Marca si el ingrediente entra en conflicto con alergias o intolerancias.'),
    suggestedSubstitute: stringSchema('Sustituto sugerido cuando el ingrediente es conflictivo.'),
    es_seguro_kosher: booleanSchema('Indica si el ingrediente es seguro para dieta Kosher.'),
    es_seguro_halal: booleanSchema('Indica si el ingrediente es seguro para dieta Halal.'),
    marca_sugerida: stringSchema('Marca sugerida compatible si aplica.'),
  },
  required: ['cantidad', 'unidad', 'nombre', 'isDislike', 'allergyAlert', 'suggestedSubstitute', 'es_seguro_kosher', 'es_seguro_halal', 'marca_sugerida'],
};

const RECIPE_MACROS_SCHEMA = {
  type: Type.OBJECT,
  description: 'Resumen de macros nutricionales.',
  properties: {
    calories: stringSchema('Calorias estimadas.'),
    protein: stringSchema('Proteina estimada.'),
    carbs: stringSchema('Carbohidratos estimados.'),
    fat: stringSchema('Grasas estimadas.'),
    fiber: stringSchema('Fibra estimada.'),
  },
  required: ['calories', 'protein', 'carbs', 'fat', 'fiber'],
};

const RECIPE_BRAND_SCHEMA = {
  type: Type.OBJECT,
  description: 'Marca sugerida compatible con la dieta del usuario.',
  properties: {
    name: stringSchema('Nombre de la marca.'),
    category: stringSchema('Categoria dietaria asociada.', {
      enum: ['kosher', 'halal', 'vegan', 'powerlifting', 'vegetariana'],
    }),
    note: stringSchema('Nota corta explicando la relevancia de la marca.'),
  },
  required: ['name', 'category', 'note'],
};

export const RECIPE_JSON_SCHEMA = {
  type: Type.OBJECT,
  description: 'Receta completa normalizada para NutriChef.',
  properties: {
    title: stringSchema('Nombre de la receta.'),
    description: stringSchema('Descripcion breve de maximo 15 palabras.'),
    prepTime: stringSchema('Tiempo de preparacion.'),
    cookTime: stringSchema('Tiempo de coccion.'),
    cuisine: stringSchema('Tipo de cocina.'),
    servings: stringSchema('Cantidad de porciones.'),
    ingredients: arraySchema(RECIPE_INGREDIENT_SCHEMA, 'Ingredientes de la receta.'),
    steps: arraySchema(stringSchema('Paso de la receta.'), 'Pasos de la receta.'),
    macros: RECIPE_MACROS_SCHEMA,
    tips: stringSchema('Consejo breve de cocina.'),
    marcas_sugeridas: arraySchema(RECIPE_BRAND_SCHEMA, 'Marcas sugeridas segun la dieta del usuario.'),
    seguridad: stringSchema('Resumen corto de seguridad alimentaria para la dieta del usuario.'),
  },
  required: ['title', 'description', 'prepTime', 'cookTime', 'cuisine', 'servings', 'ingredients', 'steps', 'macros', 'tips', 'marcas_sugeridas', 'seguridad'],
};

export const RECIPE_REFINEMENT_SCHEMA = RECIPE_JSON_SCHEMA;

const SEARCH_SUGGESTION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Sugerencia breve de plato o receta.',
  properties: {
    id: integerSchema('Identificador numerico de la sugerencia.'),
    name: stringSchema('Nombre de la sugerencia.'),
    type: stringSchema('Tipo o metodo principal del plato.'),
    description: stringSchema('Descripcion breve y directa de la sugerencia.'),
  },
  required: ['id', 'name', 'type', 'description'],
};

export const SEARCH_SUGGESTIONS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  description: 'Conjunto de sugerencias de recetas o platos.',
  properties: {
    suggestions: arraySchema(SEARCH_SUGGESTION_SCHEMA, 'Sugerencias generadas por Gemini.'),
  },
  required: ['suggestions'],
};

const MEAL_OPTION_SCHEMA = {
  type: Type.OBJECT,
  description: 'Opcion de comida dentro de un plan.',
  properties: {
    name: stringSchema('Nombre de la opcion de comida.'),
    description: stringSchema('Descripcion breve y practica.'),
    calories: stringSchema('Calorias estimadas de la opcion.'),
    protein: stringSchema('Proteina estimada de la opcion.'),
    fiber: stringSchema('Fibra estimada de la opcion.'),
    servings: integerSchema('Cantidad de porciones.'),
  },
  required: ['name', 'description', 'calories', 'protein', 'fiber', 'servings'],
};

const MEAL_GROUP_SCHEMA = {
  type: Type.OBJECT,
  description: 'Grupo de comida por horario o categoria.',
  properties: {
    type: stringSchema('Tipo de comida, por ejemplo Desayuno o Almuerzo.'),
    options: arraySchema(MEAL_OPTION_SCHEMA, 'Opciones disponibles para este tipo de comida.'),
  },
  required: ['type', 'options'],
};

const MEAL_PLAN_DAY_SCHEMA = {
  type: Type.OBJECT,
  description: 'Dia individual dentro del plan de comidas.',
  properties: {
    dayName: stringSchema('Nombre del dia.'),
    meals: arraySchema(MEAL_GROUP_SCHEMA, 'Comidas del dia.'),
  },
  required: ['dayName', 'meals'],
};

export const MEAL_PLAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  description: 'Plan de comidas diario o semanal.',
  properties: {
    summary: stringSchema('Resumen general del plan.'),
    totalCalories: stringSchema('Calorias totales estimadas.'),
    totalProtein: stringSchema('Proteina total estimada.'),
    totalFiber: stringSchema('Fibra total estimada.'),
    days: arraySchema(MEAL_PLAN_DAY_SCHEMA, 'Dias del plan de comidas.'),
  },
  required: ['summary', 'totalCalories', 'totalProtein', 'totalFiber', 'days'],
};

export const MEAL_OPTIONS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  description: 'Respuesta con opciones de reemplazo para una comida.',
  properties: {
    options: arraySchema(MEAL_OPTION_SCHEMA, 'Opciones alternativas para reemplazar una comida.'),
  },
  required: ['options'],
};

const SHOPPING_LIST_ITEM_SCHEMA = {
  type: Type.OBJECT,
  description: 'Ingrediente o item de compra.',
  properties: {
    name: stringSchema('Nombre del ingrediente o producto.'),
    amount: stringSchema('Cantidad total aproximada a comprar.'),
    estimatedPriceMin: numberSchema('Precio minimo estimado.'),
    estimatedPriceMax: numberSchema('Precio maximo estimado.'),
    budgetTip: stringSchema('Consejo breve de ahorro.'),
    substituteFor: stringSchema('Ingrediente original sustituido, si hubo cambio por seguridad.'),
  },
  required: ['name', 'amount', 'estimatedPriceMin', 'estimatedPriceMax', 'budgetTip', 'substituteFor'],
};

const SHOPPING_LIST_CATEGORY_SCHEMA = {
  type: Type.OBJECT,
  description: 'Categoria de supermercado para agrupar compras.',
  properties: {
    name: stringSchema('Nombre de la categoria.'),
    items: arraySchema(SHOPPING_LIST_ITEM_SCHEMA, 'Items agrupados en esta categoria.'),
  },
  required: ['name', 'items'],
};

export const SHOPPING_LIST_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  description: 'Lista de compras consolidada para un plan.',
  properties: {
    currency: stringSchema('Codigo de moneda.'),
    estimatedTotalMin: numberSchema('Costo minimo total estimado.'),
    estimatedTotalMax: numberSchema('Costo maximo total estimado.'),
    estimatedSavingsMin: numberSchema('Ahorro minimo estimado.'),
    estimatedSavingsMax: numberSchema('Ahorro maximo estimado.'),
    categories: arraySchema(SHOPPING_LIST_CATEGORY_SCHEMA, 'Categorias y productos de la lista de compras.'),
  },
  required: ['currency', 'estimatedTotalMin', 'estimatedTotalMax', 'estimatedSavingsMin', 'estimatedSavingsMax', 'categories'],
};

// ── Builder de prompt de receta ──────────────────────────────────────────────
export function buildRecipePrompt({ name, description, ingredients, profileStr, profile }) {
  const guardrail = buildAbsoluteGuardrail(profile);
  const foodPreferenceInstruction = buildFoodPreferencePromptBlock(profile);
  return `Actúa como un asistente que toma decisiones por el usuario. Genera UNA receta completa para "${name}".${description ? ` Contexto: ${description}.` : ''}${ingredients ? ` Ingredientes: ${ingredients}.` : ''}
Perfil: ${profileStr}.
${foodPreferenceInstruction ? `${foodPreferenceInstruction}\n` : ''}${guardrail}
REGLAS:
- NO entregues múltiples opciones ni alternativas innecesarias.
- NO incluyas productos, marcas ni recomendaciones comerciales.
- Si algún ingrediente no cumple restricciones, reemplázalo automáticamente sin mencionarlo.
- "description" máximo 15 palabras. Sin justificaciones de dieta.
- Cada ingrediente: "cantidad", "unidad", "nombre" (sin certificaciones ni texto extra).
- Máximo 5 pasos, lenguaje simple.
- Marca ingredientes problemáticos con "isDislike":true o "allergyAlert":true y añade "suggestedSubstitute".
- Devuelve "marcas_sugeridas" como array vacío.
- En "seguridad" escribe una frase corta de máximo 5 palabras.`;
}

// ── Fetch backend ─────────────────────────────────────────────────────────────
export async function fetchGeminiContent({ kind, payload }) {
  const cooldownUntil = getGeminiCooldownUntil();
  if (cooldownUntil > Date.now()) throw new Error(getCooldownMessage(cooldownUntil));

  const response = await fetchWithAuth(GEMINI_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ kind, payload }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || 'Error con Gemini';
    if (response.status === 429) setGeminiCooldownUntil(Date.now() + GEMINI_COOLDOWN_MS);
    throw new Error(message);
  }
  return data;
}

function normalizeCallGeminiOptions(options = {}) {
  if (typeof options === 'number') {
    return { maxOutputTokens: options };
  }

  return options || {};
}

function normalizeGeminiResponse(parsed, responseSchema) {
  if (responseSchema === RECIPE_JSON_SCHEMA || responseSchema === RECIPE_REFINEMENT_SCHEMA) {
    return normalizeRecipePayload(parsed);
  }

  return parsed;
}

function inferResponseSchema(promptText, entryKey, storeCacheKey) {
  const schemaFromCache = inferSchemaByCacheKey({
    storeCacheKey,
    entryKey,
    recipeSchema: { cacheKey: GENERATOR_RECIPE_CACHE_KEY, schema: RECIPE_JSON_SCHEMA },
    exploreSchema: { cacheKey: EXPLORE_CACHE_KEY, schema: SEARCH_SUGGESTIONS_RESPONSE_SCHEMA },
    mealPlanSchema: { cacheKey: MEALPLAN_CACHE_KEY, schema: MEAL_PLAN_RESPONSE_SCHEMA },
    shoppingSchema: { cacheKey: SHOPPING_CACHE_KEY, schema: SHOPPING_LIST_RESPONSE_SCHEMA },
  });
  if (schemaFromCache) return schemaFromCache;

  const text = String(promptText || '');

  if (text.startsWith('Reemplaza "')) {
    return MEAL_OPTIONS_RESPONSE_SCHEMA;
  }

  if (
    text.includes('El usuario busca EXACTAMENTE:') ||
    text.includes('Genera 3 opciones adaptadas a su perfil:') ||
    text.includes('Eres un chef IA. Genera 3 opciones')
  ) {
    return SEARCH_SUGGESTIONS_RESPONSE_SCHEMA;
  }

  if (text.startsWith('Receta completa')) {
    return RECIPE_JSON_SCHEMA;
  }

  return null;
}

export async function callGeminiAPI(promptText, cacheKeyOrEntryKey = null, storeCacheKey = null, options = {}) {
  const useNewMode = storeCacheKey !== null;
  const entryKey = cacheKeyOrEntryKey;
  const { responseSchema = null, temperature = 0.7, maxOutputTokens = null } = normalizeCallGeminiOptions(options);
  const resolvedResponseSchema = responseSchema || inferResponseSchema(promptText, entryKey, storeCacheKey);

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
      temperature,
      responseMimeType: 'application/json',
      ...(resolvedResponseSchema ? { responseSchema: resolvedResponseSchema } : {}),
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
    }
  };

  try {
    const data = await fetchGeminiContent({ kind: 'text', payload });
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) throw new Error('La IA no devolvio texto');
    let parsed;
    try { parsed = normalizeGeminiResponse(JSON.parse(textResult), resolvedResponseSchema); }
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

// ─────────────────────────────────────────────────────────────────────────────
// SUPERMERCADOS POR PAÍS
// ─────────────────────────────────────────────────────────────────────────────
export const SUPERMARKETS_BY_COUNTRY = {
  Chile:        ['Jumbo', 'Líder', 'Tottus', 'Unimarc', 'Santa Isabel', 'Costco', 'GNC / Nutri Express'],
  Argentina:    ['Carrefour', 'Coto', 'Día', 'Disco', 'Jumbo', 'La Anónima', 'Walmart'],
  México:       ['Walmart', 'Soriana', 'Chedraui', 'La Comer', 'City Market', 'Costco', "Sam's Club"],
  Colombia:     ['Éxito', 'Carulla', 'Jumbo', 'Metro', 'D1', 'Ara', 'Olímpica'],
  España:       ['Mercadona', 'Carrefour', 'Lidl', 'Aldi', 'El Corte Inglés', 'Dia', 'Eroski'],
  Perú:         ['Wong', 'Metro', 'Plaza Vea', 'Tottus', 'Vivanda', 'Mass'],
  Uruguay:      ['Disco', 'Géant', 'Tienda Inglesa', 'Devoto', 'El Dorado'],
  Ecuador:      ['Supermaxi', 'Megamaxi', 'Mi Comisariato', 'Gran Akí', 'TIA'],
  Israel:       ['Shufersal', 'Rami Levy', 'Victory', 'Osher Ad', 'Mega', 'Yochananof'],
  'Estados Unidos': ['Walmart', 'Target', 'Costco', 'Whole Foods', "Trader Joe's", 'Kroger', 'Aldi'],
};

export function getSupermarketsForCountry(country) {
  return SUPERMARKETS_BY_COUNTRY[country] || SUPERMARKETS_BY_COUNTRY['Chile'];
}

export function buildSupermarketInstruction(profile) {
  const supers = profile.preferredSupermarkets?.length
    ? profile.preferredSupermarkets
    : profile.preferredSupermarket ? [profile.preferredSupermarket] : [];
  if (!supers.length) return '';
  return `Prioriza marcas disponibles en: ${supers.join(', ')} (${profile.country || 'Chile'}).`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────
export const LOCAL_INGREDIENT_NAMES = {
  Chile:     { fresa: 'frutilla', aguacate: 'palta', calabaza: 'zapallo', maíz: 'choclo', alubia: 'poroto', melocotón: 'durazno', patata: 'papa', cacahuete: 'maní', zumo: 'jugo', nata: 'crema', platano: 'plátano' },
  México:    { palta: 'aguacate', choclo: 'elote', poroto: 'frijol', frutilla: 'fresa', maní: 'cacahuate', zumo: 'jugo' },
  España:    { palta: 'aguacate', choclo: 'maíz', poroto: 'alubias', papa: 'patata', frutilla: 'fresa', maní: 'cacahuete', jugo: 'zumo' },
  Argentina: { aguacate: 'palta', maíz: 'choclo', judía: 'poroto', patata: 'papa', fresa: 'frutilla', melocotón: 'durazno' },
  Colombia:  { palta: 'aguacate', choclo: 'mazorca', poroto: 'fríjol', frutilla: 'fresa' },
};

export const KOSHER_BRANDS_BY_COUNTRY = {
  Chile:    ['Kirkland Signature (Costco)', 'Philadelphia (cert.)', 'Nestlé línea Kosher', 'Empire Kosher (importado)'],
  Israel:   ['Tnuva', 'Strauss', 'Osem', 'Telma', 'Yotvata'],
  Argentina:['Philadelphia', 'Kosher Buenos Aires', 'Lácteos Kosher Arg.'],
  México:   ['Borden Kosher', 'Philadelphia', 'Nestlé certificados'],
  España:   ['Philadelphia', 'Rakusens', 'Carrefour Kosher'],
  'Estados Unidos': ['Kirkland Signature', 'Philadelphia', 'Manischewitz', "Nathan's"],
};

// Marcas con certificación específica Kasher lePésaj
export const PESACH_BRANDS_BY_COUNTRY = {
  Chile:    ['Kedem (importado)', 'Manischewitz (importado)', 'Elite Kasher lePésaj', 'productos con sello "KP" en Costco'],
  Israel:   ['Tnuva KP', 'Osem lePésaj', 'Sugat KP', 'Strauss lePésaj'],
  Argentina:['Productos con sello "KP" o "Kasher lePésaj" de supervisión local (ACILBA/Va\'ad)'],
  'Estados Unidos': ['Manischewitz', 'Streit\'s', 'Kedem', 'Empire Kosher KP', 'Whole Foods KP line'],
  España:   ['Kedem (importado)', 'supervisión Comunidad Judía Madrid'],
};

export const HALAL_BRANDS_BY_COUNTRY = {
  Chile:    ['Sadia Halal', 'Mr. Chicken Halal', 'carnicerías certificadas'],
  Argentina:['La Preferida Halal', 'carnicerías certificadas Buenos Aires'],
  España:   ['Carrefour Halal', 'Mercadona cert. Halal'],
  Colombia: ['Zenú Halal', 'carnicerías certificadas'],
};

export function buildLocaleInstruction(profile) {
  const country = profile.country || 'Chile';
  const lang = profile.language || 'es';
  const langNames = { es: 'español', en: 'inglés', he: 'hebreo', pt: 'portugués', fr: 'francés' };
  const localNames = LOCAL_INGREDIENT_NAMES[country] || {};
  const examples = Object.entries(localNames).slice(0, 2).map(([k, v]) => `"${v}" no "${k}"`).join(', ');
  return `Responde en ${langNames[lang] || 'español'}. Adapta para ${country}.${examples ? ` Usa: ${examples}.` : ''}`;
}

export function buildLocalBrandInstruction(profile) {
  const country = profile.country || 'Chile';
  if (profile.pesachMode) {
    const brands = PESACH_BRANDS_BY_COUNTRY[country] || PESACH_BRANDS_BY_COUNTRY['Chile'];
    return `PÉSAJ: Solo productos con certificación "Kasher lePésaj" (sello KP). En ${country}: ${brands.join(', ')}. Si no hay certeza de certificación KP de una marca, añade el aviso: "⚠️ Verificar sello Kasher lePésaj en el empaque".`;
  }
  if (profile.religiousDiet === 'Kosher') {
    const brands = KOSHER_BRANDS_BY_COUNTRY[country] || KOSHER_BRANDS_BY_COUNTRY['Chile'];
    return `Marcas Kosher en ${country}: ${brands.join(', ')}.`;
  }
  if (profile.religiousDiet === 'Halal') {
    const brands = HALAL_BRANDS_BY_COUNTRY[country] || [];
    return brands.length ? `Marcas Halal en ${country}: ${brands.join(', ')}.` : '';
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO PÉSAJ
// ─────────────────────────────────────────────────────────────────────────────
// Ingredientes prohibidos en Pésaj (Jametz y derivados)
const PESACH_FORBIDDEN_BASE = [
  'harina de trigo', 'harina de cebada', 'harina de centeno', 'harina de avena', 'harina de espelta',
  'harina común', 'harina 000', 'harina 0000',
  'levadura', 'levadura química', 'polvo de hornear', 'bicarbonato de sodio',
  'pan', 'pasta', 'fideos', 'galletas comunes', 'crackers comunes',
  'cerveza', 'whisky', 'bourbon',
];

// Ingredientes prohibidos adicionales si NO consume Kitniot
const KITNIOT_FORBIDDEN = [
  'arroz', 'frijoles', 'lentejas', 'garbanzos', 'porotos', 'soja', 'maíz', 'choclo', 'elote',
  'maní', 'cacahuete', 'cacahuate', 'semillas de sésamo', 'semillas de mostaza',
  'aceite de soja', 'aceite de maravilla', 'aceite de girasol', 'aceite de maíz',
  'harina de maíz', 'almidón de maíz', 'fécula de maíz', 'polenta',
];

// Sustituciones inteligentes para Pésaj
const PESACH_SUBSTITUTIONS = {
  'harina común': 'harina de almendras o fécula de papa (Maizena KP)',
  'harina de trigo': 'harina de almendras, harina de coco o fécula de papa',
  'pan rallado': 'matzá molida (farfel) o almendras molidas',
  'pasta': 'quinoa o fideos de matzá KP',
  'levadura': 'huevos batidos a punto nieve para dar volumen',
  'aceite de girasol': 'aceite de oliva virgen extra KP o aceite de coco KP',
  'aceite de maravilla': 'aceite de oliva virgen extra KP',
  'aceite de soja': 'aceite de oliva KP',
  'maicena / fécula de maíz': 'fécula de papa (Maizena de papa) KP',
  'vinagre blanco': 'vinagre de vino KP',
};

// Construye la instrucción completa de Pésaj para el prompt
export function buildPesachInstruction(profile) {
  if (!profile.pesachMode) return '';

  const kitniot = profile.allowsKitniot;

  const forbiddenList = kitniot
    ? PESACH_FORBIDDEN_BASE
    : [...PESACH_FORBIDDEN_BASE, ...KITNIOT_FORBIDDEN];

  const substitutionsText = Object.entries(PESACH_SUBSTITUTIONS)
    .slice(0, 6)
    .map(([orig, sub]) => `  • ${orig} → ${sub}`)
    .join('\n');

  const kitniotLine = kitniot
    ? 'KITNIOT PERMITIDO: Puedes usar arroz, legumbres, maíz y soja, pero NUNCA los granos leudantes listados arriba.'
    : 'KITNIOT PROHIBIDO: No usar arroz, legumbres (garbanzos, lentejas, frijoles/porotos), maíz, soja ni sus derivados.';

  return `
━━━ MODO PÉSAJ ACTIVO ━━━
JAMETZ PROHIBIDO ESTRICTAMENTE: ${PESACH_FORBIDDEN_BASE.slice(0, 6).join(', ')} y cualquier derivado leudante.
${kitniotLine}
INGREDIENTES COMPLETAMENTE PROHIBIDOS EN ESTA RECETA: ${forbiddenList.join(', ')}.
SUSTITUCIONES OBLIGATORIAS (aplica automáticamente):
${substitutionsText}
IMPORTANTE: Cada ingrediente que pueda generar duda debe incluir el aviso "⚠️ Verificar sello KP en el empaque".
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTRO DE TIEMPO
// ─────────────────────────────────────────────────────────────────────────────
export const TIME_OPTIONS = [
  { value: 'none', label: 'Sin límite',         emoji: '∞',  hint: '' },
  { value: '15',   label: 'Express · 15 min',   emoji: '⚡', hint: 'Sin hornear ni marinar. Máx. 4 ingredientes.' },
  { value: '30',   label: 'Estándar · 30 min',  emoji: '🕐', hint: 'Técnicas básicas. Sin procesos lentos.' },
  { value: '60',   label: 'Elaborado · 60 min', emoji: '🍳', hint: 'Puede incluir horneado o marinado corto.' },
];

export function buildTimeConstraint(maxTime) {
  if (!maxTime || maxTime === 'none') return '';
  const hints = {
    '15': 'Evita horneado, marinados, masas o procesos de más de 15 minutos.',
    '30': 'Evita marinados de más de 20 minutos y horneados lentos.',
    '60': 'Puede incluir horneado breve, pero el total no debe superar 60 minutos.',
  };
  return `TIEMPO MÁXIMO ESTRICTO: La receta DEBE completarse en ${maxTime} minutos totales (preparación + cocción combinados). ${hints[maxTime] || ''}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECCIÓN DE INTENCIÓN Y BÚSQUEDA
// ─────────────────────────────────────────────────────────────────────────────
const LITERAL_SIGNALS = [
  'en airfryer', 'en air fryer', 'al vapor', 'a la plancha', 'al horno',
  'marinado', 'asado', 'gratinado', 'al wok', 'salteado', 'frito',
  'falafel', 'shakshuka', 'ramen', 'pad thai', 'sushi', 'ceviche',
  'hummus', 'guacamole', 'tzatziki', 'chimichurri', 'pesto', 'carbonara',
  'sin ', 'con solo', 'solo con', 'únicamente',
];
const CREATIVE_SIGNALS = [
  'algo', 'ideas', 'sugerencias', 'qué puedo', 'qué hacer', 'opciones',
  'para cenar', 'para almorzar', 'con lo que tengo', 'sorpréndeme', 'antojo',
];

export function detectSearchIntent(query) {
  if (!query?.trim()) return 'creative';
  const q = query.trim().toLowerCase();
  const hasLiteral = LITERAL_SIGNALS.some(s => q.includes(s));
  const hasCreative = CREATIVE_SIGNALS.some(s => q.includes(s));
  if (hasLiteral && !hasCreative) return 'literal';
  if (hasCreative) return 'creative';
  if (q.split(/\s+/).filter(Boolean).length <= 3) return 'literal';
  return 'creative';
}

export function buildSearchPrompt({ query, mode, profileStr, localeStr, supermarketInstruction, brandInstruction, favoritesStr, pesachInstruction, foodPreferenceInstruction = '', guardrailInstruction = '' }) {
  const { favPart, superPart, brandPart, pesachPart, foodPreferencePart, guardrailPart } = buildOptionalPromptParts({
    favoritesStr,
    supermarketInstruction,
    brandInstruction,
    pesachInstruction,
    foodPreferenceInstruction,
    guardrailInstruction,
  });

  if (mode === 'literal') {
    return `${localeStr}
El usuario busca EXACTAMENTE: "${query}".
Perfil: ${profileStr}.${favPart}${foodPreferencePart}${guardrailPart}${superPart}${brandPart}${pesachPart}
MODO LITERAL: Devuelve SOLO la receta exacta pedida. NO añadas acompañamientos ni menús completos. Genera una sola sugerencia exacta y sin variaciones.`;
  }

  return `${localeStr}
El usuario busca: "${query}". Genera 3 opciones adaptadas a su perfil: ${profileStr}.${favPart}${foodPreferencePart}${guardrailPart}${superPart}${brandPart}${pesachPart}
Cada sugerencia debe incluir nombre, tipo y una descripción breve y directa.`;
}

function normalizeRecipeField(nextValue, fallbackValue) {
  if (nextValue === null || nextValue === undefined) return fallbackValue;
  if (typeof nextValue === 'string' && !nextValue.trim()) return fallbackValue;
  if (Array.isArray(nextValue) && nextValue.length === 0) return fallbackValue;
  if (typeof nextValue === 'object' && !Array.isArray(nextValue) && Object.keys(nextValue).length === 0) return fallbackValue;
  return nextValue;
}

function mergeRecipeWithFallback(recipe, refinedRecipe) {
  return {
    ...recipe,
    ...refinedRecipe,
    title: normalizeRecipeField(refinedRecipe?.title, recipe?.title || 'Receta ajustada'),
    description: normalizeRecipeField(refinedRecipe?.description, recipe?.description || ''),
    prepTime: normalizeRecipeField(refinedRecipe?.prepTime, recipe?.prepTime || ''),
    cookTime: normalizeRecipeField(refinedRecipe?.cookTime, recipe?.cookTime || ''),
    cuisine: normalizeRecipeField(refinedRecipe?.cuisine, recipe?.cuisine || ''),
    servings: normalizeRecipeField(refinedRecipe?.servings, recipe?.servings || ''),
    ingredients: normalizeRecipeField(refinedRecipe?.ingredients, recipe?.ingredients || []),
    steps: normalizeRecipeField(refinedRecipe?.steps, recipe?.steps || []),
    tips: normalizeRecipeField(refinedRecipe?.tips, recipe?.tips || ''),
    marcas_sugeridas: normalizeRecipeField(refinedRecipe?.marcas_sugeridas, recipe?.marcas_sugeridas || []),
    macros: {
      ...(recipe?.macros || {}),
      ...(refinedRecipe?.macros || {}),
      calories: normalizeRecipeField(refinedRecipe?.macros?.calories, recipe?.macros?.calories || ''),
      protein: normalizeRecipeField(refinedRecipe?.macros?.protein, recipe?.macros?.protein || ''),
      carbs: normalizeRecipeField(refinedRecipe?.macros?.carbs, recipe?.macros?.carbs || ''),
      fat: normalizeRecipeField(refinedRecipe?.macros?.fat, recipe?.macros?.fat || ''),
      fiber: normalizeRecipeField(refinedRecipe?.macros?.fiber, recipe?.macros?.fiber || ''),
    },
  };
}

export function extractDislikedIngredient(instruction = '') {
  const text = instruction.toLowerCase().trim();
  if (!text) return null;

  const patterns = [
    /(?:sin|quita(?:r)?|saca(?:r)?|elimina(?:r)?|omitir|sin usar)\s+(?:la|el|las|los)?\s*([^,.;\n]+)/i,
    /(?:no me gusta|no quiero|evita(?:r)?)\s+(?:la|el|las|los)?\s*([^,.;\n]+)/i,
    /(?:cambia|reemplaza|sustituye)\s+(?:la|el|las|los)?\s*([^,.;\n]+?)\s+(?:por|con)\s+/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const ingredient = match?.[1]?.trim();
    if (ingredient) {
      return ingredient
        .replace(/^(de|del)\s+/i, '')
        .replace(/\s+(por favor|pls|please)$/i, '')
        .trim();
    }
  }

  return null;
}

export async function refineRecipe(recipe, instruction, profile = {}) {
  if (!recipe) throw new Error('No hay receta para ajustar.');
  if (!instruction?.trim()) throw new Error('Ingresa un ajuste para la receta.');

  profile = withFoodPreferences(profile, profile?.foodPreferences);
  const foodPreferenceInstruction = buildFoodPreferencePromptBlock(profile);
  const guardrailInstruction = buildAbsoluteGuardrail(profile);

  const promptText = `Ajusta la siguiente receta según la instrucción del usuario.
Mantén el mismo idioma de la receta original.
Si el usuario pide quitar o reemplazar ingredientes, actualiza ingredientes, pasos, tiempos y macros para que sean coherentes.
Si detectas ingredientes de la receta que coinciden con alergias o dislikes del usuario, márcalos y devuelve un sustituto inmediato.
${foodPreferenceInstruction ? `${foodPreferenceInstruction}\n` : ''}${guardrailInstruction ? `${guardrailInstruction}\n` : ''}Perfil activo: ${compactProfile(profile) || 'Sin preferencias adicionales'}.

RECETA ACTUAL:
${JSON.stringify(recipe, null, 2)}

INSTRUCCIÓN DEL USUARIO:
${instruction}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.25,
      responseMimeType: 'application/json',
      responseSchema: RECIPE_REFINEMENT_SCHEMA,
    }
  };

  const data = await fetchGeminiContent({ kind: 'text', payload });
  const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResult) throw new Error('La IA no devolvio una receta ajustada.');

  let parsed;
  try {
    parsed = normalizeRecipePayload(JSON.parse(textResult));
  } catch {
    console.error('Respuesta cruda al refinar receta:', textResult);
    throw new Error('La IA devolvio un ajuste invalido. Intenta de nuevo.');
  }

  const mergedRecipe = mergeRecipeWithFallback(recipe, parsed);
  const refinements = Array.isArray(recipe?._refinements) ? recipe._refinements : [];

  return {
    ...mergedRecipe,
    _refinedFrom: recipe?._refinedFrom || recipe?.title || mergedRecipe.title,
    _refinements: [...refinements, { instruction: instruction.trim(), at: new Date().toISOString() }]
  };
}
