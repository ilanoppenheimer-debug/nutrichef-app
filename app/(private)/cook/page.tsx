'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Flame, Package, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import RecipeBottomSheet from '@/components/RecipeBottomSheet';
import { MealPrepResultCard, MealPrepSheet } from '@/components/MealPrepPlanCard';
import { useCooking } from '@/hooks/useCooking.js';
import { useMealPrep } from '@/hooks/useMealPrep.js';
import { callGeminiVisionAPI } from '@/lib/gemini.js';
import { resolveRecipeSheetState } from '@/helpers/cookingViewHelpers.js';
import PageLayout from '@/components/base/PageLayout';
import { usePersistedPreference } from '@/hooks/useCookingPreferences.js';
import {
  FLAVOR_OPTIONS,
  FLAVOR_STORAGE_KEY,
  INTENT_OPTIONS,
  INTENT_STORAGE_KEY,
  MEAL_PREP_INTENTS,
  SUGGESTED_INGREDIENTS,
  VALID_FLAVORS,
  VALID_INTENTS,
} from './constants';
import { getTimeOfDay } from './utils/getTimeOfDay';
import { getTimeGreeting } from './utils/getTimeGreeting';
import { runCookNowGeneration } from './utils/runCookNowGeneration';
import { runIngredientsGeneration } from './utils/runIngredientsGeneration';
import { runMealPrepGeneration } from './utils/runMealPrepGeneration';
import { runCookNowTweak } from './utils/runCookNowTweak';
import { runIngredientsTweak } from './utils/runIngredientsTweak';
import { runMealPrepTweak } from './utils/runMealPrepTweak';
import ActionCard from '@/components/ui/ActionCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import RecipeResultCard from '@/components/ui/RecipeResultCard';

// ── Main view ─────────────────────────────────────────────────────────────────

