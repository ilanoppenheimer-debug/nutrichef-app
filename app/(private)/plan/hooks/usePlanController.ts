'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMealPrep } from '@/hooks/useMealPrep.js';
import { usePersistedPreference } from '@/hooks/useCookingPreferences.js';
import {
  INTENT_OPTIONS,
  INTENT_STORAGE_KEY,
  VALID_PLAN_INTENTS,
} from '../constants';
import { runPlanGeneration } from '../utils/runPlanGeneration';
import { runPlanTweak } from '../utils/runPlanTweak';

export function usePlanController() {
  const [viewingPlan, setViewingPlan] = useState<unknown | null>(null);
  const [intent, setIntent] = usePersistedPreference({
    storageKey: INTENT_STORAGE_KEY,
    defaultValue: 'inspirame',
    isValid: (value: string) =>
      VALID_PLAN_INTENTS.has(value as (typeof INTENT_OPTIONS)[number]['value']),
  });
  const [planDays, setPlanDays] = useState(3);
  const [currentPlan, setCurrentPlan] = useState<unknown | null>(null);
  const [tweakingType, setTweakingType] = useState<string | null>(null);
  const mealPrep = useMealPrep({ planDays });

  useEffect(() => {
    setCurrentPlan(mealPrep.getPlan({ intent }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, planDays]);

  const params = { intent };

  const handleGenerate = useCallback(() => {
    void runPlanGeneration({
      intent,
      mealPrep,
      setCurrentPlan,
      setViewingPlan,
    });
  }, [intent, mealPrep]);

  const handleTweak = useCallback(
    (changeType: string) => {
      void runPlanTweak(
        {
          intent,
          currentPlan,
          tweakingType,
          mealPrep,
          setCurrentPlan,
          setViewingPlan,
          setTweakingType,
        },
        changeType,
      );
    },
    [intent, currentPlan, tweakingType, mealPrep],
  );

  return {
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
  };
}
