import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock,
  Heart,
  Info,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAppState } from '../context/appState.js';
import { refineRecipe, extractDislikedIngredient, formatCurrencyByCountry } from '../lib/gemini.js';
import { BRAND_LABELS, getRelevantBrandCategories, SAFE_BRANDS, normalizeAndFilterBrandsForProfile } from '../lib/brandDatabase.js';
import { annotateRecipeIngredients, normalizeIngredientEntry } from '../lib/ingredientIntelligence.js';
import { clampServings, parseServingsCount, scaleNutritionLabel, scaleQuantityText } from '../lib/recipeScaling.js';
import { estimateRecipeCost } from '../lib/pricing.js';

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

function SectionCard({ title, icon: Icon, isOpen, onToggle, badge, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} style={{ color: 'var(--c-primary)' }} />
          <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-gray-800 dark:text-slate-300">{badge}</span> : null}
          <ChevronDown size={15} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} px-4 pb-4 pt-1`}>
        {children}
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
  const { addDislike, refineGeneratedRecipe } = useAppState();
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
    if (accept && detectedIngredient) addDislike(detectedIngredient);
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

export default function RecipeCard({ recipe: initialRecipe, onRecipeChange }) {
  const {
    profile,
    setProfile,
    savedMeals,
    setSavedMeals,
    favoriteRecipes,
    setFavoriteRecipes,
    interestedRecipes,
    setInterestedRecipes,
  } = useAppState();

  const [recipe, setRecipe] = useState(initialRecipe);
  const [showAdjust, setShowAdjust] = useState(false);
  const [chefQuestion, setChefQuestion] = useState('');
  const [chefAnswer, setChefAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [refinedBadge, setRefinedBadge] = useState(false);
  const [selectedServings, setSelectedServings] = useState(parseServingsCount(initialRecipe?.servings || 1));
  const [shareFeedback, setShareFeedback] = useState('');
  const [openSections, setOpenSections] = useState({ ingredients: true, brands: false, steps: false, tips: false });
  const [showPer100g, setShowPer100g] = useState(false);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);
  const [heroPreset, setHeroPreset] = useState('');

  useEffect(() => {
    setSelectedServings(parseServingsCount(recipe?.servings || 1));
  }, [recipe?.servings, recipe?.title]);

  const isSavedForPlan = savedMeals?.some(item => item.title === recipe.title);
  const isFavorite = favoriteRecipes?.some(item => item.title === recipe.title);
  const isInterested = interestedRecipes?.some(item => item.title === recipe.title);
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
  const estimatedCost = estimateRecipeCost(displayRecipe.ingredients, profile?.country || 'Chile');
  const estimatedCostLabel = estimatedCost > 0 ? formatCurrencyByCountry(estimatedCost, profile?.country || 'Chile') : 'Costo variable';
  const verifiedBrands = profile ? getVerifiedBrands(recipe, profile) : [];
  const heroImage = recipe.image || recipe.imageUrl || recipe.photo || recipe.coverImage || recipe.thumbnail || null;
  const calories = parseFloat(String(displayRecipe.macros?.calories || '0').replace(/[^\d.]/g, '')) || 0;
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

  const toggleSaveForPlan = () => {
    if (isSavedForPlan) {
      setSavedMeals(savedMeals.filter(item => item.title !== recipe.title));
      return;
    }
    setSavedMeals([...(savedMeals || []), { title: recipe.title, calories: displayRecipe.macros?.calories, servings: selectedServings }]);
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavoriteRecipes(favoriteRecipes.filter(item => item.title !== recipe.title));
      return;
    }
    setFavoriteRecipes([...(favoriteRecipes || []), recipe]);
    if (isInterested) setInterestedRecipes(interestedRecipes.filter(item => item.title !== recipe.title));
  };

  const toggleInterested = () => {
    if (isInterested) {
      setInterestedRecipes(interestedRecipes.filter(item => item.title !== recipe.title));
      return;
    }
    setInterestedRecipes([...(interestedRecipes || []), recipe]);
    if (isFavorite) setFavoriteRecipes(favoriteRecipes.filter(item => item.title !== recipe.title));
  };

  const handleRefined = (refinedRecipe) => {
    setRecipe(refinedRecipe);
    setShowAdjust(false);
    setRefinedBadge(true);
    setOpenSections({ ingredients: true, brands: false, steps: false, tips: false });
    setTimeout(() => setRefinedBadge(false), 3000);
    if (onRecipeChange) onRecipeChange(refinedRecipe);
  };

  const handleShare = async () => {
    const shareText = `${recipe.title}\n${recipe.description || 'Receta generada con NutriChef IA'}\n${window?.location?.href || ''}`.trim();

    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text: recipe.description || `Receta para ${selectedServings} porciones`, url: window.location.href });
        setShareFeedback('Compartida');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('Copiada');
      } else {
        setShareFeedback('Sin soporte para compartir');
      }
    } catch {
      setShareFeedback('No se pudo compartir');
    } finally {
      setTimeout(() => setShareFeedback(''), 2200);
    }
  };

  const askChef = async () => {
    if (!chefQuestion.trim()) return;
    setAsking(true);
    const prompt = `Cocinando: "${recipe.title}". Ingredientes: ${displayRecipe.ingredients?.map(i => i.name)?.join(', ') || 'N/A'}. Pregunta: "${chefQuestion}". Responde en un párrafo corto como chef experto. Solo texto.`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'text', payload: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } } }),
      });
      const data = await response.json();
      setChefAnswer(data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.');
    } catch {
      setChefAnswer('Error de conexión.');
    } finally {
      setAsking(false);
      setChefQuestion('');
    }
  };

  const submitFeedback = () => {
    if (!feedbackReason.trim()) return;
    setProfile(prev => ({ ...prev, learnedPreferences: [...prev.learnedPreferences, `${feedbackType === 'like' ? 'Le encantó' : 'Evitar'}: ${feedbackReason}`] }));
    setFeedbackGiven(true);
  };

  if (!recipe) return null;

  return (
    <div className="overflow-visible rounded-3xl border border-slate-200 bg-white shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 dark:border-gray-800 dark:bg-gray-900">
      <div className="relative overflow-hidden rounded-t-3xl">
        <div className="relative aspect-[4/3] sm:aspect-[16/7]">
          {heroImage ? (
            <img src={heroImage} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_30%),linear-gradient(135deg,var(--c-primary),var(--c-accent))]">
              <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-black/10 blur-2xl" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/45 to-transparent" />

          {(refinedBadge || recipe._refinedFrom) && (
            <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <span className="flex items-center gap-1.5"><Settings2 size={11} /> Ajustada con IA</span>
            </div>
          )}

          <div className="absolute right-4 top-4 flex gap-2">
            {showSecondaryActions && (
              <>
                <button onClick={toggleInterested} className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-white shadow-md backdrop-blur-sm transition-all animate-in fade-in zoom-in-75 ${isInterested ? 'bg-blue-500' : 'bg-slate-950/25'}`} aria-label="Guardar para revisar después">
                  <Bookmark size={18} fill={isInterested ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleShare} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/25 text-white shadow-md backdrop-blur-sm transition-all animate-in fade-in zoom-in-75" aria-label="Compartir receta">
                  <Share2 size={18} />
                </button>
              </>
            )}
            <button onClick={toggleFavorite} className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-white shadow-md backdrop-blur-sm transition-all ${isFavorite ? 'bg-red-500' : 'bg-slate-950/25'}`} aria-label="Marcar como favorita">
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowSecondaryActions(v => !v)} className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 text-white shadow-md backdrop-blur-sm transition-all ${showSecondaryActions ? 'bg-white/20' : 'bg-slate-950/25'}`} aria-label="Más acciones">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 py-5 text-white md:px-8 md:py-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">{recipe.cuisine || 'Receta IA'}</span>
              {shareFeedback && <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white">{shareFeedback}</span>}
            </div>
            <h2 className="max-w-2xl text-lg font-black tracking-tight sm:text-2xl leading-tight">{recipe.title}</h2>
            {recipe.description && (
              <p className="mt-1 max-w-xl text-xs italic text-white/70 leading-relaxed line-clamp-2">{recipe.description}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5 text-xs font-medium"><Clock size={13} /> {recipe.prepTime || '?'}</span>
              <span className="flex items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5 text-xs font-medium"><ChefHat size={13} /> {recipe.cookTime || '?'}</span>
              {calories > 0 && <span className="flex items-center gap-1.5 rounded-xl bg-black/20 px-3 py-1.5 text-xs font-medium"><Zap size={13} /> {displayRecipe.macros.calories}</span>}
              <button onClick={toggleSaveForPlan} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isSavedForPlan ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                <Star size={14} fill={isSavedForPlan ? 'currentColor' : 'none'} />
                {isSavedForPlan ? 'En Plan' : '+ Plan'}
              </button>
              <button onClick={() => setShowAdjust(current => !current)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${showAdjust ? 'bg-white text-slate-900' : 'bg-white/20 text-white'}`}>
                <Settings2 size={13} /> Ajustar
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['+ Proteína', '- Calorías', 'Sin gluten', 'Más rápida'].map(preset => (
                <button
                  key={preset}
                  onClick={() => { setHeroPreset(preset); setShowAdjust(true); }}
                  className="rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="sticky top-16 z-20 -mt-4 mb-1 px-4 sm:px-5 md:-mt-5 md:px-6">
        <div className="rounded-2xl border border-slate-100 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Personas</p>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <Users size={15} style={{ color: 'var(--c-primary)' }} /> {selectedServings} porciones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedServings(current => clampServings(current - 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-[--c-primary-border] hover:bg-[--c-primary-light]" aria-label="Reducir porciones">
                  <Minus size={18} />
                </button>
                <div className="min-w-[76px] rounded-2xl bg-slate-900 px-3 py-2 text-center text-lg font-black text-white">{selectedServings}</div>
                <button onClick={() => setSelectedServings(current => clampServings(current + 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 transition-colors hover:border-[--c-primary-border] hover:bg-slate-50" aria-label="Aumentar porciones">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-right dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Costo receta</p>
              <p className="text-base font-black text-emerald-800 dark:text-emerald-200">{estimatedCostLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-5 pt-4 sm:px-5 md:px-6 md:pb-6">
        {showAdjust && <AdjustPanel recipe={recipe} onRefined={handleRefined} onClose={() => { setShowAdjust(false); setHeroPreset(''); }} initialInstruction={heroPreset} />}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.15fr] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <SectionCard title={`Ingredientes (${displayRecipe.ingredients?.length || 0})`} icon={ShoppingBag} isOpen={openSections.ingredients} onToggle={() => toggleSection('ingredients')} badge={`${selectedServings} pers.`}>
              <ul className="space-y-2.5">
                {displayRecipe.ingredients?.map((ing, index) => <IngredientRow key={index} ing={ing} />)}
              </ul>
            </SectionCard>

            {profile && (
              <SectionCard title="Marcas Sugeridas" icon={ShieldCheck} isOpen={openSections.brands} onToggle={() => toggleSection('brands')} badge={verifiedBrands.length ? `${verifiedBrands.length} seguras` : 'Filtro total'}>
                <BrandSuggestions brands={verifiedBrands} />
              </SectionCard>
            )}
          </div>

          <div className="space-y-4">
            {recipe.macros && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex items-center gap-2">
                  <h4 className="flex-1 text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Nutrición {showPer100g ? '/ 100g' : '/ porción'}
                  </h4>
                  {canShowPer100g && (
                    <>
                      <span className="text-[10px] font-semibold text-slate-400">{showPer100g ? '100g' : 'Total'}</span>
                      <button
                        type="button"
                        onClick={() => setShowPer100g(v => !v)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${showPer100g ? '' : 'bg-slate-200 dark:bg-gray-700'}`}
                        style={showPer100g ? { background: 'var(--c-primary)' } : {}}
                        aria-label="Alternar modo por 100g"
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${showPer100g ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center divide-x divide-slate-100 overflow-x-auto no-scrollbar dark:divide-gray-700">
                  {[
                    { label: 'Cal', value: displayMacros?.calories, color: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Prot', value: displayMacros?.protein, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Carb', value: displayMacros?.carbs, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Gra', value: displayMacros?.fat, color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'Fib', value: displayMacros?.fiber, color: 'text-green-600 dark:text-green-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex-1 shrink-0 px-3 py-1 text-center">
                      <p className={`text-sm font-black ${color}`}>{value || '—'}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                {recipe.seguridad && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <ShieldCheck size={13} className="shrink-0" />
                    {recipe.seguridad}
                  </div>
                )}
              </section>
            )}

            {adjustedIngredientsCount > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                Hemos ajustado {adjustedIngredientsCount} ingrediente{adjustedIngredientsCount === 1 ? '' : 's'} según tus preferencias.
              </div>
            )}

            <SectionCard title={`Instrucciones (${recipe.steps?.length || 0})`} icon={BookOpen} isOpen={openSections.steps} onToggle={() => toggleSection('steps')}>
              <div className="space-y-4">
                {recipe.steps?.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: 'var(--c-primary)' }}>
                      {index + 1}
                    </div>
                    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                      {typeof step === 'string' ? step : step.text || JSON.stringify(step)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {recipe.tips && typeof recipe.tips === 'string' && (
              <SectionCard title="Notas del Chef" icon={Info} isOpen={openSections.tips} onToggle={() => toggleSection('tips')}>
                <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-200"><span className="font-bold">Tip: </span>{recipe.tips}</p>
              </SectionCard>
            )}

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

            <div className="rounded-2xl border p-4" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)' }}>
              <h4 className="mb-1 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--c-primary-text)' }}>
                <RefreshCw size={13} /> ¿Ya la preparaste?
              </h4>
              <p className="mb-3 text-xs opacity-60" style={{ color: 'var(--c-primary-text)' }}>Tu opinión mejora las próximas recomendaciones.</p>

              {!feedbackGiven ? (
                !feedbackType ? (
                  <div className="flex gap-2">
                    <button onClick={() => setFeedbackType('like')} className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-green-200 bg-white py-2.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 dark:bg-gray-800 dark:text-green-400">
                      <ThumbsUp size={16} /> Me encantó
                    </button>
                    <button onClick={() => setFeedbackType('dislike')} className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-red-200 bg-white py-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:bg-gray-800 dark:text-red-400">
                      <ThumbsDown size={16} /> No me gustó
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${feedbackType === 'like' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {feedbackType === 'like' ? '¿Qué fue lo mejor?' : '¿Qué no te gustó?'}
                    </p>
                    <div className="flex gap-2">
                      <input type="text" value={feedbackReason} onChange={e => setFeedbackReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFeedback()} placeholder={feedbackType === 'like' ? 'Ej: el toque de ajo...' : 'Ej: muy seco...'} className="flex-1 rounded-xl border bg-white p-2.5 text-xs outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                      <button onClick={submitFeedback} disabled={!feedbackReason.trim()} className={`rounded-xl px-3 text-xs font-bold text-white disabled:opacity-50 ${feedbackType === 'like' ? 'bg-green-600' : 'bg-red-600'}`}>✓</button>
                      <button onClick={() => { setFeedbackType(null); setFeedbackReason(''); }} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 dark:border-gray-600 dark:bg-gray-800">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-green-100 p-3 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 size={13} /> ¡Guardado en tu perfil!
                </div>
              )}
            </div>

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
                <button onClick={askChef} disabled={asking || !chefQuestion.trim()} className="flex items-center rounded-xl bg-slate-800 px-4 text-white disabled:opacity-60 dark:bg-slate-600">
                  {asking ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
