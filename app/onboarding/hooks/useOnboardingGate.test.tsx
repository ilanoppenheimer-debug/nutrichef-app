/** @vitest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();

const auth = vi.hoisted(() => ({
  user: undefined as unknown,
  isLocalMode: false,
}));

const profileSlice = vi.hoisted(() => ({
  profile: { goals: '', medicalDisclaimerAccepted: false as boolean },
  firestoreReady: false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => auth,
}));

vi.mock('@/stores/useSyncStore.js', () => ({
  useSyncStore: () => {},
}));

vi.mock('@/stores/useProfileStore.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/stores/useProfileStore.js')>();
  return {
    ...mod,
    useProfileStore: (selector: (s: typeof profileSlice) => unknown) => selector(profileSlice),
  };
});

import { useOnboardingGate } from './useOnboardingGate';

describe('useOnboardingGate', () => {
  beforeEach(() => {
    replace.mockClear();
    auth.user = undefined;
    auth.isLocalMode = false;
    profileSlice.profile = { goals: '', medicalDisclaimerAccepted: false };
    profileSlice.firestoreReady = false;
  });

  it('muestra login cuando no hay usuario y no es modo local', () => {
    auth.user = null;
    const { result } = renderHook(() => useOnboardingGate());
    expect(result.current.showLogin).toBe(true);
    expect(result.current.showSplash).toBe(false);
  });

  it('muestra splash mientras auth está indefinido', () => {
    auth.user = undefined;
    const { result } = renderHook(() => useOnboardingGate());
    expect(result.current.showSplash).toBe(true);
    expect(result.current.showLogin).toBe(false);
  });

  it('redirige a /cook cuando Firestore está listo y el perfil está completo', async () => {
    auth.user = { uid: 'u1' };
    auth.isLocalMode = false;
    profileSlice.firestoreReady = true;
    profileSlice.profile = { goals: 'Mantenimiento', medicalDisclaimerAccepted: true };

    renderHook(() => useOnboardingGate());

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/cook');
    });
  });
});
