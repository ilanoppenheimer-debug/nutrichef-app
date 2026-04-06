import { useState } from 'react';
import { useAppState } from '../context/appState.js';
import { useRecipeCache } from './useRecipeCache.js';
import {
  fetchGeminiContent,
  compactProfile,
  buildLocaleInstruction,
  buildAbsoluteGuardrail,
  buildSupermarketInstruction,
} from '../lib/gemini.js';

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

// ── Map Gemini recipe to the format RecipeCard understands ───────────────────

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
    tips: r.tip || `Dificultad: ${r.difficulty || 'fácil'}`,
    marcas_sugeridas: [],
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
  const restrictions = [guardrail, superStr].filter(Boolean).join('\n') || 'Ninguna';
  const tipoLine = params.tipo ? `\nIntención del usuario: quiere algo ${params.tipo}.` : '';

  let goalLine, timeLine, inputsBlock;

  if (mode === 'cookNow') {
    timeLine = params.tiempo || 'flexible';
    goalLine = params.objetivo || 'una receta práctica y nutritiva';
    inputsBlock = `Dificultad deseada: ${params.dificultad}`;
  } else if (mode === 'ingredients') {
    timeLine = 'flexible';
    goalLine = 'aprovechar los ingredientes disponibles';
    inputsBlock = `Ingredientes disponibles: ${params.ingredientes}\nUsa SOLO estos ingredientes (más básicos de despensa como sal, aceite, especias).`;
  } else {
    throw new Error(`useCooking: modo desconocido "${mode}"`);
  }

  return `${locale}
Actúa como un asistente que NO da opciones, sino que toma decisiones por el usuario.

Objetivo: Entregar UNA receta clara, coherente y lista para ejecutar, minimizando cualquier esfuerzo mental.

Reglas clave:
- NO entregues múltiples opciones
- NO sugieras alternativas innecesarias
- NO incluyas productos, marcas ni recomendaciones comerciales
- TODO debe ser directamente útil para cocinar
- Si algún ingrediente no cumple con las restricciones del usuario, reemplázalo automáticamente por una alternativa válida sin mencionarlo

## CONTEXTO DEL USUARIO

Preferencias: ${profileStr}
Restricciones dietarias: ${restrictions}
Objetivo: ${goalLine}
Tiempo disponible: ${timeLine}
${inputsBlock}${tipoLine}

## INSTRUCCIONES

1. Genera UNA receta óptima basada en el contexto
2. Asegúrate de que TODOS los ingredientes respeten las restricciones (ej: kosher = 100% compatible)
3. Prioriza simplicidad, rapidez y coherencia
4. Evita ingredientes difíciles o innecesarios
5. Máximo 6–8 ingredientes
6. Máximo 5 pasos de preparación, lenguaje simple
7. Incluye 1 sugerencia útil (tip)
8. SOLO JSON, sin texto adicional

## FORMATO DE RESPUESTA (JSON OBLIGATORIO)

{"title":"","description":"Por qué es ideal (1 línea corta)","time_minutes":0,"difficulty":"fácil","tags":["tag1"],"nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0},"ingredients":[{"name":"","amount":""}],"steps":["Paso 1"],"tip":"1 sugerencia útil"}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCooking — generates a single decisive recipe per mode/params combination.
 *
 * - generate(mode, params)   → Promise<Recipe | null>
 * - getRecipe(mode, params)  → Recipe | null  (cached result for these params)
 * - isLoading(mode, params)  → boolean
 * - getError(mode, params)   → string | null
 */
export function useCooking() {
  const [options, setOptions] = useState({});   // key → Recipe
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});
  const { profile, saveGeneratedRecipe } = useAppState();
  const cache = useRecipeCache(); // TTL-based cache (1h default)

  const _makeKey = (mode, params) => makeKey(mode, params, compactProfile(profile).slice(0, 80));

  const generate = async (mode, params) => {
    const key = _makeKey(mode, params);

    // Deduplicate in-flight requests for the same key
    if (activeKeys.has(key)) return null;

    // TTL cache hit → no API call
    const hit = cache.getCached(key);
    if (hit) {
      setOptions(o => ({ ...o, [key]: hit }));
      return hit;
    }

    setActiveKeys(s => new Set([...s, key]));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });

    try {
      const profileStr = compactProfile(profile);
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
      try { parsed = JSON.parse(extractJSON(rawText)); }
      catch { throw new Error('Respuesta inesperada — intenta de nuevo'); }

      // Single recipe — support both { recipe: {...} } wrapper and direct object
      const raw = parsed?.recipe ?? parsed;
      if (!raw?.title) throw new Error('No se generó receta — intenta de nuevo');

      const recipe = normalizeCookingRecipe(raw);

      // Persist with TTL
      cache.setCache(key, recipe);

      // Add to history (fire-and-forget)
      if (saveGeneratedRecipe) saveGeneratedRecipe(recipe).catch(() => {});

      setOptions(o => ({ ...o, [key]: recipe }));
      return recipe;
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.message }));
      return null;
    } finally {
      setActiveKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const getRecipe = (mode, params) => options[_makeKey(mode, params)] ?? null;
  const isLoading = (mode, params) => activeKeys.has(_makeKey(mode, params));
  const getError = (mode, params) => errors[_makeKey(mode, params)] ?? null;

  return { generate, getRecipe, isLoading, getError };
}
