import { describe, expect, it, vi } from 'vitest';

import { runPlanTweak } from './runPlanTweak';

describe('runPlanTweak', () => {
  it('no hace nada si no hay plan actual', async () => {
    const mealPrep = { generate: vi.fn() };
    const setTweakingType = vi.fn();

    await runPlanTweak(
      {
        intent: 'x',
        currentPlan: null,
        tweakingType: null,
        mealPrep,
        setCurrentPlan: vi.fn(),
        setViewingPlan: vi.fn(),
        setTweakingType,
      },
      'más_proteína',
    );

    expect(mealPrep.generate).not.toHaveBeenCalled();
    expect(setTweakingType).not.toHaveBeenCalled();
  });

  it('no hace nada si ya hay tweak en curso', async () => {
    const mealPrep = { generate: vi.fn() };
    await runPlanTweak(
      {
        intent: 'x',
        currentPlan: { ok: true },
        tweakingType: 'busy',
        mealPrep,
        setCurrentPlan: vi.fn(),
        setViewingPlan: vi.fn(),
        setTweakingType: vi.fn(),
      },
      'otro',
    );
    expect(mealPrep.generate).not.toHaveBeenCalled();
  });

  it('llama generate con change_type y previousPlan, y resetea tweaking en finally', async () => {
    const current = { version: 1 };
    const nextPlan = { version: 2 };
    const mealPrep = { generate: vi.fn().mockResolvedValue(nextPlan) };
    const setCurrentPlan = vi.fn();
    const setViewingPlan = vi.fn();
    const setTweakingType = vi.fn();

    await runPlanTweak(
      {
        intent: 'meal_prep',
        currentPlan: current,
        tweakingType: null,
        mealPrep,
        setCurrentPlan,
        setViewingPlan,
        setTweakingType,
      },
      'menos_carbos',
    );

    expect(setTweakingType).toHaveBeenNthCalledWith(1, 'menos_carbos');
    expect(mealPrep.generate).toHaveBeenCalledWith(
      { intent: 'meal_prep', change_type: 'menos_carbos' },
      { previousPlan: current },
    );
    expect(setCurrentPlan).toHaveBeenCalledWith(nextPlan);
    expect(setViewingPlan).toHaveBeenCalledWith(nextPlan);
    expect(setTweakingType).toHaveBeenLastCalledWith(null);
  });

  it('sigue reseteando tweaking si generate devuelve falsy', async () => {
    const mealPrep = { generate: vi.fn().mockResolvedValue(undefined) };
    const setTweakingType = vi.fn();
    const setCurrentPlan = vi.fn();
    const setViewingPlan = vi.fn();

    await runPlanTweak(
      {
        intent: 'i',
        currentPlan: {},
        tweakingType: null,
        mealPrep,
        setCurrentPlan,
        setViewingPlan,
        setTweakingType,
      },
      'x',
    );

    expect(setCurrentPlan).not.toHaveBeenCalled();
    expect(setViewingPlan).not.toHaveBeenCalled();
    expect(setTweakingType).toHaveBeenLastCalledWith(null);
  });
});