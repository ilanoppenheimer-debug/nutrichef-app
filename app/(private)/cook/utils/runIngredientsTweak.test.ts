import { describe, expect, it, vi } from 'vitest';

import { runIngredientsTweak } from './runIngredientsTweak';

describe('runIngredientsTweak', () => {
  it('no hace nada sin receta o con tweak en curso', async () => {
    const generate = vi.fn();
    await runIngredientsTweak(
      {
        currentIngredientsRecipe: null,
        ingredientsTweakingType: null,
        buildIngredientsParams: () => ({}),
        generate,
        setCurrentIngredientsRecipe: vi.fn(),
        setViewingRecipe: vi.fn(),
        setIngredientsTweakingType: vi.fn(),
      },
      'cambio',
    );
    expect(generate).not.toHaveBeenCalled();

    await runIngredientsTweak(
      {
        currentIngredientsRecipe: { x: 1 },
        ingredientsTweakingType: 'busy',
        buildIngredientsParams: () => ({}),
        generate,
        setCurrentIngredientsRecipe: vi.fn(),
        setViewingRecipe: vi.fn(),
        setIngredientsTweakingType: vi.fn(),
      },
      'cambio',
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it('usa modo ingredients y previousRecipe', async () => {
    const current = { title: 'Curry' };
    const next = { title: 'Curry 2' };
    const generate = vi.fn().mockResolvedValue(next);
    const setTweak = vi.fn();
    const setIng = vi.fn();
    const setView = vi.fn();

    await runIngredientsTweak(
      {
        currentIngredientsRecipe: current,
        ingredientsTweakingType: null,
        buildIngredientsParams: () => ({ intent: 'x' }),
        generate,
        setCurrentIngredientsRecipe: setIng,
        setViewingRecipe: setView,
        setIngredientsTweakingType: setTweak,
      },
      'menos_picante',
    );

    expect(generate).toHaveBeenCalledWith(
      'ingredients',
      { intent: 'x', change_type: 'menos_picante' },
      { previousRecipe: current },
    );
    expect(setIng).toHaveBeenCalledWith(next);
    expect(setView).toHaveBeenCalledWith(next);
    expect(setTweak).toHaveBeenLastCalledWith(null);
  });
});
