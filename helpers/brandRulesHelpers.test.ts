import { describe, expect, it } from 'vitest';

import {
  resolveLifestyleChecks,
  resolveRelevantBrandCategories,
  resolveReligiousChecks,
} from './brandRulesHelpers.js';

describe('resolveReligiousChecks', () => {
  it('vacío si no aplica restricción religiosa ni pésaj', () => {
    expect(resolveReligiousChecks({ pesachMode: false, religiousDiet: 'Ninguna' })).toEqual([]);
  });

  it('incluye pésaj, kosher y halal según perfil', () => {
    expect(
      resolveReligiousChecks({ pesachMode: true, religiousDiet: 'Ninguna' }).map((c) => c.key),
    ).toEqual(['kosherPassover']);

    expect(
      resolveReligiousChecks({ pesachMode: false, religiousDiet: 'Kosher' }).map((c) => c.key),
    ).toEqual(['kosher']);

    expect(
      resolveReligiousChecks({ pesachMode: false, religiousDiet: 'Halal' }).map((c) => c.key),
    ).toEqual(['halal']);
  });

  it('puede combinar pésaj con kosher explícito', () => {
    const keys = resolveReligiousChecks({ pesachMode: true, religiousDiet: 'Kosher' }).map(
      (c) => c.key,
    );
    expect(keys).toContain('kosherPassover');
    expect(keys).toContain('kosher');
  });
});

describe('resolveLifestyleChecks', () => {
  it('prioriza vegano sobre vegetariano', () => {
    const profile = {
      dietaryStyle: 'Vegana',
      foodPreferences: { diets: [], restrictions: [] },
    };
    expect(resolveLifestyleChecks(profile)).toEqual([{ key: 'vegan', label: 'Vegano' }]);
  });

  it('vegetariano si no es vegano explícito', () => {
    const profile = {
      dietaryStyle: 'Vegetariana',
      foodPreferences: { diets: [], restrictions: [] },
    };
    expect(resolveLifestyleChecks(profile)).toEqual([
      { anyOf: ['vegetarian', 'vegan'], label: 'Vegetariano' },
    ]);
  });

  it('vacío si no hay estilo vegetal', () => {
    expect(
      resolveLifestyleChecks({
        dietaryStyle: 'Keto',
        foodPreferences: { diets: [], restrictions: [] },
      }),
    ).toEqual([]);
  });
});

describe('resolveRelevantBrandCategories', () => {
  it('deduplica y agrega categorías esperadas', () => {
    const profile = {
      pesachMode: true,
      religiousDiet: 'Kosher',
      dietaryStyle: 'Vegana',
      sportType: 'Fuerza/Powerlifting',
      useProteinPowder: false,
      foodPreferences: { diets: [], restrictions: [] },
    };
    expect(resolveRelevantBrandCategories(profile)).toEqual(
      expect.arrayContaining(['pesach', 'kosher', 'vegan', 'powerlifting']),
    );
    expect(new Set(resolveRelevantBrandCategories(profile)).size).toBe(
      resolveRelevantBrandCategories(profile).length,
    );
  });
});
