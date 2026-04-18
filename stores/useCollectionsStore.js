import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const useCollectionsStore = create(subscribeWithSelector((set, get) => ({
  favoriteRecipes: [],
  interestedRecipes: [],
  savedRecipes: [],
  generatedRecipes: [],
  savedMeals: [],
  plan: null,

  setFavoriteRecipes: (v) =>
    set({ favoriteRecipes: typeof v === 'function' ? v(get().favoriteRecipes) : v }),

  setInterestedRecipes: (v) =>
    set({ interestedRecipes: typeof v === 'function' ? v(get().interestedRecipes) : v }),

  setSavedRecipes: (v) =>
    set({ savedRecipes: typeof v === 'function' ? v(get().savedRecipes) : v }),

  setGeneratedRecipes: (v) =>
    set({ generatedRecipes: typeof v === 'function' ? v(get().generatedRecipes) : v }),

  setSavedMeals: (v) =>
    set({ savedMeals: typeof v === 'function' ? v(get().savedMeals) : v }),

  setPlan: (v) =>
    set({ plan: typeof v === 'function' ? v(get().plan) : v }),

  saveGeneratedRecipe: async (recipe, uid, isLocalMode) => {
    if (!recipe?.title) return;

    const entry = { ...recipe, generatedAt: new Date().toISOString() };

    set((state) => {
      if (state.generatedRecipes.some((r) => r.title === recipe.title)) return state;
      return { generatedRecipes: [entry, ...state.generatedRecipes] };
    });

    if (uid && !isLocalMode) {
      try {
        await addDoc(collection(db, 'users', uid, 'generatedRecipes'), entry);
      } catch (err) {
        console.error('Error guardando receta generada:', err);
      }
    }
  },

  reset: () =>
    set({
      favoriteRecipes: [],
      interestedRecipes: [],
      savedRecipes: [],
      generatedRecipes: [],
      savedMeals: [],
      plan: null,
    }),
})));
