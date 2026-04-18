/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';

import { readStoredJson, writeStoredJson } from './gemini.js';

describe('readStoredJson / writeStoredJson', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('readStoredJson devuelve fallback sin clave o JSON inválido', () => {
    expect(readStoredJson('no_existe', { ok: true })).toEqual({ ok: true });
    localStorage.setItem('malo', 'not-json{{{');
    expect(readStoredJson('malo', null)).toBeNull();
  });

  it('writeStoredJson persiste y readStoredJson parsea', () => {
    writeStoredJson('clave', { n: 1 });
    expect(readStoredJson('clave', {})).toEqual({ n: 1 });
  });
});
