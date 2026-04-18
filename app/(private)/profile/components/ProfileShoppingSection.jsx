import { CheckCircle2, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

import { getSupermarketsForCountry } from '@/lib/gemini.js';

export default function ProfileShoppingSection({ profile, setProfile, openSections, toggleProfileSection }) {
  return (
    <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
      <button type="button" onClick={() => toggleProfileSection('shopping')} className="flex w-full items-center justify-between">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
          <ShoppingBag size={16} className="text-emerald-500" /> Supermercados preferidos
        </h3>
        {openSections.shopping ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {openSections.shopping && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            La IA priorizará marcas disponibles en los que selecciones. Selección múltiple.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {getSupermarketsForCountry(profile.country || 'Chile').map((s) => {
              const selected = (profile.preferredSupermarkets || []).includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const current = profile.preferredSupermarkets || [];
                    setProfile({
                      ...profile,
                      preferredSupermarkets: selected ? current.filter((x) => x !== s) : [...current, s],
                    });
                  }}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                    selected
                      ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text] shadow-sm'
                      : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 hover:border-[--c-primary-border]'
                  }`}
                >
                  <ShoppingBag size={13} className="shrink-0 text-emerald-500" />
                  <span className="flex-1 leading-tight">{s}</span>
                  {selected && <CheckCircle2 size={12} className="shrink-0" style={{ color: 'var(--c-primary)' }} />}
                </button>
              );
            })}
          </div>
          {(profile.preferredSupermarkets || []).length > 0 && (
            <div className="mt-3 p-3 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              ✓ Activos: <strong>{profile.preferredSupermarkets.join(', ')}</strong>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
