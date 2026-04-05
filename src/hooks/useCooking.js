import { useState } from 'react';
import { useAppState } from '../context/appState.js';
import {
  fetchGeminiContent,
  compactProfile,
  buildLocaleInstruction,
  buildAbsoluteGuardrail,
  buildSupermarketInstruction,
  readStoredJson,
  writeStoredJson,
} from '../lib/gemini.js';

// Isolated cache bucket — separate from generator/explore caches
const COOKING_CACHE_KEY = 'cooking_home_cache_v1';

// ── Stable key per mode + params + profile slice ─────────────────────────────

function makeKey(mode, params, profileSlice) {
  return JSON.stringify({ mode, params, p: profileSlice });
}

// ── Parse raw amount string → {cantidad, unidad} ──────────────────────────────

function parseAmount(amount = '') {
  const m = String(amount).match(/^([\d.,/]+)\s*(.*)$/);
  if (m) return { cantidad: m[1], unidad: m[2].trim() };
  return { cantidad: '', unidad: amount };
}

// ── Map the new 3-recipe schema to the format RecipeCard understands ──────────

function normalizeCookingRecipe(r) {
  return {
    title: r.title || 'Receta',
    description: r.description || '',
    prepTime: r.time_minutes ? `${r.time_minutes} min` : '—',
    cookTime: '',
    cuisine: r.tags?.[0] || 'Saludable',
    servings: '2 porciones',
    ingredients: (r.ingredients || []).map(ing => {
      const { cantidad, unidad } = parseAmount(ing.amount);
      return {
        cantidad,
        unidad,
        nombre: ing.name || '',
        isDislike: false,
        allergyAlert: false,
        suggestedSubstitute: '',
        marca_sugerida: '',
      };
    }),
    steps: r.steps || [],
    macros: {
      calories: r.nutrition?.calories != null ? `${r.nutrition.calories} kcal` : '—',
      protein: r.nutrition?.protein != null ? `${r.nutrition.protein}g` : '—',
      carbs: r.nutrition?.carbs != null ? `${r.nutrition.carbs}g` : '—',
      fat: r.nutrition?.fat != null ? `${r.nutrition.fat}g` : '—',
      fiber: '—',
    },
    tips: `Dificultad: ${r.difficulty || 'fácil'}`,
    marcas_sugeridas: [],
    // Extra fields for option cards
    _difficulty: r.difficulty || 'fácil',
    _time_minutes: r.time_minutes ?? null,
    _tags: r.tags || [],
  };
}

