import { CheckCircle2, Monitor, Moon, Sun } from 'lucide-react';
import BaseCard from '@/components/base/BaseCard';
import { THEMES } from '@/context/ThemeContext';

type Props = {
  colorMode: string | null;
  setMode: (mode: string | null) => void;
  themeId: string;
  setTheme: (theme: string) => void;
};

export default function AppearanceCard({ colorMode, setMode, themeId, setTheme }: Props) {
  return (
    <BaseCard title="Apariencia" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Apariencia</h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Modo</p>
          <div className="flex gap-2">
            {[
              { value: null, label: 'Sistema', icon: Monitor },
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Oscuro', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={String(value)}
                onClick={() => setMode(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all min-h-[64px] ${
                  colorMode === value
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-[--c-primary-border]'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Color del tema</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(THEMES).map(theme => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all min-h-[44px] ${
                  themeId === theme.id
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>{theme.emoji}</span>
                {theme.label}
                {themeId === theme.id && <CheckCircle2 size={13} style={{ color: 'var(--c-primary)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

