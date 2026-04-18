'use client';

import PageLayout from '@/components/base/PageLayout';

import CookFlavorNav from './CookFlavorNav';
import CookIngredientsCard from './CookIngredientsCard';
import CookIntentNav from './CookIntentNav';
import CookMealPrepCard from './CookMealPrepCard';
import CookNowCard from './CookNowCard';
import CookPageHeader from './CookPageHeader';
import CookSheets from './CookSheets';
import { useCookPage } from '../hooks/useCookPage';

export default function CookPageClient() {
  const c = useCookPage();

  return (
    <PageLayout className="max-w-lg lg:max-w-2xl space-y-5">
      <CookPageHeader greeting={c.greeting} />
      <CookIntentNav intent={c.intent} setIntent={c.setIntent} />
      <CookFlavorNav flavor={c.flavor} setFlavor={c.setFlavor} />

      <CookNowCard
        currentCookNowRecipe={c.currentCookNowRecipe}
        cookNowParams={c.cookNowParams}
        isLoading={c.isLoading}
        getError={c.getError}
        generate={c.generate}
        buildCookNowParams={c.buildCookNowParams}
        setCurrentCookNowRecipe={c.setCurrentCookNowRecipe}
        setViewingRecipe={c.setViewingRecipe}
      />

      <CookIngredientsCard
        ingredientes={c.ingredientes}
        setIngredientes={c.setIngredientes}
        ingredientsExpanded={c.ingredientsExpanded}
        setIngredientsExpanded={c.setIngredientsExpanded}
        scanning={c.scanning}
        fileInputRef={c.fileInputRef}
        currentIngredientsRecipe={c.currentIngredientsRecipe}
        ingredientsParams={c.ingredientsParams}
        isLoading={c.isLoading}
        getError={c.getError}
        generate={c.generate}
        buildIngredientsParams={c.buildIngredientsParams}
        setCurrentIngredientsRecipe={c.setCurrentIngredientsRecipe}
        setViewingRecipe={c.setViewingRecipe}
        addIngredient={c.addIngredient}
        handleImageScan={c.handleImageScan}
      />

      <CookMealPrepCard
        currentMealPrepPlan={c.currentMealPrepPlan}
        mealPrepParams={c.mealPrepParams}
        mealPrep={c.mealPrep}
        buildMealPrepParams={c.buildMealPrepParams}
        setCurrentMealPrepPlan={c.setCurrentMealPrepPlan}
        setViewingPlan={c.setViewingPlan}
      />

      <CookSheets
        viewingRecipe={c.viewingRecipe}
        setViewingRecipe={c.setViewingRecipe}
        viewingPlan={c.viewingPlan}
        setViewingPlan={c.setViewingPlan}
        recipeSheetState={c.recipeSheetState}
        handleMealPrepTweak={c.handleMealPrepTweak}
        mealPrepTweakingType={c.mealPrepTweakingType}
      />
    </PageLayout>
  );
}
