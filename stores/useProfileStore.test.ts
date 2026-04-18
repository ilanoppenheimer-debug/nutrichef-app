import { describe, expect, it } from 'vitest';

import { isProfileComplete } from './useProfileStore.js';

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
