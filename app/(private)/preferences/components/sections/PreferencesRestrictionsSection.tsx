'use client';

import { Plus, X } from 'lucide-react';
import type { KeyboardEvent } from 'react';

type PreferencesRestrictionsSectionProps = {
  title: string;
  description: string;
  placeholder: string;
  addLabel: string;
  emptyLabel: string;
  restrictionInput: string;
  onRestrictionInputChange: (value: string) => void;
  onRestrictionKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddRestriction: () => void;
  restrictions: string[];
  onRemoveRestriction: (restriction: string) => void;
};

export default function PreferencesRestrictionsSection({
  title,
  description,
  placeholder,
  addLabel,
  emptyLabel,
  restrictionInput,
  onRestrictionInputChange,
  onRestrictionKeyDown,
  onAddRestriction,
  restrictions,
  onRemoveRestriction,
}: PreferencesRestrictionsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-slate-800 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={restrictionInput}
          onChange={(event) => onRestrictionInputChange(event.target.value)}
          onKeyDown={onRestrictionKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={onAddRestriction}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-bold text-white"
          style={{ background: 'var(--c-primary)' }}
        >
          <Plus size={16} /> {addLabel}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {restrictions.length > 0 ? (
          restrictions.map((restriction) => (
            <span
              key={restriction}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"
            >
              {restriction}
              <button
                type="button"
                onClick={() => onRemoveRestriction(restriction)}
                className="text-slate-400 transition-colors hover:text-red-500"
                aria-label={`Eliminar ${restriction}`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
