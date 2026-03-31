import { useEffect, useState } from 'react';
import {
  AlertTriangle, Bookmark, BookOpen, CheckCircle2, ChefHat,
  Clock, Heart, Info, MessageSquare, Minus, Plus, RefreshCw, Send,
  Settings2, ShoppingBag, Star, ThumbsDown, ThumbsUp, X, Zap,
  Users,
} from 'lucide-react';
import { useAppState } from '../context/appState.js';
import { refineRecipe, extractDislikedIngredient } from '../lib/gemini.js';
import { BRAND_LABELS, getRelevantBrandCategories, SAFE_BRANDS } from '../lib/brandDatabase.js';
import { clampServings, parseServingsCount, scaleNutritionLabel, scaleQuantityText } from '../lib/recipeScaling.js';

// ── Barra de macro ─────────────────────────────────────────────────────────────
function MacroBar({ label, value, color, max }) {
  const raw = parseFloat(String(value || '0').replace(/[^\d.]/g, '')) || 0;
  const pct = Math.min(100, (raw / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-bold text-slate-800 dark:text-white">{value || '—'}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Ingrediente con checkbox — layout adaptativo para nombres largos ────────────
function IngredientRow({ ing }) {
  const [checked, setChecked] = useState(false);
  const isLong = (ing.name?.length || 0) > 22;

  return (
    <li
      onClick={() => setChecked(c => !c)}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
        checked
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 opacity-60'
          : 'bg-slate-50 dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-[--c-primary-border]'
      }`}
    >
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-gray-500'
      }`}>
        {checked && <CheckCircle2 size={11} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        {isLong ? (
          <>
            <p className={`text-sm font-medium leading-snug mb-1 ${checked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
              {ing.name}
            </p>
            {ing.amount && (
              <span className="inline-block text-xs font-bold px-2 py-0.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-gray-600">
                {ing.amount}
              </span>
            )}
          </>
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-sm font-medium leading-tight ${checked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
              {ing.name}
            </span>
            {ing.amount && (
              <span className="shrink-0 text-xs font-bold px-2 py-0.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-gray-600 whitespace-nowrap">
                {ing.amount}
              </span>
            )}
          </div>
        )}
        {ing.substitute && (
          <div className="mt-1.5 text-xs flex gap-1 items-start" style={{ color: 'var(--c-primary)' }}>
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            <span className="opacity-80 leading-tight">Sub: <strong>{ing.substitute}</strong></span>
          </div>
        )}
      </div>
    </li>
  );
}

// ── Guía de Compra Inteligente ─────────────────────────────────────────────────
function SmartShoppingGuide({ recipe, profile }) {
  const relevantCats = getRelevantBrandCategories(profile);
  const aiSuggestions = recipe.marcas_sugeridas || [];
  const localBrands = relevantCats.flatMap(cat => {
    const brands = SAFE_BRANDS[cat];
    return Array.isArray(brands) ? brands.map(b => ({ ...b, cat })) : [];
  });
  if (!aiSuggestions.length && !localBrands.length) return null;

  return (
    <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 border border-slate-100 dark:border-gray-700">
      <h4 className="text-xs font-black text-slate-700 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wide">
        <ShoppingBag size={14} style={{ color: 'var(--c-primary)' }} /> Guía de Compra Inteligente
      </h4>
      {aiSuggestions.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Sugeridas por IA</p>
          <div className="flex flex-wrap gap-1.5">
            {aiSuggestions.map((s, i) => {
              const brand = typeof s === 'string' ? { name: s, category: 'general' } : s;
              const style = BRAND_LABELS[brand.category?.toLowerCase()] || BRAND_LABELS.powerlifting;
              return (
                <span key={i} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${style.color}`} title={brand.note}>
                  {brand.name}
                  {style && <span className="ml-1 opacity-60 text-[10px]">· {style.label}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {localBrands.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Verificadas para tu dieta</p>
          <div className="flex flex-wrap gap-1.5">
            {localBrands.map((b, i) => {
              const style = BRAND_LABELS[b.cat] || BRAND_LABELS.powerlifting;
              return (
                <span key={i} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${style.color}`} title={b.note}>
                  {b.name} <span className="opacity-60 text-[10px]">· {style.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Panel "Ajustar con IA" ─────────────────────────────────────────────────────
function AdjustPanel({ recipe, onRefined, onClose }) {
  const { addDislike, refineGeneratedRecipe } = useAppState();
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Feedback loop: ingrediente detectado para recordar
  const [detectedIngredient, setDetectedIngredient] = useState(null);
  const [rememberAsked, setRememberAsked] = useState(false);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const refined = await refineRecipe(recipe, instruction);

      // Detectar si el usuario quitó un ingrediente — feedback loop
      const ingredient = extractDislikedIngredient(instruction);
      if (ingredient && !rememberAsked) {
        setDetectedIngredient(ingredient);
      }

      // Actualizar en Firestore si la receta tiene ID
      if (recipe._firestoreId) {
        await refineGeneratedRecipe(recipe._firestoreId, refined);
      }

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
    }
    setDetectedIngredient(null);
    setRememberAsked(true);
  };

  const QUICK_ADJUSTMENTS = [
    'Hazla más proteica',
    'Ajusta para 4 personas',
    'Hazla más económica',
    'Versión sin gluten',
    'Reduce las calorías',
    'Hazla más rápida',
  ];

  return (
    <div className="rounded-2xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200" style={{ borderColor: 'var(--c-primary-border)', background: 'var(--c-primary-light)' }}>
      <div className="flex items-center justify-between">
        <h4 className="font-black text-sm flex items-center gap-2" style={{ color: 'var(--c-primary-text)' }}>
          <Settings2 size={15} /> Ajustar con IA
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      {/* Feedback loop — pregunta si recordar el ingrediente eliminado */}
      {detectedIngredient && !rememberAsked && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-amber-200 dark:border-amber-700 animate-in fade-in">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
            💡 Notamos que quitaste <strong>"{detectedIngredient}"</strong>. ¿Quieres que lo recordemos para futuras recetas?
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleRememberDislike(true)} className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors">
              Sí, no me gusta
            </button>
            <button onClick={() => handleRememberDislike(false)} className="flex-1 py-1.5 rounded-lg bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition-colors">
              Solo esta vez
            </button>
          </div>
        </div>
      )}

      {/* Ajustes rápidos */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 opacity-60" style={{ color: 'var(--c-primary-text)' }}>Ajustes rápidos</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ADJUSTMENTS.map(adj => (
            <button
              key={adj}
              onClick={() => setInstruction(adj)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
              style={instruction === adj
                ? { background: 'var(--c-primary)', color: 'white', borderColor: 'var(--c-primary)' }
                : { background: 'white', color: 'var(--c-primary-text)', borderColor: 'var(--c-primary-border)' }
              }
            >
              {adj}
            </button>
          ))}
        </div>
      </div>

      {/* Campo libre */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-60" style={{ color: 'var(--c-primary-text)' }}>O escribe tu cambio</p>
        <div className="flex gap-2">
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder='Ej: "sin cebolla", "cambia el pollo por tofu", "para 6 porciones"...'
            rows={2}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-xs outline-none bg-white dark:bg-gray-800 dark:text-white resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
          />
          <button
            onClick={handleRefine}
            disabled={loading || !instruction.trim()}
            className="px-4 rounded-xl font-bold text-white text-sm flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0"
            style={{ background: 'var(--c-primary)' }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Settings2 size={16} />}
            {loading ? '' : 'Ajustar'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <p className="text-[10px] opacity-50" style={{ color: 'var(--c-primary-text)' }}>
        Los ajustes menores usan menos tokens (temperatura baja). La receta se actualiza automáticamente en tu historial.
      </p>
    </div>
  );
}

// ── RecipeCard principal ───────────────────────────────────────────────────────
export default function RecipeCard({ recipe: initialRecipe, onRecipeChange }) {
  const { profile, setProfile, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes, saveGeneratedRecipe } = useAppState();

  // La receta puede cambiar cuando se refina — estado local para re-render inmediato
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

  useEffect(() => {
    setSelectedServings(parseServingsCount(recipe?.servings || 1));
  }, [recipe?.servings, recipe?.title]);

  const isSavedForPlan = savedMeals?.some(m => m.title === recipe.title);
  const isFavorite = favoriteRecipes?.some(r => r.title === recipe.title);
  const isInterested = interestedRecipes?.some(r => r.title === recipe.title);
  const baseServings = parseServingsCount(recipe?.servings || 1);
  const servingsScale = selectedServings / baseServings;
  const displayRecipe = {
    ...recipe,
    servings: `${selectedServings} porciones`,
    ingredients: recipe.ingredients?.map(ing => ({
      ...ing,
      amount: scaleQuantityText(ing.amount, servingsScale),
    })) || [],
    macros: recipe.macros ? {
      ...recipe.macros,
      calories: scaleNutritionLabel(recipe.macros.calories, servingsScale),
      protein: scaleNutritionLabel(recipe.macros.protein, servingsScale),
      carbs: scaleNutritionLabel(recipe.macros.carbs, servingsScale),
      fat: scaleNutritionLabel(recipe.macros.fat, servingsScale),
      fiber: scaleNutritionLabel(recipe.macros.fiber, servingsScale),
    } : recipe.macros,
  };

  const toggleSaveForPlan = () => {
    if (isSavedForPlan) setSavedMeals(savedMeals.filter(m => m.title !== recipe.title));
    else setSavedMeals([...(savedMeals || []), { title: recipe.title, calories: displayRecipe.macros?.calories, servings: selectedServings }]);
  };
  const toggleFavorite = () => {
    if (isFavorite) setFavoriteRecipes(favoriteRecipes.filter(r => r.title !== recipe.title));
    else { setFavoriteRecipes([...(favoriteRecipes || []), recipe]); if (isInterested) setInterestedRecipes(interestedRecipes.filter(r => r.title !== recipe.title)); }
  };
  const toggleInterested = () => {
    if (isInterested) setInterestedRecipes(interestedRecipes.filter(r => r.title !== recipe.title));
    else { setInterestedRecipes([...(interestedRecipes || []), recipe]); if (isFavorite) setFavoriteRecipes(favoriteRecipes.filter(r => r.title !== recipe.title)); }
  };

  // Cuando la IA devuelve una receta refinada, actualizar estado local
  const handleRefined = (refinedRecipe) => {
    setRecipe(refinedRecipe);
    setShowAdjust(false);
    setRefinedBadge(true);
    setTimeout(() => setRefinedBadge(false), 3000);
    if (onRecipeChange) onRecipeChange(refinedRecipe);
  };

  const askChef = async () => {
    if (!chefQuestion.trim()) return;
    setAsking(true);
    const prompt = `Cocinando: "${recipe.title}". Ingredientes: ${recipe.ingredients?.map(i => i.name).join(', ') || 'N/A'}. Pregunta: "${chefQuestion}". Responde en un párrafo corto como chef experto. Solo texto.`;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'text', payload: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } } })
      });
      const data = await response.json();
      setChefAnswer(data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.');
    } catch { setChefAnswer('Error de conexión.'); }
    finally { setAsking(false); setChefQuestion(''); }
  };

  const submitFeedback = () => {
    if (!feedbackReason.trim()) return;
    setProfile(prev => ({ ...prev, learnedPreferences: [...prev.learnedPreferences, `${feedbackType === 'like' ? 'Le encantó' : 'Evitar'}: ${feedbackReason}`] }));
    setFeedbackGiven(true);
  };

  if (!recipe) return null;
  const calories = parseFloat(String(displayRecipe.macros?.calories || '0').replace(/[^\d.]/g, '')) || 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="p-6 md:p-8 text-white relative" style={{ background: `linear-gradient(135deg, var(--c-primary), var(--c-accent))` }}>
        {/* Badge de receta ajustada */}
        {(refinedBadge || recipe._refinedFrom) && (
          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Settings2 size={11} /> Ajustada con IA
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={toggleInterested} className={`p-2.5 rounded-full transition-all shadow-md backdrop-blur-sm ${isInterested ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30 border border-white/20'}`}>
            <Bookmark size={16} fill={isInterested ? 'currentColor' : 'none'} />
          </button>
          <button onClick={toggleFavorite} className={`p-2.5 rounded-full transition-all shadow-md backdrop-blur-sm ${isFavorite ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30 border border-white/20'}`}>
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={toggleSaveForPlan} className={`px-3 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-md backdrop-blur-sm ${isSavedForPlan ? 'bg-yellow-400 text-yellow-900' : 'bg-black/20 hover:bg-black/30 border border-white/20'}`}>
            <Star size={14} fill={isSavedForPlan ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{isSavedForPlan ? 'En Plan' : '+ Plan'}</span>
          </button>
        </div>

        <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3 mt-10 sm:mt-0">{recipe.cuisine || 'Receta IA'}</span>
        <h2 className="text-xl md:text-3xl font-black mb-2 pr-20 leading-tight">{recipe.title}</h2>
        <p className="text-white/80 text-sm leading-relaxed mb-4">{recipe.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl text-xs font-medium"><Clock size={13} /> {recipe.prepTime || '?'}</span>
          <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl text-xs font-medium"><ChefHat size={13} /> {recipe.cookTime || '?'}</span>
          {calories > 0 && <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl text-xs font-medium"><Zap size={13} /> {displayRecipe.macros.calories}</span>}
          {/* Botón Ajustar en el header para fácil acceso */}
          <button
            onClick={() => setShowAdjust(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showAdjust ? 'bg-white text-slate-800' : 'bg-white/20 hover:bg-white/30 border border-white/20'}`}
          >
            <Settings2 size={13} /> Ajustar
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-black/15 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-black text-white/70">Porciones</p>
            <p className="text-sm font-bold flex items-center gap-2">
              <Users size={15} /> Rinde para {selectedServings} personas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedServings(current => clampServings(current - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
              aria-label="Reducir porciones"
            >
              <Minus size={18} />
            </button>
            <div className="min-w-[84px] text-center rounded-xl bg-white text-slate-900 px-3 py-2 font-black text-lg">
              {selectedServings}
            </div>
            <button
              onClick={() => setSelectedServings(current => clampServings(current + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 transition-colors hover:bg-white/90"
              aria-label="Aumentar porciones"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 space-y-5">

        {/* Panel Ajustar con IA — aparece aquí cuando se activa */}
        {showAdjust && (
          <AdjustPanel
            recipe={recipe}
            onRefined={handleRefined}
            onClose={() => setShowAdjust(false)}
          />
        )}

        {/* Macros */}
        {recipe.macros && (
          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-5 border border-slate-100 dark:border-gray-700">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Información Nutricional</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <MacroBar label="Proteína" value={displayRecipe.macros.protein} color="bg-blue-500" max={60} />
              <MacroBar label="Carbohidratos" value={displayRecipe.macros.carbs} color="bg-amber-400" max={120} />
              <MacroBar label="Grasa" value={displayRecipe.macros.fat} color="bg-rose-400" max={50} />
              <MacroBar label="Fibra" value={displayRecipe.macros.fiber} color="bg-green-500" max={30} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Ingredientes */}
          <div className="md:col-span-5 space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide">
                🛒 Ingredientes ({displayRecipe.ingredients?.length || 0})
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Toca para marcar mientras cocinas</p>
            </div>
            <ul className="space-y-2">
              {displayRecipe.ingredients?.map((ing, i) => <IngredientRow key={i} ing={ing} />)}
            </ul>
            {profile && <SmartShoppingGuide recipe={recipe} profile={profile} />}
          </div>

          {/* Pasos + Feedback + Chef */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                <BookOpen size={15} style={{ color: 'var(--c-primary)' }} /> Preparación
              </h3>
              <div className="space-y-4">
                {recipe.steps?.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full font-black text-xs flex items-center justify-center text-white mt-0.5" style={{ background: 'var(--c-primary)' }}>
                      {i + 1}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                      {typeof step === 'string' ? step : step.text || JSON.stringify(step)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {recipe.tips && typeof recipe.tips === 'string' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed"><span className="font-bold">Tip: </span>{recipe.tips}</p>
              </div>
            )}

            {/* Historial de refinamientos */}
            {recipe._refinements?.length > 0 && (
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 border border-slate-100 dark:border-gray-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Ajustes aplicados</p>
                <div className="space-y-1">
                  {recipe._refinements.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Settings2 size={10} />
                      <span>"{r.instruction}"</span>
                      <span className="text-[10px] opacity-50">{new Date(r.at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="rounded-2xl border p-4" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)' }}>
              <h4 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--c-primary-text)' }}>
                <RefreshCw size={13} /> ¿Ya la preparaste?
              </h4>
              <p className="text-xs mb-3 opacity-60" style={{ color: 'var(--c-primary-text)' }}>Tu opinión mejora las próximas recomendaciones.</p>
              {!feedbackGiven ? (
                !feedbackType ? (
                  <div className="flex gap-2">
                    <button onClick={() => setFeedbackType('like')} className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-white dark:bg-gray-800 border border-green-200 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-50 text-xs font-medium transition-colors">
                      <ThumbsUp size={16} /> Me encantó
                    </button>
                    <button onClick={() => setFeedbackType('dislike')} className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-white dark:bg-gray-800 border border-red-200 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 text-xs font-medium transition-colors">
                      <ThumbsDown size={16} /> No me gustó
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${feedbackType === 'like' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {feedbackType === 'like' ? '¿Qué fue lo mejor?' : '¿Qué no te gustó?'}
                    </p>
                    <div className="flex gap-2">
                      <input type="text" value={feedbackReason} onChange={e => setFeedbackReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFeedback()} placeholder={feedbackType === 'like' ? 'Ej: el toque de ajo...' : 'Ej: muy seco...'} className="flex-1 p-2.5 rounded-xl border text-xs outline-none bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600" />
                      <button onClick={submitFeedback} disabled={!feedbackReason.trim()} className={`px-3 rounded-xl text-xs font-bold text-white disabled:opacity-50 ${feedbackType === 'like' ? 'bg-green-600' : 'bg-red-600'}`}>✓</button>
                      <button onClick={() => { setFeedbackType(null); setFeedbackReason(''); }} className="p-2 text-slate-400 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl"><X size={14} /></button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={13} /> ¡Guardado en tu perfil!
                </div>
              )}
            </div>

            {/* Ask the Chef */}
            <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-gray-700">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                <MessageSquare size={13} style={{ color: 'var(--c-primary)' }} /> Pregúntale al Chef IA
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">¿Dudas sobre técnica, sustitutos o tiempos?</p>
              {chefAnswer && (
                <div className="mb-3 p-3 rounded-xl text-xs border animate-in fade-in" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)', color: 'var(--c-primary-text)' }}>
                  <span className="font-bold block mb-1">👨‍🍳 Chef:</span>{chefAnswer}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={chefQuestion} onChange={e => setChefQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askChef()} placeholder="Ej: ¿A cuántos grados el horno?" className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-xs outline-none bg-white dark:bg-gray-700 dark:text-white" />
                <button onClick={askChef} disabled={asking || !chefQuestion.trim()} className="bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 text-white px-4 rounded-xl disabled:opacity-60 flex items-center">
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
