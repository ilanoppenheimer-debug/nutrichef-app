'use client';

import { SplashScreen } from '@/components/routing/RouteScreens';

import { useRootRouteRedirect } from './hooks/useRootRouteRedirect';

export default function Page() {
  const { showSplash } = useRootRouteRedirect();

  if (showSplash) {
    return <SplashScreen />;
  }

  return null;
}
