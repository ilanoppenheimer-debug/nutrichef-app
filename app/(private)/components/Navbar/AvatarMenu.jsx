'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';

import { ROUTES } from '@/lib/routes.js';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';

export default function AvatarMenu({ user, isLocalMode, onClose }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { askConfirmation } = useConfirmDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const go = (path) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    const confirmed = await askConfirmation({
      title: 'Cerrar sesión',
      description: '¿Seguro que quieres cerrar tu sesión actual?',
      confirmLabel: 'Sí, cerrar sesión',
      danger: true,
    });
    if (!confirmed || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('No se pudo cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800">
        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
          {user?.displayName || (isLocalMode ? 'Modo Local' : 'Usuario')}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
          {user?.email || 'Sin cuenta'}
        </p>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={() => go(ROUTES.profile)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          <User size={16} className="text-slate-400" /> Mi Perfil
        </button>
        <button
          type="button"
          onClick={() => go(ROUTES.settings)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={16} className="text-slate-400" /> Configuración
        </button>
        <div className="border-t border-slate-100 dark:border-gray-800 mt-1 pt-1">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} /> {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
