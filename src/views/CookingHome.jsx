import { useEffect, useState } from 'react';
import { ChevronRight, Flame, Package, Plus, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import RecipeBottomSheet from '../components/RecipeBottomSheet.jsx';
import { MealPrepResultCard, MealPrepSheet } from '../components/MealPrepPlanCard.jsx';
import { useCooking } from '../hooks/useCooking.js';
import { useMealPrep } from '../hooks/useMealPrep.js';

// ── Intent options (single source of truth) ──────────────────────────────────

const INTENT_OPTIONS = [
  { value: 'inspirame', label: '✨ Inspírame' },
  { value: 'proteico',  label: '💪 Proteico' },
  { value: 'liviano',   label: '🥗 Liviano' },
  { value: 'dulce',     label: '🍫 Dulce' },
  { value: 'economico', label: '💸 Económico' },
  { value: 'snack',     label: '🍎 Snack' },
];
const VALID_INTENTS = new Set(INTENT_OPTIONS.map(o => o.value));
const INTENT_STORAGE_KEY = 'nutrichef_cook_intent';

function loadInitialIntent() {
  try {
    const saved = localStorage.getItem(INTENT_STORAGE_KEY);
    if (saved && VALID_INTENTS.has(saved)) return saved;
  } catch { /* ignore */ }
  return 'inspirame';
}

// ── Suggested ingredient chips for the "tengo ingredientes" card ─────────────

const SUGGESTED_INGREDIENTS = [
  'pollo', 'arroz', 'huevo', 'atún', 'pasta', 'tomate', 'cebolla', 'lentejas',
];

// ── Time-of-day bucket (silent meal-type inference for the model) ────────────

function getTimeOfDay(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'manana';
  if (hour >= 11 && hour < 16) return 'mediodia';
  if (hour >= 16 && hour < 19) return 'tarde';
  if (hour >= 19 && hour < 23) return 'noche';
  return 'noche_tarde';
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

  // Intent (persisted, falls back to "inspirame")
  const [intent, setIntent] = useState(loadInitialIntent);
  useEffect(() => {
    try { localStorage.setItem(INTENT_STORAGE_KEY, intent); } catch { /* ignore */ }
  }, [intent]);

  // Ingredients input
  const [ingredientes, setIngredientes] = useState('');

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
  const buildCookNowParams = () => ({ intent, time_of_day: getTimeOfDay() });
  const buildIngredientsParams = () => ({
    intent,
    time_of_day: getTimeOfDay(),
    ingredientes: ingredientes.trim(),
  });
  const buildMealPrepParams = () => ({ intent });

  // When intent or ingredients change, sync the displayed result to whatever
  // the cache has for the new params (or null). Discards stale tweaks.
  useEffect(() => {
    setCurrentCookNowRecipe(getRecipe('cookNow', buildCookNowParams()));
    setCurrentMealPrepPlan(mealPrep.getPlan(buildMealPrepParams()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  useEffect(() => {
    setCurrentIngredientsRecipe(getRecipe('ingredients', buildIngredientsParams()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, ingredientes]);

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

  // ── Loading / error helpers for the active sheet ───────────────────────────

  // Which surface owns viewingRecipe → wire its tweak handler to the sheet
  const recipeSheetTweakHandler = (() => {
    if (!viewingRecipe) return null;
    if (viewingRecipe === currentCookNowRecipe) return handleCookNowTweak;
    if (viewingRecipe === currentIngredientsRecipe) return handleIngredientsTweak;
    return null;
  })();
  const recipeSheetTweakingType = (() => {
    if (!viewingRecipe) return null;
    if (viewingRecipe === currentCookNowRecipe) return cookNowTweakingType;
    if (viewingRecipe === currentIngredientsRecipe) return ingredientsTweakingType;
    return null;
  })();

  const cookNowParams = buildCookNowParams();
  const ingredientsParams = buildIngredientsParams();
  const mealPrepParams = buildMealPrepParams();

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <header className="pt-1">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">¿Qué te apetece hoy?</h1>
      </header>

      {/* ── 2. Intent chips (single source of truth, persisted) ───────────── */}
      <nav
        aria-label="Intención"
        className="-mx-1 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-2 px-1 pb-1 min-w-max">
          {INTENT_OPTIONS.map(opt => {
            const isActive = intent === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntent(opt.value)}
                aria-pressed={isActive}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
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
        </div>
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

      {/* Card 2: Tengo ingredientes */}
      <ActionCard
        icon={ShoppingBag}
        title="Tengo ingredientes"
        subtitle="Dime qué tienes y resuelvo el resto"
      >
        <textarea
          value={ingredientes}
          onChange={e => setIngredientes(e.target.value)}
          placeholder="Ej: pollo, arroz, zanahoria..."
          rows={2}
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:border-[--c-primary-border] transition-colors"
        />

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
        onTweak={recipeSheetTweakHandler}
        tweakingType={recipeSheetTweakingType}
      />

      <MealPrepSheet
        plan={viewingPlan}
        onClose={() => setViewingPlan(null)}
        onTweak={handleMealPrepTweak}
        tweakingType={mealPrepTweakingType}
      />
    </div>
  );
}
