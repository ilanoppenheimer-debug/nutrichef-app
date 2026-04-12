import { useState } from 'react';
import { ArrowLeft, Plus, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FOOD_DIET_OPTIONS } from '@/utils/foodPreferences.js';
import { useFoodPreferences } from '../hooks/useFoodPreferences.js';

export default function FoodPreferencesScreen() {
  const navigate = useNavigate();
  const {
    preferences,
    setKosher,
    toggleDiet,
    addRestriction,
    removeRestriction,
    clearPreferences,
    summaryLines,
    hasActivePreferences,
  } = useFoodPreferences();
  const [restrictionInput, setRestrictionInput] = useState('');

  const handleAddRestriction = () => {
    if (!restrictionInput.trim()) return;
    addRestriction(restrictionInput);
    setRestrictionInput('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Preferencias alimentarias</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Estas reglas se aplican siempre en recetas, exploración y generación con IA.
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-300">
              <ShieldCheck size={16} />
              Guardrail activo
            </h2>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Nunca se debe generar contenido que viole estas preferencias.
            </p>
          </div>
          {hasActivePreferences && (
            <button
              onClick={clearPreferences}
              className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-white dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {summaryLines.length > 0 ? summaryLines.map(item => (
            <span
              key={item}
              className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              {item}
            </span>
          )) : (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Aún no tienes preferencias activas.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white">Kosher</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Se aplica como restricción absoluta en prompts y resultados.
            </p>
          </div>
          <button
            onClick={() => setKosher(!preferences.kosher)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              preferences.kosher ? 'bg-amber-500' : 'bg-slate-300 dark:bg-gray-600'
            }`}
            aria-label="Activar kosher"
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${preferences.kosher ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
            <SlidersHorizontal size={16} />
            Dietas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Puedes activar varias al mismo tiempo.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {FOOD_DIET_OPTIONS.map(option => {
            const selected = preferences.diets.includes(option.id);

            return (
              <button
                key={option.id}
                onClick={() => toggleDiet(option.id)}
                className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${
                  selected
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">Restricciones adicionales</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ejemplo: Sin lácteos, Sin gluten, Sin soya.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={restrictionInput}
            onChange={(event) => setRestrictionInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddRestriction();
              }
            }}
            placeholder="Agregar restricción"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleAddRestriction}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
            style={{ background: 'var(--c-primary)' }}
          >
            <Plus size={16} />
            Añadir
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {preferences.restrictions.length > 0 ? preferences.restrictions.map(restriction => (
            <span
              key={restriction}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
            >
              {restriction}
              <button
                onClick={() => removeRestriction(restriction)}
                className="text-slate-400 transition-colors hover:text-red-500"
                aria-label={`Eliminar ${restriction}`}
              >
                <X size={12} />
              </button>
            </span>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay restricciones adicionales cargadas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
