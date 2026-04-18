import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable bottom sheet component.
 * - Mobile: slides up from bottom with backdrop
 * - Closes on backdrop click or X button
 * - Respects safe-area-inset-bottom (iPhone notch)
 * - Supports optional title
 */
export default function BottomSheet({ isOpen, onClose, title, children, maxHeightClass = 'max-h-[85vh]' }) {
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`relative z-10 flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom-4 duration-250 ${maxHeightClass}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-0 h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600 shrink-0" />

        {/* Header (optional title + close) */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
          {title ? (
            <h2 className="text-base font-bold text-slate-800 dark:text-white">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-gray-700 active:scale-90"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Safe-area spacer */}
        <div className="shrink-0" style={{ height: 'max(env(safe-area-inset-bottom), 0.75rem)' }} />
      </div>
    </div>
  );
}
