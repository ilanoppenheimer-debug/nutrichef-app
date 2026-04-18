'use client';

import { useMemo, useState } from 'react';
import { useCollectionsStore } from '@/stores/useCollectionsStore.js';
import type { SavedRecipeCard, SavedTabId } from '../types';

export function useSavedCollectionsView() {
  const favoriteRecipes = useCollectionsStore((s) => s.favoriteRecipes) as SavedRecipeCard[];
  const interestedRecipes = useCollectionsStore((s) => s.interestedRecipes) as SavedRecipeCard[];
  const generatedRecipes = useCollectionsStore((s) => s.generatedRecipes) as SavedRecipeCard[];

  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipeCard | null>(null);
  const [tab, setTab] = useState<SavedTabId>('favorites');

  const counts = useMemo(
    () => ({
      favorites: favoriteRecipes.length,
      interested: interestedRecipes.length,
      history: generatedRecipes.length,
    }),
    [favoriteRecipes.length, interestedRecipes.length, generatedRecipes.length],
  );

  const activeRecipes =
    tab === 'favorites' ? favoriteRecipes : tab === 'interested' ? interestedRecipes : generatedRecipes;

  return {
    tab,
    setTab,
    selectedRecipe,
    setSelectedRecipe,
    counts,
    activeRecipes,
  };
}
