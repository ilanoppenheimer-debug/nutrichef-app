import type { Dispatch, SetStateAction } from 'react';

type PlanMealPrepClient = {
  generate: (params: object, options?: object) => Promise<unknown>;
};

export type RunPlanTweakDeps = {
  intent: string;
  currentPlan: unknown | null;
  tweakingType: string | null;
  mealPrep: PlanMealPrepClient;
  setCurrentPlan: Dispatch<SetStateAction<unknown | null>>;
  setViewingPlan: Dispatch<SetStateAction<unknown | null>>;
  setTweakingType: Dispatch<SetStateAction<string | null>>;
};

export async function runPlanTweak(deps: RunPlanTweakDeps, changeType: string): Promise<void> {
  if (!deps.currentPlan || deps.tweakingType) return;
  deps.setTweakingType(changeType);
  try {
    const plan = await deps.mealPrep.generate(
      { intent: deps.intent, change_type: changeType },
      { previousPlan: deps.currentPlan },
    );
    if (!plan) return;
    deps.setCurrentPlan(plan);
    deps.setViewingPlan(plan);
  } finally {
    deps.setTweakingType(null);
  }
}
