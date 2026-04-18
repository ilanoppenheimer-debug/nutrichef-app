'use client';

import { Package, RefreshCw, Sparkles } from 'lucide-react';
import { MealPrepResultCard } from '@/components/MealPrepPlanCard';

type PlanMealPrepSectionProps = {
  planDays: number;
  currentPlan: unknown;
  isLoading: boolean;
  error: string | null | undefined;
  loadingLabel: string;
  ctaInitial: string;
  ctaAnother: string;
  onGenerate: () => void;
  onViewPlan: () => void;
};

export default function PlanMealPrepSection({
  planDays,
  currentPlan,
  isLoading,
  error,
  loadingLabel,
  ctaInitial,
  ctaAnother,
  onGenerate,
  onViewPlan,
}: PlanMealPrepSectionProps) {
  return (
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
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
        style={{ background: 'var(--c-primary)' }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={16} className="animate-spin" /> {loadingLabel}
          </>
        ) : (
          <>
            <Sparkles size={16} /> {currentPlan ? ctaAnother : ctaInitial}
          </>
        )}
      </button>

      {currentPlan != null ? (
        <MealPrepResultCard plan={currentPlan} onView={onViewPlan} />
      ) : null}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>
      )}
    </section>
  );
}
