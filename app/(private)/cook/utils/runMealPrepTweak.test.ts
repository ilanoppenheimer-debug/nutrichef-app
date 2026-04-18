import { describe, expect, it, vi } from 'vitest';

import { runMealPrepTweak } from './runMealPrepTweak';

describe('runMealPrepTweak', () => {
  it('no hace nada sin plan o con tweak en curso', async () => {
    const mealPrep = { generate: vi.fn() };
    await runMealPrepTweak(
      {
        currentMealPrepPlan: null,
        mealPrepTweakingType: null,
        buildMealPrepParams: () => ({}),
        mealPrep,
        setCurrentMealPrepPlan: vi.fn(),
        setViewingPlan: vi.fn(),
        setMealPrepTweakingType: vi.fn(),
      },
      'x',
    );
    expect(mealPrep.generate).not.toHaveBeenCalled();

    await runMealPrepTweak(
      {
        currentMealPrepPlan: {},
        mealPrepTweakingType: 'busy',
        buildMealPrepParams: () => ({}),
        mealPrep,
        setCurrentMealPrepPlan: vi.fn(),
        setViewingPlan: vi.fn(),
        setMealPrepTweakingType: vi.fn(),
      },
      'x',
    );
    expect(mealPrep.generate).not.toHaveBeenCalled();
  });

  it('genera con change_type y previousPlan', async () => {
    const current = { w: 1 };
    const next = { w: 2 };
    const mealPrep = { generate: vi.fn().mockResolvedValue(next) };
    const setTweak = vi.fn();
    const setPlan = vi.fn();
    const setView = vi.fn();

    await runMealPrepTweak(
      {
        currentMealPrepPlan: current,
        mealPrepTweakingType: null,
        buildMealPrepParams: () => ({ intent: 'meal_prep' }),
        mealPrep,
        setCurrentMealPrepPlan: setPlan,
        setViewingPlan: setView,
        setMealPrepTweakingType: setTweak,
      },
      'más_variedad',
    );

    expect(mealPrep.generate).toHaveBeenCalledWith(
      { intent: 'meal_prep', change_type: 'más_variedad' },
      { previousPlan: current },
    );
    expect(setPlan).toHaveBeenCalledWith(next);
    expect(setView).toHaveBeenCalledWith(next);
    expect(setTweak).toHaveBeenLastCalledWith(null);
  });
});
