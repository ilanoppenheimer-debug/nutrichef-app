'use client';

import { Lightbulb, X } from 'lucide-react';

export default function TipsFloatingButton({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      style={{ background: 'var(--c-primary)' }}
      title="Tips de cocina"
      aria-label="Abrir tips de cocina"
    >
      {open ? <X size={20} className="text-white" /> : <Lightbulb size={22} className="text-white" />}
    </button>
  );
}
