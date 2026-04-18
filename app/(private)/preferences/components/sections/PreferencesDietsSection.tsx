'use client';

import { SlidersHorizontal } from 'lucide-react';

export type FoodDietOption = { id: string; label: string };

type PreferencesDietsSectionProps = {
  title: string;
  description: string;
  options: readonly FoodDietOption[];
  selectedIds: string[];
  onToggleDiet: (id: string) => void;
};

export default function PreferencesDietsSection({
  title,
  description,
  options,
  selectedIds,
  onToggleDiet,
}: PreferencesDietsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
          <SlidersHorizontal size={16} /> {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggleDiet(option.id)}
              className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${selected ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]' : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
