'use client';

import { MealPrepSheet } from '@/components/MealPrepPlanCard';
import { INTENT_OPTIONS, PLAN_PAGE_COPY } from './constants';
import PlanDaysSelector from './components/sections/PlanDaysSelector';
import PlanIntentChips from './components/sections/PlanIntentChips';
import PlanMealPrepSection from './components/sections/PlanMealPrepSection';
import PlanPageHeader from './components/sections/PlanPageHeader';
import { usePlanController } from './hooks/usePlanController';

export default function Page() {
  const {
    intent,
    setIntent,
    planDays,
    setPlanDays,
    currentPlan,
    viewingPlan,
    setViewingPlan,
    tweakingType,
    mealPrep,
    params,
    handleGenerate,
    handleTweak,
  } = usePlanController();

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <PlanPageHeader title={PLAN_PAGE_COPY.title} subtitle={PLAN_PAGE_COPY.subtitle} />

      <PlanIntentChips
        options={INTENT_OPTIONS}
        intent={intent}
        onIntentChange={setIntent}
        ariaLabel={PLAN_PAGE_COPY.intentNavLabel}
      />

      <PlanDaysSelector planDays={planDays} onPlanDaysChange={setPlanDays} />

      <PlanMealPrepSection
        planDays={planDays}
        currentPlan={currentPlan}
        isLoading={mealPrep.isLoading(params)}
        error={mealPrep.getError(params)}
        loadingLabel={PLAN_PAGE_COPY.loadingPlan}
        ctaInitial={PLAN_PAGE_COPY.ctaPlan}
        ctaAnother={PLAN_PAGE_COPY.ctaAnotherPlan}
        onGenerate={handleGenerate}
        onViewPlan={() => setViewingPlan(currentPlan)}
      />

      <MealPrepSheet
        plan={viewingPlan}
        onClose={() => setViewingPlan(null)}
        onTweak={handleTweak}
        tweakingType={tweakingType}
      />
    </div>
  );
}
