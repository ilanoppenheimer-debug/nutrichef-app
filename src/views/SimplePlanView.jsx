import { useEffect, useState } from 'react';
import { Calendar, Package, RefreshCw, Sparkles } from 'lucide-react';
import { MealPrepResultCard, MealPrepSheet } from '../components/MealPrepPlanCard.jsx';
import { useMealPrep } from '../hooks/useMealPrep.js';

// ── Intent options (subset that makes sense for weekly planning) ─────────────

const INTENT_OPTIONS = [
  { value: 'inspirame', label: '✨ Inspírame' },
  { value: 'proteico',  label: '💪 Proteico' },
  { value: 'liviano',   label: '🥗 Liviano' },
  { value: 'economico', label: '💸 Económico' },
];

const INTENT_STORAGE_KEY = 'nutrichef_plan_intent';

function loadInitialIntent() {
  try {
    const saved = localStorage.getItem(INTENT_STORAGE_KEY);
    if (saved && INTENT_OPTIONS.some(o => o.value === saved)) return saved;
  } catch { /* ignore */ }
  return 'inspirame';
}

// ── Plan length options ─────────────────────────────────────────────────────

const PLAN_OPTIONS = [
  { value: 3, label: '3 días', subtitle: 'Rápido' },
  { value: 5, label: '5 días', subtitle: 'Semana laboral' },
  { value: 7, label: '7 días', subtitle: 'Semana completa' },
];

// ── Main view ────────────────────────────────────────────────────────────────

export default function SimplePlanView() {
  const [viewingPlan, setViewingPlan] = useState(null);
  const [intent, setIntent] = useState(loadInitialIntent);
  const [planDays, setPlanDays] = useState(3);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [tweakingType, setTweakingType] = useState(null);

  const mealPrep = useMealPrep({ planDays });

  useEffect(() => {
    try { localStorage.setItem(INTENT_STORAGE_KEY, intent); } catch { /* ignore */ }
  }, [intent]);

  // Sync displayed result when intent or planDays change
  useEffect(() => {
    setCurrentPlan(mealPrep.getPlan({ intent }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, planDays]);

  const handleGenerate = async () => {
    const params = { intent };
    const plan = await mealPrep.generate(params);
    if (plan) {
      setCurrentPlan(plan);
      setViewingPlan(plan);
    }
  };

  const handleTweak = async (changeType) => {
    if (!currentPlan || tweakingType) return;
    setTweakingType(changeType);
    try {
      const params = { intent, change_type: changeType };
      const plan = await mealPrep.generate(params, { previousPlan: currentPlan });
      if (plan) {
        setCurrentPlan(plan);
        setViewingPlan(plan);
      }
    } finally {
      setTweakingType(null);
    }
  };

  const params = { intent };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <header className="pt-1">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Planifica tu semana</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Un plan, una cocción base, varios días resueltos.
        </p>
      </header>

      {/* Intent chips */}
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

      {/* Plan days selector */}
      <div className="flex gap-2">
        {PLAN_OPTIONS.map(opt => {
          const isActive = planDays === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPlanDays(opt.value)}
              className={`flex-1 py-3 rounded-2xl text-center border-2 transition-all ${
                isActive
                  ? 'border-[--c-primary] bg-[--c-primary-light]'
                  : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <p className={`text-sm font-black ${isActive ? 'text-[--c-primary-text]' : 'text-slate-800 dark:text-white'}`}>
                {opt.label}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-[--c-primary-text] opacity-70' : 'text-slate-400'}`}>
                {opt.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action card */}
      <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm p-5 space-y-4">
        <header className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
          >
            <Package size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-base text-slate-800 dark:text-white leading-snug">
              Meal prep · {planDays} días
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cocina una vez, come {planDays} días
            </p>
          </div>
        </header>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={mealPrep.isLoading(params)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
          style={{ background: 'var(--c-primary)' }}
        >
          {mealPrep.isLoading(params)
            ? <><RefreshCw size={16} className="animate-spin" /> Generando plan...</>
            : <><Sparkles size={16} /> {currentPlan ? 'Generar otro plan' : 'Planificar'}</>
          }
        </button>

        {currentPlan && (
          <MealPrepResultCard
            plan={currentPlan}
            onView={() => setViewingPlan(currentPlan)}
          />
        )}

        {mealPrep.getError(params) && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
            {mealPrep.getError(params)}
          </p>
        )}
      </section>

      {/* Sheet */}
      <MealPrepSheet
        plan={viewingPlan}
        onClose={() => setViewingPlan(null)}
        onTweak={handleTweak}
        tweakingType={tweakingType}
      />
    </div>
  );
}
