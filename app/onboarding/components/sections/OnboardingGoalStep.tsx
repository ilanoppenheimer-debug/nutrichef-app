'use client';

import { CheckCircle2 } from 'lucide-react';
import { ONBOARDING_GOAL_OPTIONS } from '../../constants';
import StepHeading from './StepHeading';

type OnboardingGoalStepProps = {
  selectedGoal: string;
  onSelectGoal: (value: string) => void;
};

export default function OnboardingGoalStep({ selectedGoal, onSelectGoal }: OnboardingGoalStepProps) {
  return (
    <div className="space-y-4">
      <StepHeading
        title="¿Cuál es tu objetivo?"
        description="Esta decisión guía calorías, proteína y el tono de las recetas."
      />
      <div className="space-y-3">
        {ONBOARDING_GOAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectGoal(option.value)}
            className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
              selectedGoal === option.value
                ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl">{option.emoji}</span>
              <span className="flex-1 text-base font-semibold">{option.label}</span>
              {selectedGoal === option.value && (
                <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
