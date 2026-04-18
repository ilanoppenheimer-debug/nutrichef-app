'use client';

import { ArrowLeftRight, ChevronRight } from 'lucide-react';

import { SUBSTITUTIONS } from './tipsWidgetData.js';

export default function TipsSubstitutionsTabPanel({ subIdx, onSubIdxChange }) {
  return (
    <div className="space-y-2">
      {SUBSTITUTIONS.map((s, i) => (
        <div
          key={s.from}
          role="button"
          tabIndex={0}
          onClick={() => onSubIdxChange(subIdx === i ? -1 : i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSubIdxChange(subIdx === i ? -1 : i);
            }
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            subIdx === i
              ? 'border-[--c-primary] bg-[--c-primary-light]'
              : 'border-slate-100 dark:border-gray-700 hover:border-[--c-primary-border] bg-slate-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{s.emoji}</span>
            <span className="font-bold text-xs text-slate-800 dark:text-white flex-1 leading-tight">{s.from}</span>
            <ChevronRight
              size={14}
              className={`text-slate-400 transition-transform ${subIdx === i ? 'rotate-90' : ''}`}
            />
          </div>
          {subIdx === i && (
            <div className="mt-2 pl-6">
              <div className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--c-primary-text)' }}>
                <ArrowLeftRight size={11} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{s.to}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
