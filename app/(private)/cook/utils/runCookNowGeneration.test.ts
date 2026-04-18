import { describe, expect, it, vi } from 'vitest';

import { runCookNowGeneration } from './runCookNowGeneration';

describe('runCookNowGeneration', () => {
  it('no actualiza estado si generate devuelve falsy', async () => {
    const generate = vi.fn().mockResolvedValue(null);
    const setCurrent = vi.fn();
    const setViewing = vi.fn();

    await runCookNowGeneration({
      buildCookNowParams: () => ({ x: 1 }),
      generate,
      setCurrentCookNowRecipe: setCurrent,
      setViewingRecipe: setViewing,
    });

    expect(generate).toHaveBeenCalledWith('cookNow', { x: 1 });
    expect(setCurrent).not.toHaveBeenCalled();
    expect(setViewing).not.toHaveBeenCalled();
  });

  it('propaga la receta a ambos setters', async () => {
    const recipe = { title: 'Tortilla' };
    const generate = vi.fn().mockResolvedValue(recipe);
    const setCurrent = vi.fn();
    const setViewing = vi.fn();

    await runCookNowGeneration({
      buildCookNowParams: () => ({}),
      generate,
      setCurrentCookNowRecipe: setCurrent,
      setViewingRecipe: setViewing,
    });

    expect(setCurrent).toHaveBeenCalledWith(recipe);
    expect(setViewing).toHaveBeenCalledWith(recipe);
  });
});
