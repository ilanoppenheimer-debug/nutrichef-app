import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Apple, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Dumbbell, HeartPulse, Lock, Moon, PiggyBank, RefreshCw, ShoppingBag, Star, Target, Trophy } from 'lucide-react';
import { useProfileStore } from '../stores/useProfileStore.js';
import { calculateTDEE, getSupermarketsForCountry } from '@/services/gemini.js';
import { mergeUniqueTerms } from '@/utils/ingredientIntelligence.js';

const SPORT_OPTIONS = ['Ninguno', 'Cardio', 'Fuerza/Powerlifting', 'Crossfit', 'HIIT', 'Deportes de equipo'];
const DIETARY_STYLES = ['Ninguna', 'Vegetariana', 'Vegana', 'Pescatariana', 'Keto', 'Paleo'];
const RELIGIOUS_DIETS = ['Ninguna', 'Halal', 'Kosher', 'Hindú (Sin carne de res)', 'Jainista'];
const COMMON_ALLERGIES = ['Sin Gluten', 'Sin Lácteos', 'Alergia al Maní', 'Alergia a Mariscos', 'Sin Soya'];

const DIETARY_META = {
  Ninguna: { icon: '•', active: 'border-slate-300 bg-slate-100 text-slate-700' },
  Vegetariana: { icon: '🥬', active: 'border-green-300 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
  Vegana: { icon: '🌱', active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' },
  Pescatariana: { icon: '🐟', active: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:text-sky-300' },
  Keto: { icon: '🥑', active: 'border-lime-300 bg-lime-50 text-lime-800 dark:bg-lime-900/20 dark:text-lime-300' },
  Paleo: { icon: '🥩', active: 'border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
};

const RELIGIOUS_META = {
  Ninguna: { icon: '•', active: 'border-slate-300 bg-slate-100 text-slate-700' },
  Halal: { icon: '☪', active: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300' },
  Kosher: { icon: '✡', active: 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.22)]' },
  'Hindú (Sin carne de res)': { icon: '🕉', active: 'border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-900/20 dark:text-orange-300' },
  Jainista: { icon: '◌', active: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-900/20 dark:text-fuchsia-300' },
};

const ALLERGY_META = {
  'Sin Gluten': { icon: 'GF' },
  'Sin Lácteos': { icon: 'DF' },
  'Alergia al Maní': { icon: 'PN' },
  'Alergia a Mariscos': { icon: 'SF' },
  'Sin Soya': { icon: 'SY' },
};

export default function ProfileView() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const [dislikeInput, setDislikeInput] = useState('');
  const [otherAllergyInput, setOtherAllergyInput] = useState('');
  const [openSections, setOpenSections] = useState({ biometry: true, diet: true, shopping: false });
  const toggleProfileSection = (key) => setOpenSections(c => ({ ...c, [key]: !c[key] }));

  // Recalcular macros automáticamente cuando cambien los datos relevantes
  useEffect(() => {
    if (profile.manualCalories && profile.manualProtein && profile.manualFiber && profile.manualCarb) return;
    if (!profile.weight || !profile.height || !profile.age) return;

    const macros = calculateTDEE(profile);
    if (!macros) return;

    setProfile(prev => ({
      ...prev,
      ...(!prev.manualCalories && { dailyCalories: macros.calories.toString() }),
      ...(!prev.manualProtein && { proteinTarget: macros.protein.toString() }),
      ...(!prev.manualFiber && { fiberTarget: macros.fiber.toString() }),
      ...(!prev.manualCarb && { carbTarget: macros.carbs.toString() }),
    }));
  }, [
    profile.weight, profile.height, profile.age, profile.gender,
    profile.activityLevel, profile.goals,
    profile.sportType, profile.trainingDuration, profile.trainingDaysPerWeek,
    profile.manualCalories, profile.manualProtein, profile.manualFiber, profile.manualCarb,
    setProfile
  ]);

  const toggleAllergy = (a) => setProfile({ ...profile, allergies: profile.allergies.includes(a) ? profile.allergies.filter(x => x !== a) : [...profile.allergies, a] });
  const removeLearnedPref = (i) => { const p = [...profile.learnedPreferences]; p.splice(i, 1); setProfile({ ...profile, learnedPreferences: p }); };
  const addCustomAllergies = () => {
    const nextAllergies = mergeUniqueTerms(profile.allergies, otherAllergyInput);
    if (nextAllergies.length === profile.allergies.length) return;
    setProfile({ ...profile, allergies: nextAllergies });
    setOtherAllergyInput('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* Banner médico */}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-black">⚠️ Advertencia:</span> NutriChef IA es un asistente inteligente, pero puede cometer errores. Revisa siempre los ingredientes y sellos de certificación antes de consumir, especialmente si tienes alergias severas o restricciones religiosas estrictas.
        </p>
      </div>

      {/* Meta principal */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
        <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--c-primary-text)' }}>
          <Target size={18} /> Tu Meta Principal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--c-primary-text)' }}>Objetivo</label>
            <select value={profile.goals} onChange={e => setProfile({ ...profile, goals: e.target.value, manualCalories: false })} className="w-full p-3 rounded-xl border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-medium" style={{ borderColor: 'var(--c-primary-border)' }}>
              <option>Mantenimiento y energia</option>
              <option>Déficit calórico (Pérdida de peso)</option>
              <option>Superávit calórico (Ganancia muscular)</option>
              <option>Comer más saludable general</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--c-primary-text)' }}>Nivel de actividad</label>
            <select value={profile.activityLevel} onChange={e => setProfile({ ...profile, activityLevel: e.target.value, manualCalories: false })} className="w-full p-3 rounded-xl border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-medium" style={{ borderColor: 'var(--c-primary-border)' }}>
              <option value="1.2">Sedentario</option>
              <option value="1.375">Ligero (1-3 días/semana)</option>
              <option value="1.55">Moderado (3-5 días/semana)</option>
              <option value="1.725">Activo (6-7 días/semana)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Biometría */}
      <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
        <button
          type="button"
          onClick={() => toggleProfileSection('biometry')}
          className="flex w-full items-center justify-between"
        >
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={16} className="text-blue-500" /> Biometría y Macros
          </h3>
          {openSections.biometry ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {openSections.biometry && <div className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Edad', field: 'age', placeholder: '30' },
            { label: 'Peso (kg)', field: 'weight', placeholder: '70' },
            { label: 'Altura (cm)', field: 'height', placeholder: '175' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
              <input type="number" value={profile[field]} onChange={e => setProfile({ ...profile, [field]: e.target.value, manualCalories: false })} placeholder={placeholder} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Género</label>
            <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value, manualCalories: false })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm">
              <option>Femenino</option>
              <option>Masculino</option>
            </select>
          </div>
        </div>

        {/* Macros calculados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
          {[
            { label: 'Calorías', field: 'dailyCalories', manualKey: 'manualCalories', suffix: 'kcal', color: 'orange' },
            { label: 'Proteína', field: 'proteinTarget', manualKey: 'manualProtein', suffix: 'g', color: 'blue' },
            { label: 'Carbohidratos', field: 'carbTarget', manualKey: 'manualCarb', suffix: 'g', color: 'amber' },
            { label: 'Fibra', field: 'fiberTarget', manualKey: 'manualFiber', suffix: 'g', color: 'green' },
          ].map(({ label, field, manualKey, suffix, color }) => (
            <div key={field} className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-xl border border-${color}-100 dark:border-${color}-800`}>
              <div className="flex justify-between items-center mb-1">
                <label className={`text-xs font-bold text-${color}-800 dark:text-${color}-300`}>{label}</label>
                {profile[manualKey] && <span className={`text-[9px] bg-${color}-200 dark:bg-${color}-800 text-${color}-700 px-1.5 py-0.5 rounded-full font-bold`}>Manual</span>}
              </div>
              <div className="flex items-center gap-1">
                <input type="number" value={profile[field]} onChange={e => setProfile({ ...profile, [field]: e.target.value, [manualKey]: true })} placeholder="—" className="flex-1 p-2 rounded-lg border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-bold min-w-0" />
                <span className={`text-xs text-${color}-600 dark:text-${color}-400 font-medium shrink-0`}>{suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
          {[
            { key: 'useProteinPowder', label: 'Proteína en Polvo', desc: 'Permite recetas con suplemento.', icon: Dumbbell, color: 'blue' },
            { key: 'budgetFriendly', label: 'Modo Económico', desc: 'Prioriza recetas de bajo costo.', icon: PiggyBank, color: 'emerald' },
          ].map(({ key, label, desc, icon: Icon, color }) => (
            <div key={key} className={`flex items-center justify-between bg-${color}-50 dark:bg-${color}-900/20 p-4 rounded-xl border border-${color}-200 dark:border-${color}-800`}>
              <div>
                <h4 className={`font-bold text-${color}-900 dark:text-${color}-300 text-sm flex items-center gap-1`}><Icon size={15} /> {label}</h4>
                <p className={`text-xs text-${color}-700 dark:text-${color}-400`}>{desc}</p>
              </div>
              <button onClick={() => setProfile({ ...profile, [key]: !profile[key] })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${profile[key] ? `bg-${color}-600` : 'bg-slate-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        </div>}
      </section>

      {/* Deporte */}
      <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
        <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" /> Deporte y Entrenamiento
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Ajusta el TDEE y la proteína según tu tipo de entrenamiento.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {SPORT_OPTIONS.map(sport => (
            <button key={sport} onClick={() => setProfile({ ...profile, sportType: sport, manualCalories: false })} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${profile.sportType === sport ? 'text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'}`} style={profile.sportType === sport ? { background: 'var(--c-primary)' } : {}}>
              {sport}
            </button>
          ))}
        </div>
        {profile.sportType !== 'Ninguno' && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duración por sesión</label>
              <div className="flex items-center border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                <input type="number" value={profile.trainingDuration} onChange={e => setProfile({ ...profile, trainingDuration: e.target.value, manualCalories: false })} placeholder="60" className="flex-1 p-3 outline-none text-sm dark:text-white bg-transparent" />
                <span className="px-2 text-xs text-slate-400 font-medium">min</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Días por semana</label>
              <select value={profile.trainingDaysPerWeek} onChange={e => setProfile({ ...profile, trainingDaysPerWeek: e.target.value, manualCalories: false })} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm">
                {['1','2','3','4','5','6','7'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Dieta */}
      <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
        <button
          type="button"
          onClick={() => toggleProfileSection('diet')}
          className="flex w-full items-center justify-between"
        >
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Apple size={16} className="text-green-500" /> Dieta y Restricciones
            {!openSections.diet && (() => {
              const count = [
                profile.dietaryStyle && profile.dietaryStyle !== 'Ninguna' ? 1 : 0,
                profile.religiousDiet && profile.religiousDiet !== 'Ninguna' ? 1 : 0,
                ...(profile.allergies?.map(() => 1) || []),
              ].reduce((a, b) => a + b, 0);
              return count > 0 ? (
                <span className="ml-1 text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {count} activa{count > 1 ? 's' : ''}
                </span>
              ) : null;
            })()}
          </h3>
          {openSections.diet ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {openSections.diet && <div className="mt-4 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><Apple size={12} className="text-green-500" /> Estilo de Dieta</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_STYLES.map(d => {
                const selected = profile.dietaryStyle === d;
                const meta = DIETARY_META[d] || DIETARY_META.Ninguna;
                return (
                  <button
                    key={d}
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><BookOpen size={12} className="text-purple-500" /> Dieta Religiosa</label>
            <div className="flex flex-wrap gap-2">
              {RELIGIOUS_DIETS.map(d => {
                const selected = profile.religiousDiet === d;
                const meta = RELIGIOUS_META[d] || RELIGIOUS_META.Ninguna;
                return (
                  <button
                    key={d}
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

        {/* ── Panel Pésaj — solo visible si Kosher ───────────────────── */}
        {profile.religiousDiet === 'Kosher' && (
          <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'var(--c-primary-border)' }}>
            {/* Header del panel */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--c-primary-light)' }}>
              <div className="flex items-center gap-2">
                <Moon size={16} style={{ color: 'var(--c-primary)' }} />
                <h4 className="font-black text-sm" style={{ color: 'var(--c-primary-text)' }}>Modo Pésaj</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20" style={{ color: 'var(--c-primary)' }}>Temporal</span>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setProfile({ ...profile, pesachMode: !profile.pesachMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${profile.pesachMode ? '' : 'bg-slate-300 dark:bg-gray-600'}`}
                style={profile.pesachMode ? { background: 'var(--c-primary)' } : {}}
                aria-label="Activar modo Pésaj"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profile.pesachMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Contenido expandido cuando está activo */}
            {profile.pesachMode && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                {/* Resumen de restricciones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <p className="font-bold text-red-700 dark:text-red-300 mb-1">❌ Jametz prohibido</p>
                    <p className="text-red-600 dark:text-red-400 leading-snug">Trigo, cebada, centeno, avena, espelta y cualquier leudante (levadura, polvo de hornear, bicarbonato).</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">🔄 Sustituciones auto</p>
                    <p className="text-amber-600 dark:text-amber-400 leading-snug">Harina común → almendras o fécula de papa · Aceite de girasol → aceite de oliva KP.</p>
                  </div>
                </div>

                {/* Switch Kitniot */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Star size={13} className="text-amber-500" />
                      ¿Consumes Kitniot?
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Kitniot: arroz, legumbres (porotos, garbanzos, lentejas), maíz/choclo, soja.
                      Tradición sefardí los permite; askenazí los prohíbe.
                    </p>
                  </div>
                  <button
                    onClick={() => setProfile({ ...profile, allowsKitniot: !profile.allowsKitniot })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${profile.allowsKitniot ? 'bg-green-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                    aria-label="Permitir Kitniot"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profile.allowsKitniot ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Estado actual */}
                <div className={`p-3 rounded-xl text-xs leading-relaxed ${profile.allowsKitniot ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300'}`}>
                  {profile.allowsKitniot
                    ? '✅ Kitniot permitido (tradición sefardí). Puedes usar arroz y legumbres, pero nunca Jametz.'
                    : '🔵 Sin Kitniot (tradición askenazí). Las recetas excluirán arroz, legumbres, maíz y soja además del Jametz.'}
                </div>

                {/* Aviso de marcas KP */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">🏷️ Certificación Kasher lePésaj (KP)</p>
                  <p className="leading-snug">Cada ingrediente envasado debe tener el sello <strong>KP</strong> o <strong>Kasher lePésaj</strong>. La app señalará cuando no haya certeza de certificación.</p>
                </div>
              </div>
            )}

            {/* Estado inactivo — resumen */}
            {!profile.pesachMode && (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-900">
                Activa este modo durante Pésaj para recetas sin Jametz con sustituciones automáticas y marcas KP.
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><AlertTriangle size={12} className="text-red-500" /> Alergias e Intolerancias</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {COMMON_ALLERGIES.map(a => {
              const isActive = profile.allergies.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300'
                  }`}
                >
                  <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-black text-red-700 dark:bg-black/10 dark:text-red-300 shrink-0">{ALLERGY_META[a]?.icon || 'AL'}</span>
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
                onChange={e => setOtherAllergyInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAllergies();
                  }
                }}
                placeholder="Ej: Sésamo, kiwi, mostaza"
                className="flex-1 rounded-xl border border-red-200 bg-white p-2.5 text-sm outline-none dark:border-red-800 dark:bg-gray-900 dark:text-white"
              />
              <button onClick={addCustomAllergies} className="rounded-xl bg-red-600 px-4 text-sm font-bold text-white">
                Añadir
              </button>
            </div>
            <p className="mt-2 text-xs text-red-700/80 dark:text-red-300/80">Se guardan dentro de tu lista de alergias y bloquean ingredientes automáticamente.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ingredientes que no te gustan</label>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Escribe y presiona Enter</p>
          <div className="bg-slate-50 dark:bg-gray-800 p-3 rounded-xl border border-slate-200 dark:border-gray-600 flex flex-wrap gap-2 items-center min-h-[44px]">
            {profile.dislikes.map((item, i) => (
              <span key={i} className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-500 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
                {item}
                <button onClick={() => setProfile({ ...profile, dislikes: profile.dislikes.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-red-500 font-bold text-sm leading-none">×</button>
              </span>
            ))}
            <input type="text" value={dislikeInput} onChange={e => setDislikeInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && dislikeInput.trim()) { e.preventDefault(); if (!profile.dislikes.includes(dislikeInput.trim())) setProfile({ ...profile, dislikes: [...profile.dislikes, dislikeInput.trim()] }); setDislikeInput(''); } }} placeholder={profile.dislikes.length === 0 ? 'Ej: Cilantro, Mariscos...' : 'Agregar...'} className="flex-1 bg-transparent outline-none text-xs min-w-[120px] dark:text-white dark:placeholder-gray-500" />
          </div>
        </div>

        {profile.learnedPreferences.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1"><RefreshCw size={11} /> Lo que la IA aprendió de ti</label>
            <div className="flex flex-wrap gap-2">
              {profile.learnedPreferences.map((pref, i) => (
                <button key={i} onClick={() => removeLearnedPref(i)} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-red-200 hover:text-red-800 transition-colors group" title="Clic para eliminar">
                  {pref} <span className="hidden group-hover:inline">×</span>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>}
      </section>

      {/* ── Supermercados preferidos (multi-select) ─────────────────── */}
      <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
        <button
          type="button"
          onClick={() => toggleProfileSection('shopping')}
          className="flex w-full items-center justify-between"
        >
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingBag size={16} className="text-emerald-500" /> Supermercados preferidos
          </h3>
          {openSections.shopping ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {openSections.shopping && <div className="mt-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          La IA priorizará marcas disponibles en los que selecciones. Selección múltiple.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {getSupermarketsForCountry(profile.country || 'Chile').map(s => {
            const selected = (profile.preferredSupermarkets || []).includes(s);
            return (
              <button
                key={s}
                onClick={() => {
                  const current = profile.preferredSupermarkets || [];
                  setProfile({
                    ...profile,
                    preferredSupermarkets: selected
                      ? current.filter(x => x !== s)
                      : [...current, s],
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
        </div>}
      </section>
    </div>
  );
}