// ── Extract first JSON object/array from a string (handles markdown wrappers) ─

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(mode, params, { profileStr, locale, guardrail, superStr }) {
  const preferences = [profileStr, guardrail, superStr].filter(Boolean).join('\n');

  let modeLabel, inputsBlock;

  if (mode === 'cookNow') {
    modeLabel = 'quick';
    inputsBlock = `Tiempo disponible: ${params.tiempo}\nDificultad deseada: ${params.dificultad}${params.objetivo ? `\nObjetivo nutricional: ${params.objetivo}` : ''}`;
  } else if (mode === 'ingredients') {
    modeLabel = 'ingredients';
    inputsBlock = `Ingredientes disponibles: ${params.ingredientes}`;
  } else if (mode === 'mealPrep') {
    modeLabel = 'mealprep';
    inputsBlock = `Días a cubrir: ${params.dias}${params.objetivo ? `\nObjetivo nutricional: ${params.objetivo}` : ''}\nCada receta debe rendir ~${Number(params.dias) * 2} porciones y conservarse bien en frío.`;
  } else {
    throw new Error(`useCooking: modo desconocido "${mode}"`);
  }

  return `${locale}
Actúa como un chef experto en cocina saludable.

Tu tarea es generar EXACTAMENTE 3 recetas distintas basadas en los siguientes criterios.

## CONTEXTO DEL USUARIO

- Preferencias alimenticias: ${preferences}
- Modo: ${modeLabel}
- Inputs:
${inputsBlock}

## LÓGICA DE LAS 3 OPCIONES

1. Opción 1 → rápida y simple
2. Opción 2 → balanceada (mejor nutrición)
3. Opción 3 → alternativa (más creativa o distinta)

## REGLAS

- EXACTAMENTE 3 recetas (ni más ni menos)
- Ingredientes principales distintos en cada opción
- Máx 6–8 ingredientes por receta
- Máx 5–6 pasos por receta
- Respetar SIEMPRE las preferencias (kosher, alergias, etc.)
- SOLO JSON, sin texto adicional

## FORMATO DE RESPUESTA (JSON OBLIGATORIO)

{"recipes":[{"title":"","description":"","time_minutes":0,"difficulty":"fácil","tags":["tag1"],"nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0},"ingredients":[{"name":"","amount":""}],"steps":["Paso 1"]}]}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCooking — generates 3 recipe options per mode/params combination.
 *
 * - generate(mode, params)     → Promise<Recipe[] | null>
 * - getOptions(mode, params)   → Recipe[] | null  (cached result for these params)
 * - isLoading(mode, params)    → boolean
 * - getError(mode, params)     → string | null
 */
export function useCooking() {
  const [options, setOptions] = useState({});   // key → Recipe[]
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});
  const { profile, saveGeneratedRecipe } = useAppState();

  const generate = async (mode, params) => {
    const profileStr = compactProfile(profile);
    const key = makeKey(mode, params, profileStr.slice(0, 80));

    // Prevent duplicate in-flight requests
    if (activeKeys.has(key)) return null;

    // Check localStorage cache
    const cache = readStoredJson(COOKING_CACHE_KEY, {});
    if (cache[key]) {
      setOptions(o => ({ ...o, [key]: cache[key] }));
      return cache[key];
    }

    setActiveKeys(s => new Set([...s, key]));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });

    try {
      const locale = buildLocaleInstruction(profile);
      const guardrail = buildAbsoluteGuardrail(profile);
      const superStr = buildSupermarketInstruction(profile);

      const prompt = buildPrompt(mode, params, { profileStr, locale, guardrail, superStr });

      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75, responseMimeType: 'application/json' },
      };

      const data = await fetchGeminiContent({ kind: 'text', payload });
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('La IA no devolvió respuesta');

      let parsed;
      try {
        parsed = JSON.parse(extractJSON(rawText));
      } catch {
        throw new Error('Respuesta inesperada — intenta de nuevo');
      }

      const recipes = parsed?.recipes;
      if (!Array.isArray(recipes) || recipes.length === 0) {
        throw new Error('No se generaron recetas — intenta de nuevo');
      }

      const normalized = recipes.slice(0, 3).map(normalizeCookingRecipe);

      // Persist to localStorage
      const updated = { ...readStoredJson(COOKING_CACHE_KEY, {}), [key]: normalized };
      writeStoredJson(COOKING_CACHE_KEY, updated);

      // Save first recipe to history (fire-and-forget)
      if (saveGeneratedRecipe) {
        normalized.forEach(r => saveGeneratedRecipe(r).catch(() => {}));
      }

      setOptions(o => ({ ...o, [key]: normalized }));
      return normalized;
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.message }));
      return null;
    } finally {
      setActiveKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const getOptions = (mode, params) => {
    const profileStr = compactProfile(profile);
    const key = makeKey(mode, params, profileStr.slice(0, 80));
    return options[key] ?? null;
  };

  const isLoading = (mode, params) => {
    const profileStr = compactProfile(profile);
    const key = makeKey(mode, params, profileStr.slice(0, 80));
    return activeKeys.has(key);
  };

  const getError = (mode, params) => {
    const profileStr = compactProfile(profile);
    const key = makeKey(mode, params, profileStr.slice(0, 80));
    return errors[key] ?? null;
  };

  return { generate, getOptions, isLoading, getError };
}
