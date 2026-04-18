import { INTENT_OPTIONS } from '@/lib/cookingOptions';

export { INTENT_OPTIONS };

export const INTENT_STORAGE_KEY = 'nutrichef_plan_intent';

export const VALID_PLAN_INTENTS = new Set(INTENT_OPTIONS.map((o) => o.value));

export const PLAN_OPTIONS = [
  { value: 3, label: '3 días', subtitle: 'Rápido' },
  { value: 5, label: '5 días', subtitle: 'Semana laboral' },
  { value: 7, label: '7 días', subtitle: 'Semana completa' },
] as const;

export const PLAN_PAGE_COPY = {
  title: 'Planifica tu semana',
  subtitle: 'Un plan, una cocción base, varios días resueltos.',
  intentNavLabel: 'Intención',
  loadingPlan: 'Generando plan...',
  ctaPlan: 'Planificar',
  ctaAnotherPlan: 'Generar otro plan',
} as const;
