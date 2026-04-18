'use client';

import { ShieldCheck } from 'lucide-react';

type PreferencesGuardrailSectionProps = {
  title: string;
  body: string;
  emptyLabel: string;
  clearLabel: string;
  summaryLines: string[];
  hasActivePreferences: boolean;
  onClear: () => void;
};

export default function PreferencesGuardrailSection({
  title,
  body,
  emptyLabel,
  clearLabel,
  summaryLines,
  hasActivePreferences,
  onClear,
}: PreferencesGuardrailSectionProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-300">
            <ShieldCheck size={16} /> {title}
          </h2>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{body}</p>
        </div>
        {hasActivePreferences && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-white dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            {clearLabel}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {summaryLines.length > 0 ? (
          summaryLines.map((item) => (
            <span
              key={item}
              className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
