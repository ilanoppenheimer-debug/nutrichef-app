/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSearchPrompt,
  buildTimeConstraint,
  calculateTDEE,
  compactProfile,
  detectSearchIntent,
  extractDislikedIngredient,
  extractJSON,
  formatCurrencyByCountry,
  GEMINI_COOLDOWN_KEY,
  GENERATOR_SUGGESTIONS_CACHE_KEY,
  getCacheEntry,
  getCooldownMessage,
  getCurrencyForCountry,
  getCurrentSeasonForCountry,
  getGeminiCooldownUntil,
  sanitizeUserInput,
  setCacheEntry,
  setGeminiCooldownUntil,
} from './gemini.js';

describe('compactProfile', () => {
  it('concatena campos principales del perfil', () => {
    const s = compactProfile({
      goals: 'Mantenimiento',
      weight: '72',
      dailyCalories: '2000',
      country: 'Chile',
    });
    expect(s).toContain('Obj:Mantenimiento');
    expect(s).toContain('Cal:2000kcal');
    expect(s).toContain('Peso:72kg');
    expect(s).toContain('Pais:Chile');
  });
});

describe('buildSearchPrompt', () => {
  it('modo literal exige la receta exacta en el prompt', () => {
    const p = buildSearchPrompt({
      query: 'lentejas turcas',
      mode: 'literal',
      profileStr: 'Perfil corto',
      localeStr: 'ES',
      supermarketInstruction: '',
      brandInstruction: '',
      favoritesStr: '',
      pesachInstruction: '',
    });
    expect(p).toContain('MODO LITERAL');
    expect(p).toContain('lentejas turcas');
    expect(p).toContain('EXACTAMENTE');
  });

  it('modo creativo pide tres opciones', () => {
    const p = buildSearchPrompt({
      query: 'cena rápida',
      mode: 'creative',
      profileStr: 'Perfil',
      localeStr: 'ES',
      supermarketInstruction: '',
      brandInstruction: '',
      favoritesStr: '',
      pesachInstruction: '',
    });
    expect(p).toContain('3 opciones');
  });
});

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

describe('getCooldownMessage', () => {
  it('indica al menos 1 min cuando el cooldown ya pasó', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    expect(getCooldownMessage(Date.now() - 60_000)).toMatch(/1 min/);
    vi.useRealTimers();
  });

  it('redondea hacia arriba los minutos restantes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const until = Date.now() + 125_000;
    expect(getCooldownMessage(until)).toMatch(/3 min/);
    vi.useRealTimers();
  });
});

describe('cooldown y caché (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getGeminiCooldownUntil y setGeminiCooldownUntil persisten la marca de tiempo', () => {
    expect(getGeminiCooldownUntil()).toBe(0);
    setGeminiCooldownUntil(4242);
    expect(localStorage.getItem(GEMINI_COOLDOWN_KEY)).toBeTruthy();
    expect(getGeminiCooldownUntil()).toBe(4242);
  });

  it('setCacheEntry y getCacheEntry leen y escriben dentro de una clave de caché', () => {
    setCacheEntry(GENERATOR_SUGGESTIONS_CACHE_KEY, 'k1', { a: 1 });
    expect(getCacheEntry(GENERATOR_SUGGESTIONS_CACHE_KEY, 'k1')).toEqual({ a: 1 });
    expect(getCacheEntry(GENERATOR_SUGGESTIONS_CACHE_KEY, 'missing')).toBeNull();
  });
});

describe('getCurrencyForCountry / formatCurrencyByCountry', () => {
  it('resuelve moneda conocida y usa USD por defecto para país desconocido', () => {
    expect(getCurrencyForCountry('Chile').code).toBe('CLP');
    expect(getCurrencyForCountry('Atlantis').code).toBe('USD');
  });

  it('formatea importe en moneda local', () => {
    const s = formatCurrencyByCountry(1500, 'Chile');
    expect(s).toMatch(/1/);
    expect(s).toMatch(/500|1\.500/);
  });
});

describe('getCurrentSeasonForCountry', () => {
  it('hemisferio sur: junio es invierno en Chile', () => {
    const d = new Date(2026, 5, 10);
    expect(getCurrentSeasonForCountry('Chile', d)).toBe('invierno');
  });

  it('hemisferio norte: junio es verano', () => {
    const d = new Date(2026, 5, 10);
    expect(getCurrentSeasonForCountry('España', d)).toBe('verano');
  });
});

describe('buildTimeConstraint', () => {
  it('devuelve cadena vacía sin límite o none', () => {
    expect(buildTimeConstraint('')).toBe('');
    expect(buildTimeConstraint('none')).toBe('');
  });

  it('incluye minutos y pautas para 15 y 30', () => {
    expect(buildTimeConstraint('15')).toContain('15 minutos');
    expect(buildTimeConstraint('15')).toMatch(/horneado|marinados/i);
    expect(buildTimeConstraint('30')).toMatch(/marinados|horneados/i);
  });
});

describe('detectSearchIntent', () => {
  it('vacío o solo espacios → creative', () => {
    expect(detectSearchIntent('')).toBe('creative');
    expect(detectSearchIntent('   ')).toBe('creative');
  });

  it('señal literal sin creativa → literal', () => {
    expect(detectSearchIntent('pollo al horno con limón')).toBe('literal');
  });

  it('señal creativa gana sobre literal', () => {
    expect(detectSearchIntent('ideas para cenar al horno')).toBe('creative');
  });

  it('consultas muy cortas → literal', () => {
    expect(detectSearchIntent('arroz con leche')).toBe('literal');
  });
});

describe('extractDislikedIngredient', () => {
  it('extrae ingrediente tras sin / no me gusta / reemplaza', () => {
    expect(extractDislikedIngredient('sin cebolla por favor')).toBe('cebolla');
    expect(extractDislikedIngredient('no me gusta el cilantro')).toBe('cilantro');
    expect(extractDislikedIngredient('reemplaza la nata por yogur')).toBe('nata');
  });

  it('devuelve null sin texto reconocible', () => {
    expect(extractDislikedIngredient('')).toBeNull();
    expect(extractDislikedIngredient('solo sal')).toBeNull();
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
