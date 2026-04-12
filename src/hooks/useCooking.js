import { useState } from 'react';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useCollectionsStore } from '../stores/useCollectionsStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRecipeCache } from './useRecipeCache.js';
import {
  fetchGeminiContent,
  compactProfile,
  buildLocaleInstruction,
  buildAbsoluteGuardrail,
  buildSupermarketInstruction,
  extractJSON,
} from '@/services/gemini.js';

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
    servings: r.servings ? `${r.servings} porciones` : '2 porciones',
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

const COOKING_CHANGE_GUIDANCE = {
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
AJUSTE (NO mencionar): ${changeType} — ${guidance}
Receta previa: ${summarizePreviousRecipe(previousRecipe)}
Ajustar en esa dirección. Preservar lo coherente. No rehacer todo. Resultado debe parecer fresco.
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
    inputsBlock = `\nIngredientes disponibles: ${params.ingredientes}\nUsar SOLO estos + básicos de despensa (sal, aceite, especias). Minimizar extras.`;
  } else {
    throw new Error(`useCooking: modo desconocido "${mode}"`);
  }

  return `${locale}
Resuelve qué cocinar. UNA receta, sin opciones. El usuario NO quiere pensar.

Reglas:
- 1 receta simple, coherente, accionable
- Máx 6–8 ingredientes, máx 5 pasos, lenguaje directo
- Sin marcas comerciales
- NUNCA incluir ingredientes de "Evitar:" en preferencias — reemplazar sin mencionar
- Restricciones absolutas: reemplazar automáticamente sin mencionar

Preferencias: ${profileStr}
Restricciones: ${restrictions}${inputsBlock}

Directriz interna (NO mencionar al usuario):
- Intención: ${intentGuidance}
- Momento: ${timeGuidance}
- Inferir tipo de comida (desayuno/almuerzo/merienda/cena/snack) según hora + intención. No explicar.
${tweakBlock}
SOLO JSON, sin texto adicional.

{"title":"","description":"Por qué es ideal (1 línea corta)","time_minutes":0,"difficulty":"fácil","servings":2,"tags":["tag1"],"nutrition":{"calories":0,"protein":0,"carbs":0,"fat":0},"ingredients":[{"name":"","amount":""}],"steps":["Paso 1"],"tip":"1 sugerencia útil"}`;
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
  const profile = useProfileStore((s) => s.profile);
  const rawSave = useCollectionsStore((s) => s.saveGeneratedRecipe);
  const { user, isLocalMode } = useAuth();
  const saveGeneratedRecipe = (recipe) => rawSave(recipe, user?.uid ?? null, isLocalMode);
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
