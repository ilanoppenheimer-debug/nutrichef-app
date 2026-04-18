'use client';

import { X } from 'lucide-react';

export default function TipsPanelHeader({ onClose }) {
  return (
    <div
      className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-gray-800"
      style={{ background: 'var(--c-primary-light)' }}
    >
      <span className="font-black text-sm" style={{ color: 'var(--c-primary-text)' }}>
        💡 Tips de Cocina
      </span>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X size={16} />
      </button>
    </div>
  );
}
