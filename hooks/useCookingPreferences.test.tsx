/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { usePersistedPreference } from './useCookingPreferences.js';

describe('usePersistedPreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usa defaultValue si no hay valor o no pasa isValid', () => {
    const key = `pref-empty-${Math.random()}`;
    const { result } = renderHook(() =>
      usePersistedPreference({
        storageKey: key,
        defaultValue: 'alpha',
        isValid: (v) => v === 'beta',
      }),
    );
    expect(result.current[0]).toBe('alpha');
  });

  it('inicializa desde localStorage cuando isValid acepta el valor', () => {
    const key = `pref-saved-${Date.now()}`;
    localStorage.setItem(key, 'gamma');
    const { result } = renderHook(() =>
      usePersistedPreference({
        storageKey: key,
        defaultValue: 'alpha',
        isValid: (v) => v === 'gamma',
      }),
    );
    expect(result.current[0]).toBe('gamma');
  });

  it('persiste en localStorage al actualizar el estado', async () => {
    const key = `pref-write-${Date.now()}`;
    const { result } = renderHook(() =>
      usePersistedPreference({
        storageKey: key,
        defaultValue: '1',
        isValid: (v) => ['1', '2', '3'].includes(v),
      }),
    );

    act(() => {
      result.current[1]('2');
    });

    await waitFor(() => {
      expect(localStorage.getItem(key)).toBe('2');
    });
    expect(result.current[0]).toBe('2');
  });
});
