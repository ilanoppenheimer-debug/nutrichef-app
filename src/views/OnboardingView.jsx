import { useState } from 'react';
import { Activity, Apple, BookOpen, ChefHat, CheckCircle2, ChevronRight, Dumbbell, ShoppingBag, Target } from 'lucide-react';
import { useAppState } from '../context/appState.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths.js';
import { calculateTDEE, getSupermarketsForCountry } from '../lib/gemini.js';
import { SAFE_BRANDS } from '../lib/brandDatabase.js';

const SPORT_OPTIONS = ['Ninguno', 'Cardio', 'Fuerza/Powerlifting', 'Crossfit', 'HIIT', 'Deportes de equipo'];
const GOAL_OPTIONS = [
  { value: 'Mantenimiento y energia', label: 'Mantener peso y energía', emoji: '⚖️' },
  { value: 'Déficit calórico (Pérdida de peso)', label: 'Perder peso', emoji: '📉' },
  { value: 'Superávit calórico (Ganancia muscular)', label: 'Ganar músculo', emoji: '💪' },
  { value: 'Comer más saludable general', label: 'Comer más sano', emoji: '🥗' },
];

const STEPS = [
  { id: 'welcome',   title: '¡Bienvenido!',     icon: ChefHat },
  { id: 'goal',      title: 'Tu objetivo',      icon: Target },
  { id: 'body',      title: 'Biometría',        icon: Activity },
  { id: 'sport',     title: 'Deporte',          icon: Dumbbell },
  { id: 'diet',      title: 'Dieta',            icon: Apple },
  { id: 'religion',  title: 'Religión/Ética',   icon: BookOpen },
  { id: 'shopping',  title: 'Supermercado',     icon: ShoppingBag },
  { id: 'done',      title: '¡Listo!',          icon: CheckCircle2 },
];


