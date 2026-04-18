import { describe, expect, it } from 'vitest';

import {
  addRecipeToCollection,
  isRecipeInCollection,
  removeRecipeFromCollection,
} from './recipeCollectionsHelpers.js';

describe('isRecipeInCollection', () => {
  it('detecta título exacto', () => {
    const col = [{ title: 'A' }, { title: 'B' }];
    expect(isRecipeInCollection(col, 'B')).toBe(true);
    expect(isRecipeInCollection(col, 'C')).toBe(false);
  });

  it('maneja colección o título vacío', () => {
    expect(isRecipeInCollection([], 'x')).toBe(false);
    expect(isRecipeInCollection([{ title: 'x' }], '')).toBe(false);
  });
});

describe('removeRecipeFromCollection', () => {
  it('filtra por título', () => {
    const col = [{ title: 'A' }, { title: 'B' }];
    expect(removeRecipeFromCollection(col, 'A')).toEqual([{ title: 'B' }]);
  });

  it('no muta el arreglo original', () => {
    const col = [{ title: 'A' }];
    const out = removeRecipeFromCollection(col, 'A');
    expect(col).toEqual([{ title: 'A' }]);
    expect(out).toEqual([]);
  });
});

describe('addRecipeToCollection', () => {
  it('añade al final', () => {
    const r = { title: 'Nueva' };
    expect(addRecipeToCollection([{ title: 'A' }], r)).toEqual([{ title: 'A' }, r]);
  });
});
