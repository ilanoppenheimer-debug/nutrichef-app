import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export default function BaseButton({
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  children,
  ...props
}: BaseButtonProps) {
  const variantClass =
    {
      primary: 'text-white',
      secondary:
        'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-slate-200 dark:border-gray-700',
      ghost: 'bg-transparent text-slate-600 dark:text-slate-300',
      danger: 'bg-red-600 text-white',
    }[variant] || 'text-white';

  const variantStyle = variant === 'primary' ? { background: 'var(--c-primary)' } : undefined;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${variantClass} ${className}`}
      style={variantStyle}
      {...props}
    >
      {children}
    </button>
  );
}
