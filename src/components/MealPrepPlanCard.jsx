import { useEffect } from 'react';
import { ChevronRight, ShoppingCart, Star, X } from 'lucide-react';
import { useBottomSheet } from '../hooks/useBottomSheet.js';

// ── Label → icon mapping ───────────────────────────────────────────────────────

const PLAN_LABEL_CONFIG = {
  'rápido':     { icon: '⚡', text: 'Rápido y simple' },
  'balanceado': { icon: '⚖️', text: 'Balanceado' },
  'económico':  { icon: '💸', text: 'Económico' },
};

// ── Plan option card (shown in the 3-option selection list) ───────────────────

export function MealPrepPlanCard({ plan, isRecommended, onSelect }) {
  const cfg = PLAN_LABEL_CONFIG[plan.label] ?? { icon: '📋', text: plan.label ?? 'Plan' };

  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.97] ${
        isRecommended
          ? 'border-[--c-primary-border] bg-[--c-primary-light] scale-[1.01] shadow-sm'
          : 'border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 hover:border-[--c-primary-border]'
      }`}
      style={{ transitionDuration: '100ms' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isRecommended ? 'text-[--c-primary-text]' : 'text-slate-400 dark:text-slate-500'}`}>
            {cfg.icon} {cfg.text}
          </span>
          {isRecommended && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full text-white leading-none" style={{ background: 'var(--c-primary)' }}>
              <Star size={9} fill="currentColor" /> Recomendado
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          {plan.total_time_minutes > 0 && (
            <span className="text-[10px] font-bold text-slate-400">⏱ {plan.total_time_minutes} min</span>
          )}
          {plan.total_days > 0 && (
            <span className="text-[10px] font-bold text-slate-400"> · {plan.total_days} días</span>
          )}
        </div>
      </div>

      {/* Plan title */}
      <p className={`font-black text-sm leading-snug ${isRecommended ? 'text-[--c-primary-text]' : 'text-slate-800 dark:text-white'}`}>
        {plan.title}
      </p>

      {/* Recipe chips */}
      {plan.recipes?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {plan.recipes.slice(0, 3).map((r, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isRecommended
                  ? 'bg-white/60 text-[--c-primary-text]'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {r.name}
            </span>
          ))}
        </div>
      )}

      {/* Nutrition mini-row */}
      {plan.nutrition_summary && (
        <div className="flex gap-3 mt-2">
          {plan.nutrition_summary.daily_calories > 0 && (
            <span className={`text-[10px] font-bold ${isRecommended ? 'text-[--c-primary-text] opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>
              🔥 {plan.nutrition_summary.daily_calories} cal/día
            </span>
          )}
          {plan.nutrition_summary.daily_protein > 0 && (
            <span className={`text-[10px] font-bold ${isRecommended ? 'text-[--c-primary-text] opacity-80' : 'text-slate-400 dark:text-slate-500'}`}>
              💪 {plan.nutrition_summary.daily_protein}g prot
            </span>
          )}
        </div>
      )}

      {/* CTA hint */}
      <div className="flex items-center gap-1 mt-2.5" style={{ color: 'var(--c-primary)' }}>
        <span className="text-xs font-bold">Ver plan completo</span>
        <ChevronRight size={13} strokeWidth={2.5} />
      </div>
    </button>
  );
}

// ── Full plan detail (inside MealPrepSheet) ───────────────────────────────────

function PlanSection({ icon, title, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white mb-2">
        <span className="text-base leading-none">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function MealPrepPlanDetail({ plan }) {
  const cfg = PLAN_LABEL_CONFIG[plan.label] ?? { icon: '📋', text: plan.label };

  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Plan header */}
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {cfg.icon} {cfg.text}
          </span>
          {plan.total_time_minutes > 0 && (
            <span className="text-[10px] text-slate-400">· ⏱ {plan.total_time_minutes} min cocinar</span>
          )}
          {plan.total_days > 0 && (
            <span className="text-[10px] text-slate-400">· {plan.total_days} días cubiertos</span>
          )}
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{plan.title}</h2>
      </div>

      {/* Nutrition summary pills */}
      {plan.nutrition_summary && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Cal/día', value: plan.nutrition_summary.daily_calories, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Prot/día', value: plan.nutrition_summary.daily_protein ? `${plan.nutrition_summary.daily_protein}g` : null, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Tuppers', value: plan.storage?.containers || null, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-100 dark:bg-gray-800' },
          ].map(({ label, value, color, bg }) => value ? (
            <div key={label} className={`flex flex-col items-center px-4 py-2.5 rounded-2xl ${bg}`}>
              <span className={`text-lg font-black leading-none ${color}`}>{value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">{label}</span>
            </div>
          ) : null)}
        </div>
      )}

      {/* Recipes */}
      {plan.recipes?.length > 0 && (
        <PlanSection icon="🥘" title="Recetas del plan">
          <div className="space-y-2">
            {plan.recipes.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-gray-800 last:border-0">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{r.name}</span>
                <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">{r.portions} porciones</span>
              </div>
            ))}
          </div>
        </PlanSection>
      )}

      {/* Shopping list */}
      {plan.shopping_list?.length > 0 && (
        <PlanSection icon="🛒" title="Lista de compras">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {plan.shopping_list.map((item, i) => (
              <div key={i} className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{item.amount}</span>
              </div>
            ))}
          </div>
        </PlanSection>
      )}

      {/* Prep steps */}
      {plan.prep_plan?.length > 0 && (
        <PlanSection icon="👨‍🍳" title="Pasos de preparación">
          <ol className="space-y-2.5">
            {plan.prep_plan.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white mt-0.5"
                  style={{ background: 'var(--c-primary)' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </PlanSection>
      )}

      {/* Storage */}
      {plan.storage && (
        <PlanSection icon="📦" title="Almacenamiento">
          <div className="space-y-1.5">
            {plan.storage.instructions?.map((inst, i) => (
              <p key={i} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{inst}</p>
            ))}
            {plan.storage.duration_days > 0 && (
              <p className="text-xs font-bold text-slate-400 mt-2">
                🗓️ Se conserva {plan.storage.duration_days} días en refrigeración
              </p>
            )}
          </div>
        </PlanSection>
      )}
    </div>
  );
}

// ── Bottom sheet that shows a plan's full detail ──────────────────────────────

/**
 * MealPrepSheet — displays the full meal prep plan detail.
 *
 * Props:
 *   plan     — plan object (null = closed)
 *   onClose  — called after the close animation
 */
export function MealPrepSheet({ plan, onClose }) {
  const bs = useBottomSheet({ onClosed: onClose });

  // Sync plan prop → open/close
  useEffect(() => {
    if (plan) { bs.open(); }
    else if (bs.mounted) { bs.close(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!plan]);

  // Body scroll lock
  useEffect(() => {
    if (bs.mounted) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [bs.mounted]);

  if (!bs.mounted) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={bs.backdropStyle}
        onClick={bs.close}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
        style={{ ...bs.sheetStyle, maxHeight: '88dvh' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div
          {...bs.handleProps}
          className="flex flex-col items-center px-4 pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
          aria-label="Arrastrar para cerrar"
        >
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600" />
        </div>

        {/* Close button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={bs.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-gray-700 active:scale-90"
            aria-label="Cerrar plan"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable plan detail */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {plan && <MealPrepPlanDetail plan={plan} />}
        </div>

        {/* Safe-area spacer */}
        <div className="shrink-0" style={{ height: 'max(env(safe-area-inset-bottom), 1rem)' }} />
      </div>
    </div>
  );
}
