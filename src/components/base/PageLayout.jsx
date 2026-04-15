export default function PageLayout({ title, subtitle, className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-2xl space-y-6 ${className}`}>
      {(title || subtitle) && (
        <header>
          {title ? <h1 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </header>
      )}
      {children}
    </div>
  );
}
