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

// Meal prep plans are less volatile than single recipes — cache for 2 hours
const MEAL_PREP_TTL = 2 * 60 * 60 * 1000;

// ── JSON extraction ───────────────────────────────────────────────────────────

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

// ── Cache key ─────────────────────────────────────────────────────────────────

function makePlanKey(params, profileSlice) {
  return JSON.stringify({ type: 'mealprep_v1', params, p: profileSlice });
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildMealPrepPrompt(params, { profileStr, locale, guardrail, superStr }) {
  const preferences = [profileStr, guardrail, superStr].filter(Boolean).join('\n');
  const tiempoDisponible = params.tiempoDisponible ?? 'flexible';
  const objetivo = params.objetivo ?? 'equilibrado';

  return `${locale}
Actúa como un experto en meal prep saludable, práctico y realista.

Tu tarea es generar EXACTAMENTE 3 planes de meal prep distintos.

## CONTEXTO DEL USUARIO

Preferencias:
${preferences}

Inputs:
- días: ${params.dias}
- objetivo: ${objetivo}
- tiempo disponible para cocinar: ${tiempoDisponible}

## LÓGICA DE LOS PLANES

1. Plan 1 → ⚡ Rápido y simple (label: "rápido")
2. Plan 2 → ⚖️ Balanceado (label: "balanceado")
3. Plan 3 → 💸 Económico y eficiente (label: "económico")

## REGLAS

- EXACTAMENTE 3 planes distintos entre sí
- Máximo 3 recetas por plan
- Optimizar para cocinar TODO en una sesión
- Compartir ingredientes entre recetas del mismo plan (eficiencia)
- Respetar SIEMPRE las preferencias (kosher, alergias, etc.)
- Recetas realistas — que alguien realmente prepararía
- NO escribir nada fuera del JSON

## FORMATO DE RESPUESTA (JSON OBLIGATORIO)

{"plans":[{"title":"","label":"rápido","total_days":${params.dias},"total_time_minutes":0,"recipes":[{"name":"","portions":0}],"shopping_list":[{"name":"","amount":""}],"prep_plan":["Paso 1"],"storage":{"containers":0,"instructions":["instrucción"],"duration_days":${params.dias}},"nutrition_summary":{"daily_calories":0,"daily_protein":0}}]}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useMealPrep — generates 3 meal prep plans per params combination.
 *
 * - generate(params)     → Promise<Plan[] | null>
 * - getPlans(params)     → Plan[] | null  (null = not yet generated)
 * - isLoading(params)    → boolean
 * - getError(params)     → string | null
 *
 * Params shape:
 *   { dias: string, objetivo: string|null, tiempoDisponible: string|null }
 */
export function useMealPrep() {
  const [plansMap, setPlansMap] = useState({});
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});
  const { profile } = useAppState();
  const cache = useRecipeCache(MEAL_PREP_TTL);

  const _key = (params) => makePlanKey(params, compactProfile(profile).slice(0, 80));

  const generate = async (params) => {
    const key = _key(params);
    if (activeKeys.has(key)) return null;

    // TTL cache hit → no API call
    const hit = cache.getCached(key);
    if (hit) {
      setPlansMap(m => ({ ...m, [key]: hit }));
      return hit;
    }

    setActiveKeys(s => new Set([...s, key]));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });

    try {
      const profileStr = compactProfile(profile);
      const locale = buildLocaleInstruction(profile);
      const guardrail = buildAbsoluteGuardrail(profile);
      const superStr = buildSupermarketInstruction(profile);

      const prompt = buildMealPrepPrompt(params, { profileStr, locale, guardrail, superStr });
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      };

      const data = await fetchGeminiContent({ kind: 'text', payload });
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('La IA no devolvió respuesta');

      let parsed;
      try { parsed = JSON.parse(extractJSON(rawText)); }
      catch { throw new Error('Respuesta inesperada — intenta de nuevo'); }

      const plans = parsed?.plans;
      if (!Array.isArray(plans) || plans.length === 0) {
        throw new Error('No se generaron planes — intenta de nuevo');
      }

      const trimmed = plans.slice(0, 3);
      cache.setCache(key, trimmed);
      setPlansMap(m => ({ ...m, [key]: trimmed }));
      return trimmed;
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.message }));
      return null;
    } finally {
      setActiveKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const getPlans = (params) => plansMap[_key(params)] ?? null;
  const isLoading = (params) => activeKeys.has(_key(params));
  const getError = (params) => errors[_key(params)] ?? null;

  return { generate, getPlans, isLoading, getError };
}
