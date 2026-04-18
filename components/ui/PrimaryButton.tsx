'use client';

import { RefreshCw, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export type PrimaryButtonProps = {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel: ReactNode;
  children: ReactNode;
};

/** CTA principal dentro de las tarjetas de cocina (estado de carga con icono). */
export default function PrimaryButton({
  onClick,
  disabled = false,
  loading = false,
  loadingLabel,
  children,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white font-black text-sm disabled:opacity-60 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
      style={{ background: 'var(--c-primary)' }}
    >
      {loading ? (
        <>
          <RefreshCw size={16} className="animate-spin" /> {loadingLabel}
        </>
      ) : (
        <>
          <Sparkles size={16} /> {children}
        </>
      )}
    </button>
  );
}
