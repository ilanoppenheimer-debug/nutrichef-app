import { RefreshCw } from 'lucide-react';

// ── Shared option presets ────────────────────────────────────────────────────

export const COOKING_TWEAKS = [
  { value: 'mas_simple',    label: '✂️ Más simple' },
  { value: 'mas_proteina',  label: '💪 Más proteína' },
  { value: 'mas_economico', label: '💸 Más económico' },
  { value: 'sin_carne',     label: '🥗 Sin carne' },
  { value: 'mas_fibra',     label: '🌾 Más fibra' },
];

export const MEAL_PREP_TWEAKS = [
  { value: 'mas_proteina',  label: '💪 Más proteína' },
  { value: 'mas_economico', label: '💸 Más económico' },
  { value: 'sin_carne',     label: '🥗 Sin carne' },
  { value: 'mas_simple',    label: '⚡ Más simple' },
  { value: 'mas_fibra',     label: '🌾 Más fibra' },
];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * TweakBar — directed-change chip row for adjusting a generated result.
 *
 * Props:
 *   options       — array of { value, label }
 *   onTweak       — (changeType) => void
 *   tweakingType  — currently in-flight tweak value (drives loading UI)
 *   label         — optional header text (default: "Ajustar")
 */
export default function TweakBar({ options, onTweak, tweakingType, label = 'Ajustar' }) {
  if (!onTweak || !options?.length) return null;
  const isBusy = !!tweakingType;

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/60 p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isActive = tweakingType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTweak(opt.value)}
              disabled={isBusy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-gray-600'
              }`}
              style={isActive ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            >
              {isActive ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={11} className="animate-spin" />
                  Ajustando...
                </span>
              ) : opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
