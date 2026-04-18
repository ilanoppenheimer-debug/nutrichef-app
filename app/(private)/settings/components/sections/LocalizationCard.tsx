import type { CSSProperties } from 'react';
import { CheckCircle2, Globe } from 'lucide-react';
import BaseCard from '@/components/base/BaseCard';
import { DEFAULT_PROFILE } from '@/stores/useProfileStore.js';
import { COUNTRIES, LANGUAGES } from '../../constants';

type Profile = typeof DEFAULT_PROFILE;

type Props = {
  profile: Profile;
  setProfile: (next: Profile | ((prev: Profile) => Profile)) => void;
};

export default function LocalizationCard({ profile, setProfile }: Props) {
  return (
    <BaseCard title="Localización" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Globe size={12} /> Localización
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">País / Región</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">La IA usará nombres locales de ingredientes y marcas de tu país. Ej: \"palta\" en Chile, \"aguacate\" en México.</p>
          <select
            value={profile.country || 'Chile'}
            onChange={e => setProfile({ ...profile, country: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none focus:ring-2 min-h-[48px]"
            style={{ '--tw-ring-color': 'var(--c-primary)' } as CSSProperties}
          >
            {COUNTRIES.map(country => <option key={country}>{country}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Idioma de respuesta</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Las recetas generadas por la IA responderán en el idioma seleccionado.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map(language => (
              <button
                key={language.code}
                onClick={() => setProfile({ ...profile, language: language.code })}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all min-h-[48px] ${
                  (profile.language || 'es') === language.code
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.label}</span>
                {(profile.language || 'es') === language.code && <CheckCircle2 size={13} className="ml-auto shrink-0" style={{ color: 'var(--c-primary)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

