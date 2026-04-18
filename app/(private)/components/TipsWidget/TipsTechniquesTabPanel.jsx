'use client';

import { ChevronRight } from 'lucide-react';

import { TECHNIQUES } from './tipsWidgetData.js';

export default function TipsTechniquesTabPanel({ techIdx, onTechIdxChange }) {
  return (
    <div className="space-y-2">
      {TECHNIQUES.map((t, i) => (
        <div
          key={t.title}
          role="button"
          tabIndex={0}
          onClick={() => onTechIdxChange(techIdx === i ? -1 : i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTechIdxChange(techIdx === i ? -1 : i);
            }
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            techIdx === i
              ? 'border-[--c-primary] bg-[--c-primary-light]'
              : 'border-slate-100 dark:border-gray-700 hover:border-[--c-primary-border] bg-slate-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{t.emoji}</span>
            <span className="font-bold text-sm text-slate-800 dark:text-white">{t.title}</span>
            <ChevronRight
              size={14}
              className={`ml-auto text-slate-400 transition-transform ${techIdx === i ? 'rotate-90' : ''}`}
            />
          </div>
          {techIdx === i && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed pl-7">{t.desc}</p>
          )}
        </div>
      ))}
    </div>
  );
}
