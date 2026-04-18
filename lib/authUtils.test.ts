import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authMock = vi.hoisted(() => ({
  currentUser: null as { getIdToken: ReturnType<typeof vi.fn> } | null,
  onAuthStateChanged: vi.fn((_cb: (u: unknown) => void) => () => {}),
}));

vi.mock('./firebase.js', () => ({
  auth: authMock,
}));

import { fetchWithAuth, getAuthToken } from './authUtils.js';

describe('getAuthToken', () => {
  beforeEach(() => {
    authMock.currentUser = null;
    authMock.onAuthStateChanged.mockReset();
    authMock.onAuthStateChanged.mockImplementation(() => () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve token con forceRefresh cuando ya hay currentUser', async () => {
    authMock.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('token-directo'),
    };

    await expect(getAuthToken()).resolves.toBe('token-directo');
    expect(authMock.currentUser?.getIdToken).toHaveBeenCalledWith(true);
  });

  it('espera onAuthStateChanged y devuelve token cuando aparece usuario', async () => {
    const user = {
      getIdToken: vi.fn().mockResolvedValue('token-tras-auth'),
    };
    authMock.onAuthStateChanged.mockImplementation((cb: (u: unknown) => void) => {
      queueMicrotask(() => cb(user));
      return () => {};
    });

    await expect(getAuthToken()).resolves.toBe('token-tras-auth');
    expect(user.getIdToken).toHaveBeenCalledWith(true);
  });

  it('lanza si la sesión termina en null', async () => {
    authMock.onAuthStateChanged.mockImplementation((cb: (u: unknown) => void) => {
      queueMicrotask(() => cb(null));
      return () => {};
    });

    await expect(getAuthToken()).rejects.toThrow('No hay sesión activa');
  });
});

describe('fetchWithAuth', () => {
  beforeEach(() => {
    authMock.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('header-token'),
    };
    authMock.onAuthStateChanged.mockImplementation(() => () => {});
  });

  it('inyecta Authorization y Content-Type en fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithAuth('https://api.example/test', { method: 'POST', body: '{}' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/test',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
        headers: expect.objectContaining({
          Authorization: 'Bearer header-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
