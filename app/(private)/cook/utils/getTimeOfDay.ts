import type { TimeOfDay } from '../types';

/** Franja horaria del día para inferencia de tipo de comida (modelo / UI). */
export function getTimeOfDay(hour: number = new Date().getHours()): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'manana';
  if (hour >= 11 && hour < 16) return 'mediodia';
  if (hour >= 16 && hour < 19) return 'tarde';
  if (hour >= 19 && hour < 23) return 'noche';
  return 'noche_tarde';
}
