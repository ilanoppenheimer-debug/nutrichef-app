/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecipeCache } from './useRecipeCache.js';

describe('useRecipeCache', () => {
  let dateNow: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    dateNow = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    dateNow.mockRestore();
  });

  it('getCached devuelve null sin entrada', () => {
    const { getCached } = useRecipeCache();
    expect(getCached('clave_inexistente')).toBeNull();
  });

  it('setCache persiste y getCached devuelve los datos dentro del TTL', () => {
    dateNow.mockReturnValue(1_000_000);
    const { setCache, getCached } = useRecipeCache(60 * 60 * 1000);

    setCache('receta-a', { title: 'Pollo' });

    dateNow.mockReturnValue(1_000_000 + 1000);
    expect(getCached('receta-a')).toEqual({ title: 'Pollo' });
  });

  it('getCached devuelve null si expiró y limpia la entrada', () => {
    const ttl = 5000;
    dateNow.mockReturnValue(10_000);
    const { setCache, getCached } = useRecipeCache(ttl);

    setCache('expira', { v: 1 });

    dateNow.mockReturnValue(10_000 + ttl + 1);
    expect(getCached('expira')).toBeNull();
  });

  it('clearAll vacía el almacén de caché', () => {
    dateNow.mockReturnValue(20_000);
    const { setCache, getCached, clearAll } = useRecipeCache();

    setCache('x', { ok: true });
    clearAll();

    expect(getCached('x')).toBeNull();
  });
});
