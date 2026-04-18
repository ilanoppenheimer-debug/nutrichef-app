'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type ActionCardProps = {
  icon: LucideIcon;
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
};

/** Tarjeta de acción grande, mobile-first, con icono y cabecera fija. */
export default function ActionCard({ icon: Icon, title, subtitle, children }: ActionCardProps) {
  return (
    <section className="rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm p-5 space-y-4">
      <header className="flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
          style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
        >
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-base text-slate-800 dark:text-white leading-snug">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
