/** @vitest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useProfileMacrosAutoSync } from './useProfileMacrosAutoSync.js';

function baseProfile(overrides: Record<string, unknown> = {}) {
  return {
    weight: '70',
    height: '175',
    age: '32',
    gender: 'Femenino',
    activityLevel: '1.375',
    sportType: 'Ninguno',
    trainingDuration: '45',
    trainingDaysPerWeek: '3',
    goals: 'Mantenimiento y energia',
    manualCalories: false,
    manualProtein: false,
    manualFiber: false,
    manualCarb: false,
    dailyCalories: '',
    proteinTarget: '',
    fiberTarget: '',
    carbTarget: '',
    ...overrides,
  };
}

describe('useProfileMacrosAutoSync', () => {
  it('no llama setProfile si faltan peso, altura o edad', async () => {
    const setProfile = vi.fn();
    const profile = baseProfile({ weight: '', height: '175', age: '32' });

    renderHook(() => useProfileMacrosAutoSync(profile, setProfile));

    await new Promise((r) => setTimeout(r, 40));
    expect(setProfile).not.toHaveBeenCalled();
  });

  it('no sincroniza si los cuatro macros manuales están activos', async () => {
    const setProfile = vi.fn();
    const profile = baseProfile({
      manualCalories: true,
      manualProtein: true,
      manualFiber: true,
      manualCarb: true,
    });

    renderHook(() => useProfileMacrosAutoSync(profile, setProfile));

    await new Promise((r) => setTimeout(r, 40));
    expect(setProfile).not.toHaveBeenCalled();
  });

  it('aplica TDEE vía setProfile cuando hay datos y no hay overrides manuales', async () => {
    const setProfile = vi.fn();
    const profile = baseProfile();

    renderHook(() => useProfileMacrosAutoSync(profile, setProfile));

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalled();
    });

    const updater = setProfile.mock.calls[0][0] as (p: typeof profile) => typeof profile;
    const next = updater(profile);
    expect(Number.parseInt(String(next.dailyCalories), 10)).toBeGreaterThan(500);
    expect(Number.parseInt(String(next.proteinTarget), 10)).toBeGreaterThan(40);
    expect(Number.parseInt(String(next.carbTarget), 10)).toBeGreaterThan(50);
    expect(Number.parseInt(String(next.fiberTarget), 10)).toBeGreaterThanOrEqual(0);
  });

  it('respeta manualCalories y rellena el resto desde TDEE', async () => {
    const setProfile = vi.fn();
    const profile = baseProfile({
      manualCalories: true,
      dailyCalories: '9999',
      manualProtein: false,
      manualFiber: false,
      manualCarb: false,
    });

    renderHook(() => useProfileMacrosAutoSync(profile, setProfile));

    await waitFor(() => {
      expect(setProfile).toHaveBeenCalled();
    });

    const updater = setProfile.mock.calls[0][0] as (p: typeof profile) => typeof profile;
    const next = updater(profile);
    expect(next.dailyCalories).toBe('9999');
    expect(Number.parseInt(String(next.proteinTarget), 10)).toBeGreaterThan(40);
  });
});
