'use client';

import { ChevronRight } from 'lucide-react';
import { ONBOARDING_STEPS } from '../constants';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import OnboardingDoneStep from './sections/OnboardingDoneStep';
import OnboardingGoalStep from './sections/OnboardingGoalStep';
import OnboardingProgress from './sections/OnboardingProgress';
import OnboardingSafetyStep from './sections/OnboardingSafetyStep';
import OnboardingWelcomeStep from './sections/OnboardingWelcomeStep';

export default function OnboardingFlow() {
  const {
    profile,
    step,
    currentStep,
    progress,
    next,
    prev,
    medicalDisclaimerAccepted,
    setMedicalDisclaimerAccepted,
    selectedGoal,
    setSelectedGoal,
    selectedDietaryStyle,
    setSelectedDietaryStyle,
    selectedReligiousDiet,
    setSelectedReligiousDiet,
    selectedAllergies,
    toggleAllergy,
    finish,
    stepsLength,
  } = useOnboardingFlow();

  const renderStep = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <OnboardingWelcomeStep displayName={profile.displayName} />;
      case 'goal':
        return <OnboardingGoalStep selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} />;
      case 'safety':
        return (
          <OnboardingSafetyStep
            selectedDietaryStyle={selectedDietaryStyle}
            selectedReligiousDiet={selectedReligiousDiet}
            selectedAllergies={selectedAllergies}
            onSelectDietaryStyle={setSelectedDietaryStyle}
            onSelectReligiousDiet={setSelectedReligiousDiet}
            onToggleAllergy={toggleAllergy}
          />
        );
      default:
        return <OnboardingDoneStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-6 py-6 dark:from-slate-950 dark:to-slate-900">
      <div
        className={`mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col ${currentStep.id === 'safety' ? 'justify-start pt-4' : 'justify-center'}`}
      >
        <OnboardingProgress
          stepIndex={step}
          stepsLength={stepsLength}
          currentTitle={currentStep.title}
          progressPercent={progress}
        />

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {renderStep()}

          {step === ONBOARDING_STEPS.length - 1 && (
            <label className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-900/20">
              <input
                type="checkbox"
                checked={medicalDisclaimerAccepted}
                onChange={(e) => setMedicalDisclaimerAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                Entiendo que NutriChef es una herramienta de asistencia y sugerencias nutricionales basadas en IA. No
                constituye un diagnóstico, tratamiento ni reemplaza la evaluación formal presencial de un profesional de
                la salud. Asumo la responsabilidad sobre las decisiones dietéticas que tome basándome en esta app.
              </span>
            </label>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && step < ONBOARDING_STEPS.length - 1 && (
              <button
                type="button"
                onClick={prev}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 dark:border-gray-700 dark:text-slate-300"
              >
                Atrás
              </button>
            )}

            {step < ONBOARDING_STEPS.length - 1 ? (
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

          {step > 0 && step < ONBOARDING_STEPS.length - 1 && currentStep.optional && (
            <button
              type="button"
              onClick={next}
              className="mt-3 w-full py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Saltar este paso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
