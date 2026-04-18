'use client';

type PlanIntentOption = { value: string; label: string };

type PlanIntentChipsProps = {
  options: readonly PlanIntentOption[];
  intent: string;
  onIntentChange: (value: string) => void;
  ariaLabel: string;
};

export default function PlanIntentChips({
  options,
  intent,
  onIntentChange,
  ariaLabel,
}: PlanIntentChipsProps) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = intent === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onIntentChange(opt.value)}
            aria-pressed={isActive}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
              isActive
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200'
            }`}
            style={isActive ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
          >
            {opt.label}
          </button>
        );
      })}
    </nav>
  );
}
