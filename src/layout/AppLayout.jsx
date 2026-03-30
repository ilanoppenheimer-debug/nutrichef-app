import { useEffect, useRef, useState } from 'react';
import { Bookmark, Calendar, ChefHat, Compass, LogOut, PlusCircle, Settings, Star, Utensils, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TipsWidget from '../TipsWidget.jsx';

const NAV_ITEMS = [
  { to: ROUTES.create, label: 'Crear', icon: Utensils },
  { to: ROUTES.explore, label: 'Explorar', icon: Compass },
  { to: '/add-recipe', label: 'Agregar', icon: PlusCircle },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
];

function desktopNavClass({ isActive }) {
  return `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all min-h-[44px] ${
    isActive
      ? 'bg-[--c-primary-light] text-[--c-primary] shadow-sm'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
  }`;
}

// Bottom nav mobile — 48px mínimo para touch
function mobileNavClass({ isActive }) {
  return `flex flex-col items-center justify-center gap-1 flex-1 transition-all min-h-[48px] py-2 px-1 ${
    isActive ? 'text-[--c-primary]' : 'text-slate-400 dark:text-slate-500'
  }`;
}

// Avatar menu desplegable
function AvatarMenu({ user, isLocalMode, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const go = (path) => { onClose(); navigate(path); };

  const menuItems = [
    { label: 'Mi Perfil', icon: User, path: ROUTES.profile },
    { label: 'Mis Recetas', icon: Star, path: ROUTES.saved },
    { label: 'Ajustes', icon: Settings, path: ROUTES.settings },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Info usuario */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border-2" style={{ borderColor: 'var(--c-primary-border)' }} />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--c-primary)' }}>
            {user?.displayName?.[0] || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user?.displayName || (isLocalMode ? 'Modo Local' : 'Usuario')}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email || 'Sin cuenta'}</p>
        </div>
      </div>

      {/* Opciones */}
      <div className="py-1">
        {menuItems.map(item => (
          <button
            key={item.path}
            onClick={() => go(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
          >
            <item.icon size={16} className="text-slate-400 dark:text-slate-500" />
            {item.label}
          </button>
        ))}
        <div className="border-t border-slate-100 dark:border-gray-800 mt-1 pt-1">
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
          >
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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[--c-bg] dark:bg-gray-950 text-slate-800 dark:text-slate-100 font-sans pb-16 md:pb-0 transition-colors duration-200">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <NavLink to={ROUTES.create} className="flex items-center gap-2 shrink-0" style={{ color: 'var(--c-primary)' }}>
            <ChefHat size={26} />
            <h1 className="text-lg font-black tracking-tight hidden sm:block">NutriChef IA</h1>
          </NavLink>

          {/* Nav desktop */}
          <nav className="hidden md:flex gap-1 flex-1 justify-center">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                <item.icon size={17} />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Avatar con menú */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 transition-all min-h-[44px] min-w-[44px] justify-center"
              style={{ '--tw-ring-color': 'var(--c-primary-border)' }}
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-9 h-9 rounded-full border-2"
                  style={{ borderColor: 'var(--c-primary-border)' }}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'var(--c-primary)' }}
                >
                  {user?.displayName?.[0] || (isLocalMode ? '?' : 'U')}
                </div>
              )}
            </button>
            {menuOpen && <AvatarMenu user={user} isLocalMode={isLocalMode} onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </header>

      {/* Main — max-w-7xl para aprovechar pantallas grandes */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Tips widget flotante */}
      <TipsWidget />

      {/* Bottom nav SOLO en mobile — 48px touch targets */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-20 flex"
        aria-label="Navegación principal"
      >
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={mobileNavClass}>
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={isActive ? { color: 'var(--c-primary)' } : {}}
                />
                <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Avatar pequeño en mobile bottom nav */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[48px] py-2 px-1 text-slate-400 dark:text-slate-500"
          aria-label="Menú usuario"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border" style={{ borderColor: 'var(--c-primary-border)' }} />
          ) : (
            <User size={22} strokeWidth={1.8} />
          )}
          <span className="text-[9px] font-semibold leading-none">Yo</span>
        </button>
      </nav>
    </div>
  );
}
