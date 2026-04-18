import {
  AlertTriangle,
  Apple,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  Moon,
  RefreshCw,
  Star,
} from 'lucide-react';

import {
  ALLERGY_META,
  COMMON_ALLERGIES,
  DIETARY_META,
  DIETARY_STYLES,
  RELIGIOUS_DIETS,
  RELIGIOUS_META,
} from '../constants';
import { getProfileDietActiveCount } from '../profile.helpers';

export default function ProfileDietSection({
  profile,
  setProfile,
  openSections,
  toggleProfileSection,
  dislikeInput,
  setDislikeInput,
  otherAllergyInput,
  setOtherAllergyInput,
  toggleAllergy,
  addCustomAllergies,
  removeLearnedPref,
}) {
  const dietCount = getProfileDietActiveCount(profile);

  return (
    <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
      <button type="button" onClick={() => toggleProfileSection('diet')} className="flex w-full items-center justify-between">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Apple size={16} className="text-green-500" /> Dieta y Restricciones
          {!openSections.diet && dietCount > 0 && (
            <span className="ml-1 text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
              {dietCount} activa{dietCount > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        {openSections.diet ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {openSections.diet && (
        <div className="mt-4 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Apple size={12} className="text-green-500" /> Estilo de Dieta
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_STYLES.map((d) => {
                  const selected = profile.dietaryStyle === d;
                  const meta = DIETARY_META[d] || DIETARY_META.Ninguna;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setProfile({ ...profile, dietaryStyle: d })}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        selected
                          ? meta.active
                          : 'border-slate-200 bg-white text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{meta.icon}</span>
                      <span>{d}</span>
                      {selected && <CheckCircle2 size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                <BookOpen size={12} className="text-purple-500" /> Dieta Religiosa
              </label>
              <div className="flex flex-wrap gap-2">
                {RELIGIOUS_DIETS.map((d) => {
                  const selected = profile.religiousDiet === d;
                  const meta = RELIGIOUS_META[d] || RELIGIOUS_META.Ninguna;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setProfile({ ...profile, religiousDiet: d })}
                      className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        selected
                          ? meta.active
                          : 'border-slate-200 bg-white text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-sm">{meta.icon}</span>
                      <span>{d}</span>
                      {selected && d !== 'Ninguna' && <Lock size={11} className="shrink-0" />}
                      {selected && d === 'Ninguna' && <CheckCircle2 size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {profile.religiousDiet === 'Kosher' && (
            <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'var(--c-primary-border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--c-primary-light)' }}>
                <div className="flex items-center gap-2">
                  <Moon size={16} style={{ color: 'var(--c-primary)' }} />
                  <h4 className="font-black text-sm" style={{ color: 'var(--c-primary-text)' }}>
                    Modo Pésaj
                  </h4>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20"
                    style={{ color: 'var(--c-primary)' }}
                  >
                    Temporal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, pesachMode: !profile.pesachMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    profile.pesachMode ? '' : 'bg-slate-300 dark:bg-gray-600'
                  }`}
                  style={profile.pesachMode ? { background: 'var(--c-primary)' } : {}}
                  aria-label="Activar modo Pésaj"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      profile.pesachMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {profile.pesachMode && (
                <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                      <p className="font-bold text-red-700 dark:text-red-300 mb-1">❌ Jametz prohibido</p>
                      <p className="text-red-600 dark:text-red-400 leading-snug">
                        Trigo, cebada, centeno, avena, espelta y cualquier leudante (levadura, polvo de hornear, bicarbonato).
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                      <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">🔄 Sustituciones auto</p>
                      <p className="text-amber-600 dark:text-amber-400 leading-snug">
                        Harina común → almendras o fécula de papa · Aceite de girasol → aceite de oliva KP.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Star size={13} className="text-amber-500" />
                        ¿Consumes Kitniot?
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Kitniot: arroz, legumbres (porotos, garbanzos, lentejas), maíz/choclo, soja. Tradición sefardí los permite; askenazí los
                        prohíbe.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, allowsKitniot: !profile.allowsKitniot })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                        profile.allowsKitniot ? 'bg-green-500' : 'bg-slate-300 dark:bg-gray-600'
                      }`}
                      aria-label="Permitir Kitniot"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          profile.allowsKitniot ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      profile.allowsKitniot
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {profile.allowsKitniot
                      ? '✅ Kitniot permitido (tradición sefardí). Puedes usar arroz y legumbres, pero nunca Jametz.'
                      : '🔵 Sin Kitniot (tradición askenazí). Las recetas excluirán arroz, legumbres, maíz y soja además del Jametz.'}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">🏷️ Certificación Kasher lePésaj (KP)</p>
                    <p className="leading-snug">
                      Cada ingrediente envasado debe tener el sello <strong>KP</strong> o <strong>Kasher lePésaj</strong>. La app señalará cuando no
                      haya certeza de certificación.
                    </p>
                  </div>
                </div>
              )}

              {!profile.pesachMode && (
                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-900">
                  Activa este modo durante Pésaj para recetas sin Jametz con sustituciones automáticas y marcas KP.
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
              <AlertTriangle size={12} className="text-red-500" /> Alergias e Intolerancias
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {COMMON_ALLERGIES.map((a) => {
                const isActive = profile.allergies.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergy(a)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300'
                    }`}
                  >
                    <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-black text-red-700 dark:bg-black/10 dark:text-red-300 shrink-0">
                      {ALLERGY_META[a]?.icon || 'AL'}
                    </span>
                    <span className="flex-1 leading-tight">{a}</span>
                    {isActive && <Lock size={11} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
              <label className="mb-2 block text-xs font-bold text-red-800 dark:text-red-300">Otras alergias o intolerancias</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otherAllergyInput}
                  onChange={(e) => setOtherAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAllergies();
                    }
                  }}
                  placeholder="Ej: Sésamo, kiwi, mostaza"
                  className="flex-1 rounded-xl border border-red-200 bg-white p-2.5 text-sm outline-none dark:border-red-800 dark:bg-gray-900 dark:text-white"
                />
                <button type="button" onClick={addCustomAllergies} className="rounded-xl bg-red-600 px-4 text-sm font-bold text-white">
                  Añadir
                </button>
              </div>
              <p className="mt-2 text-xs text-red-700/80 dark:text-red-300/80">
                Se guardan dentro de tu lista de alergias y bloquean ingredientes automáticamente.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ingredientes que no te gustan</label>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Escribe y presiona Enter</p>
            <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-slate-200 dark:border-gray-600 flex flex-wrap gap-2 items-center min-h-[44px]">
              {profile.dislikes.map((item, i) => (
                <span
                  key={i}
                  className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-500 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, dislikes: profile.dislikes.filter((_, j) => j !== i) })}
                    className="text-slate-400 hover:text-red-500 font-bold text-sm leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dislikeInput.trim()) {
                    e.preventDefault();
                    if (!profile.dislikes.includes(dislikeInput.trim())) {
                      setProfile({ ...profile, dislikes: [...profile.dislikes, dislikeInput.trim()] });
                    }
                    setDislikeInput('');
                  }
                }}
                placeholder={profile.dislikes.length === 0 ? 'Ej: Cilantro, Mariscos...' : 'Agregar...'}
                className="flex-1 bg-transparent outline-none text-xs min-w-[120px] dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>

          {profile.learnedPreferences.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                <RefreshCw size={11} /> Lo que la IA aprendió de ti
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.learnedPreferences.map((pref, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => removeLearnedPref(i)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-red-200 hover:text-red-800 transition-colors group"
                    title="Clic para eliminar"
                  >
                    {pref} <span className="hidden group-hover:inline">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
