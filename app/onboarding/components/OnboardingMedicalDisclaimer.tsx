'use client';

export default function OnboardingMedicalDisclaimer({
  visible,
  accepted,
  onAcceptedChange,
}: {
  visible: boolean;
  accepted: boolean;
  onAcceptedChange: (checked: boolean) => void;
}) {
  if (!visible) return null;

  return (
    <label className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-800 dark:bg-amber-900/20">
      <input
        type="checkbox"
        checked={accepted}
        onChange={(e) => onAcceptedChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
      />
      <span className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
        Entiendo que NutriChef es una herramienta de asistencia y sugerencias nutricionales basadas en IA. No constituye un diagnóstico, tratamiento ni
        reemplaza la evaluación formal presencial de un profesional de la salud. Asumo la responsabilidad sobre las decisiones dietéticas que tome
        basándome en esta app.
      </span>
    </label>
  );
}
