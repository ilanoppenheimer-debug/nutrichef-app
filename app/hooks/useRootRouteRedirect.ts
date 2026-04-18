'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes.js';

/** Redirige desde la raíz según sesión Firebase o modo local. */
export function useRootRouteRedirect() {
  const router = useRouter();
  const { user, isLocalMode } = useAuth();

  useEffect(() => {
    if (user === undefined && !isLocalMode) return;

    if ((user && !isLocalMode) || isLocalMode) {
      router.replace(ROUTES.onboarding);
      return;
    }

    if (user === null && !isLocalMode) {
      router.replace('/auth');
    }
  }, [user, isLocalMode, router]);

  return { showSplash: user === undefined && !isLocalMode };
}
