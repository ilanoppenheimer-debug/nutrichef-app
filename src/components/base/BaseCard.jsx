export default function BaseCard({ title, subtitle, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {(title || subtitle) && (
        <header className="border-b border-slate-100 px-5 py-3 dark:border-gray-800">
          {title ? <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
