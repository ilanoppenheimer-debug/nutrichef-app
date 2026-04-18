import { describe, expect, it, vi } from 'vitest';

import { resolveRecipeSheetState } from './cookingViewHelpers.js';

describe('resolveRecipeSheetState', () => {
  it('sin receta activa no ofrece tweak', () => {
    const onCook = vi.fn();
    const onIng = vi.fn();
    expect(
      resolveRecipeSheetState({
        viewingRecipe: null,
        currentCookNowRecipe: {},
        currentIngredientsRecipe: {},
        handleCookNowTweak: onCook,
        handleIngredientsTweak: onIng,
        cookNowTweakingType: 'x',
        ingredientsTweakingType: 'y',
      }),
    ).toEqual({ onTweak: null, tweakingType: null });
  });

  it('asocia tweak de cook now cuando la hoja es la receta actual', () => {
    const recipe = { id: 'r1' };
    const onCook = vi.fn();
    const onIng = vi.fn();
    expect(
      resolveRecipeSheetState({
        viewingRecipe: recipe,
        currentCookNowRecipe: recipe,
        currentIngredientsRecipe: null,
        handleCookNowTweak: onCook,
        handleIngredientsTweak: onIng,
        cookNowTweakingType: 'más_rápido',
        ingredientsTweakingType: null,
      }),
    ).toEqual({ onTweak: onCook, tweakingType: 'más_rápido' });
  });

  it('asocia tweak de ingredientes cuando coincide la receta', () => {
    const recipe = { id: 'r2' };
    const onCook = vi.fn();
    const onIng = vi.fn();
    expect(
      resolveRecipeSheetState({
        viewingRecipe: recipe,
        currentCookNowRecipe: null,
        currentIngredientsRecipe: recipe,
        handleCookNowTweak: onCook,
        handleIngredientsTweak: onIng,
        cookNowTweakingType: null,
        ingredientsTweakingType: 'sustituir',
      }),
    ).toEqual({ onTweak: onIng, tweakingType: 'sustituir' });
  });

  it('si la hoja no coincide con ninguna receta activa, sin tweak', () => {
    const onCook = vi.fn();
    const onIng = vi.fn();
    expect(
      resolveRecipeSheetState({
        viewingRecipe: { id: 'other' },
        currentCookNowRecipe: { id: 'a' },
        currentIngredientsRecipe: { id: 'b' },
        handleCookNowTweak: onCook,
        handleIngredientsTweak: onIng,
        cookNowTweakingType: null,
        ingredientsTweakingType: null,
      }),
    ).toEqual({ onTweak: null, tweakingType: null });
  });
});
