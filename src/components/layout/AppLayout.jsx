import { Bookmark, Calendar, ChefHat, Compass, PlusCircle, Settings, Utensils } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TipsWidget from '../TipsWidget.jsx';

const NAV_ITEMS = [
  { to: ROUTES.create, label: 'Crear', icon: Utensils },
  { to: ROUTES.explore, label: 'Explorar', icon: Compass },
  { to: '/add-recipe', label: 'Agregar', icon: PlusCircle },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
  { to: ROUTES.profile, label: 'Perfil', icon: Settings },
];

function desktopNavClass({ isActive }) {
  return `flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${
    isActive
      ? 'bg-[--c-primary-light] text-[--c-primary] shadow-sm'
      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-700'
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-col items-center justify-center gap-1 py-2 px-2 flex-1 transition-all ${
    isActive ? 'text-[--c-primary]' : 'text-slate-400 dark:text-slate-500'
  }`;
}

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[--c-bg] dark:bg-gray-950 text-slate-800 dark:text-slate-100 font-sans pb-20 md:pb-12 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800 sticky top-0 z-20 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to={ROUTES.create} className="flex items-center gap-2" style={{ color: 'var(--c-primary)' }}>
            <ChefHat size={28} />
            <h1 className="text-xl font-bold tracking-tight">NutriChef IA</h1>
          </NavLink>

          <nav className="hidden sm:flex gap-1 md:gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={desktopNavClass}>
                <item.icon size={18} />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Usuario'}
              title={user.displayName || ''}
              className="w-9 h-9 rounded-full border-2 shadow-sm hidden sm:block"
              style={{ borderColor: 'var(--c-primary-border)' }}
            />
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Widget flotante de tips — visible en todas las pantallas */}
      <TipsWidget />

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-20 flex">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={mobileNavClass}>
            {({ isActive }) => (
              <>
                <item.icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={isActive ? { color: 'var(--c-primary)' } : {}}
                />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
