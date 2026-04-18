'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfileStore, isProfileComplete } from '@/stores/useProfileStore.js';
import { useSyncStore } from '@/stores/useSyncStore.js';
import { ROUTES } from '@/lib/routes.js';

export function useOnboardingGate() {
  const router = useRouter();
  const { user, isLocalMode } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const firestoreReady = useProfileStore((s) => s.firestoreReady);

  useSyncStore();

  useEffect(() => {
    if (firestoreReady && isProfileComplete(profile)) {
      router.replace(ROUTES.cook);
    }
  }, [firestoreReady, profile, router]);

  const authLoading = user === undefined && !isLocalMode;
  const syncLoading = (user != null || isLocalMode) && !firestoreReady;
  const redirectingToCook = firestoreReady && isProfileComplete(profile);

  return {
    showSplash: authLoading || syncLoading || redirectingToCook,
    showLogin: user === null && !isLocalMode,
  };
}
