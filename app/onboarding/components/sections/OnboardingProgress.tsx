'use client';

type OnboardingProgressProps = {
  stepIndex: number;
  stepsLength: number;
  currentTitle: string;
  progressPercent: number;
};

export default function OnboardingProgress({
  stepIndex,
  stepsLength,
  currentTitle,
  progressPercent,
}: OnboardingProgressProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          Paso {stepIndex + 1} de {stepsLength}
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{currentTitle}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: 'var(--c-primary)' }}
        />
      </div>
    </div>
  );
}
