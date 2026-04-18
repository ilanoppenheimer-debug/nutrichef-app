// @ts-nocheck — tipar `profile` y secciones en un PR dedicado.
'use client';

import PageLayout from '@/components/base/PageLayout';
import { useProfileMacrosAutoSync } from '@/hooks/useProfileMacrosAutoSync.js';

import ProfileBiometrySection from './components/ProfileBiometrySection';
import ProfileDietSection from './components/ProfileDietSection';
import ProfileMainGoalSection from './components/ProfileMainGoalSection';
import ProfileMedicalBanner from './components/ProfileMedicalBanner';
import ProfileShoppingSection from './components/ProfileShoppingSection';
import ProfileSportSection from './components/ProfileSportSection';
import { useProfileSectionState } from './hooks/useProfileSectionState';

export default function ProfilePage() {
  const {
    profile,
    setProfile,
    dislikeInput,
    setDislikeInput,
    otherAllergyInput,
    setOtherAllergyInput,
    openSections,
    toggleProfileSection,
    toggleAllergy,
    removeLearnedPref,
    addCustomAllergies,
  } = useProfileSectionState();

  useProfileMacrosAutoSync(profile, setProfile);

  return (
    <PageLayout title="Perfil nutricional" className="max-w-6xl space-y-6">
      <ProfileMedicalBanner />
      <ProfileMainGoalSection profile={profile} setProfile={setProfile} />
      <ProfileBiometrySection
        profile={profile}
        setProfile={setProfile}
        openSections={openSections}
        toggleProfileSection={toggleProfileSection}
      />
      <ProfileSportSection profile={profile} setProfile={setProfile} />
      <ProfileDietSection
        profile={profile}
        setProfile={setProfile}
        openSections={openSections}
        toggleProfileSection={toggleProfileSection}
        dislikeInput={dislikeInput}
        setDislikeInput={setDislikeInput}
        otherAllergyInput={otherAllergyInput}
        setOtherAllergyInput={setOtherAllergyInput}
        toggleAllergy={toggleAllergy}
        addCustomAllergies={addCustomAllergies}
        removeLearnedPref={removeLearnedPref}
      />
      <ProfileShoppingSection
        profile={profile}
        setProfile={setProfile}
        openSections={openSections}
        toggleProfileSection={toggleProfileSection}
      />
    </PageLayout>
  );
}
