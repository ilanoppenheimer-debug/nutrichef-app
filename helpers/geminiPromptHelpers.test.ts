import { describe, expect, it } from 'vitest';

import { buildOptionalPromptParts, inferSchemaByCacheKey } from './geminiPromptHelpers.js';

describe('buildOptionalPromptParts', () => {
  it('devuelve cadenas vacías cuando no hay datos opcionales', () => {
    expect(
      buildOptionalPromptParts({
        favoritesStr: '',
        supermarketInstruction: '',
        brandInstruction: '',
        pesachInstruction: '',
        foodPreferenceInstruction: '',
        guardrailInstruction: '',
      }),
    ).toEqual({
      favPart: '',
      superPart: '',
      brandPart: '',
      pesachPart: '',
      foodPreferencePart: '',
      guardrailPart: '',
    });
  });

  it('concatena cada parte solo si viene contenido', () => {
    const parts = buildOptionalPromptParts({
      favoritesStr: 'pasta, pesto',
      supermarketInstruction: 'Compra en Líder',
      brandInstruction: 'Marcas locales',
      pesachInstruction: 'Modo Pésaj',
      foodPreferenceInstruction: 'Sin nueces',
      guardrailInstruction: 'No médico',
    });

    expect(parts.favPart).toBe(' Le gustan: pasta, pesto.');
    expect(parts.superPart).toBe('\nCompra en Líder');
    expect(parts.brandPart).toBe('\nMarcas locales');
    expect(parts.pesachPart).toBe('\nModo Pésaj');
    expect(parts.foodPreferencePart).toBe('\nSin nueces');
    expect(parts.guardrailPart).toBe('\nNo médico');
  });
});

describe('inferSchemaByCacheKey', () => {
  const recipeSchema = { cacheKey: 'recipe', schema: { type: 'recipe' } };
  const exploreSchema = { cacheKey: 'explore', schema: { type: 'explore' } };
  const mealPlanSchema = { cacheKey: 'plan', schema: { type: 'plan' } };
  const shoppingSchema = { cacheKey: 'shop', schema: { type: 'shop' } };

  it('elige esquema por storeCacheKey', () => {
    expect(
      inferSchemaByCacheKey({
        storeCacheKey: 'plan',
        entryKey: null,
        recipeSchema,
        exploreSchema,
        mealPlanSchema,
        shoppingSchema,
      }),
    ).toEqual({ type: 'plan' });
  });

  it('usa recipe cuando no hay storeCacheKey pero sí entryKey', () => {
    expect(
      inferSchemaByCacheKey({
        storeCacheKey: null,
        entryKey: 'any',
        recipeSchema,
        exploreSchema,
        mealPlanSchema,
        shoppingSchema,
      }),
    ).toEqual({ type: 'recipe' });
  });

  it('devuelve null si no coincide', () => {
    expect(
      inferSchemaByCacheKey({
        storeCacheKey: 'unknown',
        entryKey: null,
        recipeSchema,
        exploreSchema,
        mealPlanSchema,
        shoppingSchema,
      }),
    ).toBeNull();
  });
});
