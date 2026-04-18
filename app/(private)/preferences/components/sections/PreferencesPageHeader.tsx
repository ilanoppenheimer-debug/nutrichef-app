'use client';

import { ArrowLeft } from 'lucide-react';

type PreferencesPageHeaderProps = {
  onBack: () => void;
  title: string;
  description: string;
};

export default function PreferencesPageHeader({
  onBack,
  title,
  description,
}: PreferencesPageHeaderProps) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </>
  );
}
