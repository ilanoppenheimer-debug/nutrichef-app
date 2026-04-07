import { useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useBottomSheet } from '../hooks/useBottomSheet.js';
import TweakBar, { MEAL_PREP_TWEAKS } from './TweakBar.jsx';

// ── Result preview card (tap to re-open the generated plan) ──────────────────

export function MealPrepResultCard({ plan, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full text-left p-4 rounded-2xl border border-[--c-primary-border] bg-[--c-primary-light] transition-all active:scale-[0.97]"
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {plan.total_time_minutes > 0 && (
          <span className="text-[10px] font-bold text-[--c-primary-text] opacity-70">
            ⏱ {plan.total_time_minutes} min cocina
          </span>
        )}
        {plan.total_days > 0 && (
          <span className="text-[10px] font-bold text-[--c-primary-text] opacity-70">
            · {plan.total_days} días
          </span>
        )}
      </div>
      <p className="font-black text-sm leading-snug text-[--c-primary-text]">{plan.title}</p>
      {plan.description && (
        <p className="text-xs mt-0.5 text-[--c-primary-text] opacity-80 line-clamp-2">{plan.description}</p>
      )}
      <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--c-primary)' }}>
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

function MealPrepPlanDetail({ plan, onTweak, tweakingType }) {
  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Plan header */}
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {plan.total_time_minutes > 0 && (
            <span className="text-[10px] text-slate-400">⏱ {plan.total_time_minutes} min cocinar</span>
          )}
          {plan.total_days > 0 && (
            <span className="text-[10px] text-slate-400">· {plan.total_days} días cubiertos</span>
          )}
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{plan.title}</h2>
        {plan.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{plan.description}</p>
        )}
      </div>

      {/* Directed-change tweak chips */}
      <TweakBar
        options={MEAL_PREP_TWEAKS}
        onTweak={onTweak}
        tweakingType={tweakingType}
        label="Ajustar plan"
      />

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

      {/* Days breakdown */}
      {plan.days?.length > 0 && (
        <PlanSection icon="🗓️" title="Plan por día">
          <div className="space-y-3">
            {plan.days.map((d, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 dark:border-gray-800 p-3 bg-slate-50 dark:bg-gray-800/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                    style={{ background: 'var(--c-primary)' }}
                  >
                    {d.day}
                  </span>
                  <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{d.meal}</p>
                </div>
                {d.ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {d.ingredients.map((ing, j) => (
                      <span
                        key={j}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-gray-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-gray-600"
                      >
                        {ing.name}{ing.amount ? ` · ${ing.amount}` : ''}
                      </span>
                    ))}
                  </div>
                )}
                {d.steps?.length > 0 && (
                  <ol className="mt-2 space-y-1">
                    {d.steps.map((step, j) => (
                      <li key={j} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {j + 1}. {step}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </PlanSection>
      )}

      {/* Shopping list */}
      {plan.shopping_list?.length > 0 && (
        <PlanSection icon="🛒" title="Lista total de ingredientes">
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

      {/* Batch cooking steps */}
      {plan.prep_plan?.length > 0 && (
        <PlanSection icon="👨‍🍳" title="Preparación optimizada">
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
      {plan.storage && (plan.storage.instructions?.length > 0 || plan.storage.duration_days > 0) && (
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

      {/* Tip */}
      {plan.tip && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            💡 {plan.tip}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Bottom sheet that shows a plan's full detail ──────────────────────────────

/**
 * MealPrepSheet — displays the full meal prep plan detail.
 *
 * Props:
 *   plan          — plan object (null = closed)
 *   onClose       — called after the close animation
 *   onTweak       — (changeType) => void  optional, enables tweak chips
 *   tweakingType  — currently in-flight tweak type (for loading UI)
 */
export function MealPrepSheet({ plan, onClose, onTweak, tweakingType }) {
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
          {plan && <MealPrepPlanDetail plan={plan} onTweak={onTweak} tweakingType={tweakingType} />}
        </div>

        {/* Safe-area spacer */}
        <div className="shrink-0" style={{ height: 'max(env(safe-area-inset-bottom), 1rem)' }} />
      </div>
    </div>
  );
}
