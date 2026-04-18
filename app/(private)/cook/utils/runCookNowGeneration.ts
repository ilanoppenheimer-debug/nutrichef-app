import type { Dispatch, SetStateAction } from 'react';

export type RunCookNowGenerationDeps = {
  buildCookNowParams: () => object;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  setCurrentCookNowRecipe: Dispatch<SetStateAction<any>>;
  setViewingRecipe: Dispatch<SetStateAction<any>>;
};

export async function runCookNowGeneration(deps: RunCookNowGenerationDeps): Promise<void> {
  const params = deps.buildCookNowParams();
  const recipe = await deps.generate('cookNow', params);
  if (recipe) {
    deps.setCurrentCookNowRecipe(recipe);
    deps.setViewingRecipe(recipe);
  }
}
