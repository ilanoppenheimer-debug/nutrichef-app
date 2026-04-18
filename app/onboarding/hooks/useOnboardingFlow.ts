'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_PROFILE, useProfileStore } from '@/stores/useProfileStore.js';
import { ROUTES } from '@/lib/routes.js';
import { ONBOARDING_STEPS } from '../constants';

type ProfileState = typeof DEFAULT_PROFILE & { displayName?: string };

export function useOnboardingFlow() {
  const profile = useProfileStore((s) => s.profile) as ProfileState;
  const setProfile = useProfileStore((s) => s.setProfile);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(
    profile.goals || 'Mantenimiento y energia',
  );
  const [selectedDietaryStyle, setSelectedDietaryStyle] = useState(
    profile.dietaryStyle || 'Ninguna',
  );
  const [selectedReligiousDiet, setSelectedReligiousDiet] = useState(
    profile.religiousDiet || 'Ninguna',
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    Array.isArray(profile.allergies) ? (profile.allergies as string[]) : [],
  );

  const currentStep = ONBOARDING_STEPS[step];
  const progress = (step / (ONBOARDING_STEPS.length - 1)) * 100;

  const next = useCallback(() => {
    setStep((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }, []);

  const prev = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const toggleAllergy = useCallback((item: string) => {
    setSelectedAllergies((current) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    );
  }, []);

  const finish = useCallback(() => {
    if (!medicalDisclaimerAccepted) return;
    setProfile((current: ProfileState) => ({
      ...current,
      goals: selectedGoal,
      dietaryStyle: selectedDietaryStyle,
      religiousDiet: selectedReligiousDiet,
      allergies: selectedAllergies,
      medicalDisclaimerAccepted: true,
      acceptedAt: new Date().toISOString(),
    }));
    router.push(ROUTES.cook);
  }, [
    medicalDisclaimerAccepted,
    selectedAllergies,
    selectedDietaryStyle,
    selectedGoal,
    selectedReligiousDiet,
    router,
    setProfile,
  ]);

  return {
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
    stepsLength: ONBOARDING_STEPS.length,
  };
}
