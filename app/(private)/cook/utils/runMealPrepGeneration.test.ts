import { describe, expect, it, vi } from 'vitest';

import { runMealPrepGeneration } from './runMealPrepGeneration';

describe('runMealPrepGeneration', () => {
  it('no toca setters si generate devuelve falsy', async () => {
    const mealPrep = { generate: vi.fn().mockResolvedValue(undefined) };
    const setPlan = vi.fn();
    const setView = vi.fn();

    await runMealPrepGeneration({
      buildMealPrepParams: () => ({ intent: 'x' }),
      mealPrep,
      setCurrentMealPrepPlan: setPlan,
      setViewingPlan: setView,
    });

    expect(mealPrep.generate).toHaveBeenCalledWith({ intent: 'x' });
    expect(setPlan).not.toHaveBeenCalled();
  });

  it('actualiza plan actual y vista con el resultado', async () => {
    const plan = { week: 1 };
    const mealPrep = { generate: vi.fn().mockResolvedValue(plan) };
    const setPlan = vi.fn();
    const setView = vi.fn();

    await runMealPrepGeneration({
      buildMealPrepParams: () => ({}),
      mealPrep,
      setCurrentMealPrepPlan: setPlan,
      setViewingPlan: setView,
    });

    expect(setPlan).toHaveBeenCalledWith(plan);
    expect(setView).toHaveBeenCalledWith(plan);
  });
});
