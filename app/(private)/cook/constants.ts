import { INTENT_OPTIONS } from '@/lib/cookingOptions';

export { INTENT_OPTIONS };

export const VALID_INTENTS = new Set(INTENT_OPTIONS.map((o) => o.value));

/** Intents admitidos para el flujo de meal prep (mismos valores que las opciones de UI). */
export const MEAL_PREP_INTENTS = new Set(INTENT_OPTIONS.map((o) => o.value));

export const INTENT_STORAGE_KEY = 'nutrichef_cook_intent';

export const FLAVOR_OPTIONS = [
  { value: 'any', label: 'Cualquiera' },
  { value: 'dulce', label: '🍬 Dulce' },
  { value: 'salado', label: '🧂 Salado' },
] as const;

export const VALID_FLAVORS = new Set(FLAVOR_OPTIONS.map((o) => o.value));

export const FLAVOR_STORAGE_KEY = 'nutrichef_cook_flavor';

/** Chips sugeridos para la tarjeta "tengo ingredientes". */
export const SUGGESTED_INGREDIENTS = [
  'pollo',
  'arroz',
  'huevo',
  'atún',
  'pasta',
  'tomate',
] as const;
