import { LogOut, RefreshCw, Upload } from 'lucide-react';
import BaseCard from '@/components/base/BaseCard';
import BaseButton from '@/components/base/BaseButton';

type Props = {
  user: any;
  isLocalMode: boolean;
  linkingGoogle: boolean;
  loggingOut: boolean;
  onLinkGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
};

export default function AccountCard({
  user,
  isLocalMode,
  linkingGoogle,
  loggingOut,
  onLinkGoogle,
  onLogout,
}: Props) {
  return (
    <BaseCard title="Cuenta" className="overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full border-2 shadow-sm" style={{ borderColor: 'var(--c-primary-border)' }} />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ background: 'var(--c-primary)' }}>
            {user?.displayName?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-white truncate">{user?.displayName || (isLocalMode ? 'Modo local' : 'Usuario')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || (isLocalMode ? 'Sin cuenta - solo este dispositivo' : '')}</p>
        </div>
        {isLocalMode ? (
          <BaseButton onClick={onLinkGoogle} disabled={linkingGoogle} className="shrink-0">
            {linkingGoogle ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            <span className="hidden sm:inline">Vincular Google</span>
          </BaseButton>
        ) : (
          <BaseButton variant="secondary" onClick={onLogout} disabled={loggingOut} className="shrink-0 text-slate-500 hover:text-red-600">
            <LogOut size={15} />
            <span className="hidden sm:inline">{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
          </BaseButton>
        )}
      </div>
      {isLocalMode && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          En modo local tus datos no se sincronizan. Vincula tu cuenta Google para no perderlos.
        </div>
      )}
    </BaseCard>
  );
}

