import { Heart, Settings2, Star } from 'lucide-react';

/**
 * StickyCTA — barra fija inferior con 3 acciones:
 *   ❤  Favorita   |  ★ Agregar al plan (CTA primario)  |  ⚙ Ajustar con IA
 *
 * Props:
 *   isSavedForPlan   — boolean
 *   isFavorite       — boolean
 *   showAdjust       — boolean (estado del panel de ajuste)
 *   onTogglePlan     — fn
 *   onToggleFavorite — fn
 *   onToggleAdjust   — fn
 */
export default function StickyCTA({
  isSavedForPlan,
  isFavorite,
  showAdjust,
  onTogglePlan,
  onToggleFavorite,
  onToggleAdjust,
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-px overflow-hidden rounded-b-3xl">
      <div className="flex items-center gap-2 border-t border-slate-100 bg-white/96 px-4 pt-3 pb-16 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/96 sm:pb-4 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">

        {/* ❤ Favorita — icono solo */}
        <button
          onClick={onToggleFavorite}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 active:scale-90 ${
            isFavorite
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-300'
          }`}
          aria-label={isFavorite ? 'Quitar de favoritas' : 'Guardar como favorita'}
        >
          <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} className="transition-all duration-200" />
        </button>

        {/* ★ Agregar al plan — CTA primario, ocupa todo el ancho disponible */}
        <button
          onClick={onTogglePlan}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
            isSavedForPlan ? 'bg-amber-400 text-amber-900' : 'text-white'
          }`}
          style={!isSavedForPlan ? { background: 'var(--c-primary)' } : {}}
        >
          <Star size={18} fill={isSavedForPlan ? 'currentColor' : 'none'} className="transition-all duration-200" />
          {isSavedForPlan ? 'En tu plan ✓' : 'Agregar al plan'}
        </button>

        {/* ⚙ Ajustar con IA — icono solo */}
        <button
          onClick={onToggleAdjust}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200 active:scale-90 ${
            showAdjust
              ? 'bg-slate-900 dark:bg-white border-slate-900 text-white dark:text-slate-900'
              : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-300'
          }`}
          aria-label="Ajustar con IA"
        >
          <Settings2 size={19} />
        </button>

      </div>
    </div>
  );
}
