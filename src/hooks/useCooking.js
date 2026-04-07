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
  return JSON.stringify({ v: 2, mode, params, p: profileSlice });
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

// ── Extract first JSON object/array from a string ─────────────────────────────

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

// ── Intent → silent guidance for the model (never named to the user) ─────────

const INTENT_GUIDANCE = {
  inspirame: 'Sorprende al usuario con algo coherente al momento del día. Prioriza accesibilidad.',
  proteico:  'Maximiza proteína por porción. Carnes magras, huevos, legumbres o lácteos.',
  liviano:   'Bajo en calorías y fácil de digerir. Verduras, ensaladas, proteínas magras.',
  dulce:     'Postre o snack dulce simple, ingredientes accesibles, porción razonable.',
  economico: 'Ingredientes baratos: huevo, legumbres, arroz, verduras de estación. Evita carnes caras.',
  snack:     'Algo pequeño y rápido entre comidas. Mínimo esfuerzo.',
};

// ── Time of day → silent meal-type inference ─────────────────────────────────

const TIME_GUIDANCE = {
  manana:      'Es la mañana del usuario. Sugiere algo apropiado para desayuno.',
  mediodia:    'Es el mediodía. Sugiere comida principal/almuerzo.',
  tarde:       'Es la tarde. Sugiere merienda o snack ligero.',
  noche:       'Es la noche. Sugiere algo para cena (usualmente más liviano y rápido).',
  noche_tarde: 'Es muy tarde en la noche. Sugiere algo ligero, simple y rápido.',
};

// ── Directed-change guidance for cooking tweaks ──────────────────────────────

export const COOKING_CHANGE_GUIDANCE = {
  mas_simple:    'Reducir pasos e ingredientes. Hacerla aún más simple y rápida de ejecutar.',
  mas_economico: 'Reemplazar ingredientes caros por opciones baratas (huevo, legumbres, arroz).',
  mas_proteina:  'Aumentar densidad de proteína (huevo, pollo, legumbres, lácteos).',
  sin_carne:     'Eliminar todas las carnes y pescados. Usar legumbres, huevo y lácteos si las preferencias lo permiten.',
  mas_fibra:     'Agregar verduras, legumbres o granos integrales para subir la fibra.',
};

// ── Tweak block builder ──────────────────────────────────────────────────────

function summarizePreviousRecipe(recipe) {
  if (!recipe) return '';
  const ingredients = (recipe.ingredients || [])
    .map(i => i.nombre)
    .filter(Boolean)
    .slice(0, 10)
    .join(', ');
  return `- Título: ${recipe.title}\n- Ingredientes: ${ingredients}`;
}

