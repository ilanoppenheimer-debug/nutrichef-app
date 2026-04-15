import { useEffect } from 'react';
import { X } from 'lucide-react';
import RecipeCard from './RecipeCard.jsx';
import { useBottomSheet } from '../hooks/useBottomSheet.js';

/**
 * RecipeBottomSheet — displays a RecipeCard in:
 *
 * Mobile (< sm):
 *   - Bottom sheet, 90dvh, slides up from bottom
 *   - Swipe the drag handle down to dismiss
 *   - Tap backdrop to dismiss
 *
 * Desktop (≥ sm):
 *   - Centered modal with zoom-in animation
 *   - Tap backdrop or X to dismiss
 *
 * Props:
 *   recipe          — recipe object; null = closed
 *   onClose         — called after the closing animation completes
 *   onRecipeChange  — forwarded to RecipeCard (AI adjustments)
 *   onTweak         — (changeType) => void  optional, enables tweak chip bar
 *   tweakingType    — currently in-flight tweak type (loading state)
 */
export default function RecipeBottomSheet({ recipe, onClose, onRecipeChange, onTweak, tweakingType }) {
  const bs = useBottomSheet({ onClosed: onClose });

  // Sync recipe prop → open/close the sheet
  useEffect(() => {
    if (recipe) {
      bs.open();
    } else {
      // Only close if currently mounted (avoids spurious close on initial render)
      if (bs.mounted) bs.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!recipe]);

  // Lock body scroll while mounted
  useEffect(() => {
    if (bs.mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [bs.mounted]);

  if (!bs.mounted) return null;

  return (
    <>
      {/* ══ MOBILE bottom sheet ══════════════════════════════════════════════ */}
      <div className="sm:hidden fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={bs.backdropStyle}
          onClick={bs.close}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden"
          style={{ ...bs.sheetStyle, height: '90dvh', maxHeight: '90dvh' }}
          role="dialog"
          aria-modal="true"
        >
          {/* ── Drag handle area (touch target for swipe) ─── */}
          <div
            {...bs.handleProps}
            className="flex flex-col items-center px-4 pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
            aria-label="Arrastrar para cerrar"
          >
            <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600" />
          </div>

          {/* ── Close button ─────────────────────────────── */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={bs.close}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 dark:bg-gray-800/80 text-slate-500 dark:text-slate-400 backdrop-blur-sm transition-colors hover:bg-slate-300 dark:hover:bg-gray-700 active:scale-90"
              aria-label="Cerrar receta"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Scrollable content ───────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Keep RecipeCard mounted while bs.mounted (even if recipe prop
                changes to null during the exit animation) */}
            {recipe && (
              <RecipeCard
                recipe={recipe}
                onRecipeChange={onRecipeChange}
                onTweak={onTweak}
                tweakingType={tweakingType}
              />
            )}
          </div>
        </div>
      </div>

      {/* ══ DESKTOP centered modal ═══════════════════════════════════════════ */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center p-4 lg:p-8">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={bs.backdropStyle}
          onClick={bs.close}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className="relative z-10 w-full max-w-2xl lg:max-w-4xl flex flex-col rounded-3xl bg-slate-50 dark:bg-slate-950 shadow-2xl overflow-hidden"
          style={{
            maxHeight: '90dvh',
            opacity: bs.visible ? 1 : 0,
            transform: bs.visible ? 'scale(1)' : 'scale(0.95)',
            transition: `opacity 250ms ease, transform 250ms cubic-bezier(0.32, 0.72, 0, 1)`,
          }}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={bs.close}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 text-slate-500 dark:text-slate-400 shadow-sm transition-colors hover:bg-white dark:hover:bg-gray-900 active:scale-90"
            aria-label="Cerrar receta"
          >
            <X size={17} />
          </button>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {recipe && (
              <RecipeCard
                recipe={recipe}
                onRecipeChange={onRecipeChange}
                onTweak={onTweak}
                tweakingType={tweakingType}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
