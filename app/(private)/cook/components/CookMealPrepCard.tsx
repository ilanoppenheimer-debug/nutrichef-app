import { Package } from 'lucide-react';

import { MealPrepResultCard } from '@/components/MealPrepPlanCard';

import ActionCard from '@/components/ui/ActionCard';
import PrimaryButton from '@/components/ui/PrimaryButton';

import type { MealPrepGenerateClient } from '../utils/runMealPrepGeneration';
import { runMealPrepGeneration } from '../utils/runMealPrepGeneration';

type CookMealPrepClient = MealPrepGenerateClient & {
  isLoading: (params: Record<string, unknown>) => boolean;
  getError: (params: Record<string, unknown>) => string | undefined;
};

export default function CookMealPrepCard({
  currentMealPrepPlan,
  mealPrepParams,
  mealPrep,
  buildMealPrepParams,
  setCurrentMealPrepPlan,
  setViewingPlan,
}: {
  currentMealPrepPlan: Record<string, unknown> | null;
  mealPrepParams: Record<string, unknown>;
  mealPrep: CookMealPrepClient;
  buildMealPrepParams: () => Record<string, unknown>;
  setCurrentMealPrepPlan: (p: Record<string, unknown> | null) => void;
  setViewingPlan: (p: Record<string, unknown> | null) => void;
}) {
  return (
    <ActionCard icon={Package} title="Meal prep · 3 días" subtitle="Cocina una vez, come tres días">
      <PrimaryButton
        onClick={() =>
          runMealPrepGeneration({
            buildMealPrepParams,
            mealPrep,
            setCurrentMealPrepPlan,
            setViewingPlan,
          })
        }
        loading={mealPrep.isLoading(mealPrepParams)}
        loadingLabel="Generando plan..."
      >
        {currentMealPrepPlan ? 'Generar otro plan' : 'Planificar meal prep'}
      </PrimaryButton>

      {currentMealPrepPlan != null && (
        <MealPrepResultCard plan={currentMealPrepPlan} onView={() => setViewingPlan(currentMealPrepPlan)} />
      )}

      {mealPrep.getError(mealPrepParams) && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          {mealPrep.getError(mealPrepParams)}
        </p>
      )}
    </ActionCard>
  );
}
