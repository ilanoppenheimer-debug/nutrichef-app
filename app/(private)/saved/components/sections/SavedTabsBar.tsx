'use client';

import type { SavedTabConfig, SavedTabId } from '../../types';

type SavedTabsBarProps = {
  tabs: SavedTabConfig[];
  activeTab: SavedTabId;
  onTabChange: (tab: SavedTabId) => void;
  counts: Record<SavedTabId, number>;
};

export default function SavedTabsBar({ tabs, activeTab, onTabChange, counts }: SavedTabsBarProps) {
  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTabChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-900 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          <t.icon size={14} />
          <span className="hidden sm:inline">{t.label}</span>
          {counts[t.id] > 0 && (
            <span className="text-xs font-black bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
              {counts[t.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
