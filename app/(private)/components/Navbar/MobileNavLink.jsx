'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActivePath } from './navbarConfig.js';

export default function MobileNavLink({ to, icon: Icon, label }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, to);

  return (
    <Link
      href={to}
      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 flex-1 transition-all min-h-[56px] ${
        active ? '' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <div
        className={`flex items-center justify-center rounded-2xl transition-all duration-200 ${
          active ? 'w-12 h-7' : 'w-10 h-7'
        }`}
        style={active ? { background: 'var(--c-primary)' } : {}}
      >
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 2}
          style={active ? { color: 'white' } : {}}
        />
      </div>
      <span
        className="text-[10px] font-bold leading-none tracking-tight transition-colors"
        style={active ? { color: 'var(--c-primary)' } : {}}
      >
        {label}
      </span>
    </Link>
  );
}
