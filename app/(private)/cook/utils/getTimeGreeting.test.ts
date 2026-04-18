import { describe, expect, it } from 'vitest';

import type { TimeOfDay } from '../types';
import { getTimeGreeting } from './getTimeGreeting';

describe('getTimeGreeting', () => {
  it('asigna emoji e hint por franja', () => {
    expect(getTimeGreeting('manana')).toEqual({ emoji: '🌅', hint: 'Hora del desayuno' });
    expect(getTimeGreeting('mediodia')).toEqual({ emoji: '☀️', hint: 'Hora del almuerzo' });
    expect(getTimeGreeting('tarde')).toEqual({ emoji: '☕', hint: 'Hora de la merienda' });
    expect(getTimeGreeting('noche')).toEqual({ emoji: '🌙', hint: 'Hora de la cena' });
    expect(getTimeGreeting('noche_tarde')).toEqual({
      emoji: '🌙',
      hint: 'Algo ligero para esta hora',
    });
  });

  it('usa el default para valores no contemplados', () => {
    expect(getTimeGreeting('desconocido' as TimeOfDay)).toEqual({ emoji: '✨', hint: '' });
  });
});
