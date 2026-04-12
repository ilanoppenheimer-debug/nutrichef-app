import { useState } from 'react';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useRecipeCache } from './useRecipeCache.js';
import {
  fetchGeminiContent,
  compactProfile,
  buildLocaleInstruction,
  buildAbsoluteGuardrail,
  buildSupermarketInstruction,
  extractJSON,
} from '@/services/gemini.js';

// Meal prep plans are less volatile than single recipes — cache for 2 hours
const MEAL_PREP_TTL = 2 * 60 * 60 * 1000;

// Fixed plan length — the user shouldn't think about this
const PLAN_DAYS = 3;

// ── Cache key ─────────────────────────────────────────────────────────────────

function makePlanKey(params, profileSlice) {
  return JSON.stringify({ type: 'mealprep_v6', params, p: profileSlice });
}

// ── Intent → silent guidance ──────────────────────────────────────────────────

const INTENT_GUIDANCE = {
  inspirame: 'Plan equilibrado y accesible. Sin extremos, fácil de ejecutar.',
  proteico:  'Maximiza proteína por porción. Carnes magras, huevos, legumbres.',
  liviano:   'Bajo en calorías. Verduras, ensaladas, proteínas magras.',
  dulce:     'Plan con un componente dulce simple incorporado (desayunos o snacks dulces). Mantén el balance.',
  economico: 'Prioriza ingredientes baratos: huevo, legumbres, arroz, verduras de estación. Evita carnes caras.',
  snack:     'Comidas pequeñas, ligeras y rápidas. Estilo "snacks completos" más que platos grandes.',
};

// ── Directed change → silent adjustment guidance ─────────────────────────────

const CHANGE_GUIDANCE = {
  mas_simple:    'Reducir pasos y preparaciones distintas. Plan más rápido y simple de ejecutar.',
  mas_economico: 'Reemplazar carnes caras por huevo y legumbres. Reducir variedad de ingredientes.',
  mas_proteina:  'Aumentar huevo, pollo y legumbres. Mantener todo simple.',
  sin_carne:     'Eliminar todas las carnes y pescados. Usar legumbres, huevo y lácteos si las preferencias lo permiten.',
  mas_fibra:     'Agregar verduras, legumbres y granos integrales.',
};

// ── Tweak block builder ──────────────────────────────────────────────────────

function summarizePreviousPlan(plan) {
  if (!plan) return '';
  const base = plan.base?.name || '';
  const uses = (plan.uses || []).map(u => `Día ${u.day}: ${u.meal}`).join(' | ');
  const ingredients = (plan.shopping_list || []).slice(0, 12).map(i => i.name).filter(Boolean).join(', ');
  return `- Título: ${plan.title}\n- Base: ${base}\n- Usos: ${uses}\n- Ingredientes: ${ingredients}`;
}

