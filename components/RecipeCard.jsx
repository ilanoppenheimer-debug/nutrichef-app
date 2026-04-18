import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Info,
  MessageSquare,
  Minus,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  X,
  Zap,
} from 'lucide-react';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useCollectionsStore } from '../stores/useCollectionsStore.js';
import { refineRecipe, extractDislikedIngredient } from '../lib/gemini.js';
import { BRAND_LABELS, getRelevantBrandCategories, SAFE_BRANDS, normalizeAndFilterBrandsForProfile } from '../lib/brandDatabase.js';
import { annotateRecipeIngredients, normalizeIngredientEntry } from '../lib/ingredientIntelligence.js';
import { clampServings, parseServingsCount, scaleNutritionLabel, scaleQuantityText } from '../lib/recipeScaling.js';
import RecipeHeaderCompact from './RecipeHeaderCompact.jsx';
import StickyCTA from './StickyCTA.jsx';
import TweakBar, { COOKING_TWEAKS } from './TweakBar.jsx';
import { recordLike, recordDislike } from '../lib/learningEngine.js';
import { askChefAboutRecipe } from '../services/chefService.js';
import { addRecipeToCollection, isRecipeInCollection, removeRecipeFromCollection } from '../helpers/recipeCollectionsHelpers.js';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';

function formatSafetyBadge(reason) {
  if (!reason) return 'Marca verificada';
  if (/p[eé]saj/i.test(reason)) return 'Apto Pésaj';
  if (/kosher/i.test(reason)) return 'Certificado Kosher';
  if (/halal/i.test(reason)) return 'Certificado Halal';
  if (/gluten/i.test(reason)) return 'Sin Gluten';
  if (/l[aá]ct/i.test(reason)) return 'Sin Lácteos';
  if (/soya/i.test(reason)) return 'Sin Soya';
  if (/man[ií]/i.test(reason)) return 'Sin Maní';
  if (/mariscos/i.test(reason)) return 'Sin Mariscos';
  return reason;
}

function getVerifiedBrands(recipe, profile) {
  const relevantCats = getRelevantBrandCategories(profile);
  const aiSuggestions = normalizeAndFilterBrandsForProfile(recipe.marcas_sugeridas || [], profile);
  const localBrands = normalizeAndFilterBrandsForProfile(relevantCats.flatMap(cat => {
    const brands = SAFE_BRANDS[cat];
    return Array.isArray(brands) ? brands.map(brand => ({ ...brand, cat })) : [];
  }), profile);

  return [...aiSuggestions, ...localBrands].filter((brand, index, all) => (
    all.findIndex(candidate => candidate.name === brand.name) === index
  ));
}

