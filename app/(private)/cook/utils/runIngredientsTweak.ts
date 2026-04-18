import type { Dispatch, SetStateAction } from 'react';

export type RunIngredientsTweakDeps = {
  currentIngredientsRecipe: unknown;
  ingredientsTweakingType: unknown;
  buildIngredientsParams: () => object;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  setCurrentIngredientsRecipe: Dispatch<SetStateAction<any>>;
  setViewingRecipe: Dispatch<SetStateAction<any>>;
  setIngredientsTweakingType: Dispatch<SetStateAction<any>>;
};

export async function runIngredientsTweak(deps: RunIngredientsTweakDeps, changeType: string): Promise<void> {
  if (!deps.currentIngredientsRecipe || deps.ingredientsTweakingType) return;
  deps.setIngredientsTweakingType(changeType);
  try {
    const params = { ...deps.buildIngredientsParams(), change_type: changeType };
    const recipe = await deps.generate('ingredients', params, { previousRecipe: deps.currentIngredientsRecipe });
    if (recipe) {
      deps.setCurrentIngredientsRecipe(recipe);
      deps.setViewingRecipe(recipe);
    }
  } finally {
    deps.setIngredientsTweakingType(null);
  }
}
