'use client';

import { ONBOARDING_STEPS } from '../constants';
import { useOnboardingFlow } from '../hooks/useOnboardingFlow';
import OnboardingFlowActions from './OnboardingFlowActions';
import OnboardingMedicalDisclaimer from './OnboardingMedicalDisclaimer';
import OnboardingProgress from './sections/OnboardingProgress';
import OnboardingStepRenderer from './OnboardingStepRenderer';

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
          <OnboardingStepRenderer
            stepId={currentStep.id}
            profile={profile}
            selectedGoal={selectedGoal}
            setSelectedGoal={setSelectedGoal}
            selectedDietaryStyle={selectedDietaryStyle}
            selectedReligiousDiet={selectedReligiousDiet}
            selectedAllergies={selectedAllergies}
            setSelectedDietaryStyle={setSelectedDietaryStyle}
            setSelectedReligiousDiet={setSelectedReligiousDiet}
            toggleAllergy={toggleAllergy}
          />

          <OnboardingMedicalDisclaimer
            visible={step === ONBOARDING_STEPS.length - 1}
            accepted={medicalDisclaimerAccepted}
            onAcceptedChange={setMedicalDisclaimerAccepted}
          />

          <OnboardingFlowActions
            step={step}
            currentStep={currentStep}
            stepsLength={stepsLength}
            medicalDisclaimerAccepted={medicalDisclaimerAccepted}
            prev={prev}
            next={next}
            finish={finish}
          />
        </div>
      </div>
    </div>
  );
}
