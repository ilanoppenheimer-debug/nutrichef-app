'use client';

import Link from 'next/link';
import { ChefHat } from 'lucide-react';

import { ROUTES } from '@/lib/routes.js';
import { useAuth } from '@/context/AuthContext';

import AvatarMenu from './AvatarMenu.jsx';
import DesktopNavLink from './DesktopNavLink.jsx';
import { DESKTOP_NAV_ITEMS, MOBILE_NAV_ITEMS } from './navbarConfig.js';
import MobileNavLink from './MobileNavLink.jsx';
import { useUserMenu } from './useUserMenu.js';

export default function Navbar() {
  const { user, isLocalMode } = useAuth();
  const { menuOpen, setMenuOpen, menuRef } = useUserMenu();

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20 border-b border-slate-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href={ROUTES.cook} className="flex items-center gap-2 shrink-0" style={{ color: 'var(--c-primary)' }}>
            <ChefHat size={26} />
            <h1 className="text-lg font-black tracking-tight hidden sm:block">NutriChef IA</h1>
          </Link>

          <nav className="hidden sm:flex gap-1 flex-1 justify-center">
            {DESKTOP_NAV_ITEMS.map((item) => (
              <DesktopNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 transition-all"
              style={{ '--tw-ring-color': 'var(--c-primary-border)' }}
              aria-label="Menú de usuario"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ borderColor: 'var(--c-primary-border)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'var(--c-primary)' }}
                >
                  {user?.displayName?.[0] || (isLocalMode ? '?' : 'U')}
                </div>
              )}
            </button>

            {menuOpen && (
              <AvatarMenu user={user} isLocalMode={isLocalMode} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        </div>
      </header>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/96 dark:bg-gray-900/96 backdrop-blur-md border-t border-slate-100 dark:border-gray-800 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] z-20 px-3 pb-safe pt-2">
        <div className="flex items-stretch gap-1.5">
          {MOBILE_NAV_ITEMS.map((item) => (
            <MobileNavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </div>
      </nav>
    </>
  );
}
