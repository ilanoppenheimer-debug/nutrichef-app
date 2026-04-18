'use client';

import { Scale } from 'lucide-react';

import { MEASURES } from './tipsWidgetData.js';

export default function TipsMeasuresTabPanel() {
  return (
    <div className="space-y-4">
      {MEASURES.map((cat) => (
        <div key={cat.label}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
            <Scale size={11} /> {cat.label}
          </h4>
          <div className="space-y-1">
            {cat.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-gray-700"
              >
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
