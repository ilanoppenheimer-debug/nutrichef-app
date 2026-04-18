'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import type { RecipeResultCardRecipe } from '@/components/ui/RecipeResultCard';
import { resolveRecipeSheetState } from '@/helpers/cookingViewHelpers.js';
import { useCooking } from '@/hooks/useCooking.js';
import { usePersistedPreference } from '@/hooks/useCookingPreferences.js';
import { useMealPrep } from '@/hooks/useMealPrep.js';
import { callGeminiVisionAPI } from '@/lib/gemini.js';

import {
  FLAVOR_OPTIONS,
  FLAVOR_STORAGE_KEY,
  INTENT_OPTIONS,
  INTENT_STORAGE_KEY,
  MEAL_PREP_INTENTS,
  VALID_FLAVORS,
  VALID_INTENTS,
} from '../constants';
import { getTimeOfDay } from '../utils/getTimeOfDay';
import { getTimeGreeting } from '../utils/getTimeGreeting';
import { runCookNowTweak } from '../utils/runCookNowTweak';
import { runIngredientsTweak } from '../utils/runIngredientsTweak';
import { runMealPrepTweak } from '../utils/runMealPrepTweak';

export function useCookPage() {
  const [viewingRecipe, setViewingRecipe] = useState<RecipeResultCardRecipe | null>(null);
  const [viewingPlan, setViewingPlan] = useState<Record<string, unknown> | null>(null);

  const [intent, setIntent] = usePersistedPreference({
    storageKey: INTENT_STORAGE_KEY,
    defaultValue: 'inspirame',
    isValid: (value: string) =>
      VALID_INTENTS.has(value as (typeof INTENT_OPTIONS)[number]['value']),
  });

  const [flavor, setFlavor] = usePersistedPreference({
    storageKey: FLAVOR_STORAGE_KEY,
    defaultValue: 'any',
    isValid: (value: string) =>
      VALID_FLAVORS.has(value as (typeof FLAVOR_OPTIONS)[number]['value']),
  });

  const greeting = getTimeGreeting();

  const [ingredientes, setIngredientes] = useState('');
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentCookNowRecipe, setCurrentCookNowRecipe] = useState<RecipeResultCardRecipe | null>(null);
  const [currentIngredientsRecipe, setCurrentIngredientsRecipe] = useState<RecipeResultCardRecipe | null>(
    null,
  );
  const [currentMealPrepPlan, setCurrentMealPrepPlan] = useState<Record<string, unknown> | null>(null);

  const [cookNowTweakingType, setCookNowTweakingType] = useState<string | null>(null);
  const [ingredientsTweakingType, setIngredientsTweakingType] = useState<string | null>(null);
  const [mealPrepTweakingType, setMealPrepTweakingType] = useState<string | null>(null);

  const { generate, getRecipe, isLoading, getError } = useCooking();
  const mealPrep = useMealPrep();

  const buildCookNowParams = () => ({ intent, flavor, time_of_day: getTimeOfDay() });
  const buildIngredientsParams = () => ({
    intent,
    flavor,
    time_of_day: getTimeOfDay(),
    ingredientes: ingredientes.trim(),
  });
  const mealPrepIntent = MEAL_PREP_INTENTS.has(intent) ? intent : 'inspirame';
  const buildMealPrepParams = () => ({ intent: mealPrepIntent });

  useEffect(() => {
    setCurrentCookNowRecipe(getRecipe('cookNow', buildCookNowParams()) as RecipeResultCardRecipe | null);
    setCurrentMealPrepPlan(mealPrep.getPlan(buildMealPrepParams()) as Record<string, unknown> | null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, flavor]);

  useEffect(() => {
    setCurrentIngredientsRecipe(
      getRecipe('ingredients', buildIngredientsParams()) as RecipeResultCardRecipe | null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, flavor, ingredientes]);

  const handleCookNowTweak = (changeType: string) =>
    runCookNowTweak(
      {
        currentCookNowRecipe,
        cookNowTweakingType,
        buildCookNowParams,
        generate,
        setCurrentCookNowRecipe,
        setViewingRecipe,
        setCookNowTweakingType,
      },
      changeType,
    );

  const handleIngredientsTweak = (changeType: string) =>
    runIngredientsTweak(
      {
        currentIngredientsRecipe,
        ingredientsTweakingType,
        buildIngredientsParams,
        generate,
        setCurrentIngredientsRecipe,
        setViewingRecipe,
        setIngredientsTweakingType,
      },
      changeType,
    );

  const handleMealPrepTweak = (changeType: string) =>
    runMealPrepTweak(
      {
        currentMealPrepPlan,
        mealPrepTweakingType,
        buildMealPrepParams,
        mealPrep,
        setCurrentMealPrepPlan,
        setViewingPlan,
        setMealPrepTweakingType,
      },
      changeType,
    );

  const addIngredient = (item: string) => {
    setIngredientes((prev) => {
      const trimmed = prev.trim();
      const tokens = trimmed
        ? trimmed
            .toLowerCase()
            .split(/[,\n]+/)
            .map((s) => s.trim())
        : [];
      if (tokens.includes(item.toLowerCase())) return prev;
      return trimmed ? `${trimmed}, ${item}` : item;
    });
  };

  const handleImageScan = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = reader.result;
      if (typeof raw !== 'string') return;
      const base64Data = raw.split(',')[1];
      setScanning(true);
      try {
        const prompt =
          'Analiza esta imagen. Si muestra ingredientes o alimentos, lista los ingredientes detectados separados por coma. Responde SOLO el texto de ingredientes, sin explicaciones.';
        const resultText = await callGeminiVisionAPI(prompt, base64Data, file.type);
        const detectedText = resultText.trim().replace(/^["']|["']$/g, '');
        if (detectedText) {
          setIngredientes((prev) => (prev.trim() ? `${prev.trim()}, ${detectedText}` : detectedText));
          setIngredientsExpanded(true);
        }
      } catch {
        /* silently degrade */
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const recipeSheetState = resolveRecipeSheetState({
    viewingRecipe,
    currentCookNowRecipe,
    currentIngredientsRecipe,
    handleCookNowTweak,
    handleIngredientsTweak,
    cookNowTweakingType,
    ingredientsTweakingType,
  });

  const cookNowParams = buildCookNowParams();
  const ingredientsParams = buildIngredientsParams();
  const mealPrepParams = buildMealPrepParams();

  return {
    greeting,
    intent,
    setIntent,
    flavor,
    setFlavor,
    ingredientes,
    setIngredientes,
    ingredientsExpanded,
    setIngredientsExpanded,
    scanning,
    fileInputRef,
    currentCookNowRecipe,
    currentIngredientsRecipe,
    currentMealPrepPlan,
    viewingRecipe,
    setViewingRecipe,
    viewingPlan,
    setViewingPlan,
    generate,
    isLoading,
    getError,
    mealPrep,
    buildCookNowParams,
    buildIngredientsParams,
    buildMealPrepParams,
    cookNowParams,
    ingredientsParams,
    mealPrepParams,
    mealPrepIntent,
    handleCookNowTweak,
    handleIngredientsTweak,
    handleMealPrepTweak,
    mealPrepTweakingType,
    addIngredient,
    handleImageScan,
    recipeSheetState,
    setCurrentCookNowRecipe,
    setCurrentIngredientsRecipe,
    setCurrentMealPrepPlan,
  };
}
