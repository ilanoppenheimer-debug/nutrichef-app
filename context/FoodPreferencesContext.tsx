'use client';

import { createContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useProfileStore } from '@/stores/useProfileStore.js';
import {
  DEFAULT_FOOD_PREFERENCES,
  FOOD_PREFERENCES_STORAGE_KEY,
  deriveFoodPreferencesFromProfile,
  getFoodPreferenceSummaryLines,
  getPrimaryLegacyDietaryStyle,
  hasActiveFoodPreferences,
  mergeLegacyProfileIntoFoodPreferences,
  normalizeFoodPreferences as normalizeFoodPreferencesRaw,
  normalizeRestriction,
} from '@/lib/foodPreferences.js';

export type FoodPreferencesState = {
  kosher: boolean;
  diets: string[];
  restrictions: string[];
};

/** `normalizeFoodPreferences` en JS infiere tipos literales demasiado estrechos para TS estricto. */
const normalizeFoodPreferences = normalizeFoodPreferencesRaw as (
  value?: unknown,
) => FoodPreferencesState;

export type FoodPreferencesContextValue = {
  preferences: FoodPreferencesState;
  setPreferences: (
    nextValue: FoodPreferencesState | ((current: FoodPreferencesState) => FoodPreferencesState),
  ) => void;
  setKosher: (isEnabled: boolean) => void;
  toggleDiet: (dietId: string) => void;
  setRestrictions: (restrictions: string[]) => void;
  addRestriction: (restriction: string) => void;
  removeRestriction: (restriction: string) => void;
  clearPreferences: () => void;
  summaryLines: string[];
  hasActivePreferences: boolean;
};

export const FoodPreferencesContext = createContext<FoodPreferencesContextValue | null>(null);

function readStoredFoodPreferences(): FoodPreferencesState | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(FOOD_PREFERENCES_STORAGE_KEY);
    return rawValue ? normalizeFoodPreferences(JSON.parse(rawValue)) : null;
  } catch {
    return null;
  }
}

function writeStoredFoodPreferences(preferences: FoodPreferencesState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      FOOD_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalizeFoodPreferences(preferences)),
    );
  } catch (error) {
    console.error('No se pudieron guardar las preferencias alimentarias:', error);
  }
}

