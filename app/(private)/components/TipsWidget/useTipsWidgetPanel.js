import { useEffect, useRef, useState } from 'react';

import { getDailyTechnique } from './tipsWidget.helpers.js';
import { TECHNIQUES } from './tipsWidgetData.js';

export function useTipsWidgetPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('tip');
  const [techIdx, setTechIdx] = useState(() => TECHNIQUES.indexOf(getDailyTechnique()));
  const [subIdx, setSubIdx] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return {
    open,
    setOpen,
    tab,
    setTab,
    techIdx,
    setTechIdx,
    subIdx,
    setSubIdx,
    panelRef,
  };
}
