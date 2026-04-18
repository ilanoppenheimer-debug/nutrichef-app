'use client';

import LoginView from '@/components/auth/LoginClient';
import { SplashScreen } from '@/components/routing/RouteScreens';
import OnboardingFlow from './components/OnboardingFlow';
import { useOnboardingGate } from './hooks/useOnboardingGate';

export default function OnboardingPage() {
  const { showSplash, showLogin } = useOnboardingGate();

  if (showSplash) return <SplashScreen />;
  if (showLogin) return <LoginView />;

  return <OnboardingFlow />;
}
