'use client';

import { CheckCircle2, ChefHat } from 'lucide-react';
import { ONBOARDING_WELCOME_CHECKLIST } from '../../constants';

type OnboardingWelcomeStepProps = {
  displayName?: string;
};

export default function OnboardingWelcomeStep({ displayName }: OnboardingWelcomeStepProps) {
  return (
    <div className="space-y-5 text-center">
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-left dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-black">⚠️ Advertencia:</span> NutriChef IA puede cometer errores. Revisa siempre los
          ingredientes y sellos de certificación antes de consumir, especialmente si tienes alergias severas o
          restricciones religiosas estrictas.
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
          Hola, {displayName || 'bienvenido'}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Vamos a configurarte en pantallas cortas y claras para que cocinar en el celular se sienta fácil desde el
          primer minuto.
        </p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-gray-800 dark:bg-gray-800">
        {ONBOARDING_WELCOME_CHECKLIST.map((item) => (
          <div key={item} className="flex items-center gap-2 py-1.5 text-sm text-slate-700 dark:text-slate-200">
            <CheckCircle2 size={14} style={{ color: 'var(--c-primary)' }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
