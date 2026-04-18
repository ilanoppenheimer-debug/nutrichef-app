'use client';

import TipsMeasuresTabPanel from './TipsMeasuresTabPanel.jsx';
import TipsSubstitutionsTabPanel from './TipsSubstitutionsTabPanel.jsx';
import TipsTechniquesTabPanel from './TipsTechniquesTabPanel.jsx';
import TipsTipTabPanel from './TipsTipTabPanel.jsx';

export default function TipsPanelBody({
  tab,
  dailyTip,
  techIdx,
  setTechIdx,
  subIdx,
  setSubIdx,
}) {
  if (tab === 'tip') return <TipsTipTabPanel dailyTip={dailyTip} />;
  if (tab === 'techniques') {
    return <TipsTechniquesTabPanel techIdx={techIdx} onTechIdxChange={setTechIdx} />;
  }
  if (tab === 'substitutions') {
    return <TipsSubstitutionsTabPanel subIdx={subIdx} onSubIdxChange={setSubIdx} />;
  }
  if (tab === 'measures') return <TipsMeasuresTabPanel />;
  return null;
}
