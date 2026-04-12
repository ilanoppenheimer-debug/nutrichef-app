import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  linkWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider } from '@/services/firebase.js';

// Sentinel para distinguir estados
// undefined  = Firebase aún verificando
// null       = no autenticado, no modo local
// 'local'    = modo local sin cuenta
// User obj   = autenticado con Google

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Ver si ya eligió modo local en sesiones anteriores
    const localMode = localStorage.getItem('nutrichef_local_mode') === 'true';
    if (localMode) setIsLocalMode(true);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Si tiene cuenta Google, cancelar modo local
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
    await signOut(auth);
    localStorage.removeItem('nutrichef_local_mode');
    setIsLocalMode(false);
  }

  function continueLocally() {
    localStorage.setItem('nutrichef_local_mode', 'true');
    setIsLocalMode(true);
  }

  // Vincular cuenta local a Google (upgrade)
  // Si el usuario anónimo de Firebase no existe, simplemente hacemos signIn
  async function linkToGoogle() {
    try {
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      localStorage.removeItem('nutrichef_local_mode');
      setIsLocalMode(false);
    } catch (err) {
      // Si ya existe la cuenta, simplemente iniciar sesión
      if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use') {
        await signInWithPopup(auth, new GoogleAuthProvider());
        localStorage.removeItem('nutrichef_local_mode');
        setIsLocalMode(false);
      } else {
        throw err;
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLocalMode, loginWithGoogle, logout, continueLocally, linkToGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}