export default function Page() {
  // Sheets
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

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

  // Time greeting (contextual hint in header)
  const greeting = getTimeGreeting();

  // Ingredients input + progressive disclosure
  const [ingredientes, setIngredientes] = useState('');
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Currently displayed results — separate from the cache so iterative tweaks compound
  const [currentCookNowRecipe, setCurrentCookNowRecipe] = useState(null);
  const [currentIngredientsRecipe, setCurrentIngredientsRecipe] = useState(null);
  const [currentMealPrepPlan, setCurrentMealPrepPlan] = useState(null);

  // In-flight tweak markers (one per surface)
  const [cookNowTweakingType, setCookNowTweakingType] = useState<string | null>(null);
  const [ingredientsTweakingType, setIngredientsTweakingType] = useState<string | null>(null);
  const [mealPrepTweakingType, setMealPrepTweakingType] = useState<string | null>(null);

  const { generate, getRecipe, isLoading, getError } = useCooking();
  const mealPrep = useMealPrep();

  // Compute current params (time_of_day captured at generation time, not stored,
  // so the cache key reflects the moment the request was made)
  const buildCookNowParams = () => ({ intent, flavor, time_of_day: getTimeOfDay() });
  const buildIngredientsParams = () => ({
    intent,
    flavor,
    time_of_day: getTimeOfDay(),
    ingredientes: ingredientes.trim(),
  });
  const mealPrepIntent = MEAL_PREP_INTENTS.has(intent) ? intent : 'inspirame';
  // Meal prep ignores flavor (plans should be balanced across the week)
  const buildMealPrepParams = () => ({ intent: mealPrepIntent });

  // When intent or ingredients change, sync the displayed result to whatever
  // the cache has for the new params (or null). Discards stale tweaks.
  useEffect(() => {
    setCurrentCookNowRecipe(getRecipe('cookNow', buildCookNowParams()));
    setCurrentMealPrepPlan(mealPrep.getPlan(buildMealPrepParams()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, flavor]);

  useEffect(() => {
    setCurrentIngredientsRecipe(getRecipe('ingredients', buildIngredientsParams()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, flavor, ingredientes]);

  // ── Tweak handlers (compound on the currently displayed result) ────────────

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

  // ── Suggested ingredient chip → append to textarea ─────────────────────────

  const addIngredient = (item: string) => {
    setIngredientes(prev => {
      const trimmed = prev.trim();
      const tokens = trimmed
        ? trimmed.toLowerCase().split(/[,\n]+/).map(s => s.trim())
        : [];
      if (tokens.includes(item.toLowerCase())) return prev;
      return trimmed ? `${trimmed}, ${item}` : item;
    });
  };

  // ── Camera scan → detect ingredients from photo ────────────────────────────

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
        const prompt = `Analiza esta imagen. Si muestra ingredientes o alimentos, lista los ingredientes detectados separados por coma. Responde SOLO el texto de ingredientes, sin explicaciones.`;
        const resultText = await callGeminiVisionAPI(prompt, base64Data, file.type);
        const detectedText = resultText.trim().replace(/^["']|["']$/g, '');
        if (detectedText) {
          setIngredientes(prev => prev.trim() ? `${prev.trim()}, ${detectedText}` : detectedText);
          setIngredientsExpanded(true);
        }
      } catch { /* silently degrade */ }
      finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input for re-scan
  };

  // ── Loading / error helpers for the active sheet ───────────────────────────

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

  return (
    <PageLayout className="max-w-lg lg:max-w-2xl space-y-5">
      {/* ── 1. Header with contextual time greeting ────────────────────────── */}
      <header className="pt-1">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">¿Qué te apetece hoy?</h1>
        {greeting.hint && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {greeting.emoji} {greeting.hint}
          </p>
        )}
      </header>

      {/* ── 2. Intent chips (primary: the goal/mode) ──────────────────────── */}
      <nav aria-label="Intención" className="flex flex-wrap gap-2">
        {INTENT_OPTIONS.map(opt => {
          const isActive = intent === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntent(opt.value)}
              aria-pressed={isActive}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200'
              }`}
              style={isActive ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            >
              {opt.label}
            </button>
          );
        })}
      </nav>

      {/* ── 2b. Flavor chips (secondary: dulce/salado/cualquiera) ─────────── */}
      <nav aria-label="Sabor" className="flex flex-wrap gap-2 -mt-2">
        {FLAVOR_OPTIONS.map(opt => {
          const isActive = flavor === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFlavor(opt.value)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300'
              }`}
              style={isActive ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            >
              {opt.label}
            </button>
          );
        })}
      </nav>

      {/* ── 3. Action cards (always visible, in priority order) ──────────── */}

      {/* Card 1: Cocinar ahora */}
      <ActionCard
        icon={Flame}
        title="Cocinar ahora"
        subtitle="Yo decido qué preparar"
      >
        <PrimaryButton
          onClick={() =>
            runCookNowGeneration({
              buildCookNowParams,
              generate,
              setCurrentCookNowRecipe,
              setViewingRecipe,
            })
          }
          loading={isLoading('cookNow', cookNowParams)}
          loadingLabel="Generando receta..."
        >
          {currentCookNowRecipe ? 'Generar otra receta' : 'Sugerir receta'}
        </PrimaryButton>

        {currentCookNowRecipe && (
          <RecipeResultCard
            recipe={currentCookNowRecipe}
            onView={() => setViewingRecipe(currentCookNowRecipe)}
          />
        )}

        {getError('cookNow', cookNowParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {getError('cookNow', cookNowParams)}
          </p>
        )}
      </ActionCard>

      {/* Card 2: Tengo ingredientes (progressive disclosure) */}
      <ActionCard
        icon={ShoppingBag}
        title="Tengo ingredientes"
        subtitle="Dime qué tienes y resuelvo el resto"
      >
        {/* Collapsed: single tappable trigger */}
        {!ingredientsExpanded && !ingredientes.trim() && !currentIngredientsRecipe ? (
          <button
            type="button"
            onClick={() => setIngredientsExpanded(true)}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold border-2 border-dashed border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 active:scale-[0.98] transition-transform"
          >
            <Plus size={16} strokeWidth={2.5} /> Agregar ingredientes
          </button>
        ) : (
          <>
            <div className="relative">
              <textarea
                value={ingredientes}
                onChange={e => setIngredientes(e.target.value)}
                placeholder="Ej: pollo, arroz, zanahoria..."
                rows={2}
                className="w-full px-4 py-3 pb-10 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:border-[--c-primary-border] transition-colors"
                autoFocus={ingredientsExpanded && !ingredientes.trim()}
              />
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageScan} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-500 dark:text-slate-300 active:scale-95 transition-all"
              >
                {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={12} />}
                {scanning ? 'Escaneando...' : 'Escanear foto'}
              </button>
            </div>

            {/* Suggested chips for faster input */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_INGREDIENTS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => addIngredient(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-700 active:scale-95 transition-transform"
                >
                  <Plus size={11} strokeWidth={3} /> {item}
                </button>
              ))}
            </div>

            <PrimaryButton
              onClick={() =>
                runIngredientsGeneration({
                  ingredientes,
                  buildIngredientsParams,
                  generate,
                  setCurrentIngredientsRecipe,
                  setViewingRecipe,
                })
              }
              disabled={!ingredientes.trim()}
              loading={isLoading('ingredients', ingredientsParams)}
              loadingLabel="Generando receta..."
            >
              {currentIngredientsRecipe ? 'Generar otra receta' : '¿Qué puedo cocinar?'}
            </PrimaryButton>
          </>
        )}

        {currentIngredientsRecipe && (
          <RecipeResultCard
            recipe={currentIngredientsRecipe}
            onView={() => setViewingRecipe(currentIngredientsRecipe)}
          />
        )}

        {getError('ingredients', ingredientsParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {getError('ingredients', ingredientsParams)}
          </p>
        )}
      </ActionCard>

      {/* Card 3: Meal prep */}
      <ActionCard
        icon={Package}
        title="Meal prep · 3 días"
        subtitle="Cocina una vez, come tres días"
      >
        <PrimaryButton
          onClick={() =>
            runMealPrepGeneration({
              buildMealPrepParams,
              mealPrep,
              setCurrentMealPrepPlan,
              setViewingPlan,
            })
          }
          loading={mealPrep.isLoading(mealPrepParams)}
          loadingLabel="Generando plan..."
        >
          {currentMealPrepPlan ? 'Generar otro plan' : 'Planificar meal prep'}
        </PrimaryButton>

        {currentMealPrepPlan && (
          <MealPrepResultCard
            plan={currentMealPrepPlan}
            onView={() => setViewingPlan(currentMealPrepPlan)}
          />
        )}

        {mealPrep.getError(mealPrepParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {mealPrep.getError(mealPrepParams)}
          </p>
        )}
      </ActionCard>

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
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
    </PageLayout>
  );
}



