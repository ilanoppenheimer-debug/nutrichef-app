'use client';

import LoginView from '@/components/auth/LoginClient';
import { useAuth } from '@/context/AuthContext';
import { useRedirectIfAuthenticated } from './hooks/useRedirectIfAuthenticated';

export default function AuthPage() {
  const { user, isLocalMode } = useAuth();
  useRedirectIfAuthenticated(user, isLocalMode);
  return <LoginView />;
}
