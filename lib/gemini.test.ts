import { describe, expect, it } from 'vitest';

import { extractJSON, sanitizeUserInput } from './gemini.js';

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
