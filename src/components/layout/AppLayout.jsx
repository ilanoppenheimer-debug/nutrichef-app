import { useEffect, useRef, useState } from 'react';
import { Bookmark, Calendar, ChefHat, LogOut, Settings, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirmDialog } from '../../context/ConfirmDialogContext.jsx';
import TipsWidget from '../TipsWidget.jsx';

const DESKTOP_NAV_ITEMS = [
  { to: ROUTES.cook, label: 'Cocinar', icon: ChefHat },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
];

const MOBILE_NAV_ITEMS = [
  { to: ROUTES.cook, label: 'Cocinar', icon: ChefHat },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
];

function desktopNavClass({ isActive }) {
  return `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all ${
    isActive
      ? 'bg-[--c-primary-light] text-[--c-primary] shadow-sm'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-col items-center justify-center gap-1 py-2 px-1 flex-1 transition-all min-h-[56px] ${
    isActive ? '' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
  }`;
}

// Menú desplegable del avatar
function AvatarMenu({ user, isLocalMode, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { askConfirmation } = useConfirmDialog();

  const go = (path) => { onClose(); navigate(path); };
  const handleLogout = async () => {
    onClose();
    const confirmed = await askConfirmation({
      title: 'Cerrar sesión',
      description: '¿Seguro que quieres cerrar tu sesión actual?',
      confirmLabel: 'Sí, cerrar sesión',
      danger: true,
    });
    if (confirmed) logout();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800">
        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user?.displayName || (isLocalMode ? 'Modo Local' : 'Usuario')}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email || 'Sin cuenta'}</p>
      </div>

      {/* Opciones */}
      <div className="py-1">
        <button onClick={() => go(ROUTES.profile)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
          <User size={16} className="text-slate-400" /> Mi Perfil
        </button>
        <button onClick={() => go(ROUTES.settings)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
          <Settings size={16} className="text-slate-400" /> Configuración
        </button>
        <div className="border-t border-slate-100 dark:border-gray-800 mt-1 pt-1">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, isLocalMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al clicar fuera
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-28 md:pb-12 transition-colors duration-200">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <NavLink to={ROUTES.cook} className="flex items-center gap-2 shrink-0" style={{ color: 'var(--c-primary)' }}>
            <ChefHat size={26} />
            <h1 className="text-lg font-black tracking-tight hidden sm:block">NutriChef IA</h1>
          </NavLink>

          {/* Nav desktop */}
          <nav className="hidden sm:flex gap-1 flex-1 justify-center">
            {DESKTOP_NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                <item.icon size={17} />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Avatar con menú desplegable */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 transition-all"
              style={{ '--tw-ring-color': 'var(--c-primary-border)' }}
              aria-label="Menú de usuario"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-8 h-8 rounded-full border-2" style={{ borderColor: 'var(--c-primary-border)' }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--c-primary)' }}>
                  {user?.displayName?.[0] || (isLocalMode ? '?' : 'U')}
                </div>
              )}
            </button>

            {menuOpen && <AvatarMenu user={user} isLocalMode={isLocalMode} onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-5 lg:px-4 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Tips widget */}
      <TipsWidget />

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/96 dark:bg-gray-900/96 backdrop-blur-md border-t border-slate-100 dark:border-gray-800 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-20 px-3 pb-safe pt-2">
        <div className="flex items-stretch gap-1.5">
        {MOBILE_NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={mobileNavClass}>
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center rounded-2xl transition-all duration-200 ${
                    isActive ? 'w-12 h-7' : 'w-10 h-7'
                  }`}
                  style={isActive ? { background: 'var(--c-primary)' } : {}}
                >
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={isActive ? { color: 'white' } : {}}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold leading-none tracking-tight transition-colors ${
                    isActive ? '' : ''
                  }`}
                  style={isActive ? { color: 'var(--c-primary)' } : {}}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        </div>
      </nav>
    </div>
  );
}
