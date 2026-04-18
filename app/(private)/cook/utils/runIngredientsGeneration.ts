/* eslint-disable @typescript-eslint/no-explicit-any -- setters desde useState(null) sin genérico de receta */
import type { Dispatch, SetStateAction } from 'react';

export type RunIngredientsGenerationDeps = {
  ingredientes: string;
  buildIngredientsParams: () => object;
  generate: (mode: string, params: object, options?: object) => Promise<unknown>;
  setCurrentIngredientsRecipe: Dispatch<SetStateAction<any>>;
  setViewingRecipe: Dispatch<SetStateAction<any>>;
};

export async function runIngredientsGeneration(deps: RunIngredientsGenerationDeps): Promise<void> {
  if (!deps.ingredientes.trim()) return;
  const params = deps.buildIngredientsParams();
  const recipe = await deps.generate('ingredients', params);
  if (recipe) {
    deps.setCurrentIngredientsRecipe(recipe);
    deps.setViewingRecipe(recipe);
  }
}
