import { DAILY_TIPS, TECHNIQUES } from './tipsWidgetData.js';

function dayOfYear() {
  return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
}

/** Tip del día según fecha (cambia cada día). */
export function getDailyTip() {
  return DAILY_TIPS[dayOfYear() % DAILY_TIPS.length];
}

/** Técnica destacada del día según fecha. */
export function getDailyTechnique() {
  return TECHNIQUES[dayOfYear() % TECHNIQUES.length];
}
