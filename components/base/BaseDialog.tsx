import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export type BaseDialogProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function BaseDialog({
  open,
  title,
  description,
  onClose,
  actions,
  children,
}: BaseDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-base font-black text-slate-800 dark:text-white">{title}</h3> : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar diálogo"
          >
            <X size={16} />
          </button>
        </div>
        {children}
        {actions ? <div className="mt-4 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
