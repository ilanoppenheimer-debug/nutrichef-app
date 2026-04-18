import { describe, expect, it, vi } from 'vitest';

import { runIngredientsGeneration } from './runIngredientsGeneration';

describe('runIngredientsGeneration', () => {
  it('sale temprano si ingredientes vacío', async () => {
    const generate = vi.fn();
    await runIngredientsGeneration({
      ingredientes: '   ',
      buildIngredientsParams: () => ({}),
      generate,
      setCurrentIngredientsRecipe: vi.fn(),
      setViewingRecipe: vi.fn(),
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('genera y actualiza recetas cuando hay ingredientes', async () => {
    const recipe = { title: 'Bowl' };
    const generate = vi.fn().mockResolvedValue(recipe);
    const setIng = vi.fn();
    const setView = vi.fn();

    await runIngredientsGeneration({
      ingredientes: 'arroz, pollo',
      buildIngredientsParams: () => ({ items: ['arroz'] }),
      generate,
      setCurrentIngredientsRecipe: setIng,
      setViewingRecipe: setView,
    });

    expect(generate).toHaveBeenCalledWith('ingredients', { items: ['arroz'] });
    expect(setIng).toHaveBeenCalledWith(recipe);
    expect(setView).toHaveBeenCalledWith(recipe);
  });
});