export function FoodPreferencesProvider({ children }: { children: ReactNode }) {
  const initialStoredPreferences = useRef(readStoredFoodPreferences());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- store sin tipos aun
  const profile = useProfileStore((s: any) => s.profile) as Record<string, unknown> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setProfile = useProfileStore((s: any) => s.setProfile) as (
    fn: (current: Record<string, unknown>) => Record<string, unknown>,
  ) => void;
  const firestoreReady = useProfileStore((s) => s.firestoreReady);
  const [preferences, setPreferencesState] = useState<FoodPreferencesState>(
    () => initialStoredPreferences.current || DEFAULT_FOOD_PREFERENCES,
  );

  const skipNextProfilePullRef = useRef(false);
  const lastNonKosherReligiousDietRef = useRef('Ninguna');

  useEffect(() => {
    if (profile?.religiousDiet && profile.religiousDiet !== 'Kosher') {
      lastNonKosherReligiousDietRef.current = String(profile.religiousDiet);
    }
  }, [profile?.religiousDiet]);

  useEffect(() => {
    writeStoredFoodPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (!firestoreReady) return;

    const nextDietaryStyle = getPrimaryLegacyDietaryStyle(preferences);
    const nextReligiousDiet = preferences.kosher
      ? 'Kosher'
      : lastNonKosherReligiousDietRef.current || 'Ninguna';
    const nextAllergies = preferences.restrictions;
    const nextPesachMode = preferences.kosher ? Boolean(profile?.pesachMode) : false;
    const nextAllowsKitniot = preferences.kosher ? Boolean(profile?.allowsKitniot) : false;

    const shouldSyncProfile =
      (String(profile?.dietaryStyle || 'Ninguna')) !== nextDietaryStyle ||
      (String(profile?.religiousDiet || 'Ninguna')) !== nextReligiousDiet ||
      JSON.stringify(profile?.allergies || []) !== JSON.stringify(nextAllergies) ||
      Boolean(profile?.pesachMode) !== nextPesachMode ||
      Boolean(profile?.allowsKitniot) !== nextAllowsKitniot;

    if (!shouldSyncProfile) return;

    skipNextProfilePullRef.current = true;
    setProfile((current: Record<string, unknown>) => ({
      ...current,
      dietaryStyle: nextDietaryStyle,
      religiousDiet: nextReligiousDiet,
      allergies: nextAllergies,
      pesachMode: nextPesachMode,
      allowsKitniot: nextAllowsKitniot,
    }));
  }, [
    preferences,
    firestoreReady,
    profile?.dietaryStyle,
    profile?.religiousDiet,
    profile?.allergies,
    profile?.pesachMode,
    profile?.allowsKitniot,
    setProfile,
  ]);

  useEffect(() => {
    if (!firestoreReady) return;

    if (skipNextProfilePullRef.current) {
      skipNextProfilePullRef.current = false;
      return;
    }

    const legacyPreferences = deriveFoodPreferencesFromProfile(profile);

    setPreferencesState((current) => {
      const next = initialStoredPreferences.current
        ? mergeLegacyProfileIntoFoodPreferences(current, legacyPreferences)
        : legacyPreferences;

      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
  }, [
    firestoreReady,
    profile?.dietaryStyle,
    profile?.religiousDiet,
    profile?.allergies,
    profile?.pesachMode,
  ]);

  const setPreferences = (
    nextValue: FoodPreferencesState | ((current: FoodPreferencesState) => FoodPreferencesState),
  ) => {
    setPreferencesState((current) =>
      normalizeFoodPreferences(typeof nextValue === 'function' ? nextValue(current) : nextValue),
    );
  };

  const setKosher = (isEnabled: boolean) => {
    setPreferencesState((current) =>
      normalizeFoodPreferences({
        ...current,
        kosher: Boolean(isEnabled),
      }),
    );
  };

  const toggleDiet = (dietId: string) => {
    setPreferencesState((current) => {
      const nextDiets = current.diets.includes(dietId)
        ? current.diets.filter((item) => item !== dietId)
        : [...current.diets, dietId];

      return normalizeFoodPreferences({ ...current, diets: nextDiets });
    });
  };

  const setRestrictions = (restrictions: string[]) => {
    setPreferencesState((current) =>
      normalizeFoodPreferences({ ...current, restrictions }),
    );
  };

  const addRestriction = (restriction: string) => {
    const normalizedRestriction = normalizeRestriction(restriction);
    if (!normalizedRestriction) return;

    setPreferencesState((current) =>
      normalizeFoodPreferences({
        ...current,
        restrictions: [...current.restrictions, normalizedRestriction],
      }),
    );
  };

  const removeRestriction = (restriction: string) => {
    setPreferencesState((current) =>
      normalizeFoodPreferences({
        ...current,
        restrictions: current.restrictions.filter((item) => item !== restriction),
      }),
    );
  };

  const clearPreferences = () => setPreferencesState(DEFAULT_FOOD_PREFERENCES);

  const value = useMemo<FoodPreferencesContextValue>(
    () => ({
      preferences,
      setPreferences,
      setKosher,
      toggleDiet,
      setRestrictions,
      addRestriction,
      removeRestriction,
      clearPreferences,
      summaryLines: getFoodPreferenceSummaryLines(preferences),
      hasActivePreferences: hasActiveFoodPreferences(preferences),
    }),
    [preferences],
  );

  return (
    <FoodPreferencesContext.Provider value={value}>
      {children}
    </FoodPreferencesContext.Provider>
  );
}
