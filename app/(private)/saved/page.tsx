'use client';

import RecipeModal from '@/components/RecipeModal';
import { SAVED_EMPTY_BY_TAB, SAVED_PAGE_TITLE, SAVED_TABS } from './constants';
import SavedEmptyState from './components/sections/SavedEmptyState';
import SavedTabsBar from './components/sections/SavedTabsBar';
import RecipeGrid from './components/sections/RecipeGrid';
import { useSavedCollectionsView } from './hooks/useSavedCollectionsView';

export default function Page() {
  const { tab, setTab, selectedRecipe, setSelectedRecipe, counts, activeRecipes } =
    useSavedCollectionsView();

  const empty = SAVED_EMPTY_BY_TAB[tab];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onRecipeChange={setSelectedRecipe}
      />
      <h1 className="text-2xl font-black text-slate-800 dark:text-white">{SAVED_PAGE_TITLE}</h1>

      <SavedTabsBar tabs={SAVED_TABS} activeTab={tab} onTabChange={setTab} counts={counts} />

      {activeRecipes.length === 0 ? (
        <SavedEmptyState icon={empty.icon} title={empty.title} text={empty.text} />
      ) : (
        <RecipeGrid recipes={activeRecipes} onSelect={setSelectedRecipe} />
      )}
    </div>
  );
}
