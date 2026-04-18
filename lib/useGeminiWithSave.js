import { useCallback } from 'react';
import { useCollectionsStore } from '../stores/useCollectionsStore.js';
import { useAuth } from '../context/AuthContext';
import { callGeminiAPI } from './gemini.js';

// Campos que indican que el resultado es una receta completa (no sugerencias ni planes)
const RECIPE_FIELDS = ['title', 'ingredients', 'steps', 'macros'];

function isRecipe(parsed) {
  return RECIPE_FIELDS.every(f => f in parsed);
}

/**
 * Hook que envuelve callGeminiAPI y guarda automáticamente en Firestore
 * si el resultado parece una receta completa.
 */
export function useGeminiWithSave() {
  const rawSave = useCollectionsStore((s) => s.saveGeneratedRecipe);
  const { user, isLocalMode } = useAuth();

  const callAndSave = useCallback(async (promptText, cacheKey = null, storeCacheKey = null, options = {}) => {
    const result = await callGeminiAPI(promptText, cacheKey, storeCacheKey, options);
    if (result && isRecipe(result)) {
      await rawSave(result, user?.uid ?? null, isLocalMode);
    }
    return result;
  }, [rawSave, user, isLocalMode]);

  return callAndSave;
}
