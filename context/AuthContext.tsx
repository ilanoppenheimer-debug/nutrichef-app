'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  linkWithPopup,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase.js';

const AuthContext = createContext<AuthContextValue | null>(null);

const SYNC_STORAGE_KEYS = [
  'nutrichef_profile',
  'nutrichef_favs',
  'nutrichef_interested',
  'nutrichef_saved_recipes',
  'nutrichef_generated',
];

function clearPersistedSessionData() {
  SYNC_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export type AuthContextValue = {
  user: User | null | undefined;
  isLocalMode: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  continueLocally: () => void;
  linkToGoogle: () => Promise<void>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function isFirebaseAuthError(err: unknown): err is { code?: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const localMode = localStorage.getItem('nutrichef_local_mode') === 'true';
    if (localMode) setIsLocalMode(true);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('nutrichef_local_mode');
        setIsLocalMode(false);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    clearPersistedSessionData();
    await signOut(auth);
    localStorage.removeItem('nutrichef_local_mode');
    setIsLocalMode(false);
  }

  function continueLocally() {
    localStorage.setItem('nutrichef_local_mode', 'true');
    setIsLocalMode(true);
  }

  async function linkToGoogle() {
    try {
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      localStorage.removeItem('nutrichef_local_mode');
      setIsLocalMode(false);
    } catch (err: unknown) {
      if (
        isFirebaseAuthError(err) &&
        (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use')
      ) {
        const fallbackProvider = new GoogleAuthProvider();
        fallbackProvider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, fallbackProvider);
        localStorage.removeItem('nutrichef_local_mode');
        setIsLocalMode(false);
      } else {
        throw err;
      }
    }
  }

  const value: AuthContextValue = {
    user,
    isLocalMode,
    loginWithGoogle,
    logout,
    continueLocally,
    linkToGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
