import { FLAVOR_OPTIONS } from '../constants';

export default function CookFlavorNav({
  flavor,
  setFlavor,
}: {
  flavor: string;
  setFlavor: (value: string) => void;
}) {
  return (
    <nav aria-label="Sabor" className="flex flex-wrap gap-2 -mt-2">
      {FLAVOR_OPTIONS.map((opt) => {
        const isActive = flavor === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFlavor(opt.value)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              isActive
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300'
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
