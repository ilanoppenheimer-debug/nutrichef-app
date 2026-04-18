'use client';

type PlanPageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PlanPageHeader({ title, subtitle }: PlanPageHeaderProps) {
  return (
    <header className="pt-1">
      <h1 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </header>
  );
}
