import { INTENT_OPTIONS } from '../constants';

export default function CookIntentNav({
  intent,
  setIntent,
}: {
  intent: string;
  setIntent: (value: string) => void;
}) {
  return (
    <nav aria-label="Intención" className="flex flex-wrap gap-2">
      {INTENT_OPTIONS.map((opt) => {
        const isActive = intent === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setIntent(opt.value)}
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
