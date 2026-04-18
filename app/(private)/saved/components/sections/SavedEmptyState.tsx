'use client';

import type { LucideIcon } from 'lucide-react';

type SavedEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export default function SavedEmptyState({ icon: Icon, title, text }: SavedEmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-center text-slate-400 dark:text-slate-500">
      <Icon size={32} className="mx-auto mb-3 opacity-30" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm mt-1">{text}</p>
    </div>
  );
}
