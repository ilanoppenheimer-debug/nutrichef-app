'use client';

import type { OnboardingStepId } from '../constants';
import OnboardingDoneStep from './sections/OnboardingDoneStep';
import OnboardingGoalStep from './sections/OnboardingGoalStep';
import OnboardingSafetyStep from './sections/OnboardingSafetyStep';
import OnboardingWelcomeStep from './sections/OnboardingWelcomeStep';

type OnboardingProfile = { displayName?: string | null };

export default function OnboardingStepRenderer({
  stepId,
  profile,
  selectedGoal,
  setSelectedGoal,
  selectedDietaryStyle,
  selectedReligiousDiet,
  selectedAllergies,
  setSelectedDietaryStyle,
  setSelectedReligiousDiet,
  toggleAllergy,
}: {
  stepId: OnboardingStepId;
  profile: OnboardingProfile;
  selectedGoal: string;
  setSelectedGoal: (g: string) => void;
  selectedDietaryStyle: string;
  selectedReligiousDiet: string;
  selectedAllergies: string[];
  setSelectedDietaryStyle: (v: string) => void;
  setSelectedReligiousDiet: (v: string) => void;
  toggleAllergy: (a: string) => void;
}) {
  switch (stepId) {
    case 'welcome':
      return (
        <OnboardingWelcomeStep displayName={profile.displayName == null ? undefined : profile.displayName} />
      );
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
}
