import { useState } from 'react';
import { ChevronDown, ChevronRight, Flame, Package, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import RecipeModal from '../components/RecipeModal.jsx';
import { useCooking } from '../hooks/useCooking.js';

// ── Chip selector ─────────────────────────────────────────────────────────────

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(isSelected && opt.optional ? null : opt.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border ${
                isSelected
                  ? 'text-white border-transparent'
                  : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
              style={isSelected ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Recipe option card (shown after generation) ───────────────────────────────

const OPTION_LABELS = ['Rápida y simple', 'Mejor nutrición', 'Alternativa creativa'];

function RecipeOptionCard({ recipe, index, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(recipe)}
      className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 hover:border-[--c-primary-border] active:scale-[0.98] transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {OPTION_LABELS[index] ?? `Opción ${index + 1}`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {recipe._time_minutes && (
            <span className="text-[10px] font-bold text-slate-400">⏱ {recipe._time_minutes} min</span>
          )}
          {recipe._difficulty && (
            <span className="text-[10px] font-bold text-slate-400 capitalize">· {recipe._difficulty}</span>
          )}
        </div>
      </div>
      <p className="font-black text-slate-800 dark:text-white text-sm leading-snug">{recipe.title}</p>
      {recipe.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{recipe.description}</p>
      )}
      <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--c-primary)' }}>
        <span className="text-xs font-bold">Ver receta</span>
        <ChevronRight size={13} strokeWidth={2.5} />
      </div>
    </button>
  );
}

// ── Accordion card wrapper ────────────────────────────────────────────────────

function CookingCard({ icon: Icon, title, subtitle, badge, isOpen, onToggle, ctaLabel, onGenerate, loading, options, onSelectOption, children }) {
  return (
    <div
      className={`rounded-3xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-200 ${
        isOpen
          ? 'shadow-lg border-2 border-[--c-primary-border]'
          : 'border border-slate-100 dark:border-gray-800'
      }`}
    >
      {/* Always-visible header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 px-5 py-4 text-left transition-colors active:bg-slate-50 dark:active:bg-gray-800/60"
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 transition-colors duration-200"
          style={isOpen
            ? { background: 'var(--c-primary)', color: 'white' }
            : { background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
        >
          <Icon size={21} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-black text-base text-slate-800 dark:text-white leading-snug">{title}</h2>
            {badge && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full text-white leading-none"
                style={{ background: 'var(--c-primary)' }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Smooth-expanding body */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-4">
            {children}

            {/* CTA */}
            <button
              type="button"
              onClick={onGenerate}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white font-black text-sm disabled:opacity-60 active:opacity-80 transition-opacity"
              style={{ background: 'var(--c-primary)' }}
            >
              {loading
                ? <><RefreshCw size={16} className="animate-spin" /> Generando opciones...</>
                : <><Sparkles size={16} /> {ctaLabel}</>
              }
            </button>

            {/* 3 option cards (shown after generation) */}
            {options && options.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Elige una opción
                </p>
                {options.map((recipe, i) => (
                  <RecipeOptionCard
                    key={recipe.title + i}
                    recipe={recipe}
                    index={i}
                    onSelect={onSelectOption}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Option data ───────────────────────────────────────────────────────────────

const TIEMPO_OPTIONS = [
  { value: 'rápido (menos de 20 min)', label: '⚡ Rápido' },
  { value: 'medio (20–40 min)', label: '⏱ Medio' },
  { value: 'largo (más de 40 min)', label: '🕐 Sin prisa' },
];

const DIFICULTAD_OPTIONS = [
  { value: 'fácil, paso a paso simple', label: '😊 Fácil' },
  { value: 'intermedio', label: '👨‍🍳 Intermedio' },
];

const OBJETIVO_COOK_OPTIONS = [
  { value: null, label: '🎯 Sin filtro', optional: true },
  { value: 'alta en proteína', label: '💪 Proteína' },
  { value: 'baja en calorías y saludable', label: '🥗 Ligera' },
  { value: 'energética y nutritiva', label: '⚡ Energía' },
];

const DIAS_OPTIONS = [
  { value: '2', label: '2 días' },
  { value: '3', label: '3 días' },
  { value: '4', label: '4 días' },
  { value: '5', label: '5 días' },
];

const OBJETIVO_PREP_OPTIONS = [
  { value: null, label: '🎯 Sin filtro', optional: true },
  { value: 'alta en proteína', label: '💪 Proteína' },
  { value: 'baja en calorías', label: '🥗 Ligera' },
  { value: 'equilibrada y variada', label: '⚖️ Equilibrada' },
];

// ── Main view ─────────────────────────────────────────────────────────────────

export default function CookingHome() {
  const [activeCard, setActiveCard] = useState('cookNow');
  const [viewingRecipe, setViewingRecipe] = useState(null);

  // cookNow params
  const [tiempo, setTiempo] = useState('rápido (menos de 20 min)');
  const [dificultad, setDificultad] = useState('fácil, paso a paso simple');
  const [objetivoCook, setObjetivoCook] = useState(null);

  // ingredients params
  const [ingredientes, setIngredientes] = useState('');

  // mealPrep params
  const [dias, setDias] = useState('4');
  const [objetivoPrep, setObjetivoPrep] = useState(null);

  const { generate, getOptions, isLoading, getError } = useCooking();

  // Current params objects
  const cookNowParams = { tiempo, dificultad, objetivo: objetivoCook };
  const ingredientsParams = { ingredientes: ingredientes.trim() };
  const mealPrepParams = { dias, objetivo: objetivoPrep };

  const toggle = (id) => setActiveCard(prev => (prev === id ? null : id));

  const handleCookNow = () => generate('cookNow', cookNowParams);
  const handleIngredients = () => { if (ingredientes.trim()) generate('ingredients', ingredientsParams); };
  const handleMealPrep = () => generate('mealPrep', mealPrepParams);

  // Cached option arrays for current params
  const cookNowOptions = getOptions('cookNow', cookNowParams);
  const ingredientsOptions = getOptions('ingredients', ingredientsParams);
  const mealPrepOptions = getOptions('mealPrep', mealPrepParams);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Page header */}
      <div className="pt-1 pb-1">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">¿Qué cocinamos?</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Elige cómo quieres empezar — te doy 3 opciones.
        </p>
      </div>

      {/* ── Card 1: Cocinar ahora ── */}
      <CookingCard
        icon={Flame}
        title="Cocinar ahora"
        subtitle="Te sugiero qué preparar según tu tiempo"
        badge={cookNowOptions ? `${cookNowOptions.length} opciones` : null}
        isOpen={activeCard === 'cookNow'}
        onToggle={() => toggle('cookNow')}
        ctaLabel={cookNowOptions ? 'Generar nuevas opciones' : 'Sugerir receta'}
        onGenerate={handleCookNow}
        loading={isLoading('cookNow', cookNowParams)}
        options={cookNowOptions}
        onSelectOption={setViewingRecipe}
      >
        <ChipGroup label="Tiempo disponible" options={TIEMPO_OPTIONS} value={tiempo} onChange={setTiempo} />
        <ChipGroup label="Dificultad" options={DIFICULTAD_OPTIONS} value={dificultad} onChange={setDificultad} />
        <ChipGroup label="Objetivo (opcional)" options={OBJETIVO_COOK_OPTIONS} value={objetivoCook} onChange={setObjetivoCook} />

        {getError('cookNow', cookNowParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {getError('cookNow', cookNowParams)}
          </p>
        )}
      </CookingCard>

      {/* ── Card 2: Tengo ingredientes ── */}
      <CookingCard
        icon={ShoppingBag}
        title="Tengo ingredientes"
        subtitle="Dime qué tienes y te digo qué preparar"
        badge={ingredientsOptions ? `${ingredientsOptions.length} opciones` : null}
        isOpen={activeCard === 'ingredients'}
        onToggle={() => toggle('ingredients')}
        ctaLabel={ingredientsOptions ? 'Generar nuevas opciones' : '¿Qué puedo cocinar?'}
        onGenerate={handleIngredients}
        loading={isLoading('ingredients', ingredientsParams)}
        options={ingredientsOptions}
        onSelectOption={setViewingRecipe}
      >
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
            Ingredientes disponibles
          </p>
          <textarea
            value={ingredientes}
            onChange={e => setIngredientes(e.target.value)}
            placeholder="Ej: pollo, arroz, zanahoria, ajo, aceite de oliva..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none focus:outline-none focus:border-[--c-primary-border] transition-colors"
          />
        </div>

        {getError('ingredients', ingredientsParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {getError('ingredients', ingredientsParams)}
          </p>
        )}
      </CookingCard>

      {/* ── Card 3: Meal prep ── */}
      <CookingCard
        icon={Package}
        title="Meal prep"
        subtitle="Cocina una vez, come varios días"
        badge={mealPrepOptions ? `${mealPrepOptions.length} opciones` : null}
        isOpen={activeCard === 'mealPrep'}
        onToggle={() => toggle('mealPrep')}
        ctaLabel={mealPrepOptions ? 'Generar nuevas opciones' : 'Planificar meal prep'}
        onGenerate={handleMealPrep}
        loading={isLoading('mealPrep', mealPrepParams)}
        options={mealPrepOptions}
        onSelectOption={setViewingRecipe}
      >
        <ChipGroup label="Días a cubrir" options={DIAS_OPTIONS} value={dias} onChange={setDias} />
        <ChipGroup label="Objetivo (opcional)" options={OBJETIVO_PREP_OPTIONS} value={objetivoPrep} onChange={setObjetivoPrep} />

        {getError('mealPrep', mealPrepParams) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {getError('mealPrep', mealPrepParams)}
          </p>
        )}
      </CookingCard>

      {/* Recipe result — bottom sheet on mobile, centered modal on desktop */}
      <RecipeModal
        recipe={viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onRecipeChange={setViewingRecipe}
      />
    </div>
  );
}