function buildTweakBlock(changeType, previousRecipe) {
  if (!changeType || !previousRecipe) return '';
  const guidance = COOKING_CHANGE_GUIDANCE[changeType] || '';
  return `

## AJUSTE DIRIGIDO (instrucción interna, NO mencionar al usuario)

Receta actual del usuario:
${summarizePreviousRecipe(previousRecipe)}

Tipo de ajuste: ${changeType}

Guía:
${guidance}

Reglas del ajuste:
- Ajusta la receta en esa dirección manteniendo simplicidad
- Preserva lo que sea coherente con el ajuste
- NO rehagas todo innecesariamente
- NO menciones que estás ajustando una receta previa
- El resultado debe parecer una receta natural y fresca, no una "versión modificada"
`;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(mode, params, { profileStr, locale, guardrail, superStr }, previousRecipe = null) {
  const restrictions = [guardrail, superStr].filter(Boolean).join('\n') || 'Ninguna';
  const intentGuidance = INTENT_GUIDANCE[params.intent] || INTENT_GUIDANCE.inspirame;
  const timeGuidance = TIME_GUIDANCE[params.time_of_day] || TIME_GUIDANCE.mediodia;
  const tweakBlock = buildTweakBlock(params.change_type, previousRecipe);

  let inputsBlock;
  if (mode === 'cookNow') {
    inputsBlock = '';
  } else if (mode === 'ingredients') {
    inputsBlock = `\nIngredientes disponibles: ${params.ingredientes}\nUsa SOLO estos ingredientes (más básicos de despensa: sal, aceite, especias). Minimiza ingredientes adicionales.`;
  } else {
    throw new Error(`useCooking: modo desconocido "${mode}"`);
  }

  return `${locale}
Actúa como un asistente que toma decisiones por el usuario y resuelve qué cocinar sin esfuerzo.

Objetivo: Entregar UNA receta clara y ejecutable, minimizando cualquier esfuerzo mental.

Reglas clave:
- SIEMPRE entrega UNA sola solución (nunca múltiples opciones)
- TODO debe ser simple, coherente y accionable
- Evita ruido, explicaciones largas o información innecesaria
- NO incluyas marcas ni productos comerciales
- NUNCA incluyas ingredientes que el usuario quiera evitar (ver "Evitar:" en preferencias). Reemplázalos automáticamente sin mencionarlo.
- Si algún ingrediente no cumple con las restricciones, reemplázalo automáticamente sin mencionarlo

## CONTEXTO DEL USUARIO

Preferencias: ${profileStr}
Restricciones dietarias: ${restrictions}${inputsBlock}

## DIRECTRIZ INTERNA (no mencionar al usuario)

Intención: ${intentGuidance}
Momento del día: ${timeGuidance}
Infiere el tipo de comida apropiado (desayuno / almuerzo / merienda / cena / snack) según la hora y la intención. NO preguntes ni expliques esta inferencia, solo aplícala.
${tweakBlock}
## INSTRUCCIONES

1. Genera UNA receta óptima
2. Asegúrate de que TODOS los ingredientes respeten las restricciones
3. Prioriza simplicidad y coherencia
4. Máximo 6–8 ingredientes
5. Máximo 5 pasos de preparación, lenguaje directo
6. Incluye 1 sugerencia útil (tip)
7. SOLO JSON, sin texto adicional

## FORMATO DE RESPUESTA (JSON OBLIGATORIO)

{"title":"","description":"Por qué es ideal (1 línea corta)","time_minutes":0,"difficulty":"fácil","tags":["tag1"],"nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0},"ingredients":[{"name":"","amount":""}],"steps":["Paso 1"],"tip":"1 sugerencia útil"}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCooking — generates ONE decisive recipe per mode/params combination.
 *
 * - generate(mode, params, { previousRecipe? }) → Promise<Recipe | null>
 * - getRecipe(mode, params)                     → Recipe | null  (cached, base only)
 * - isLoading(mode, params)                     → boolean
 * - getError(mode, params)                      → string | null
 *
 * Params shape:
 *   { intent: 'inspirame'|'proteico'|'liviano'|'dulce'|'economico'|'snack',
 *     time_of_day: 'manana'|'mediodia'|'tarde'|'noche'|'noche_tarde',
 *     ingredientes?: string,         // ingredients mode only
 *     change_type?: ... }            // tweak mode
 *
 * When change_type + previousRecipe are provided, it's a tweak (not cached).
 */
export function useCooking() {
  const [options, setOptions] = useState({});
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});
  const { profile, saveGeneratedRecipe } = useAppState();
  const cache = useRecipeCache();

  const _makeKey = (mode, params) => makeKey(mode, params, compactProfile(profile).slice(0, 80));

  const generate = async (mode, params, { previousRecipe } = {}) => {
    const key = _makeKey(mode, params);
    const isTweak = !!params.change_type && !!previousRecipe;

    if (activeKeys.has(key)) return null;

    if (!isTweak) {
      const hit = cache.getCached(key);
      if (hit) {
        setOptions(o => ({ ...o, [key]: hit }));
        return hit;
      }
    }

    setActiveKeys(s => new Set([...s, key]));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });

    try {
      const profileStr = compactProfile(profile);
      const locale = buildLocaleInstruction(profile);
      const guardrail = buildAbsoluteGuardrail(profile);
      const superStr = buildSupermarketInstruction(profile);

      const prompt = buildPrompt(
        mode,
        params,
        { profileStr, locale, guardrail, superStr },
        isTweak ? previousRecipe : null
      );

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

      const raw = parsed?.recipe ?? parsed;
      if (!raw?.title) throw new Error('No se generó receta — intenta de nuevo');

      const recipe = normalizeCookingRecipe(raw);

      if (!isTweak) cache.setCache(key, recipe);

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
