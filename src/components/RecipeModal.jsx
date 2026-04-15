import { useEffect } from 'react';
import { X } from 'lucide-react';
import RecipeCard from './RecipeCard.jsx';
import BottomSheet from './BottomSheet.jsx';

/**
 * RecipeModal — opens a RecipeCard in:
 * - Mobile (< sm): full-height bottom sheet sliding up from bottom
 * - Desktop (≥ sm): centered modal overlay with backdrop
 *
 * Props:
 *   recipe          — recipe object (null = closed)
 *   onClose         — called when user dismisses
 *   onRecipeChange  — forwarded to RecipeCard for AI adjustments
 */
export default function RecipeModal({ recipe, onClose, onRecipeChange }) {
  const isOpen = !!recipe;

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Mobile: bottom sheet (hidden on sm+) ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet — nearly full-screen, scrollable */}
        <div
          className="relative z-10 flex flex-col rounded-t-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-250"
          style={{ maxHeight: '95dvh', height: '95dvh' }}
          role="dialog"
          aria-modal="true"
        >
          {/* Drag handle + close row */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
            <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <div />
            <button
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-300 dark:hover:bg-gray-700 active:scale-90"
              aria-label="Cerrar receta"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable RecipeCard */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <RecipeCard recipe={recipe} onRecipeChange={onRecipeChange} />
          </div>
        </div>
      </div>

      {/* ── Desktop: centered modal (hidden below sm) ── */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4 lg:p-8">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal card */}
        <div
          className="relative z-10 w-full max-w-2xl lg:max-w-4xl flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl animate-in zoom-in-75 duration-200 overflow-hidden"
          style={{ maxHeight: '90dvh' }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-slate-500 dark:text-slate-400 shadow-sm transition-colors hover:bg-white dark:hover:bg-gray-900 active:scale-90"
            aria-label="Cerrar receta"
          >
            <X size={17} />
          </button>

          {/* Scrollable RecipeCard */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <RecipeCard recipe={recipe} onRecipeChange={onRecipeChange} />
          </div>
        </div>
      </div>
    </>
  );
}
