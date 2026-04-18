import type { TimeGreeting } from '../types';

export default function CookPageHeader({ greeting }: { greeting: TimeGreeting }) {
  return (
    <header className="pt-1">
      <h1 className="text-2xl font-black text-slate-800 dark:text-white">¿Qué te apetece hoy?</h1>
      {greeting.hint && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {greeting.emoji} {greeting.hint}
        </p>
      )}
    </header>
  );
}
