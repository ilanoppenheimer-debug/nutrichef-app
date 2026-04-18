import type { Dispatch, SetStateAction } from 'react';
import type { MealPrepGenerateClient } from './runMealPrepGeneration';

export type RunMealPrepTweakDeps = {
  currentMealPrepPlan: unknown;
  mealPrepTweakingType: string | null;
  buildMealPrepParams: () => object;
  mealPrep: MealPrepGenerateClient;
  setCurrentMealPrepPlan: Dispatch<SetStateAction<any>>;
  setViewingPlan: Dispatch<SetStateAction<any>>;
  setMealPrepTweakingType: Dispatch<SetStateAction<string | null>>;
};

export async function runMealPrepTweak(deps: RunMealPrepTweakDeps, changeType: string): Promise<void> {
  if (!deps.currentMealPrepPlan || deps.mealPrepTweakingType) return;
  deps.setMealPrepTweakingType(changeType);
  try {
    const params = { ...deps.buildMealPrepParams(), change_type: changeType };
    const plan = await deps.mealPrep.generate(params, { previousPlan: deps.currentMealPrepPlan });
    if (plan) {
      deps.setCurrentMealPrepPlan(plan);
      deps.setViewingPlan(plan);
    }
  } finally {
    deps.setMealPrepTweakingType(null);
  }
}
