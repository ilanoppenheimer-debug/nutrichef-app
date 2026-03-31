import { useState } from 'react';
import { Activity, AlertTriangle, Apple, BookOpen, ChefHat, CheckCircle2, ChevronRight, Dumbbell, ShoppingBag, Target, UserRound } from 'lucide-react';
import { useAppState } from '../context/appState.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths.js';
import { calculateTDEE, getSupermarketsForCountry } from '../lib/gemini.js';
import { mergeUniqueTerms } from '../lib/ingredientIntelligence.js';

const SPORT_OPTIONS = ['Ninguno', 'Cardio', 'Fuerza/Powerlifting', 'Crossfit', 'HIIT', 'Deportes de equipo'];
const GOAL_OPTIONS = [
  { value: 'Mantenimiento y energia', label: 'Mantener peso y energía', emoji: '⚖️' },
  { value: 'Déficit calórico (Pérdida de peso)', label: 'Perder peso', emoji: '📉' },
  { value: 'Superávit calórico (Ganancia muscular)', label: 'Ganar músculo', emoji: '💪' },
  { value: 'Comer más saludable general', label: 'Comer más sano', emoji: '🥗' },
];
const DIETARY_STYLES = ['Ninguna', 'Vegetariana', 'Vegana', 'Pescatariana', 'Keto', 'Paleo'];
const RELIGIOUS_DIETS = ['Ninguna', 'Halal', 'Kosher', 'Hindú (Sin carne de res)', 'Jainista'];
const COMMON_ALLERGIES = ['Sin Gluten', 'Sin Lácteos', 'Alergia al Maní', 'Alergia a Mariscos', 'Sin Soya'];
const STEPS = [
  { id: 'welcome', title: 'Bienvenido', icon: ChefHat, optional: false },
  { id: 'goal', title: 'Objetivo', icon: Target, optional: false },
  { id: 'age', title: 'Edad', icon: Activity, optional: false },
  { id: 'weight', title: 'Peso', icon: Activity, optional: false },
  { id: 'height', title: 'Altura', icon: Activity, optional: false },
  { id: 'gender', title: 'Género', icon: UserRound, optional: true },
  { id: 'activity', title: 'Actividad', icon: Activity, optional: true },
  { id: 'sport', title: 'Deporte', icon: Dumbbell, optional: true },
  { id: 'diet', title: 'Dieta', icon: Apple, optional: true },
  { id: 'allergies', title: 'Alergias', icon: AlertTriangle, optional: true },
  { id: 'religion', title: 'Religión', icon: BookOpen, optional: true },
  { id: 'shopping', title: 'Supermercados', icon: ShoppingBag, optional: true },
  { id: 'done', title: 'Listo', icon: CheckCircle2, optional: false },
];

