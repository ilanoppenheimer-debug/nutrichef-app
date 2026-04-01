import { useState } from 'react';
import { useAppState } from '../context/appState.js';
import {
  callGeminiAPI,
  compactProfile,
  buildLocaleInstruction,
  buildAbsoluteGuardrail,
  buildSupermarketInstruction,
  buildLocalBrandInstruction,
  RECIPE_JSON_SCHEMA,
} from '../lib/gemini.js';

// Isolated localStorage bucket for this screen — keeps it separate from
// generator/explore caches so flushes don't interfere.
const COOKING_CACHE_KEY = 'cooking_home_cache';

// Stable string key from mode + params (used as both React state key AND part
// of the Gemini cache key).
function makeKey(mode, params) {
  return `${mode}||${JSON.stringify(params)}`;
}

function buildPrompt(mode, params, { profileStr, locale, guardrail, superStr, brandStr }) {
  const extra = [guardrail, superStr, brandStr].filter(Boolean).join('\n');

  if (mode === 'cookNow') {
    const { tiempo, dificultad, objetivo } = params;
    return `${locale}
Sugiere UNA receta ideal para cocinar AHORA MISMO.
Tiempo disponible: ${tiempo}. Dificultad deseada: ${dificultad}.${objetivo ? ` Objetivo nutricional: ${objetivo}.` : ''}
Perfil del usuario: ${profileStr}.${extra ? `\n${extra}` : ''}
Devuelve SOLO este JSON (sin texto adicional):
${RECIPE_JSON_SCHEMA}`;
  }

  if (mode === 'ingredients') {
    const { ingredientes } = params;
    return `${locale}
El usuario tiene estos ingredientes disponibles: ${ingredientes}.
Sugiere UNA receta creativa y realista que pueda preparar con lo que tiene (puede asumir sal, aceite, condimentos básicos).
Perfil del usuario: ${profileStr}.${extra ? `\n${extra}` : ''}
Devuelve SOLO este JSON (sin texto adicional):
${RECIPE_JSON_SCHEMA}`;
  }

  if (mode === 'mealPrep') {
    const { dias, objetivo } = params;
    return `${locale}
Genera UNA receta de meal prep en lote para cubrir ${dias} días de comidas.
La receta debe: cocinarse una vez, rendir ~${Number(dias) * 2} porciones, conservarse bien en frío y ser fácil de recalentar.${objetivo ? ` Objetivo nutricional: ${objetivo}.` : ''}
Perfil del usuario: ${profileStr}.${extra ? `\n${extra}` : ''}
Devuelve SOLO este JSON (sin texto adicional):
${RECIPE_JSON_SCHEMA}`;
  }

  throw new Error(`useCooking: modo desconocido "${mode}"`);
}

/**
 * Hook for CookingHome — handles generation, deduplication, and per-params caching.
 *
 * Usage:
 *   const { generate, getResult, isLoading, getError } = useCooking();
 *
 *   // generate returns the recipe or null on error
 *   const recipe = await generate('cookNow', { tiempo, dificultad, objetivo });
 *
 *   // check cached result for the current param combination
 *   const cached = getResult('cookNow', { tiempo, dificultad, objetivo });
 */
export function useCooking() {
  const { profile, saveGeneratedRecipe } = useAppState();

  // Keyed by makeKey(mode, params) — multiple results can coexist
  const [results, setResults] = useState({});
  // Set of active keys prevents double-submitting the same config
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});

  const generate = async (mode, params) => {
    const key = makeKey(mode, params);

    // Already in-flight for this exact config → skip
    if (activeKeys.has(key)) return null;

    setActiveKeys(s => new Set([...s, key]));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });

    try {
      const profileStr = compactProfile(profile);
      const locale = buildLocaleInstruction(profile);
      const guardrail = buildAbsoluteGuardrail(profile);
      const superStr = buildSupermarketInstruction(profile);
      const brandStr = buildLocalBrandInstruction(profile);

      const prompt = buildPrompt(mode, params, { profileStr, locale, guardrail, superStr, brandStr });

      // Cache key includes profile slice so different users get different results
      const cacheKey = JSON.stringify({ mode, params, p: profileStr.slice(0, 80) });

      const result = await callGeminiAPI(prompt, cacheKey, COOKING_CACHE_KEY);

      // Persist to history (fire-and-forget, never block UX)
      if (saveGeneratedRecipe) saveGeneratedRecipe(result).catch(() => {});

      setResults(r => ({ ...r, [key]: result }));
      return result;
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.message }));
      return null;
    } finally {
      setActiveKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const getResult = (mode, params) => results[makeKey(mode, params)] ?? null;
  const isLoading = (mode, params) => activeKeys.has(makeKey(mode, params));
  const getError = (mode, params) => errors[makeKey(mode, params)] ?? null;

  return { generate, getResult, isLoading, getError };
}
