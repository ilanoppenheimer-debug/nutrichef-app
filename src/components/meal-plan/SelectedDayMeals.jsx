import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Edit3,
  Minus,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import RecipeCard from '../RecipeCard.jsx';
import { getAllergyTerms, normalizeIngredientText } from '../../lib/ingredientIntelligence.js';
import { parseServingsCount, scaleNutritionLabel } from '../../lib/recipeScaling.js';

const MEAL_THEMES = {
  desayuno: {
    accent: 'text-orange-700',
    badge: 'border-orange-200 bg-orange-100 text-orange-700',
    card: 'border-orange-200 bg-orange-50/80',
    pill: 'bg-orange-100 text-orange-700',
    selected: 'ring-2 ring-orange-200',
  },
  almuerzo: {
    accent: 'text-emerald-700',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    card: 'border-emerald-200 bg-emerald-50/80',
    pill: 'bg-emerald-100 text-emerald-700',
    selected: 'ring-2 ring-emerald-200',
  },
  cena: {
    accent: 'text-sky-700',
    badge: 'border-sky-200 bg-sky-100 text-sky-700',
    card: 'border-sky-200 bg-sky-50/80',
    pill: 'bg-sky-100 text-sky-700',
    selected: 'ring-2 ring-sky-200',
  },
  snack: {
    accent: 'text-violet-700',
    badge: 'border-violet-200 bg-violet-100 text-violet-700',
    card: 'border-violet-200 bg-violet-50/80',
    pill: 'bg-violet-100 text-violet-700',
    selected: 'ring-2 ring-violet-200',
  },
  default: {
    accent: 'text-slate-700',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    card: 'border-slate-200 bg-slate-50',
    pill: 'bg-slate-100 text-slate-700',
    selected: 'ring-2 ring-slate-200',
  },
};

function getMealTheme(type = '') {
  const normalized = normalizeIngredientText(type);

  if (normalized.includes('desayuno')) return MEAL_THEMES.desayuno;
  if (normalized.includes('almuerzo') || normalized.includes('comida')) return MEAL_THEMES.almuerzo;
  if (normalized.includes('cena')) return MEAL_THEMES.cena;
  if (normalized.includes('snack') || normalized.includes('colacion') || normalized.includes('colación') || normalized.includes('merienda')) {
    return MEAL_THEMES.snack;
  }

  return MEAL_THEMES.default;
}

function findMatchedTerms(text, terms = []) {
  const normalizedText = normalizeIngredientText(text);
  if (!normalizedText) return [];

  return terms.filter(term => {
    const normalizedTerm = normalizeIngredientText(term);
    return normalizedTerm && normalizedText.includes(normalizedTerm);
  });
}

function buildDayWarnings(day, profile = {}, selectedOptions = {}) {
  if (!day?.meals?.length) return [];

  const dislikes = profile.dislikes || [];
  const allergyTerms = getAllergyTerms(profile.allergies || []);
  const warnings = [];

  day.meals.forEach((meal, mealIndex) => {
    const optionIndex = selectedOptions[mealIndex] ?? 0;
    const option = meal.options?.[optionIndex] || meal.options?.[0];
    if (!option) return;

    const haystack = `${option.name || ''} ${option.description || ''}`;
    const matchedDislikes = findMatchedTerms(haystack, dislikes);
    const matchedAllergies = findMatchedTerms(haystack, allergyTerms);

    matchedDislikes.forEach(term => warnings.push({ term, type: 'dislike' }));
    matchedAllergies.forEach(term => warnings.push({ term, type: 'allergy' }));
  });

  return warnings.filter((warning, index, collection) => (
    collection.findIndex(candidate => normalizeIngredientText(candidate.term) === normalizeIngredientText(warning.term)) === index
  ));
}

