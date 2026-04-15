export function resolveRecipeSheetState({
  viewingRecipe,
  currentCookNowRecipe,
  currentIngredientsRecipe,
  handleCookNowTweak,
  handleIngredientsTweak,
  cookNowTweakingType,
  ingredientsTweakingType,
}) {
  if (!viewingRecipe) return { onTweak: null, tweakingType: null };

  if (viewingRecipe === currentCookNowRecipe) {
    return { onTweak: handleCookNowTweak, tweakingType: cookNowTweakingType };
  }

  if (viewingRecipe === currentIngredientsRecipe) {
    return { onTweak: handleIngredientsTweak, tweakingType: ingredientsTweakingType };
  }

  return { onTweak: null, tweakingType: null };
}
