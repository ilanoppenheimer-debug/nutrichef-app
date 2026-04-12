import { useState } from 'react';
import { AlertTriangle, ChefHat, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths.js';

const GOAL_OPTIONS = [
  { value: 'Mantenimiento y energia', label: 'Mantener peso y energía', emoji: '⚖️' },
  { value: 'Déficit calórico (Pérdida de peso)', label: 'Perder peso', emoji: '📉' },
  { value: 'Superávit calórico (Ganancia muscular)', label: 'Ganar músculo', emoji: '💪' },
  { value: 'Comer más saludable general', label: 'Comer más sano', emoji: '🥗' },
];

// Dietas que funcionan como guardrail absoluto (religiosas o éticas estrictas)
const SAFETY_DIETS = [
  'Ninguna',
  'Kosher',
  'Halal',
  'Vegano',
  'Vegetariana',
  'Hindú (Sin carne de res)',
  'Jainista',
];

const COMMON_ALLERGIES = [
  'Sin Gluten',
  'Sin Lácteos',
  'Alergia al Maní',
  'Alergia a Mariscos',
  'Sin Soya',
];

const STEPS = [
  { id: 'welcome',  title: 'Bienvenido',        icon: ChefHat,        optional: false },
  { id: 'goal',     title: 'Objetivo',           icon: Target,         optional: false },
  { id: 'safety',   title: 'Filtros de Seguridad', icon: AlertTriangle, optional: true  },
  { id: 'done',     title: 'Listo',              icon: CheckCircle2,   optional: false },
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
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(
    Boolean(profile.medicalDisclaimerAccepted)
  );

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const next = () => setStep(current => Math.min(current + 1, STEPS.length - 1));
  const prev = () => setStep(current => Math.max(current - 1, 0));

  const toggleAllergy = (item) =>
    setProfile(current => ({
      ...current,
      allergies: current.allergies.includes(item)
        ? current.allergies.filter(entry => entry !== item)
        : [...current.allergies, item],
    }));

  const finish = () => {
    if (!medicalDisclaimerAccepted) return;
    setProfile(current => ({
      ...current,
      medicalDisclaimerAccepted: true,
      acceptedAt: new Date().toISOString(),
    }));
    navigate(ROUTES.create);
  };

  const renderStep = () => {
    // ── Paso 1: Bienvenida ────────────────────────────────────────────────
    if (currentStep.id === 'welcome') {
      return (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-left dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-black">⚠️ Advertencia:</span> NutriChef IA puede cometer errores. Revisa siempre los ingredientes y sellos de certificación antes de consumir, especialmente si tienes alergias severas o restricciones religiosas estrictas.
            </p>
          </div>
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-lg"
            style={{ background: 'var(--c-primary)' }}
          >
            <ChefHat size={32} />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              Hola, {profile.displayName || 'bienvenido'}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Vamos a configurarte en pantallas cortas y claras para que cocinar en el celular se sienta fácil desde el primer minuto.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-gray-800 dark:bg-gray-800">
            {['Tu objetivo nutricional', 'Tus filtros de seguridad y alergias'].map(item => (
              <div key={item} className="flex items-center gap-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 size={14} style={{ color: 'var(--c-primary)' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── Paso 2: Objetivo ──────────────────────────────────────────────────
    if (currentStep.id === 'goal') {
      return (
        <div className="space-y-4">
          <StepHeading
            title="¿Cuál es tu objetivo?"
            description="Esta decisión guía calorías, proteína y el tono de las recetas."
          />
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
                  {profile.goals === option.value && (
                    <CheckCircle2 size={16} style={{ color: 'var(--c-primary)' }} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ── Paso 3: Filtros de Seguridad (dieta estricta + alergias) ─────────
    if (currentStep.id === 'safety') {
      return (
        <div className="space-y-5">
          <StepHeading
            title="Filtros de Seguridad"
            description="¿Tienes alguna restricción inquebrantable o alergia? Si no tienes, sáltate este paso."
          />

          {/* Dieta religiosa o estricta */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Dieta religiosa o estricta
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SAFETY_DIETS.map(option => (
                <button
                  key={option}
                  onClick={() => setProfile(current => ({ ...current, religiousDiet: option }))}
                  className={`min-h-[56px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    profile.religiousDiet === option
                      ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="leading-tight">{option}</span>
                    {profile.religiousDiet === option && (
                      <CheckCircle2 size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Alergias comunes */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Alergias comunes
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_ALLERGIES.map(option => (
                <button
                  key={option}
                  onClick={() => toggleAllergy(option)}
                  className={`min-h-[56px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    profile.allergies.includes(option)
                      ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'
                      : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="leading-tight">{option}</span>
                    {profile.allergies.includes(option) && (
                      <CheckCircle2 size={14} className="shrink-0 text-red-500 dark:text-red-400" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── Paso 4: Listo ─────────────────────────────────────────────────────
    return (
      <div className="space-y-5 text-center">
        <div className="text-5xl">🎉</div>
        <StepHeading
          title="Perfil listo para cocinar"
          description="Ya podemos personalizar recetas y filtros. Puedes afinar tu perfil nutricional en cualquier momento desde Ajustes."
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-6 py-6 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Paso {step + 1} de {STEPS.length}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {currentStep.title}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--c-primary)' }}
            />
          </div>
        </div>

        {/* Tarjeta del paso */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {renderStep()}

          {/* Disclaimer médico — solo en el último paso */}
          {step === STEPS.length - 1 && (
            <label className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-900/20">
              <input
                type="checkbox"
                checked={medicalDisclaimerAccepted}
                onChange={e => setMedicalDisclaimerAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                Entiendo que NutriChef es una herramienta de asistencia y sugerencias nutricionales basadas en IA. No constituye un diagnóstico, tratamiento ni reemplaza la evaluación formal presencial de un profesional de la salud. Asumo la responsabilidad sobre las decisiones dietéticas que tome basándome en esta app.
              </span>
            </label>
          )}

          {/* Navegación */}
          <div className="mt-8 flex gap-3">
            {step > 0 && step < STEPS.length - 1 && (
              <button
                onClick={prev}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-slate-400 dark:border-gray-700 dark:text-slate-300"
              >
                Atrás
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all"
                style={{ background: 'var(--c-primary)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  {step === 0 ? 'Comenzar' : 'Siguiente'}
                  <ChevronRight size={16} />
                </span>
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={!medicalDisclaimerAccepted}
                className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'var(--c-primary)' }}
              >
                Empezar a cocinar
              </button>
            )}
          </div>

          {/* Saltar — solo en pasos opcionales intermedios */}
          {step > 0 && step < STEPS.length - 1 && currentStep.optional && (
            <button
              onClick={next}
              className="mt-3 w-full py-1 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Saltar este paso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
