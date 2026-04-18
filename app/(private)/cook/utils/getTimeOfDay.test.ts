import { describe, expect, it } from 'vitest';

import { getTimeOfDay } from './getTimeOfDay';

describe('getTimeOfDay', () => {
  it('devuelve manana entre las 5 y las 10 inclusive', () => {
    expect(getTimeOfDay(5)).toBe('manana');
    expect(getTimeOfDay(10)).toBe('manana');
  });

  it('devuelve mediodia entre las 11 y las 15 inclusive', () => {
    expect(getTimeOfDay(11)).toBe('mediodia');
    expect(getTimeOfDay(15)).toBe('mediodia');
  });

  it('devuelve tarde entre las 16 y las 18 inclusive', () => {
    expect(getTimeOfDay(16)).toBe('tarde');
    expect(getTimeOfDay(18)).toBe('tarde');
  });

  it('devuelve noche entre las 19 y las 22 inclusive', () => {
    expect(getTimeOfDay(19)).toBe('noche');
    expect(getTimeOfDay(22)).toBe('noche');
  });

  it('devuelve noche_tarde fuera de las franjas diurnas', () => {
    for (const hour of [0, 1, 4, 23]) {
      expect(getTimeOfDay(hour)).toBe('noche_tarde');
    }
  });

  it('respeta los limites exclusivos de cada franja', () => {
    expect(getTimeOfDay(4)).toBe('noche_tarde');
    expect(getTimeOfDay(5)).toBe('manana');
    expect(getTimeOfDay(10)).toBe('manana');
    expect(getTimeOfDay(11)).toBe('mediodia');
    expect(getTimeOfDay(15)).toBe('mediodia');
    expect(getTimeOfDay(16)).toBe('tarde');
    expect(getTimeOfDay(18)).toBe('tarde');
    expect(getTimeOfDay(19)).toBe('noche');
    expect(getTimeOfDay(22)).toBe('noche');
    expect(getTimeOfDay(23)).toBe('noche_tarde');
  });
});
