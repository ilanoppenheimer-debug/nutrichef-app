import { Settings2 } from 'lucide-react';

/**
 * RecipeHeaderCompact — título + línea de métricas.
 * Sin imagen, sin gradiente, sin padding excesivo.
 *
 * Props:
 *   title      — nombre de la receta
 *   macros     — { calories, protein } (strings ya formateados)
 *   prepTime   — string, ej "10 min"
 *   isRefined  — boolean, muestra badge "Ajustada con IA"
 */
export default function RecipeHeaderCompact({ title, macros, prepTime, isRefined }) {
  const calories = macros?.calories
    ? String(macros.calories).replace(/[^\d.]/g, '')
    : null;
  const protein = macros?.protein
    ? String(macros.protein).replace(/[^\d.]/g, '')
    : null;

  return (
    <div className="px-4 pt-4 pb-2">
      {isRefined && (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-gray-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <Settings2 size={9} /> Ajustada con IA
        </span>
      )}

      <h2 className="text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white line-clamp-2">
        {title}
      </h2>

      {(calories || protein || prepTime) && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0 text-sm text-slate-500 dark:text-slate-400">
          {calories && <span>🔥 {calories} kcal</span>}
          {protein && <span>💪 {protein}g prot</span>}
          {prepTime && <span>⏱ {prepTime}</span>}
        </p>
      )}
    </div>
  );
}
