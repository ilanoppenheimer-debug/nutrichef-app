import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { AppStateProvider, isProfileComplete } from './context/AppStateContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ROUTES } from './routes/paths.js';
import { useAppState } from './context/appState.js';

const AppLayout = lazy(() => import('./components/layout/AppLayout.jsx'));
const GeneratorView = lazy(() => import('./views/GeneratorView.jsx'));
const ExploreView = lazy(() => import('./views/ExploreView.jsx'));
const MealPlanView = lazy(() => import('./views/MealPlanView.jsx'));
const ProfileView = lazy(() => import('./views/ProfileView.jsx'));
const SettingsView = lazy(() => import('./views/SettingsView.jsx'));
const SavedView = lazy(() => import('./views/SavedView.jsx'));
const AddRecipeView = lazy(() => import('./views/AddRecipeView.jsx'));
const LoginView = lazy(() => import('./views/LoginView.jsx'));
const OnboardingView = lazy(() => import('./views/OnboardingView.jsx'));

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[--c-bg] to-white dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg rotate-3" style={{ background: 'var(--c-primary)' }}>
          <ChefHat size={42} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-700 dark:text-white">NutriChef <span style={{ color: 'var(--c-primary)' }}>IA</span></h1>
      </div>
    </div>
  );
}

function RouteLoadingScreen() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg" style={{ background: 'var(--c-primary)' }}>
          <ChefHat size={34} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando vista...</p>
      </div>
    </div>
  );
}

function OnboardingGuard({ children }) {
  const { profile, firestoreReady } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (firestoreReady && !isProfileComplete(profile)) {
      navigate(ROUTES.onboarding, { replace: true });
    }
  }, [firestoreReady, profile, navigate]);

  return children;
}

function AppRoutes() {
  const { user, isLocalMode } = useAuth();

  if (user === undefined && !isLocalMode) return <SplashScreen />;

  if (user === null && !isLocalMode) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <LoginView />
      </Suspense>
    );
  }

  return (
    <AppStateProvider>
      <Suspense fallback={<RouteLoadingScreen />}>
        <Routes>
          <Route path={ROUTES.onboarding} element={<OnboardingView />} />

          <Route
            path={ROUTES.home}
            element={
              <OnboardingGuard>
                <AppLayout />
              </OnboardingGuard>
            }
          >
            <Route index element={<Navigate to={ROUTES.create} replace />} />
            <Route path={ROUTES.create.slice(1)} element={<GeneratorView />} />
            <Route path={ROUTES.explore.slice(1)} element={<ExploreView />} />
            <Route path={ROUTES.saved.slice(1)} element={<SavedView />} />
            <Route path={ROUTES.plan.slice(1)} element={<MealPlanView />} />
            <Route path={ROUTES.profile.slice(1)} element={<ProfileView />} />
            <Route path={ROUTES.settings.slice(1)} element={<SettingsView />} />
            <Route path="add-recipe" element={<AddRecipeView />} />
            <Route path="*" element={<Navigate to={ROUTES.create} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AppStateProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
