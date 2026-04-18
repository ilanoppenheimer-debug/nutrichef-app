import { describe, expect, it } from 'vitest';

import {
  FLAVOR_OPTIONS,
  INTENT_OPTIONS,
  MEAL_PREP_INTENTS,
  SUGGESTED_INGREDIENTS,
  VALID_FLAVORS,
  VALID_INTENTS,
} from './constants';

describe('cook/constants', () => {
  it('VALID_INTENTS y MEAL_PREP_INTENTS cubren todas las opciones de intención', () => {
    for (const opt of INTENT_OPTIONS) {
      expect(VALID_INTENTS.has(opt.value)).toBe(true);
      expect(MEAL_PREP_INTENTS.has(opt.value)).toBe(true);
    }
  });

  it('VALID_FLAVORS incluye todas las variantes de sabor', () => {
    for (const opt of FLAVOR_OPTIONS) {
      expect(VALID_FLAVORS.has(opt.value)).toBe(true);
    }
  });

  it('SUGGESTED_INGREDIENTS es una lista no vacía de strings', () => {
    expect(SUGGESTED_INGREDIENTS.length).toBeGreaterThan(0);
    expect(SUGGESTED_INGREDIENTS.every((s) => typeof s === 'string' && s.length > 0)).toBe(true);
  });
});
