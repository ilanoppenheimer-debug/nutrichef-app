'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { ROUTES } from '@/lib/routes.js';

export function useRedirectIfAuthenticated(
  user: User | null | undefined,
  isLocalMode: boolean,
): void {
  const router = useRouter();

  useEffect(() => {
    if (user || isLocalMode) {
      router.replace(ROUTES.cook);
    }
  }, [user, isLocalMode, router]);
}
