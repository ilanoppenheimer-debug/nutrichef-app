'use client';

import { CheckCircle2 } from 'lucide-react';
import {
  ONBOARDING_COMMON_ALLERGIES,
  ONBOARDING_DIETARY_STYLES,
  ONBOARDING_RELIGIOUS_DIETS,
} from '../../constants';
import StepHeading from './StepHeading';

type OnboardingSafetyStepProps = {
  selectedDietaryStyle: string;
  selectedReligiousDiet: string;
  selectedAllergies: string[];
  onSelectDietaryStyle: (value: string) => void;
  onSelectReligiousDiet: (value: string) => void;
  onToggleAllergy: (value: string) => void;
};

export default function OnboardingSafetyStep({
  selectedDietaryStyle,
  selectedReligiousDiet,
  selectedAllergies,
  onSelectDietaryStyle,
  onSelectReligiousDiet,
  onToggleAllergy,
}: OnboardingSafetyStepProps) {
  return (
    <div className="space-y-5">
      <StepHeading
        title="Filtros de Seguridad"
        description="¿Tienes alguna restricción o alergia? Si no tienes, sáltate este paso."
      />

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Estilo alimentario
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ONBOARDING_DIETARY_STYLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectDietaryStyle(option.value)}
              className={`min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                selectedDietaryStyle === option.value
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="leading-tight">{option.label}</span>
                {selectedDietaryStyle === option.value && (
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Dieta religiosa
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ONBOARDING_RELIGIOUS_DIETS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectReligiousDiet(option.value)}
              className={`min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                selectedReligiousDiet === option.value
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="leading-tight">{option.label}</span>
                {selectedReligiousDiet === option.value && (
                  <CheckCircle2 size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Alergias e intolerancias
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Selecciona todas las que apliquen. La IA nunca usará estos ingredientes.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ONBOARDING_COMMON_ALLERGIES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggleAllergy(option.value)}
              className={`min-h-[48px] rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                selectedAllergies.includes(option.value)
                  ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200'
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="leading-tight">{option.label}</span>
                {selectedAllergies.includes(option.value) && (
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
