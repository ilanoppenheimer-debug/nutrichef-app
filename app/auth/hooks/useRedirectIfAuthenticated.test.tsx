/** @vitest-environment jsdom */
import type { User } from 'firebase/auth';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replace } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

import { useRedirectIfAuthenticated } from './useRedirectIfAuthenticated';

describe('useRedirectIfAuthenticated', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('redirige a /onboarding cuando hay usuario', async () => {
    const user = { uid: 'u1' } as User;
    renderHook(() => useRedirectIfAuthenticated(user, false));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('redirige a /onboarding en modo local aunque no haya usuario', async () => {
    renderHook(() => useRedirectIfAuthenticated(undefined, true));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('no redirige si no hay usuario y no es modo local', async () => {
    renderHook(() => useRedirectIfAuthenticated(null, false));

    await new Promise((r) => setTimeout(r, 30));
    expect(replace).not.toHaveBeenCalled();
  });
});
