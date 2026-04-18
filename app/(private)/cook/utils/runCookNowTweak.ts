import type { Dispatch, SetStateAction } from 'react';

export type RunCookNowTweakDeps = {
  currentCookNowRecipe: unknown;
  cookNowTweakingType: unknown;
  buildCookNowParams: () => object;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  setCurrentCookNowRecipe: Dispatch<SetStateAction<any>>;
  setViewingRecipe: Dispatch<SetStateAction<any>>;
  setCookNowTweakingType: Dispatch<SetStateAction<any>>;
};

export async function runCookNowTweak(deps: RunCookNowTweakDeps, changeType: string): Promise<void> {
  if (!deps.currentCookNowRecipe || deps.cookNowTweakingType) return;
  deps.setCookNowTweakingType(changeType);
  try {
    const params = { ...deps.buildCookNowParams(), change_type: changeType };
    const recipe = await deps.generate('cookNow', params, { previousRecipe: deps.currentCookNowRecipe });
    if (recipe) {
      deps.setCurrentCookNowRecipe(recipe);
      deps.setViewingRecipe(recipe);
    }
  } finally {
    deps.setCookNowTweakingType(null);
  }
}
