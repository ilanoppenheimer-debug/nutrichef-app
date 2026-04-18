'use client';

import TipsPanelBody from './TipsPanelBody.jsx';
import TipsPanelHeader from './TipsPanelHeader.jsx';
import TipsTabBar from './TipsTabBar.jsx';
import { TIPS_WIDGET_TABS } from './tipsWidgetTabs.js';

export default function TipsPanel({
  panelRef,
  onClose,
  tab,
  onTabChange,
  dailyTip,
  techIdx,
  setTechIdx,
  subIdx,
  setSubIdx,
}) {
  return (
    <div
      ref={panelRef}
      className="fixed bottom-36 right-4 sm:bottom-20 sm:right-6 z-30 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <TipsPanelHeader onClose={onClose} />
      <TipsTabBar tabs={TIPS_WIDGET_TABS} activeTab={tab} onTabChange={onTabChange} />
      <div className="p-4 max-h-72 overflow-y-auto">
        <TipsPanelBody
          tab={tab}
          dailyTip={dailyTip}
          techIdx={techIdx}
          setTechIdx={setTechIdx}
          subIdx={subIdx}
          setSubIdx={setSubIdx}
        />
      </div>
    </div>
  );
}
