import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';

export function useSettingsActions() {
  const { logout, linkToGoogle } = useAuth();
  const { askConfirmation } = useConfirmDialog();
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLinkGoogle = async () => {
    const confirmed = await askConfirmation({
      title: 'Vincular cuenta Google',
      description: '¿Quieres vincular tu cuenta local con Google para sincronizar datos?',
      confirmLabel: 'Sí, vincular',
    });
    if (!confirmed) return;

    setLinkingGoogle(true);
    try {
      await linkToGoogle();
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await askConfirmation({
      title: 'Cerrar sesión',
      description: '¿Seguro que quieres cerrar tu sesión actual?',
      confirmLabel: 'Sí, cerrar sesión',
      danger: true,
    });
    if (!confirmed || loggingOut) return;

    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('No se pudo cerrar sesión:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    linkingGoogle,
    loggingOut,
    handleLinkGoogle,
    handleLogout,
  };
}

