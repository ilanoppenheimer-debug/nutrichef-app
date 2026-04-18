'use client';

import StepHeading from './StepHeading';

export default function OnboardingDoneStep() {
  return (
    <div className="space-y-5 text-center">
      <div className="text-5xl">🎉</div>
      <StepHeading
        title="Perfil listo para cocinar"
        description="Ya podemos personalizar recetas y filtros. Puedes afinar tu perfil nutricional en cualquier momento desde Ajustes."
      />
    </div>
  );
}
