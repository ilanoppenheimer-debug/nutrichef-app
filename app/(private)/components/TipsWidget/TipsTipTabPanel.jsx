'use client';

export default function TipsTipTabPanel({ dailyTip }) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)' }}
      >
        <div className="text-3xl mb-2">{dailyTip.emoji}</div>
        <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--c-primary-text)' }}>
          {dailyTip.text}
        </p>
        <p className="text-xs mt-2 opacity-50" style={{ color: 'var(--c-primary-text)' }}>
          Tip del día — cambia mañana
        </p>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Explora las otras pestañas para técnicas, sustituciones y equivalencias 👆
      </p>
    </div>
  );
}
