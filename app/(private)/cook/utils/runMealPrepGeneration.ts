import type { Dispatch, SetStateAction } from 'react';

export type MealPrepGenerateClient = {
  generate: (params: object, options?: object) => Promise<unknown>;
};

export type RunMealPrepGenerationDeps = {
  buildMealPrepParams: () => object;
  mealPrep: MealPrepGenerateClient;
  setCurrentMealPrepPlan: Dispatch<SetStateAction<any>>;
  setViewingPlan: Dispatch<SetStateAction<any>>;
};

export async function runMealPrepGeneration(deps: RunMealPrepGenerationDeps): Promise<void> {
  const params = deps.buildMealPrepParams();
  const plan = await deps.mealPrep.generate(params);
  if (plan) {
    deps.setCurrentMealPrepPlan(plan);
    deps.setViewingPlan(plan);
  }
}
