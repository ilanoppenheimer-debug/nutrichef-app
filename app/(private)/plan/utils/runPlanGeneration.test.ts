import { describe, expect, it, vi } from 'vitest';

import { runPlanGeneration } from './runPlanGeneration';

describe('runPlanGeneration', () => {
  it('no actualiza estado si generate devuelve valor falsy', async () => {
    const mealPrep = { generate: vi.fn().mockResolvedValue(null) };
    const setCurrentPlan = vi.fn();
    const setViewingPlan = vi.fn();

    await runPlanGeneration({
      intent: 'meal_prep',
      mealPrep,
      setCurrentPlan,
      setViewingPlan,
    });

    expect(mealPrep.generate).toHaveBeenCalledWith({ intent: 'meal_prep' });
    expect(setCurrentPlan).not.toHaveBeenCalled();
    expect(setViewingPlan).not.toHaveBeenCalled();
  });

  it('pasa el plan a ambos setters cuando hay resultado', async () => {
    const plan = { id: 'p1', meals: [] };
    const mealPrep = { generate: vi.fn().mockResolvedValue(plan) };
    const setCurrentPlan = vi.fn();
    const setViewingPlan = vi.fn();

    await runPlanGeneration({
      intent: 'bajo_tiempo',
      mealPrep,
      setCurrentPlan,
      setViewingPlan,
    });

    expect(setCurrentPlan).toHaveBeenCalledWith(plan);
    expect(setViewingPlan).toHaveBeenCalledWith(plan);
  });
});