export default function OnboardingView() {
  const { profile, setProfile } = useAppState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const finish = () => {
    // Calcular macros automáticamente al terminar
    const macros = calculateTDEE(profile);
    if (macros && !profile.manualCalories) {
      setProfile(p => ({
        ...p,
        dailyCalories: macros.calories.toString(),
        proteinTarget: macros.protein.toString(),
        fiberTarget: macros.fiber.toString(),
        carbTarget: macros.carbs.toString(),
      }));
    }
    navigate(ROUTES.create);
  };

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[--c-bg] to-white dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`flex flex-col items-center gap-1 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  i < step ? 'bg-[--c-primary] text-white' :
                  i === step ? 'border-2 border-[--c-primary] text-[--c-primary]' :
                  'border-2 border-slate-200 dark:border-gray-700 text-slate-300'
                }`}>
                  {i < step ? <CheckCircle2 size={14} /> : <s.icon size={13} />}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--c-primary)' }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-800 p-8">

          {/* Paso 0: Bienvenida */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto rotate-3" style={{ background: 'var(--c-primary)' }}>
                <ChefHat size={34} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Hola, {profile.displayName || 'bienvenido'} 👋</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Vamos a configurar tu perfil en 2 minutos para que NutriChef IA te dé recomendaciones personalizadas.
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300 text-left bg-slate-50 dark:bg-gray-800 rounded-2xl p-4">
                {['Tu objetivo y metas calóricas', 'Tu biometría para calcular tus macros', 'Tu deporte para ajustar la proteína', 'Tus preferencias y restricciones'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: 'var(--c-primary)' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paso 1: Objetivo */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">¿Cuál es tu objetivo principal?</h2>
              <div className="space-y-2">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile(p => ({ ...p, goals: opt.value }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      profile.goals === opt.value
                        ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                        : 'border-slate-200 dark:border-gray-700 hover:border-[--c-primary-border]'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-semibold text-sm">{opt.label}</span>
                    {profile.goals === opt.value && <CheckCircle2 size={16} className="ml-auto shrink-0" style={{ color: 'var(--c-primary)' }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Biometría */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Cuéntanos sobre ti</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Necesitamos esto para calcular tus calorías y proteínas exactas.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Edad', field: 'age', placeholder: '30', suffix: 'años' },
                  { label: 'Peso', field: 'weight', placeholder: '70', suffix: 'kg' },
                  { label: 'Altura', field: 'height', placeholder: '175', suffix: 'cm' },
                ].map(({ label, field, placeholder, suffix }) => (
                  <div key={field} className={field === 'height' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                    <div className="flex items-center border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                      <input
                        type="number"
                        value={profile[field]}
                        onChange={e => setProfile(p => ({ ...p, [field]: e.target.value, manualCalories: false }))}
                        placeholder={placeholder}
                        className="flex-1 p-3 outline-none text-sm bg-transparent dark:text-white"
                      />
                      <span className="px-3 text-xs text-slate-400 dark:text-slate-500 font-medium">{suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Género</label>
                  <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value, manualCalories: false }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none">
                    <option>Femenino</option>
                    <option>Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Actividad</label>
                  <select value={profile.activityLevel} onChange={e => setProfile(p => ({ ...p, activityLevel: e.target.value, manualCalories: false }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none">
                    <option value="1.2">Sedentario</option>
                    <option value="1.375">Ligero</option>
                    <option value="1.55">Moderado</option>
                    <option value="1.725">Activo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Deporte */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">¿Practicas algún deporte?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Los deportes de fuerza necesitan más proteína y ajustes en el TDEE.</p>
              <div className="grid grid-cols-2 gap-2">
                {SPORT_OPTIONS.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setProfile(p => ({ ...p, sportType: sport }))}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      profile.sportType === sport
                        ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
              {profile.sportType !== 'Ninguno' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duración/sesión</label>
                    <div className="flex items-center border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                      <input type="number" value={profile.trainingDuration} onChange={e => setProfile(p => ({ ...p, trainingDuration: e.target.value }))} placeholder="60" className="flex-1 p-3 outline-none text-sm bg-transparent dark:text-white" />
                      <span className="px-2 text-xs text-slate-400">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Días/semana</label>
                    <select value={profile.trainingDaysPerWeek} onChange={e => setProfile(p => ({ ...p, trainingDaysPerWeek: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none">
                      {['1','2','3','4','5','6','7'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 4: Dieta */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Restricciones alimentarias</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Puedes saltarte este paso y configurarlo después.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Estilo de dieta</label>
                <div className="flex flex-wrap gap-2">
                  {['Ninguna', 'Vegetariana', 'Vegana', 'Pescatariana', 'Keto', 'Paleo'].map(d => (
                    <button key={d} onClick={() => setProfile(p => ({ ...p, dietaryStyle: d }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${profile.dietaryStyle === d ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Alergias</label>
                <div className="flex flex-wrap gap-2">
                  {['Sin Gluten', 'Sin Lácteos', 'Alergia al Maní', 'Alergia a Mariscos', 'Sin Soya'].map(a => (
                    <button key={a} onClick={() => setProfile(p => ({
                      ...p,
                      allergies: p.allergies.includes(a) ? p.allergies.filter(x => x !== a) : [...p.allergies, a]
                    }))} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${profile.allergies.includes(a) ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'}`}>
                      {profile.allergies.includes(a) && '✓ '}{a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Paso 5: Restricciones religiosas y éticas */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Restricciones religiosas y éticas</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                La IA nunca sugerirá ingredientes no permitidos. Puedes saltarte este paso.
              </p>
              <div className="space-y-2">
                {[
                  { value: 'Ninguna',                 emoji: '—',  desc: 'Sin restricciones religiosas' },
                  { value: 'Kosher',                  emoji: '✡️', desc: 'Sin mezcla carne/lácteos · carne certificada' },
                  { value: 'Halal',                   emoji: '☪️', desc: 'Sin cerdo ni alcohol · carne certificada' },
                  { value: 'Hindú (Sin carne de res)',emoji: '🕉️', desc: 'Sin carne de res ni derivados' },
                  { value: 'Jainista',                emoji: '🟡', desc: 'Sin carne, huevos ni raíces (ajo, cebolla)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile(p => ({ ...p, religiousDiet: opt.value }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${profile.religiousDiet === opt.value ? 'border-[--c-primary] bg-[--c-primary-light]' : 'border-slate-200 dark:border-gray-700 hover:border-[--c-primary-border]'}`}
                  >
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{opt.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{opt.desc}</p>
                    </div>
                    {profile.religiousDiet === opt.value && <CheckCircle2 size={15} className="shrink-0" style={{ color: 'var(--c-primary)' }} />}
                  </button>
                ))}
              </div>
              {profile.religiousDiet === 'Kosher' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  ✡️ La app sugerirá marcas Kosher disponibles en <strong>{profile.country || 'tu país'}</strong>.
                </div>
              )}
            </div>
          )}

          {/* Paso 6: Supermercados (multi-select dinámico por país) */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">¿Dónde compras?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Selecciona uno o más. La IA priorizará marcas disponibles ahí. Opcional.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {getSupermarketsForCountry(profile.country || 'Chile').map(s => {
                  const selected = (profile.preferredSupermarkets || []).includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setProfile(p => {
                        const current = p.preferredSupermarkets || [];
                        return {
                          ...p,
                          preferredSupermarkets: selected
                            ? current.filter(x => x !== s)
                            : [...current, s],
                        };
                      })}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all min-h-[48px] text-left ${selected ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]' : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'}`}
                    >
                      <span className="flex-1 leading-tight">{s}</span>
                      {selected && <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--c-primary)' }} />}
                    </button>
                  );
                })}
              </div>
              {(profile.preferredSupermarkets || []).length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ✓ Seleccionados: <strong>{profile.preferredSupermarkets.join(', ')}</strong>
                </p>
              )}
            </div>
          )}

{/* Paso 7: Listo */}
          {step === 7 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">¡Todo listo!</h2>
              {(() => {
                const macros = calculateTDEE(profile);
                return macros ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Calorías/día', value: `${macros.calories} kcal`, color: 'orange' },
                      { label: 'Proteína', value: `${macros.protein}g`, color: 'blue' },
                      { label: 'Carbohidratos', value: `${macros.carbs}g`, color: 'amber' },
                      { label: 'Fibra', value: `${macros.fiber}g`, color: 'green' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-xl border border-${color}-100 dark:border-${color}-800`}>
                        <div className={`text-xs font-semibold text-${color}-700 dark:text-${color}-300`}>{label}</div>
                        <div className={`text-lg font-black text-${color}-800 dark:text-${color}-200`}>{value}</div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
              <p className="text-slate-500 dark:text-slate-400 text-xs">Tus macros se calcularon automáticamente. Puedes ajustarlos en tu perfil.</p>
            </div>
          )}

          {/* Navegación */}
          <div className="flex gap-3 mt-6">
            {step > 0 && step < STEPS.length - 1 && (
              <button onClick={prev} className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:border-slate-400 transition-colors">
                Atrás
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all" style={{ background: 'var(--c-primary)' }}>
                {step === 0 ? 'Comenzar' : 'Siguiente'} <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={finish} className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all" style={{ background: 'var(--c-primary)' }}>
                Empezar a cocinar 🍳
              </button>
            )}
          </div>

          {step > 0 && step < STEPS.length - 1 && step !== 4 && (
            <button onClick={next} className="w-full mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 text-center py-1">
              Saltar este paso →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
