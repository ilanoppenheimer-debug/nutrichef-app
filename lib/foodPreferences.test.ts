import { describe, expect, it } from 'vitest';

import {
  buildFoodPreferencePromptBlock,
  deriveFoodPreferencesFromProfile,
  getDietLabel,
  getFoodPreferenceCacheFragment,
  getFoodPreferenceSummaryLines,
  getPrimaryLegacyDietaryStyle,
  hasActiveFoodPreferences,
  isDietSelected,
  matchesRestriction,
  mergeFoodPreferences,
  mergeLegacyProfileIntoFoodPreferences,
  normalizeDietId,
  normalizeFoodPreferences,
  normalizeRestriction,
  withFoodPreferences,
} from './foodPreferences.js';

describe('normalizeDietId', () => {
  it('devuelve null para vacío o sin coincidencia', () => {
    expect(normalizeDietId('')).toBeNull();
    expect(normalizeDietId('   ')).toBeNull();
    expect(normalizeDietId('dieta inventada')).toBeNull();
  });

  it('normaliza por id, label, legacyStyle o alias', () => {
    expect(normalizeDietId('keto')).toBe('keto');
    expect(normalizeDietId('KETO')).toBe('keto');
    expect(normalizeDietId('Vegana')).toBe('vegan');
    expect(normalizeDietId('alta en proteina')).toBe('high_protein');
  });
});

describe('getDietLabel', () => {
  it('usa la etiqueta conocida o devuelve el id', () => {
    expect(getDietLabel('keto')).toBe('Keto');
    expect(getDietLabel('desconocido')).toBe('desconocido');
  });
});

describe('normalizeRestriction', () => {
  it('resuelve alias a canónico', () => {
    expect(normalizeRestriction('sin gluten')).toBe('Sin Gluten');
    expect(normalizeRestriction('PEANUT FREE')).toBe('Alergia al Maní');
  });

  it('humaniza texto libre sin alias', () => {
    expect(normalizeRestriction('  frutos secos  ')).toBe('Frutos secos');
  });
});

describe('normalizeFoodPreferences', () => {
  it('deduplica dietas y restricciones', () => {
    const out = normalizeFoodPreferences({
      kosher: true,
      diets: ['keto', 'Keto', 'vegan'],
      restrictions: ['Sin Gluten', 'sin gluten'],
    } as never);
    expect(out.kosher).toBe(true);
    expect(out.diets).toEqual(['keto', 'vegan']);
    expect(out.restrictions).toEqual(['Sin Gluten']);
  });
});

describe('hasActiveFoodPreferences', () => {
  it('detecta kosher, dietas o restricciones', () => {
    expect(hasActiveFoodPreferences({ kosher: false, diets: [], restrictions: [] })).toBe(false);
    expect(hasActiveFoodPreferences({ kosher: true, diets: [], restrictions: [] })).toBe(true);
    expect(hasActiveFoodPreferences({ kosher: false, diets: ['keto'], restrictions: [] })).toBe(
      true,
    );
    expect(
      hasActiveFoodPreferences({ kosher: false, diets: [], restrictions: ['Sin Gluten'] }),
    ).toBe(true);
  });
});

describe('getPrimaryLegacyDietaryStyle', () => {
  it('prioriza el primer estilo legacy mapeado', () => {
    expect(getPrimaryLegacyDietaryStyle({ diets: ['vegan', 'keto'] })).toBe('Vegana');
    expect(getPrimaryLegacyDietaryStyle({ diets: ['keto'] })).toBe('Keto');
    expect(getPrimaryLegacyDietaryStyle({ diets: [] })).toBe('Ninguna');
  });
});

describe('isDietSelected', () => {
  it('lee desde foodPreferences anidado o objeto plano', () => {
    expect(isDietSelected({ foodPreferences: { diets: ['keto'] } }, 'keto')).toBe(true);
    expect(isDietSelected({ diets: ['keto'] }, 'vegan')).toBe(false);
  });
});

describe('matchesRestriction', () => {
  it('compara patrones normalizados', () => {
    const src = { foodPreferences: { restrictions: ['Sin Gluten'], diets: [], kosher: false } };
    expect(matchesRestriction(src, ['gluten'])).toBe(true);
    expect(matchesRestriction(src, ['lacteos'])).toBe(false);
    expect(matchesRestriction(src, [])).toBe(false);
  });
});

