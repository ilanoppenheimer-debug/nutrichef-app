'use client';

type StepHeadingProps = {
  title: string;
  description: string;
};

export default function StepHeading({ title, description }: StepHeadingProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">{title}</h2>
      <p className="text-base text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
