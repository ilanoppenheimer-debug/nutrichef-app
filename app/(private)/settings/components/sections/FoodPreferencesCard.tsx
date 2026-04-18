import { ShieldCheck } from 'lucide-react';
import BaseCard from '@/components/base/BaseCard';
import { ROUTES } from '@/lib/routes.js';

type Props = {
  summaryLines: string[];
  onNavigate: (path: string) => void;
};

export default function FoodPreferencesCard({ summaryLines, onNavigate }: Props) {
  return (
    <BaseCard title="Preferencias alimentarias" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <ShieldCheck size={12} /> Preferencias alimentarias
        </h2>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fuente única para kosher, dietas y restricciones.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Estas preferencias influyen siempre en los resultados de la IA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summaryLines.length > 0 ? summaryLines.map(item => (
            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300">
              {item}
            </span>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay preferencias activas.</p>
          )}
        </div>
        <button onClick={() => onNavigate(ROUTES.preferences)} className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white" style={{ background: 'var(--c-primary)' }}>
          Editar preferencias
        </button>
      </div>
    </BaseCard>
  );
}

