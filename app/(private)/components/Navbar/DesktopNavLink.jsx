'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActivePath } from './navbarConfig.js';

export default function DesktopNavLink({ to, icon: Icon, label }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, to);

  return (
    <Link
      href={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all ${
        active
          ? 'bg-[--c-primary-light] text-[--c-primary] shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={17} />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}
