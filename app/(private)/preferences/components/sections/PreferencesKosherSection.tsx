'use client';

type PreferencesKosherSectionProps = {
  title: string;
  description: string;
  ariaLabel: string;
  kosher: boolean;
  onToggle: () => void;
};

export default function PreferencesKosherSection({
  title,
  description,
  ariaLabel,
  kosher,
  onToggle,
}: PreferencesKosherSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${kosher ? 'bg-amber-500' : 'bg-slate-300 dark:bg-gray-600'}`}
          aria-label={ariaLabel}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${kosher ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </section>
  );
}
