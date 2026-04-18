import { describe, expect, it } from 'vitest';

import {
  annotateIngredientEntry,
  annotateRecipeIngredients,
  applyShoppingListSafetySwaps,
  getAllergyTerms,
  inferIngredientSubstitute,
  mergeUniqueTerms,
  normalizeIngredientEntry,
  normalizeIngredientText,
  normalizeRecipePayload,
  splitFreeTextTerms,
} from './ingredientIntelligence.js';

describe('normalizeIngredientText', () => {
  it('normaliza acentos y signos', () => {
    expect(normalizeIngredientText('  Cebolla,  Ajo!  ')).toBe('cebolla ajo');
  });
});

describe('splitFreeTextTerms', () => {
  it('separa por coma, punto y coma o salto de línea', () => {
    expect(splitFreeTextTerms('a, b;\nc')).toEqual(['a', 'b', 'c']);
  });
});

describe('mergeUniqueTerms', () => {
  it('evita duplicados por texto normalizado', () => {
    expect(mergeUniqueTerms(['Huevo'], 'huevo, leche')).toEqual(['Huevo', 'leche']);
  });
});

describe('getAllergyTerms', () => {
  it('expande alergias conocidas y deduplica', () => {
    const terms = getAllergyTerms(['Sin Gluten', 'Sin Gluten']);
    expect(terms).toContain('gluten');
    expect(new Set(terms).size).toBe(terms.length);
  });
});

describe('inferIngredientSubstitute', () => {
  it('encuentra sustituto por palabra clave', () => {
    expect(inferIngredientSubstitute('Cilantro fresco', '')).toContain('Perejil');
    expect(inferIngredientSubstitute('xyz', '')).toBe('');
  });
});

describe('normalizeIngredientEntry', () => {
  it('acepta string como nombre', () => {
    expect(normalizeIngredientEntry('Arroz')).toMatchObject({
      name: 'Arroz',
      amount: '',
      isDislike: false,
      allergyAlert: false,
    });
  });

  it('unifica campos en español e inglés', () => {
    expect(
      normalizeIngredientEntry({
        nombre: 'Tomate',
        cantidad: '2',
        unidad: 'ud',
        sustituto: 'Sust A',
      }),
    ).toMatchObject({
      name: 'Tomate',
      amount: '2 ud',
      substitute: 'Sust A',
      suggestedSubstitute: 'Sust A',
    });
  });
});

describe('normalizeRecipePayload', () => {
  it('devuelve no-objetos tal cual', () => {
    expect(normalizeRecipePayload(null)).toBeNull();
    expect(normalizeRecipePayload('x')).toBe('x');
  });

  it('mapea títulos, ingredientes y pasos en español', () => {
    const out = normalizeRecipePayload({
      titulo: 'Pollo',
      ingredientes: [{ nombre: 'Pollo', cantidad: '500', unidad: 'g' }],
      pasos: ['Cocinar', { texto: 'Servir' }],
    });
    expect(out.title).toBe('Pollo');
    expect(out.ingredients[0]).toMatchObject({ name: 'Pollo', amount: '500 g' });
    expect(out.steps).toEqual(['Cocinar', 'Servir']);
  });
});

describe('annotateIngredientEntry', () => {
  it('marca dislike cuando el nombre coincide', () => {
    const out = annotateIngredientEntry({ name: 'cilantro fresco' }, { dislikes: ['cilantro'], allergies: [] });
    expect(out.isDislike).toBe(true);
  });

  it('marca alergia cuando el nombre coincide con términos de la alergia', () => {
    const out = annotateIngredientEntry({ name: 'pan de trigo' }, { allergies: ['Sin Gluten'], dislikes: [] });
    expect(out.allergyAlert).toBe(true);
  });
});

describe('annotateRecipeIngredients', () => {
  it('cuenta flags en ingredientes', () => {
    const { dislikeCount, allergyCount, flaggedCount, ingredients } = annotateRecipeIngredients(
      {
        ingredients: [{ name: 'cilantro' }, { name: 'pan' }],
      },
      { dislikes: ['cilantro'], allergies: ['Sin Gluten'] },
    );
    expect(ingredients).toHaveLength(2);
    expect(dislikeCount).toBeGreaterThanOrEqual(1);
    expect(allergyCount).toBeGreaterThanOrEqual(1);
    expect(flaggedCount).toBe(dislikeCount + allergyCount);
  });
});

describe('applyShoppingListSafetySwaps', () => {
  it('devuelve la lista sin cambios si no hay categorías', () => {
    expect(applyShoppingListSafetySwaps(null)).toBeNull();
    expect(applyShoppingListSafetySwaps({ title: 'x' })).toEqual({ title: 'x' });
  });

  it('sustituye ítems string marcados y conserva los seguros', () => {
    const profile = { allergies: ['Sin Gluten'], dislikes: [] };
    const out = applyShoppingListSafetySwaps(
      {
        categories: [{ name: 'Despensa', items: ['pan', 'arroz integral'] }],
      },
      profile,
    );
    const items = out.categories[0].items;
    expect(typeof items[0]).toBe('string');
    expect(items[0]).not.toBe('pan');
    expect(items[1]).toBe('arroz integral');
  });

  it('enriquece objetos con sustituto y nota de seguridad', () => {
    const profile = { allergies: ['Sin Gluten'], dislikes: [] };
    const out = applyShoppingListSafetySwaps(
      {
        categories: [
          {
            name: 'Panadería',
            items: [{ name: 'pan de molde', budgetTip: 'Oferta' }],
          },
        ],
      },
      profile,
    );
    const item = out.categories[0].items[0] as { name: string; substituteFor: string; budgetTip: string };
    expect(item.substituteFor).toBe('pan de molde');
    expect(item.name).not.toBe('pan de molde');
    expect(item.budgetTip).toContain('Sustituido por seguridad');
  });
});
