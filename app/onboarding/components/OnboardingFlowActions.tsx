'use client';

import { ChevronRight } from 'lucide-react';

import type { OnboardingStepDef } from '../constants';

export default function OnboardingFlowActions({
  step,
  currentStep,
  stepsLength,
  medicalDisclaimerAccepted,
  prev,
  next,
  finish,
}: {
  step: number;
  currentStep: OnboardingStepDef;
  stepsLength: number;
  medicalDisclaimerAccepted: boolean;
  prev: () => void;
  next: () => void;
  finish: () => void;
}) {
  const isLast = step === stepsLength - 1;

  return (
    <>
      <div className="mt-8 flex gap-3">
        {step > 0 && !isLast && (
          <button
            type="button"
            onClick={prev}
            className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 dark:border-gray-700 dark:text-slate-300"
          >
            Atrás
          </button>
        )}

        {!isLast ? (
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all"
            style={{ background: 'var(--c-primary)' }}
          >
            <span className="flex items-center justify-center gap-2">
              {step === 0 ? 'Comenzar' : 'Siguiente'}
              <ChevronRight size={16} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!medicalDisclaimerAccepted}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'var(--c-primary)' }}
          >
            Empezar a cocinar
          </button>
        )}
      </div>

      {step > 0 && !isLast && currentStep.optional && (
        <button
          type="button"
          onClick={next}
          className="mt-3 w-full py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          Saltar este paso
        </button>
      )}
    </>
  );
}
