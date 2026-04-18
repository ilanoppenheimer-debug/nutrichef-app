'use client';

import TipsFloatingButton from './TipsFloatingButton.jsx';
import TipsPanel from './TipsPanel.jsx';
import { getDailyTip } from './tipsWidget.helpers.js';
import { useTipsWidgetPanel } from './useTipsWidgetPanel.js';

export default function TipsWidget() {
  const panel = useTipsWidgetPanel();
  const dailyTip = getDailyTip();

  return (
    <>
      <TipsFloatingButton open={panel.open} onToggle={() => panel.setOpen((o) => !o)} />
      {panel.open && (
        <TipsPanel
          panelRef={panel.panelRef}
          onClose={() => panel.setOpen(false)}
          tab={panel.tab}
          onTabChange={panel.setTab}
          dailyTip={dailyTip}
          techIdx={panel.techIdx}
          setTechIdx={panel.setTechIdx}
          subIdx={panel.subIdx}
          setSubIdx={panel.setSubIdx}
        />
      )}
    </>
  );
}
