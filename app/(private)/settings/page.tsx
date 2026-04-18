'use client';

import { useRouter } from 'next/navigation';
import PageLayout from '@/components/base/PageLayout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProfileStore } from '@/stores/useProfileStore.js';
import { useFoodPreferences } from '@/hooks/useFoodPreferences.js';
import { useSettingsActions } from './hooks/useSettingsActions';
import AccountCard from './components/sections/AccountCard';
import FoodPreferencesCard from './components/sections/FoodPreferencesCard';
import LocalizationCard from './components/sections/LocalizationCard';
import AppearanceCard from './components/sections/AppearanceCard';
import AppInfoCard from './components/sections/AppInfoCard';

export default function Page() {
  const router = useRouter();
  const { user, isLocalMode } = useAuth();
  const { themeId, setTheme, colorMode, setMode } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const { summaryLines } = useFoodPreferences();
  const { linkingGoogle, loggingOut, handleLinkGoogle, handleLogout } = useSettingsActions();

  return (
    <PageLayout title="Configuración">
      <AccountCard
        user={user}
        isLocalMode={isLocalMode}
        linkingGoogle={linkingGoogle}
        loggingOut={loggingOut}
        onLinkGoogle={handleLinkGoogle}
        onLogout={handleLogout}
      />
      <FoodPreferencesCard summaryLines={summaryLines} onNavigate={(path) => router.push(path)} />
      <LocalizationCard profile={profile} setProfile={setProfile} />
      <AppearanceCard colorMode={colorMode} setMode={setMode} themeId={themeId} setTheme={setTheme} />
      <AppInfoCard />
    </PageLayout>
  );
}



