'use client';

import { PLAN_OPTIONS } from '../../constants';

type PlanDayOption = (typeof PLAN_OPTIONS)[number];

type PlanDaysSelectorProps = {
  planDays: number;
  onPlanDaysChange: (days: PlanDayOption['value']) => void;
};

export default function PlanDaysSelector({ planDays, onPlanDaysChange }: PlanDaysSelectorProps) {
  return (
    <div className="flex gap-2">
      {PLAN_OPTIONS.map((opt) => {
        const isActive = planDays === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPlanDaysChange(opt.value)}
            className={`flex-1 py-3 rounded-2xl text-center border-2 transition-all ${isActive ? 'border-[--c-primary] bg-[--c-primary-light]' : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
          >
            <p
              className={`text-sm font-black ${isActive ? 'text-[--c-primary-text]' : 'text-slate-800 dark:text-white'}`}
            >
              {opt.label}
            </p>
            <p
              className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-[--c-primary-text] opacity-70' : 'text-slate-400'}`}
            >
              {opt.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
}