describe('deriveFoodPreferencesFromProfile', () => {
  it('mapea kosher, dieta y alergias', () => {
    const out = deriveFoodPreferencesFromProfile({
      religiousDiet: 'Kosher',
      pesachMode: false,
      dietaryStyle: 'Vegana',
      allergies: ['Sin Gluten'],
    });
    expect(out.kosher).toBe(true);
    expect(out.diets).toContain('vegan');
    expect(out.restrictions).toContain('Sin Gluten');
  });
});

describe('mergeFoodPreferences', () => {
  it('une kosher, dietas y restricciones', () => {
    const out = mergeFoodPreferences(
      { kosher: false, diets: ['keto'], restrictions: [] },
      { kosher: true, diets: ['vegan'], restrictions: ['Sin Gluten'] },
    );
    expect(out.kosher).toBe(true);
    expect(out.diets).toEqual(expect.arrayContaining(['vegan', 'keto']));
    expect(out.restrictions).toContain('Sin Gluten');
  });
});

describe('getFoodPreferenceSummaryLines', () => {
  it('lista kosher, dietas y restricciones sin duplicar', () => {
    const lines = getFoodPreferenceSummaryLines({
      foodPreferences: {
        kosher: true,
        diets: ['keto'],
        restrictions: ['Sin Gluten'],
      },
    });
    expect(lines).toContain('Kosher');
    expect(lines).toContain('Keto');
    expect(lines).toContain('Sin Gluten');
  });
});

describe('buildFoodPreferencePromptBlock', () => {
  it('devuelve vacío sin preferencias activas', () => {
    expect(buildFoodPreferencePromptBlock({ foodPreferences: { kosher: false, diets: [], restrictions: [] } })).toBe(
      '',
    );
  });

  it('incluye encabezado y viñetas cuando hay líneas', () => {
    const block = buildFoodPreferencePromptBlock({
      foodPreferences: { kosher: true, diets: [], restrictions: [] },
    });
    expect(block).toContain('PREFERENCIAS ALIMENTARIAS OBLIGATORIAS');
    expect(block).toContain('- Kosher');
  });
});

describe('getFoodPreferenceCacheFragment', () => {
  it('expone kosher, dietas y restricciones normalizadas', () => {
    expect(
      getFoodPreferenceCacheFragment({
        foodPreferences: { kosher: true, diets: ['keto'], restrictions: ['Sin Gluten'] },
      }),
    ).toEqual({ kosher: true, diets: ['keto'], restrictions: ['Sin Gluten'] });
  });
});

describe('mergeLegacyProfileIntoFoodPreferences', () => {
  it('toma kosher y restricciones del legado y reemplaza dietas legacy por las del legado', () => {
    const out = mergeLegacyProfileIntoFoodPreferences(
      { kosher: false, diets: ['keto', 'high_protein'], restrictions: ['Sin Gluten'] },
      { kosher: true, diets: ['vegan'], restrictions: ['Sin Soya'] },
    );
    expect(out.kosher).toBe(true);
    expect(out.diets).toContain('vegan');
    expect(out.diets).toContain('high_protein');
    expect(out.restrictions).toEqual(['Sin Soya']);
  });
});

describe('withFoodPreferences', () => {
  it('sin preferencias explícitas deriva solo del perfil', () => {
    const out = withFoodPreferences({
      dietaryStyle: 'Vegana',
      religiousDiet: 'Ninguna',
      allergies: [],
      pesachMode: false,
    });
    expect(out.foodPreferences.diets).toContain('vegan');
    expect(out.dietaryStyle).toBe('Vegana');
  });

  it('fusiona preferencias explícitas con el perfil y une alergias con restricciones', () => {
    const out = withFoodPreferences(
      {
        religiousDiet: 'Halal',
        dietaryStyle: 'Ninguna',
        allergies: ['Alergia a Mariscos'],
        pesachMode: false,
      },
      { kosher: false, diets: ['keto'], restrictions: ['Sin Gluten'] } as never,
    );
    expect(out.foodPreferences.diets).toContain('keto');
    expect(out.religiousDiet).toBe('Halal');
    expect(out.allergies).toEqual(expect.arrayContaining(['Alergia a Mariscos', 'Sin Gluten']));
  });

  it('fija religiousDiet a Kosher cuando las preferencias fusionadas son kosher', () => {
    const out = withFoodPreferences(
      { religiousDiet: 'Halal', dietaryStyle: 'Ninguna', allergies: [] },
      { kosher: true, diets: [], restrictions: [] } as never,
    );
    expect(out.religiousDiet).toBe('Kosher');
    expect(out.foodPreferences.kosher).toBe(true);
  });
});
