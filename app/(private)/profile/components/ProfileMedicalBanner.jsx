export default function ProfileMedicalBanner() {
  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
        <span className="font-black">⚠️ Advertencia:</span> NutriChef IA es un asistente inteligente, pero puede cometer errores. Revisa siempre los
        ingredientes y sellos de certificación antes de consumir, especialmente si tienes alergias severas o restricciones religiosas estrictas.
      </p>
    </div>
  );
}
