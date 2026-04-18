import type { Dispatch, SetStateAction } from 'react';

type PlanMealPrepClient = {
  generate: (params: object, options?: object) => Promise<unknown>;
};

export type RunPlanGenerationDeps = {
  intent: string;
  mealPrep: PlanMealPrepClient;
  setCurrentPlan: Dispatch<SetStateAction<unknown | null>>;
  setViewingPlan: Dispatch<SetStateAction<unknown | null>>;
};

export async function runPlanGeneration(deps: RunPlanGenerationDeps): Promise<void> {
  const plan = await deps.mealPrep.generate({ intent: deps.intent });
  if (!plan) return;
  deps.setCurrentPlan(plan);
  deps.setViewingPlan(plan);
}