function DetailPlaceholder({ detailSelection, generatingRecipe, onCloseRecipe }) {
  if (generatingRecipe && detailSelection?.option) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Detalle</p>
            <h4 className="mt-1 text-lg font-bold tracking-tight text-slate-800">{detailSelection.option.name}</h4>
            <p className="mt-1 text-sm text-slate-500">Estamos preparando la receta completa para esta selección.</p>
          </div>
          {onCloseRecipe ? (
            <button
              type="button"
              onClick={onCloseRecipe}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Cerrar detalle"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
          <RefreshCw className="animate-spin text-[--c-primary]" size={18} />
          Cargando el paso a paso, ingredientes y macros detallados...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <ChefHat size={24} />
      </div>
      <h4 className="mt-4 text-lg font-bold tracking-tight text-slate-800">Elige una comida para ver el detalle</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Mantén la vista limpia a la izquierda y abre solo la receta que quieras cocinar o revisar.
      </p>
    </div>
  );
}

export default function SelectedDayMeals({
  day,
  profile,
  selectedDayIdx,
  swappingData,
  customSwapRequest,
  isSwapping,
  selectedRecipe,
  generatingRecipe,
  onSwapStart,
  onSwapRequestChange,
  onSwapConfirm,
  onSwapCancel,
  onGenerateRecipe,
  onServingsChange,
  onCloseRecipe,
}) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [detailSelection, setDetailSelection] = useState(null);
  const [expandedMeals, setExpandedMeals] = useState({});

  useEffect(() => {
    const defaults = {};
    day?.meals?.forEach((meal, mealIndex) => {
      defaults[mealIndex] = 0;
    });
    setSelectedOptions(defaults);
    setDetailSelection(null);
    setExpandedMeals({});
  }, [day?.dayName]);

  const dayWarnings = useMemo(
    () => buildDayWarnings(day, profile, selectedOptions),
    [day, profile, selectedOptions]
  );

  const handleCloseDetail = () => {
    setDetailSelection(null);
    if (onCloseRecipe) onCloseRecipe();
  };

  if (!day) {
    return null;
  }

  const detailContent = selectedRecipe ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Detalle Abierto</p>
          <h4 className="text-base font-bold tracking-tight text-slate-800">{selectedRecipe.title}</h4>
        </div>
        {onCloseRecipe ? (
          <button
            type="button"
            onClick={handleCloseDetail}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:text-slate-700"
            aria-label="Ocultar detalle"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
      <RecipeCard key={`${selectedRecipe.title}-${selectedRecipe.servings || 'plan'}`} recipe={selectedRecipe} />
    </div>
  ) : (
    <DetailPlaceholder
      detailSelection={detailSelection}
      generatingRecipe={generatingRecipe}
      onCloseRecipe={handleCloseDetail}
    />
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Calendar className="text-orange-500" size={20} />
        <h3 className="text-lg font-bold tracking-tight text-slate-800">{day.dayName}</h3>
      </div>

      {dayWarnings.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            {dayWarnings.some(w => w.type === 'allergy') && (
              <p><span className="font-black">⚠️ ALÉRGENO detectado:</span> {dayWarnings.filter(w => w.type === 'allergy').map(w => w.term).join(', ')}. Este ingrediente está bloqueado por tu perfil.</p>
            )}
            {dayWarnings.some(w => w.type === 'dislike') && (
              <p className={dayWarnings.some(w => w.type === 'allergy') ? 'mt-1' : ''}><span className="font-semibold">Preferencia:</span> {dayWarnings.filter(w => w.type === 'dislike').map(w => w.term).join(', ')} — ver sustituto en el detalle.</p>
            )}
            {dayWarnings.every(w => !w.type) && (
              <p><span className="font-black">Nota:</span> Esta selección menciona {dayWarnings.map(item => item.term).join(', ')}. Revisa el sustituto sugerido antes de cocinar.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.2fr)] lg:items-start">
        <div className="space-y-4">
          {day.meals.map((meal, mealIndex) => {
            const optionIndex = selectedOptions[mealIndex] ?? 0;
            const option = meal.options?.[optionIndex] || meal.options?.[0];
            const theme = getMealTheme(meal.type);
            const baseServings = parseServingsCount(option?.baseServings || option?.servings || 1);
            const selectedServings = parseServingsCount(option?.selectedServings || option?.servings || baseServings);
            const factor = selectedServings / baseServings;
            const isRecipeOpen = detailSelection?.mealIndex === mealIndex && detailSelection?.optionIndex === optionIndex;
            const isExpanded = expandedMeals[mealIndex] ?? false;

            if (!option) return null;

            return (
              <div
                key={`meal-${mealIndex}`}
                className={`rounded-3xl border bg-white p-4 shadow-md transition-all ${isRecipeOpen ? theme.selected : ''}`}
              >
                {/* Zona A: fila compacta, siempre visible */}
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${theme.badge}`}>
                    {meal.type}
                  </div>
                  <span className="flex-1 truncate text-sm font-bold text-slate-800">{option.name}</span>
                  <span className={`shrink-0 rounded-xl px-3 py-1 text-xs font-black ${theme.pill}`}>
                    {scaleNutritionLabel(option.calories, factor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedMeals(current => ({ ...current, [mealIndex]: !current[mealIndex] }))}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:text-slate-700"
                    aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Zona B: detalles expandibles */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onSwapStart({ dayIdx: selectedDayIdx, mealIdx: mealIndex, currentMealName: option.name || 'Comida' })}
                        className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Edit3 size={14} /> Cambiar
                      </button>
                    </div>

                    <div className={`rounded-2xl border p-4 ${theme.card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-lg font-bold tracking-tight text-slate-800">{option.name}</h4>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{option.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-xl px-3 py-1 text-xs font-black ${theme.pill}`}>
                          {scaleNutritionLabel(option.calories, factor)}
                        </span>
                      </div>

                      {meal.options?.length > 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {meal.options.map((mealOption, currentOptionIndex) => (
                            <button
                              key={`${meal.type}-${currentOptionIndex}`}
                              type="button"
                              onClick={() => setSelectedOptions(current => ({ ...current, [mealIndex]: currentOptionIndex }))}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                optionIndex === currentOptionIndex
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                              }`}
                            >
                              {mealOption.name || `Opción ${currentOptionIndex + 1}`}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                          🥩 {scaleNutritionLabel(option.protein, factor)}
                        </span>
                        <span className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                          🌿 {scaleNutritionLabel(option.fiber, factor)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Porciones</p>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Users size={14} className={theme.accent} /> {selectedServings} personas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onServingsChange(selectedDayIdx, mealIndex, optionIndex, selectedServings - 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[--c-primary-border] hover:bg-[--c-primary-light]"
                          aria-label="Reducir porciones"
                        >
                          <Minus size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onServingsChange(selectedDayIdx, mealIndex, optionIndex, selectedServings + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[--c-primary-border] hover:bg-[--c-primary-light]"
                          aria-label="Aumentar porciones"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>


                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOptions(current => ({ ...current, [mealIndex]: optionIndex }));
                        setDetailSelection({ mealIndex, optionIndex, option });
                        onGenerateRecipe(option);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                    >
                      <ChefHat size={16} /> Ver Detalle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block lg:sticky lg:top-24">
          {detailContent}
        </div>
      </div>

      <div className="lg:hidden">
        {(selectedRecipe || detailSelection) ? detailContent : null}
      </div>

      {/* Bottom sheet for swap — appears over everything on mobile */}
      {swappingData?.dayIdx === selectedDayIdx && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onSwapCancel} />
          <div className="relative z-50 rounded-t-3xl bg-white dark:bg-gray-900 px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600" />
            <h4 className="text-base font-black text-slate-800 dark:text-white mb-1">¿Qué cambio te gustaría hacer?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Comida actual: <span className="font-semibold">{swappingData.currentMealName}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSwapRequest}
                onChange={(e) => onSwapRequestChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isSwapping && customSwapRequest.trim() && onSwapConfirm()}
                placeholder="Ej: más liviano, sin huevo, listo en 15 min..."
                autoFocus
                className="flex-1 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 p-3 text-sm outline-none focus:border-transparent focus:ring-2 dark:text-white"
                style={{ '--tw-ring-color': 'var(--c-primary)' }}
              />
              <button
                type="button"
                onClick={onSwapConfirm}
                disabled={isSwapping || !customSwapRequest.trim()}
                className="flex min-w-[88px] items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--c-primary)' }}
              >
                {isSwapping ? <RefreshCw className="animate-spin" size={16} /> : 'Generar'}
              </button>
              <button
                type="button"
                onClick={onSwapCancel}
                className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-slate-400 transition-colors hover:text-red-500"
                aria-label="Cancelar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
