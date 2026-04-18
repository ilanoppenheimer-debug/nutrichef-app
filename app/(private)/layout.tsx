'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FoodPreferencesProvider } from '@/context/FoodPreferencesContext';
import LoginView from '@/components/auth/LoginClient';
import { SplashScreen } from '@/components/routing/RouteScreens';
import { useProfileStore, isProfileComplete } from '@/stores/useProfileStore.js';
import { useSyncStore } from '@/stores/useSyncStore.js';
import { ROUTES } from '@/lib/routes.js';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TipsWidget from './components/TipsWidget';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLocalMode } = useAuth();
  const profile = useProfileStore((s) => s.profile);
  const firestoreReady = useProfileStore((s) => s.firestoreReady);

  useSyncStore();

  useEffect(() => {
    if (firestoreReady && !isProfileComplete(profile)) {
      router.replace(ROUTES.onboarding);
    }
  }, [firestoreReady, profile, router]);

  if (user === undefined && !isLocalMode) return <SplashScreen />;
  if (user === null && !isLocalMode) return <LoginView />;

  return (
    <FoodPreferencesProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-28 md:pb-12 transition-colors duration-200">
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 sm:px-5 lg:px-4 py-6 md:py-8">
          {children}
        </main>

        <TipsWidget />
        <Footer />
      </div>
    </FoodPreferencesProvider>
  );
}
