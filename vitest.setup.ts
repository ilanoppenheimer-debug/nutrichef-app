import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

/** Evita inicializar Firebase real en tests (API key inválida en CI / sin .env). */
vi.mock('./lib/firebase.js', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: () => () => {},
  },
  db: {},
  googleProvider: {
    setCustomParameters: vi.fn(),
  },
}));
