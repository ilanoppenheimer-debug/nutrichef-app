'use client';

import { useState } from 'react';
import { ChefHat, RefreshCw, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginView() {
  const { loginWithGoogle, continueLocally } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[--c-bg] to-white dark:from-gray-950 dark:to-gray-900 px-6">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[--c-primary] rounded-3xl shadow-lg mb-5 rotate-3">
          <ChefHat size={42} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
          NutriChef <span style={{ color: 'var(--c-primary)' }}>IA</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
          Tu asistente personal de cocina inteligente
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-3xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4">
        <div className="text-center mb-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Bienvenido</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Elige cómo quieres usar NutriChef.</p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-white font-bold py-3.5 px-4 rounded-2xl hover:border-[--c-primary] hover:bg-[--c-primary-light] dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"
              />
            </svg>
          )}
          {loading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
          <span className="text-xs text-slate-400">o</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
        </div>

        <button
          type="button"
          onClick={continueLocally}
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 font-semibold py-3.5 px-4 rounded-2xl hover:border-slate-400 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
        >
          <Smartphone size={18} />
          Continuar sin cuenta (solo este dispositivo)
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Sin cuenta, tus datos quedan guardados solo en este dispositivo. Puedes vincular tu cuenta Google más
          tarde desde el perfil.
        </p>
      </div>
    </div>
  );
}
