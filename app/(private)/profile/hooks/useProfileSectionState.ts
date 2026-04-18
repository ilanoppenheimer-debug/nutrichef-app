'use client';

import { useCallback, useState } from 'react';
import { useProfileStore } from '@/stores/useProfileStore.js';
import { mergeUniqueTerms } from '@/lib/ingredientIntelligence.js';

export type ProfileSectionKey = 'biometry' | 'diet' | 'shopping';

export function useProfileSectionState() {
  const profile = useProfileStore((s: { profile: Record<string, unknown> }) => s.profile) as Record<string, unknown>;
  const setProfile = useProfileStore((s: { setProfile: (u: Record<string, unknown> | ((c: Record<string, unknown>) => Record<string, unknown>)) => void }) => s.setProfile);

  const [dislikeInput, setDislikeInput] = useState('');
  const [otherAllergyInput, setOtherAllergyInput] = useState('');
  const [openSections, setOpenSections] = useState({
    biometry: true,
    diet: true,
    shopping: false,
  });

  const toggleProfileSection = useCallback((key: ProfileSectionKey) => {
    setOpenSections((c) => ({ ...c, [key]: !c[key] }));
  }, []);

  const toggleAllergy = useCallback(
    (a: string) => {
      const allergies = (profile.allergies as string[]) || [];
      setProfile({
        ...profile,
        allergies: allergies.includes(a) ? allergies.filter((x) => x !== a) : [...allergies, a],
      });
    },
    [profile, setProfile],
  );

  const removeLearnedPref = useCallback(
    (i: number) => {
      const learned = [...((profile.learnedPreferences as string[]) || [])];
      learned.splice(i, 1);
      setProfile({ ...profile, learnedPreferences: learned });
    },
    [profile, setProfile],
  );

  const addCustomAllergies = useCallback(() => {
    const allergies = (profile.allergies as string[]) || [];
    const nextAllergies = mergeUniqueTerms(allergies, otherAllergyInput);
    if (nextAllergies.length === allergies.length) return;
    setProfile({ ...profile, allergies: nextAllergies });
    setOtherAllergyInput('');
  }, [profile, setProfile, otherAllergyInput]);

  return {
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
  };
}
