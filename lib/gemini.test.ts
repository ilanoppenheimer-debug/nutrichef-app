import { describe, expect, it } from 'vitest';

import { calculateTDEE, extractJSON, sanitizeUserInput } from './gemini.js';

describe('sanitizeUserInput', () => {
  it('devuelve cadena vacía si no es string', () => {
    expect(sanitizeUserInput(null as unknown as string)).toBe('');
    expect(sanitizeUserInput(undefined as unknown as string)).toBe('');
    expect(sanitizeUserInput(42 as unknown as string)).toBe('');
  });

  it('elimina caracteres de control y cercados code fence', () => {
    const raw = 'a\x00b\x7Fc```d';
    expect(sanitizeUserInput(raw)).toBe('abcd');
  });

  it('aplica slice antes del trim final', () => {
    expect(sanitizeUserInput('  abcdefghij  ', 5)).toBe('abc');
  });
});

describe('calculateTDEE', () => {
  it('devuelve null si faltan peso, altura o edad', () => {
    expect(calculateTDEE({ weight: '', height: '170', age: '30' })).toBeNull();
    expect(calculateTDEE({ weight: '70', height: '', age: '30' })).toBeNull();
    expect(calculateTDEE({ weight: '70', height: '170', age: '0' })).toBeNull();
  });

  it('devuelve calorías y macros redondeados con perfil mínimo válido', () => {
    const out = calculateTDEE({
      weight: '70',
      height: '175',
      age: '32',
      gender: 'Femenino',
      activityLevel: '1.375',
      sportType: 'Ninguno',
      trainingDuration: '45',
      trainingDaysPerWeek: '3',
      goals: 'Mantenimiento y energia',
    });
    expect(out).not.toBeNull();
    expect(out!.calories).toBeGreaterThan(1000);
    expect(out!.protein).toBeGreaterThan(50);
    expect(out!.carbs).toBeGreaterThan(100);
    expect(out!.fiber).toBeGreaterThanOrEqual(0);
  });

  it('ajusta por objetivo déficit', () => {
    const mant = calculateTDEE({
      weight: '80',
      height: '180',
      age: '28',
      gender: 'Masculino',
      activityLevel: '1.2',
      sportType: 'Ninguno',
      goals: 'Mantenimiento y energia',
    });
    const deficit = calculateTDEE({
      weight: '80',
      height: '180',
      age: '28',
      gender: 'Masculino',
      activityLevel: '1.2',
      sportType: 'Ninguno',
      goals: 'Déficit',
    });
    expect(deficit!.calories).toBeLessThan(mant!.calories);
  });
});

describe('extractJSON', () => {
  it('extrae el primer objeto JSON delimitado por llaves', () => {
    expect(extractJSON('prefix {"a":1} suffix')).toBe('{"a":1}');
    expect(extractJSON('x { "nested": { "b": 2 } } y')).toBe('{ "nested": { "b": 2 } }');
  });

  it('devuelve el texto original si no hay llaves válidas', () => {
    expect(extractJSON('no json')).toBe('no json');
    expect(extractJSON('}')).toBe('}');
  });
});
