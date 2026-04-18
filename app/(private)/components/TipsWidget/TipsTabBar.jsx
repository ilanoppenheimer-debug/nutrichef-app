'use client';

export default function TipsTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-slate-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTabChange(t.id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-bold transition-all whitespace-nowrap ${
            activeTab === t.id
              ? 'text-[--c-primary] border-b-2 border-[--c-primary]'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <t.icon size={14} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