function MacroBar({ label, value, color, max }) {
  const raw = parseFloat(String(value || '0').replace(/[^\d.]/g, '')) || 0;
  const pct = Math.min(100, (raw / max) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-bold text-slate-800 dark:text-white">{value || '—'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IngredientRow({ ing }) {
  const [checked, setChecked] = useState(false);
  const isDanger = ing.allergyAlert;
  const isDislike = ing.isDislike && !ing.allergyAlert;

  // Build the quantity string: prefer structured fields, fall back to legacy amount
  const qty = ing.cantidad && ing.unidad
    ? `${ing.cantidad} ${ing.unidad}`
    : ing.cantidad || ing.unidad || ing.amount || '';

  return (
    <li
      onClick={() => setChecked(c => !c)}
      className={`flex cursor-pointer select-none items-start gap-3 rounded-xl border px-3 py-2.5 transition-all ${
        isDanger
          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          : isDislike
          ? 'border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-900/10'
          : checked
          ? 'border-green-200 bg-green-50 opacity-60 dark:border-green-800 dark:bg-green-900/20'
          : 'border-slate-100 bg-white hover:border-slate-200 dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        checked ? 'border-green-500 bg-green-500' : isDanger ? 'border-red-400' : 'border-slate-300 dark:border-gray-500'
      }`}>
        {checked && <CheckCircle2 size={9} className="text-white" />}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Top row: qty + name */}
        <div className="flex items-baseline gap-2 flex-wrap">
          {qty && (
            <span className="shrink-0 text-xs font-black text-slate-400 dark:text-slate-500 tabular-nums">
              {qty}
            </span>
          )}
          <span className={`text-sm font-semibold leading-snug line-clamp-2 ${
            checked ? 'line-through text-slate-400'
            : isDanger ? 'line-through text-red-700 dark:text-red-400'
            : isDislike ? 'text-orange-700 dark:text-orange-300'
            : 'text-slate-800 dark:text-white'
          }`}>
            {ing.name}
          </span>
        </div>

        {/* Badge row */}
        {(isDanger || isDislike || ing.es_seguro_kosher || ing.es_seguro_halal || ing.marca_sugerida) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {isDanger && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-900/40 dark:text-red-300">
                ⚠️ {ing.matchedAllergy || 'alérgeno'}
              </span>
            )}
            {isDislike && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                No te gusta
              </span>
            )}
            {ing.es_seguro_kosher && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                ✡️ Kosher
              </span>
            )}
            {ing.es_seguro_halal && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
                ☪️ Halal
              </span>
            )}
            {ing.marca_sugerida && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-gray-800 dark:border-gray-700 dark:text-slate-300">
                📦 {ing.marca_sugerida}
              </span>
            )}
          </div>
        )}

        {/* Substitute line */}
        {ing.substitute && (
          <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isDanger
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
          }`}>
            <AlertTriangle size={9} className="shrink-0" />
            {isDanger ? 'Sustituto:' : 'Cambiar por:'} {ing.substitute.replace(/\s+(es|son|está|están|se usa|para |que |por su |recomendad).*/i, '').trim()}
          </div>
        )}
      </div>
    </li>
  );
}

function SectionCard({ title, icon: Icon, isOpen, onToggle, badge, headerRight, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-gray-800/60"
      >
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
            <Icon size={14} />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight && <div onClick={e => e.stopPropagation()}>{headerRight}</div>}
          {badge != null ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-gray-800 dark:text-slate-300">{badge}</span> : null}
          <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* CSS grid trick for smooth height transition */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandSuggestions({ brands }) {
  if (!brands.length) {
    return (
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        No mostramos marcas porque ninguna coincide al 100% con tus restricciones activas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {brands.map((brand, index) => {
        const categoryKey = brand.category?.toLowerCase() || brand.cat || 'general';
        const style = BRAND_LABELS[categoryKey] || BRAND_LABELS.general;
        const primaryReason = formatSafetyBadge(brand.reasons?.[0]);

        return (
          <div key={`${brand.name}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-bold tracking-tight text-slate-800 dark:text-white">{brand.name}</p>
                {brand.note && <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{brand.note}</p>}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                <ShieldCheck size={11} /> {primaryReason}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${style.color}`}>
                {style.label}
              </span>
              {(brand.reasons || []).slice(1).map(reason => (
                <span key={`${brand.name}-${reason}`} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <ShieldCheck size={11} /> {formatSafetyBadge(reason)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdjustPanel({ recipe, onRefined, onClose, initialInstruction = '' }) {
  const setProfile = useProfileStore((s) => s.setProfile);
  const addDislike = (item) => setProfile((p) => ({
    ...p,
    dislikes: p.dislikes?.includes(item) ? p.dislikes : [...(p.dislikes || []), item],
  }));
  const refineGeneratedRecipe = () => {}; // no-op — legacy dead code
  const [instruction, setInstruction] = useState(initialInstruction);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialInstruction) setInstruction(initialInstruction);
  }, [initialInstruction]);
  const [error, setError] = useState(null);
  const [detectedIngredient, setDetectedIngredient] = useState(null);
  const [rememberAsked, setRememberAsked] = useState(false);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const refined = await refineRecipe(recipe, instruction);
      const ingredient = extractDislikedIngredient(instruction);

      if (ingredient && !rememberAsked) setDetectedIngredient(ingredient);
      if (recipe._firestoreId) await refineGeneratedRecipe(recipe._firestoreId, refined);

      onRefined({ ...refined, _firestoreId: recipe._firestoreId });
      setInstruction('');
    } catch (err) {
      setError(err.message || 'Error al ajustar la receta.');
    } finally {
      setLoading(false);
    }
  };

  const handleRememberDislike = (accept) => {
    if (accept && detectedIngredient) {
      addDislike(detectedIngredient);
      recordDislike(detectedIngredient, 0.5, true);
    }
    setDetectedIngredient(null);
    setRememberAsked(true);
  };

  const quickAdjustments = [
    'Hazla más proteica',
    'Ajusta para 4 personas',
    'Hazla más económica',
    'Versión sin gluten',
    'Reduce las calorías',
    'Hazla más rápida',
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 rounded-2xl border-2 p-4 duration-200" style={{ borderColor: 'var(--c-primary-border)', background: 'var(--c-primary-light)' }}>
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-black" style={{ color: 'var(--c-primary-text)' }}>
          <Settings2 size={15} /> Ajustar con IA
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      {detectedIngredient && !rememberAsked && (
        <div className="animate-in fade-in rounded-xl border border-amber-200 bg-white p-3 dark:border-amber-700 dark:bg-gray-800">
          <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Notamos que quitaste <strong>"{detectedIngredient}"</strong>. ¿Quieres que lo recordemos para futuras recetas?
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleRememberDislike(true)} className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600">
              Sí, no me gusta
            </button>
            <button onClick={() => handleRememberDislike(false)} className="flex-1 rounded-lg bg-slate-200 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300 dark:bg-gray-700 dark:text-slate-200">
              Solo esta vez
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: 'var(--c-primary-text)' }}>Ajustes rápidos</p>
        <div className="flex flex-wrap gap-1.5">
          {quickAdjustments.map(item => (
            <button
              key={item}
              onClick={() => setInstruction(item)}
              className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-all"
              style={instruction === item
                ? { background: 'var(--c-primary)', color: 'white', borderColor: 'var(--c-primary)' }
                : { background: 'white', color: 'var(--c-primary-text)', borderColor: 'var(--c-primary-border)' }
              }
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-60" style={{ color: 'var(--c-primary-text)' }}>O escribe tu cambio</p>
        <div className="flex gap-2">
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder='Ej: "sin cebolla", "cambia el pollo por tofu", "para 6 porciones"...'
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRefine();
              }
            }}
          />
          <button onClick={handleRefine} disabled={loading || !instruction.trim()} className="shrink-0 rounded-xl px-4 text-sm font-bold text-white transition-all disabled:opacity-50" style={{ background: 'var(--c-primary)' }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Settings2 size={16} />}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <p className="text-[10px] opacity-50" style={{ color: 'var(--c-primary-text)' }}>
        Los ajustes menores usan menos tokens y se guardan en tu historial automáticamente.
      </p>
    </div>
  );
}

function parseTotalWeightGrams(ingredients = []) {
  let total = 0;
  for (const ing of ingredients) {
    const amount = String(ing.amount || '');
    const match = amount.match(/(\d+(?:\.\d+)?)\s*(?:g|ml|gr|grs)\b/i);
    if (match) total += parseFloat(match[1]);
  }
  return total;
}

export default function RecipeCard({ recipe: initialRecipe, onRecipeChange, onTweak, tweakingType }) {
  const { askConfirmation } = useConfirmDialog();
  const profile = useProfileStore((s) => s.profile);
  const savedMeals = useCollectionsStore((s) => s.savedMeals);
  const setSavedMeals = useCollectionsStore((s) => s.setSavedMeals);
  const favoriteRecipes = useCollectionsStore((s) => s.favoriteRecipes);
  const setFavoriteRecipes = useCollectionsStore((s) => s.setFavoriteRecipes);
  const interestedRecipes = useCollectionsStore((s) => s.interestedRecipes);
  const setInterestedRecipes = useCollectionsStore((s) => s.setInterestedRecipes);

  const [recipe, setRecipe] = useState(initialRecipe);
  const [showAdjust, setShowAdjust] = useState(false);
  const [chefQuestion, setChefQuestion] = useState('');
  const [chefAnswer, setChefAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [refinedBadge, setRefinedBadge] = useState(false);
  const [selectedServings, setSelectedServings] = useState(parseServingsCount(initialRecipe?.servings || 1));
  const [openSections, setOpenSections] = useState({ ingredients: true, brands: false, steps: false, tips: false });
  const [showPer100g, setShowPer100g] = useState(false);

  useEffect(() => {
    setSelectedServings(parseServingsCount(recipe?.servings || 1));
  }, [recipe?.servings, recipe?.title]);

  const isSavedForPlan = isRecipeInCollection(savedMeals, recipe.title);
  const isFavorite = isRecipeInCollection(favoriteRecipes, recipe.title);
  const isInterested = isRecipeInCollection(interestedRecipes, recipe.title);
  const baseServings = parseServingsCount(recipe?.servings || 1);
  const servingsScale = selectedServings / baseServings;
  const normalizedIngredients = recipe.ingredients?.map(ing => {
    const normalized = normalizeIngredientEntry(ing);
    return { ...normalized, amount: scaleQuantityText(normalized.amount, servingsScale) };
  }) || [];
  const ingredientInsights = annotateRecipeIngredients({ ...recipe, ingredients: normalizedIngredients }, profile || {});
  const displayRecipe = {
    ...recipe,
    servings: `${selectedServings} porciones`,
    ingredients: ingredientInsights.ingredients,
    macros: recipe.macros ? {
      ...recipe.macros,
      calories: scaleNutritionLabel(recipe.macros.calories, servingsScale),
      protein: scaleNutritionLabel(recipe.macros.protein, servingsScale),
      carbs: scaleNutritionLabel(recipe.macros.carbs, servingsScale),
      fat: scaleNutritionLabel(recipe.macros.fat, servingsScale),
      fiber: scaleNutritionLabel(recipe.macros.fiber, servingsScale),
    } : recipe.macros,
  };
  const verifiedBrands = profile ? getVerifiedBrands(recipe, profile) : [];
  const adjustedIngredientsCount = ingredientInsights.ingredients.filter(item => item.isDislike && item.substitute).length;

  const totalWeightG = parseTotalWeightGrams(displayRecipe.ingredients);
  const canShowPer100g = totalWeightG >= 50;
  const scaleValuePer100g = (valueStr) => {
    if (!totalWeightG) return '—';
    const raw = parseFloat(String(valueStr || '0').replace(/[^\d.]/g, '')) || 0;
    return `${((raw / totalWeightG) * 100).toFixed(1)}`;
  };
  const displayMacros = showPer100g && canShowPer100g ? {
    calories: `${scaleValuePer100g(displayRecipe.macros?.calories)} kcal`,
    protein: `${scaleValuePer100g(displayRecipe.macros?.protein)}g`,
    carbs: `${scaleValuePer100g(displayRecipe.macros?.carbs)}g`,
    fat: `${scaleValuePer100g(displayRecipe.macros?.fat)}g`,
    fiber: `${scaleValuePer100g(displayRecipe.macros?.fiber)}g`,
  } : displayRecipe.macros;

  const toggleSection = (section) => {
    setOpenSections(current => ({ ...current, [section]: !current[section] }));
  };

  const toggleSaveForPlan = async () => {
    if (isSavedForPlan) {
      const confirmed = await askConfirmation({
        title: 'Quitar del plan',
        description: '¿Quieres quitar esta receta de tu plan guardado?',
        confirmLabel: 'Quitar',
        danger: true,
      });
      if (!confirmed) return;
      setSavedMeals(removeRecipeFromCollection(savedMeals, recipe.title));
      return;
    }
    setSavedMeals(addRecipeToCollection(savedMeals, { title: recipe.title, calories: displayRecipe.macros?.calories, servings: selectedServings }));
  };

  const toggleFavorite = async () => {
    if (isFavorite) {
      const confirmed = await askConfirmation({
        title: 'Quitar favorita',
        description: '¿Quieres quitar esta receta de tus favoritas?',
        confirmLabel: 'Quitar',
        danger: true,
      });
      if (!confirmed) return;
      setFavoriteRecipes(removeRecipeFromCollection(favoriteRecipes, recipe.title));
      return;
    }
    setFavoriteRecipes(addRecipeToCollection(favoriteRecipes, recipe));
    if (isInterested) setInterestedRecipes(removeRecipeFromCollection(interestedRecipes, recipe.title));
    // Learning: record positive signals for recipe ingredients
    (recipe.ingredients || []).forEach(ing => {
      const name = ing.nombre || ing.name;
      if (name && !ing.isDislike && !ing.allergyAlert) recordLike(name, 0.2);
    });
  };

  const handleRefined = (refinedRecipe) => {
    setRecipe(refinedRecipe);
    setShowAdjust(false);
    setRefinedBadge(true);
    setOpenSections({ ingredients: true, brands: false, steps: false, tips: false });
    setTimeout(() => setRefinedBadge(false), 3000);
    if (onRecipeChange) onRecipeChange(refinedRecipe);
  };

  const askChef = async () => {
    if (!chefQuestion.trim()) return;
    setAsking(true);
    try {
      const answer = await askChefAboutRecipe({
        recipeTitle: recipe.title,
        ingredientNames: displayRecipe.ingredients?.map((item) => item.name)?.join(', ') || 'N/A',
        question: chefQuestion,
      });
      setChefAnswer(answer);
    } catch {
      setChefAnswer('Error de conexión.');
    } finally {
      setAsking(false);
      setChefQuestion('');
    }
  };


  if (!recipe) return null;

  return (
    <div className="overflow-visible rounded-3xl border border-slate-200 bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 dark:border-gray-800 dark:bg-gray-900">

      {/* ── Header compacto: título + métricas ── */}
      <RecipeHeaderCompact
        title={recipe.title}
        macros={displayRecipe.macros}
        prepTime={recipe.prepTime}
        isRefined={refinedBadge || !!recipe._refinedFrom}
      />

      {/* ── Contenido con scroll (progressive disclosure) ─────────── */}
      <div className="space-y-2.5 px-4 pt-2 pb-32 sm:px-5 md:px-6 sm:pb-8 lg:pb-6">

        {/* AdjustPanel — revealed when toggled from sticky CTA */}
        {showAdjust && (
          <AdjustPanel
            recipe={recipe}
            onRefined={handleRefined}
            onClose={() => setShowAdjust(false)}
          />
        )}

        {/* Allergy / dislike notice */}
        {adjustedIngredientsCount > 0 && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle size={14} className="shrink-0 text-amber-500" />
            Ajustamos {adjustedIngredientsCount} ingrediente{adjustedIngredientsCount === 1 ? '' : 's'} según tus preferencias.
          </div>
        )}

        {/* ①+② Ingredientes y Preparación — lado a lado en desktop (lg+) */}
        <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start">

        {/* ① Ingredientes — open by default, servings control in header */}
        <SectionCard
          title="Ingredientes"
          icon={ShoppingBag}
          isOpen={openSections.ingredients}
          onToggle={() => toggleSection('ingredients')}
          badge={String(displayRecipe.ingredients?.length || 0)}
          headerRight={
            <div className="flex items-center gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); setSelectedServings(s => clampServings(s - 1)); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-200 transition-all active:scale-90"
                aria-label="Reducir porciones"
              >
                <Minus size={13} />
              </button>
              <span className="min-w-[32px] rounded-lg px-1.5 py-0.5 text-center text-xs font-black text-white" style={{ background: 'var(--c-primary)' }}>
                {selectedServings}
              </span>
              <button
                onClick={e => { e.stopPropagation(); setSelectedServings(s => clampServings(s + 1)); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200 transition-all active:scale-90"
                aria-label="Aumentar porciones"
              >
                <Plus size={13} />
              </button>
            </div>
          }
        >
          <ul className="space-y-2">
            {displayRecipe.ingredients?.map((ing, index) => <IngredientRow key={index} ing={ing} />)}
          </ul>
        </SectionCard>

        {/* ② Preparación — closed by default, unlocked when ready to cook */}
        <SectionCard
          title="Preparación"
          icon={BookOpen}
          isOpen={openSections.steps}
          onToggle={() => toggleSection('steps')}
          badge={recipe.steps?.length ? `${recipe.steps.length} pasos` : undefined}
        >
          <div className="space-y-4">
            {recipe.steps?.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: 'var(--c-primary)' }}>
                  {index + 1}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {typeof step === 'string' ? step : step.text || JSON.stringify(step)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        </div>
        {/* ── fin grid lg (ingredientes + preparación) ────────────── */}

        {/* ③ Nutrición detallada — secondary, closed by default */}
        {recipe.macros && (
          <SectionCard
            title="Nutrición"
            icon={Zap}
            isOpen={openSections.nutrition ?? false}
            onToggle={() => toggleSection('nutrition')}
            badge={showPer100g ? 'por 100g' : 'por porción'}
          >
            <div className="space-y-3">
              {canShowPer100g && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ver por 100g</span>
                  <button
                    type="button"
                    onClick={() => setShowPer100g(v => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${showPer100g ? '' : 'bg-slate-200 dark:bg-gray-600'}`}
                    style={showPer100g ? { background: 'var(--c-primary)' } : {}}
                    aria-label="Alternar modo por 100g"
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${showPer100g ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Cal',    value: displayMacros?.calories, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Prot',   value: displayMacros?.protein,  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
                  { label: 'Carbs',  value: displayMacros?.carbs,    color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Grasas', value: displayMacros?.fat,      color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-900/20'   },
                  { label: 'Fibra',  value: displayMacros?.fiber,    color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl px-1 py-2.5 text-center`}>
                    <p className={`text-xs font-black leading-none ${color} dark:opacity-90`}>{value || '—'}</p>
                    <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              {recipe.seguridad && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={13} className="shrink-0" />
                  {recipe.seguridad}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ④ Marcas — tertiary, only shown when profile has dietary restrictions */}
        {profile && verifiedBrands.length > 0 && (
          <SectionCard
            title="Marcas verificadas"
            icon={ShieldCheck}
            isOpen={openSections.brands}
            onToggle={() => toggleSection('brands')}
            badge={String(verifiedBrands.length)}
          >
            <BrandSuggestions brands={verifiedBrands} />
          </SectionCard>
        )}

        {/* ⑤ Tips del chef */}
        {recipe.tips && typeof recipe.tips === 'string' && (
          <SectionCard
            title="Nota del Chef"
            icon={Info}
            isOpen={openSections.tips}
            onToggle={() => toggleSection('tips')}
          >
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="font-bold" style={{ color: 'var(--c-primary)' }}>Tip: </span>
              {recipe.tips}
            </p>
          </SectionCard>
        )}

        {/* ⑥ Historial de ajustes — only when refined */}
        {recipe._refinements?.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ajustes aplicados</p>
            <div className="space-y-1.5">
              {recipe._refinements.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Settings2 size={10} />
                  <span>"{item.instruction}"</span>
                  <span className="text-[10px] opacity-50">{new Date(item.at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑦ Passive learning notice */}
        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/40 px-4 py-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            NutriChef aprende de tus ajustes y favoritos automáticamente.
          </p>
        </div>

        {/* ⑧ Chef IA — below fold, power-user feature */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
            <MessageSquare size={13} style={{ color: 'var(--c-primary)' }} /> Pregúntale al Chef IA
          </h4>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">¿Dudas sobre técnica, sustitutos o tiempos?</p>
          {chefAnswer && (
            <div className="mb-3 rounded-xl border p-3 text-xs animate-in fade-in" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)', color: 'var(--c-primary-text)' }}>
              <span className="mb-1 block font-bold">Chef:</span>{chefAnswer}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={chefQuestion} onChange={e => setChefQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askChef()} placeholder="Ej: ¿A cuántos grados el horno?" className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <button onClick={askChef} disabled={asking || !chefQuestion.trim()} className="flex items-center rounded-xl bg-slate-800 px-4 text-white disabled:opacity-60 dark:bg-slate-600 active:bg-slate-700 transition-colors">
              {asking ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* ⑨ TweakBar — moved to bottom so user sees recipe first */}
        {onTweak && (
          <TweakBar
            options={COOKING_TWEAKS}
            onTweak={onTweak}
            tweakingType={tweakingType}
            label="¿Ajustar esta receta?"
          />
        )}

      </div>

      <StickyCTA
        isSavedForPlan={isSavedForPlan}
        isFavorite={isFavorite}
        showAdjust={showAdjust}
        onTogglePlan={toggleSaveForPlan}
        onToggleFavorite={toggleFavorite}
        onToggleAdjust={() => setShowAdjust(v => !v)}
      />
    </div>
  );
}
