import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const DEFAULT_PROFILE = {
  weight: '', height: '', age: '', gender: 'Femenino',
  activityLevel: '1.2',
  sportType: 'Ninguno',
  trainingDuration: '60',
  trainingDaysPerWeek: '3',
  dailyCalories: '', manualCalories: false,
  proteinTarget: '', manualProtein: false,
  fiberTarget: '', manualFiber: false,
  carbTarget: '', manualCarb: false,
  useProteinPowder: false, budgetFriendly: false,
  goals: 'Mantenimiento y energia',
  dietaryStyle: 'Ninguna', religiousDiet: 'Ninguna',
  allergies: [], dislikes: [], learnedPreferences: [],
  country: 'Chile',
  language: 'es',
  preferredSupermarkets: [],
  preferredTimeLimit: 'none',
  pesachMode: false,
  allowsKitniot: false,
};

export function isProfileComplete(profile) {
  return Boolean(profile.goals && profile.medicalDisclaimerAccepted);
}

export const useProfileStore = create(subscribeWithSelector((set) => ({
  profile: DEFAULT_PROFILE,
  firestoreReady: false,

  setProfile: (updater) =>
    set((state) => ({
      profile: typeof updater === 'function' ? updater(state.profile) : updater,
    })),

  setFirestoreReady: (ready) => set({ firestoreReady: ready }),

  reset: () => set({ profile: DEFAULT_PROFILE, firestoreReady: false }),
})));
