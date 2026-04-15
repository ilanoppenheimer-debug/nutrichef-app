import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronRight, Flame, Package, Plus, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import RecipeBottomSheet from '../components/RecipeBottomSheet.jsx';
import { MealPrepResultCard, MealPrepSheet } from '../components/MealPrepPlanCard.jsx';
import { useCooking } from '../hooks/useCooking.js';
import { useMealPrep } from '../hooks/useMealPrep.js';
import { callGeminiVisionAPI } from '../lib/gemini.js';
import { resolveRecipeSheetState } from '../helpers/cookingViewHelpers.js';
import PageLayout from '../components/base/PageLayout.jsx';
import { usePersistedPreference } from '../hooks/useCookingPreferences.js';

// ── Intent options (the user's goal/mode) ────────────────────────────────────

const INTENT_OPTIONS = [
  { value: 'inspirame', label: '✨ Inspírame' },
  { value: 'proteico',  label: '💪 Proteico' },
  { value: 'liviano',   label: '🥗 Liviano' },
  { value: 'economico', label: '💸 Económico' },
];
const VALID_INTENTS = new Set(INTENT_OPTIONS.map(o => o.value));
const MEAL_PREP_INTENTS = new Set(['inspirame', 'proteico', 'liviano', 'economico']);
const INTENT_STORAGE_KEY = 'nutrichef_cook_intent';

// ── Flavor options (orthogonal dimension — dulce/salado/any) ────────────────

const FLAVOR_OPTIONS = [
  { value: 'any',    label: 'Cualquiera' },
  { value: 'dulce',  label: '🍬 Dulce' },
  { value: 'salado', label: '🧂 Salado' },
];
const VALID_FLAVORS = new Set(FLAVOR_OPTIONS.map(o => o.value));
const FLAVOR_STORAGE_KEY = 'nutrichef_cook_flavor';

// ── Suggested ingredient chips for the "tengo ingredientes" card ─────────────

const SUGGESTED_INGREDIENTS = [
  'pollo', 'arroz', 'huevo', 'atún', 'pasta', 'tomate',
];

// ── Time-of-day bucket (silent meal-type inference for the model) ────────────

function getTimeOfDay(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'manana';
  if (hour >= 11 && hour < 16) return 'mediodia';
  if (hour >= 16 && hour < 19) return 'tarde';
  if (hour >= 19 && hour < 23) return 'noche';
  return 'noche_tarde';
}

// ── Contextual greeting (visible, confirms the system understands the hour) ─

function getTimeGreeting(timeOfDay = getTimeOfDay()) {
  switch (timeOfDay) {
    case 'manana':      return { emoji: '🌅', hint: 'Hora del desayuno' };
    case 'mediodia':    return { emoji: '☀️', hint: 'Hora del almuerzo' };
    case 'tarde':       return { emoji: '☕', hint: 'Hora de la merienda' };
    case 'noche':       return { emoji: '🌙', hint: 'Hora de la cena' };
    case 'noche_tarde': return { emoji: '🌙', hint: 'Algo ligero para esta hora' };
    default:            return { emoji: '✨', hint: '' };
  }
}

// ── Result preview card (tap to re-open the generated recipe) ────────────────

function RecipeResultCard({ recipe, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full text-left p-4 rounded-2xl border border-[--c-primary-border] bg-[--c-primary-light] transition-transform active:scale-[0.98]"
    >
      <p className="font-black text-sm leading-snug text-[--c-primary-text]">{recipe.title}</p>
      {recipe.description && (
        <p className="text-xs mt-0.5 text-[--c-primary-text] opacity-80 line-clamp-2">{recipe.description}</p>
      )}
      <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--c-primary)' }}>
        <span className="text-xs font-bold">Ver receta</span>
        <ChevronRight size={13} strokeWidth={2.5} />
      </div>
    </button>
  );
}

// ── Action card (always-visible, large, mobile-first) ────────────────────────

function ActionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm p-5 space-y-4">
      <header className="flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
          style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
        >
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-base text-slate-800 dark:text-white leading-snug">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

// ── Primary CTA button (used inside every action card) ──────────────────────

