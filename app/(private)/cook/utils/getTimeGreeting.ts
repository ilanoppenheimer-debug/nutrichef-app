import type { TimeGreeting, TimeOfDay } from '../types';
import { getTimeOfDay } from './getTimeOfDay';

/** Saludo contextual según la franja horaria (confirma en UI que se entiende la hora). */
export function getTimeGreeting(timeOfDay: TimeOfDay = getTimeOfDay()): TimeGreeting {
  switch (timeOfDay) {
    case 'manana':
      return { emoji: '🌅', hint: 'Hora del desayuno' };
    case 'mediodia':
      return { emoji: '☀️', hint: 'Hora del almuerzo' };
    case 'tarde':
      return { emoji: '☕', hint: 'Hora de la merienda' };
    case 'noche':
      return { emoji: '🌙', hint: 'Hora de la cena' };
    case 'noche_tarde':
      return { emoji: '🌙', hint: 'Algo ligero para esta hora' };
    default:
      return { emoji: '✨', hint: '' };
  }
}