function StepHeading({ title, description }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{title}</h2>
      <p className="text-base text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export default function OnboardingView() {
  const { profile, setProfile } = useAppState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [otherAllergyInput, setOtherAllergyInput] = useState('');

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const next = () => setStep(current => Math.min(current + 1, STEPS.length - 1));
  const prev = () => setStep(current => Math.max(current - 1, 0));
  const toggleAllergy = (item) => setProfile(current => ({
    ...current,
    allergies: current.allergies.includes(item)
      ? current.allergies.filter(entry => entry !== item)
      : [...current.allergies, item],
  }));
  const addCustomAllergies = () => {
    const nextAllergies = mergeUniqueTerms(profile.allergies, otherAllergyInput);
    if (nextAllergies.length === profile.allergies.length) return;
    setProfile(current => ({ ...current, allergies: nextAllergies }));
    setOtherAllergyInput('');
  };

  const finish = () => {
    const macros = calculateTDEE(profile);
    if (macros && !profile.manualCalories) {
      setProfile(current => ({
        ...current,
        dailyCalories: macros.calories.toString(),
        proteinTarget: macros.protein.toString(),
        fiberTarget: macros.fiber.toString(),
        carbTarget: macros.carbs.toString(),
      }));
    }
    navigate(ROUTES.create);
  };

  const renderStep = () => {
    if (currentStep.id === 'welcome') {
      return (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-left dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-black">⚠️ Advertencia:</span> NutriChef IA puede cometer errores. Revisa siempre los ingredientes y sellos de certificación antes de consumir, especialmente si tienes alergias severas o restricciones religiosas estrictas.
            </p>
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-lg" style={{ background: 'var(--c-primary)' }}>
            <ChefHat size={32} />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Hola, {profile.displayName || 'bienvenido'}</h1>
            <p className="text-base text-slate-500 dark:text-slate-400">Vamos a configurarte en pantallas cortas y claras para que cocinar en el celular se sienta fácil desde el primer minuto.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-gray-800 dark:bg-gray-800">
            {['Tu objetivo nutricional', 'Tus datos para calcular macros', 'Tus filtros con prioridad absoluta', 'Tus supermercados favoritos'].map(item => (
              <div key={item} className="flex items-center gap-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 size={14} style={{ color: 'var(--c-primary)' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'goal') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Cuál es tu objetivo?" description="Esta decisión guía calorías, proteína y el tono de las recetas." />
          <div className="space-y-3">
            {GOAL_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setProfile(current => ({ ...current, goals: option.value }))}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  profile.goals === option.value
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="flex-1 text-base font-semibold">{option.label}</span>
                  {profile.goals === option.value && <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'age' || currentStep.id === 'weight' || currentStep.id === 'height') {
      const config = {
        age: { title: '¿Qué edad tienes?', description: 'Usamos este dato para estimar tu gasto basal.', field: 'age', placeholder: '30', suffix: 'años' },
        weight: { title: '¿Cuál es tu peso actual?', description: 'Esto nos ayuda a ajustar calorías y proteína.', field: 'weight', placeholder: '70', suffix: 'kg' },
        height: { title: '¿Cuál es tu altura?', description: 'La altura mejora el cálculo de mantenimiento.', field: 'height', placeholder: '175', suffix: 'cm' },
      }[currentStep.id];

      return (
        <div className="space-y-5">
          <StepHeading title={config.title} description={config.description} />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <label className="mb-3 block text-sm font-bold text-slate-700 dark:text-slate-200">{config.suffix}</label>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-900">
              <input
                type="number"
                value={profile[config.field]}
                onChange={e => setProfile(current => ({ ...current, [config.field]: e.target.value, manualCalories: false }))}
                placeholder={config.placeholder}
                className="flex-1 bg-transparent text-3xl font-bold tracking-tight text-slate-800 outline-none dark:text-white"
              />
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{config.suffix}</span>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep.id === 'gender') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Cómo quieres que calculemos tus macros?" description="Puedes cambiar este dato después en tu perfil." />
          <div className="grid grid-cols-2 gap-3">
            {['Femenino', 'Masculino'].map(option => (
              <button
                key={option}
                onClick={() => setProfile(current => ({ ...current, gender: option, manualCalories: false }))}
                className={`rounded-2xl border-2 p-5 text-left text-base font-semibold transition-all ${
                  profile.gender === option
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{option}</span>
                  {profile.gender === option && <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'activity') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Qué tan activo eres?" description="Este paso afina el mantenimiento calórico antes de pensar en el plan semanal." />
          <div className="space-y-3">
            {[
              { value: '1.2', label: 'Sedentario', desc: 'Poca actividad diaria o escritorio.' },
              { value: '1.375', label: 'Ligero', desc: 'Movimiento suave 1 a 3 días.' },
              { value: '1.55', label: 'Moderado', desc: 'Actividad constante 3 a 5 días.' },
              { value: '1.725', label: 'Activo', desc: 'Entrenas o te mueves casi a diario.' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setProfile(current => ({ ...current, activityLevel: option.value, manualCalories: false }))}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  profile.activityLevel === option.value
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{option.label}</p>
                    <p className="mt-1 text-sm opacity-75">{option.desc}</p>
                  </div>
                  {profile.activityLevel === option.value && <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'sport') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Practicas algún deporte?" description="Esto ajusta proteína objetivo y recomendaciones más prácticas para tu rutina." />
          <div className="grid grid-cols-2 gap-3">
            {SPORT_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => setProfile(current => ({ ...current, sportType: option }))}
                className={`min-h-[80px] rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all ${
                  profile.sportType === option
                    ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <span className="block leading-tight">{option}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'diet') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Qué estilo de dieta sigues?" description="Elegiremos recetas coherentes con este estilo desde el primer scroll." />
          <div className="grid grid-cols-2 gap-3">
            {DIETARY_STYLES.map(option => (
              <button
                key={option}
                onClick={() => setProfile(current => ({ ...current, dietaryStyle: option }))}
                className={`min-h-[80px] rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all ${
                  profile.dietaryStyle === option
                    ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <span className="block leading-tight">{option}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'allergies') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿Hay algo que debamos bloquear?" description="Estas alertas se respetan con prioridad absoluta para marcas e ingredientes." />
          <div className="grid grid-cols-2 gap-3">
            {COMMON_ALLERGIES.map(option => (
              <button
                key={option}
                onClick={() => toggleAllergy(option)}
                className={`min-h-[80px] rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all ${
                  profile.allergies.includes(option)
                    ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <span className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-red-700 dark:bg-black/10 dark:text-red-300">Filtro</span>
                  {profile.allergies.includes(option) && <CheckCircle2 size={15} />}
                </span>
                <span className="block leading-tight">{option}</span>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <label className="mb-2 block text-sm font-bold text-red-800 dark:text-red-300">Otras alergias o intolerancias</label>
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
                placeholder="Ej: Sésamo, kiwi"
                className="flex-1 rounded-xl border border-red-200 bg-white p-3 text-sm outline-none dark:border-red-800 dark:bg-gray-900 dark:text-white"
              />
              <button onClick={addCustomAllergies} className="rounded-xl bg-red-600 px-4 text-sm font-bold text-white">
                Añadir
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep.id === 'religion') {
      return (
        <div className="space-y-4">
          <StepHeading title="Restricciones religiosas o éticas" description="Si activas Kosher, Halal u otra regla, la app la trata como un guardrail absoluto." />
          <div className="space-y-3">
            {RELIGIOUS_DIETS.map(option => (
              <button
                key={option}
                onClick={() => setProfile(current => ({ ...current, religiousDiet: option }))}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  profile.religiousDiet === option
                    ? option === 'Kosher'
                      ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
                      : 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{option}</p>
                    {profile.religiousDiet === option && option === 'Kosher' && (
                      <span className="mt-2 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-black/10 dark:text-amber-200">
                        Prioridad Absoluta
                      </span>
                    )}
                  </div>
                  {profile.religiousDiet === option && <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep.id === 'shopping') {
      return (
        <div className="space-y-4">
          <StepHeading title="¿En qué supermercados compras?" description="La IA priorizará precios, formatos y marcas que sí puedas encontrar." />
          <div className="grid grid-cols-2 gap-3">
            {getSupermarketsForCountry(profile.country || 'Chile').map(option => {
              const selected = (profile.preferredSupermarkets || []).includes(option);
              return (
                <button
                  key={option}
                  onClick={() => setProfile(current => {
                    const existing = current.preferredSupermarkets || [];
                    return {
                      ...current,
                      preferredSupermarkets: selected
                        ? existing.filter(item => item !== option)
                        : [...existing, option],
                    };
                  })}
                  className={`min-h-[84px] rounded-2xl border-2 p-4 text-left text-sm font-semibold transition-all ${
                    selected
                      ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                  }`}
                >
                  <span className="mb-2 flex items-center justify-between">
                    <ShoppingBag size={15} className="text-emerald-500" />
                    {selected && <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />}
                  </span>
                  <span className="block leading-tight">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const macros = calculateTDEE(profile);
    return (
      <div className="space-y-5 text-center">
        <div className="text-5xl">🎉</div>
        <StepHeading title="Perfil listo para cocinar" description="Ya podemos personalizar recetas, costos y filtros móviles con mucha más precisión." />
        {macros && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calorías', value: `${macros.calories} kcal`, className: 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200' },
              { label: 'Proteína', value: `${macros.protein} g`, className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200' },
              { label: 'Carbs', value: `${macros.carbs} g`, className: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200' },
              { label: 'Fibra', value: `${macros.fiber} g`, className: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200' },
            ].map(item => (
              <div key={item.label} className={`rounded-2xl border p-3 text-left ${item.className}`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-75">{item.label}</p>
                <p className="mt-1 text-lg font-bold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-6 py-6 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Paso {step + 1} de {STEPS.length}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{currentStep.title}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--c-primary)' }} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {renderStep()}

          <div className="mt-8 flex gap-3">
            {step > 0 && step < STEPS.length - 1 && (
              <button onClick={prev} className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 dark:border-gray-700 dark:text-slate-300">
                Atrás
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button onClick={next} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all" style={{ background: 'var(--c-primary)' }}>
                <span className="flex items-center justify-center gap-2">{step === 0 ? 'Comenzar' : 'Siguiente'} <ChevronRight size={16} /></span>
              </button>
            ) : (
              <button onClick={finish} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all" style={{ background: 'var(--c-primary)' }}>
                Empezar a cocinar
              </button>
            )}
          </div>

          {step > 0 && step < STEPS.length - 1 && currentStep.optional && (
            <button onClick={next} className="mt-3 w-full py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              Saltar este paso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
