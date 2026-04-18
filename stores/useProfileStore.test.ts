import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_PROFILE, isProfileComplete, useProfileStore } from './useProfileStore.js';

beforeEach(() => {
  useProfileStore.getState().reset();
});

describe('isProfileComplete', () => {
  it('devuelve false si faltan goals o el aviso médico', () => {
    expect(isProfileComplete({ goals: '', medicalDisclaimerAccepted: true })).toBe(false);
    expect(isProfileComplete({ goals: 'Mantenimiento', medicalDisclaimerAccepted: false })).toBe(
      false,
    );
    expect(isProfileComplete({ goals: '', medicalDisclaimerAccepted: false })).toBe(false);
  });

  it('devuelve true cuando hay goals y disclaimer aceptado', () => {
    expect(
      isProfileComplete({ goals: 'Ganar músculo', medicalDisclaimerAccepted: true }),
    ).toBe(true);
  });
});

describe('useProfileStore', () => {
  it('setProfile con objeto reemplaza el perfil', () => {
    useProfileStore.getState().setProfile({ ...DEFAULT_PROFILE, weight: '88' });
    expect(useProfileStore.getState().profile.weight).toBe('88');
  });

  it('setProfile con función actualiza a partir del estado previo', () => {
    useProfileStore.getState().setProfile({ ...DEFAULT_PROFILE, weight: '70' });
    useProfileStore.getState().setProfile((p) => ({ ...p, weight: '71' }));
    expect(useProfileStore.getState().profile.weight).toBe('71');
  });

  it('setFirestoreReady y reset restauran valores por defecto', () => {
    useProfileStore.getState().setFirestoreReady(true);
    useProfileStore.getState().setProfile({ ...DEFAULT_PROFILE, age: '40' });
    expect(useProfileStore.getState().firestoreReady).toBe(true);
    expect(useProfileStore.getState().profile.age).toBe('40');

    useProfileStore.getState().reset();
    expect(useProfileStore.getState().firestoreReady).toBe(false);
    expect(useProfileStore.getState().profile).toEqual(DEFAULT_PROFILE);
  });
});
