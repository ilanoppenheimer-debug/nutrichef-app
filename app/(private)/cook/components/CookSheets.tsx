import RecipeBottomSheet from '@/components/RecipeBottomSheet';
import { MealPrepSheet } from '@/components/MealPrepPlanCard';
import type { RecipeResultCardRecipe } from '@/components/ui/RecipeResultCard';

export default function CookSheets({
  viewingRecipe,
  setViewingRecipe,
  viewingPlan,
  setViewingPlan,
  recipeSheetState,
  handleMealPrepTweak,
  mealPrepTweakingType,
}: {
  viewingRecipe: RecipeResultCardRecipe | null;
  setViewingRecipe: (r: RecipeResultCardRecipe | null) => void;
  viewingPlan: Record<string, unknown> | null;
  setViewingPlan: (p: Record<string, unknown> | null) => void;
  recipeSheetState: {
    onTweak: ((type: string) => void) | null;
    tweakingType: string | null;
  };
  handleMealPrepTweak: (type: string) => void;
  mealPrepTweakingType: string | null;
}) {
  return (
    <>
      <RecipeBottomSheet
        recipe={viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onRecipeChange={setViewingRecipe}
        onTweak={recipeSheetState.onTweak}
        tweakingType={recipeSheetState.tweakingType}
      />

      <MealPrepSheet
        plan={viewingPlan}
        onClose={() => setViewingPlan(null)}
        onTweak={handleMealPrepTweak}
        tweakingType={mealPrepTweakingType}
      />
    </>
  );
}