function buildTweakBlock(params, previousPlan) {
  if (!params.change_type || !previousPlan) return '';
  const guidance = CHANGE_GUIDANCE[params.change_type] || '';
  return `
AJUSTE (NO mencionar): ${params.change_type} — ${guidance}
Plan previo: ${summarizePreviousPlan(previousPlan)}
Ajustar en esa dirección. Preservar lo coherente. No rehacer todo. Resultado debe parecer fresco.
`;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildMealPrepPrompt(params, { profileStr, locale, guardrail, superStr }, previousPlan = null) {
  const restrictions = [guardrail, superStr].filter(Boolean).join('\n') || 'Ninguna';
  const intentGuidance = INTENT_GUIDANCE[params.intent] || INTENT_GUIDANCE.inspirame;
  const tweakBlock = buildTweakBlock(params, previousPlan);

  return `${locale}
Resuelve alimentación para ${PLAN_DAYS} días. UNA propuesta, sin opciones. El usuario NO quiere pensar.

CONCEPTO CLAVE: UNA preparación base cocinada en 1 sesión (máx 1–2h) → reutilizada en ${PLAN_DAYS} comidas distintas.
NO generes recetas independientes por día. La base se cocina UNA vez y se varía al servir.

Reglas:
- Mínimos ingredientes, reutilizar al máximo
- Evitar ingredientes que se usen solo una vez
- Sin marcas comerciales
- NUNCA incluir ingredientes de "Evitar:" en preferencias — reemplazar sin mencionar
- Restricciones absolutas: reemplazar automáticamente sin mencionar
- Evitar ingredientes caros o difíciles salvo que el contexto lo justifique

Preferencias: ${profileStr}
Restricciones: ${restrictions}

Directriz interna (NO mencionar):
${intentGuidance}
${tweakBlock}
shopping_list = TODO lo necesario consolidado (base + extras para servir). Sin duplicados.

SOLO JSON, sin texto adicional.

{"title":"Pollo mediterráneo x3","description":"3 días resueltos en 90 min con una sola cocción","total_days":${PLAN_DAYS},"total_time_minutes":90,"base":{"name":"Pollo desmenuzado + arroz + verduras asadas","steps":["Cocinar arroz","Hornear pollo con verduras 40 min","Desmenuzar y dividir en 3 porciones"]},"uses":[{"day":1,"meal":"Bowl caliente","details":"Arroz + pollo + verduras con salsa soja"},{"day":2,"meal":"Ensalada proteica","details":"Pollo frío sobre hojas verdes con vinagreta"},{"day":3,"meal":"Wrap rápido","details":"Tortilla + pollo + verduras + hummus"}}],"shopping_list":[{"name":"pollo","amount":"600g"},{"name":"arroz","amount":"2 tazas"}],"storage":{"containers":3,"instructions":["Refrigerar en recipientes separados"],"duration_days":${PLAN_DAYS}},"nutrition_summary":{"daily_calories":550,"daily_protein":40},"tip":"Congela 1 porción si no la usarás en 2 días"}`;
}

// ── Normalize plan from Gemini ────────────────────────────────────────────────

function normalizePlan(raw) {
  return {
    title: raw.title || 'Plan de meal prep',
    description: raw.description || '',
    total_days: raw.total_days || PLAN_DAYS,
    total_time_minutes: raw.total_time_minutes || 0,
    base: {
      name: raw.base?.name || '',
      steps: Array.isArray(raw.base?.steps) ? raw.base.steps : [],
    },
    uses: Array.isArray(raw.uses) ? raw.uses.map((u, i) => ({
      day: u.day ?? i + 1,
      meal: u.meal || '',
      details: u.details || '',
    })) : [],
    shopping_list: Array.isArray(raw.shopping_list) ? raw.shopping_list : [],
    storage: raw.storage || null,
    nutrition_summary: raw.nutrition_summary || null,
    tip: raw.tip || '',
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useMealPrep — generates ONE decisive 3-day meal prep plan per intent.
 *
 * - generate(params, { previousPlan? }) → Promise<Plan | null>
 * - getPlan(params)                     → Plan | null  (cached, base only)
 * - isLoading(params)                   → boolean
 * - getError(params)                    → string | null
 *
 * Params shape:
 *   { intent: 'inspirame'|'proteico'|'liviano'|'dulce'|'economico'|'snack',
 *     change_type?: 'mas_simple'|'mas_economico'|'mas_proteina'|'sin_carne'|'mas_fibra' }
 *
 * When change_type + previousPlan are both provided, it's a tweak (not cached).
 */
export function useMealPrep() {
  const [plansMap, setPlansMap] = useState({});
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [errors, setErrors] = useState({});
  const profile = useProfileStore((s) => s.profile);
  const cache = useRecipeCache(MEAL_PREP_TTL);

  const _key = (params) => makePlanKey(params, compactProfile(profile).slice(0, 80));

  const generate = async (params, { previousPlan } = {}) => {
    const key = _key(params);
    const isTweak = !!params.change_type && !!previousPlan;

    if (activeKeys.has(key)) return null;

    if (!isTweak) {
      const hit = cache.getCached(key);
      if (hit) {
        setPlansMap(m => ({ ...m, [key]: hit }));
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

      const prompt = buildMealPrepPrompt(
        params,
        { profileStr, locale, guardrail, superStr },
        isTweak ? previousPlan : null
      );
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, responseMimeType: 'application/json' },
      };

      const data = await fetchGeminiContent({ kind: 'text', payload });
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('La IA no devolvió respuesta');

      let parsed;
      try { parsed = JSON.parse(extractJSON(rawText)); }
      catch { throw new Error('Respuesta inesperada — intenta de nuevo'); }

      const raw = parsed?.plan ?? parsed;
      if (!raw?.title && !raw?.base) {
        throw new Error('No se generó plan — intenta de nuevo');
      }

      const plan = normalizePlan(raw);
      if (!isTweak) cache.setCache(key, plan);
      setPlansMap(m => ({ ...m, [key]: plan }));
      return plan;
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.message }));
      return null;
    } finally {
      setActiveKeys(s => { const n = new Set(s); n.delete(key); return n; });
    }
  };

  const getPlan = (params) => plansMap[_key(params)] ?? null;
  const isLoading = (params) => activeKeys.has(_key(params));
  const getError = (params) => errors[_key(params)] ?? null;

  return { generate, getPlan, isLoading, getError };
}