function PrimaryButton({ onClick, disabled, loading, loadingLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
      style={{ background: 'var(--c-primary)' }}
    >
      {loading
        ? <><RefreshCw size={16} className="animate-spin" /> {loadingLabel}</>
        : <><Sparkles size={16} /> {children}</>
      }
    </button>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function CookingHome() {
  // Sheets
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

  const [intent, setIntent] = usePersistedPreference({
    storageKey: INTENT_STORAGE_KEY,
    defaultValue: 'inspirame',
    isValid: (value) => VALID_INTENTS.has(value),
  });

  const [flavor, setFlavor] = usePersistedPreference({
    storageKey: FLAVOR_STORAGE_KEY,
    defaultValue: 'any',
    isValid: (value) => VALID_FLAVORS.has(value),
  });

  // Time greeting (contextual hint in header)
  const greeting = getTimeGreeting();

  // Ingredients input + progressive disclosure
  const [ingredientes, setIngredientes] = useState('');
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef(null);

  // Currently displayed results — separate from the cache so iterative tweaks compound
  const [currentCookNowRecipe, setCurrentCookNowRecipe] = useState(null);
  const [currentIngredientsRecipe, setCurrentIngredientsRecipe] = useState(null);
  const [currentMealPrepPlan, setCurrentMealPrepPlan] = useState(null);

  // In-flight tweak markers (one per surface)
  const [cookNowTweakingType, setCookNowTweakingType] = useState(null);
  const [ingredientsTweakingType, setIngredientsTweakingType] = useState(null);
  const [mealPrepTweakingType, setMealPrepTweakingType] = useState(null);

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

  // ── Generate handlers ──────────────────────────────────────────────────────

  const handleCookNow = async () => {
    const params = buildCookNowParams();
    const recipe = await generate('cookNow', params);
    if (recipe) {
      setCurrentCookNowRecipe(recipe);
      setViewingRecipe(recipe);
    }
  };

  const handleIngredients = async () => {
    if (!ingredientes.trim()) return;
    const params = buildIngredientsParams();
    const recipe = await generate('ingredients', params);
    if (recipe) {
      setCurrentIngredientsRecipe(recipe);
      setViewingRecipe(recipe);
    }
  };

  const handleMealPrep = async () => {
    const params = buildMealPrepParams();
    const plan = await mealPrep.generate(params);
    if (plan) {
      setCurrentMealPrepPlan(plan);
      setViewingPlan(plan);
    }
  };

  // ── Tweak handlers (compound on the currently displayed result) ────────────

  const handleCookNowTweak = async (changeType) => {
    if (!currentCookNowRecipe || cookNowTweakingType) return;
    setCookNowTweakingType(changeType);
    try {
      const params = { ...buildCookNowParams(), change_type: changeType };
      const recipe = await generate('cookNow', params, { previousRecipe: currentCookNowRecipe });
      if (recipe) {
        setCurrentCookNowRecipe(recipe);
        setViewingRecipe(recipe);
      }
    } finally {
      setCookNowTweakingType(null);
    }
  };

  const handleIngredientsTweak = async (changeType) => {
    if (!currentIngredientsRecipe || ingredientsTweakingType) return;
    setIngredientsTweakingType(changeType);
    try {
      const params = { ...buildIngredientsParams(), change_type: changeType };
      const recipe = await generate('ingredients', params, { previousRecipe: currentIngredientsRecipe });
      if (recipe) {
        setCurrentIngredientsRecipe(recipe);
        setViewingRecipe(recipe);
      }
    } finally {
      setIngredientsTweakingType(null);
    }
  };

  const handleMealPrepTweak = async (changeType) => {
    if (!currentMealPrepPlan || mealPrepTweakingType) return;
    setMealPrepTweakingType(changeType);
    try {
      const params = { ...buildMealPrepParams(), change_type: changeType };
      const plan = await mealPrep.generate(params, { previousPlan: currentMealPrepPlan });
      if (plan) {
        setCurrentMealPrepPlan(plan);
        setViewingPlan(plan);
      }
    } finally {
      setMealPrepTweakingType(null);
    }
  };

  // ── Suggested ingredient chip → append to textarea ─────────────────────────

  const addIngredient = (item) => {
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

  const handleImageScan = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
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
          onClick={handleCookNow}
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
              onClick={handleIngredients}
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
          onClick={handleMealPrep}
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
