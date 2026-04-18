import { describe, expect, it } from 'vitest';

import { getProfileDietActiveCount } from './profile.helpers';

describe('getProfileDietActiveCount', () => {
  it('suma estilos y alergias', () => {
    expect(
      getProfileDietActiveCount({
        dietaryStyle: 'Vegano',
        religiousDiet: 'Ninguna',
        allergies: ['Gluten', 'Lácteos'],
      }),
    ).toBe(3);
  });

  it('ignora Ninguna en estilos', () => {
    expect(
      getProfileDietActiveCount({
        dietaryStyle: 'Ninguna',
        religiousDiet: 'Halal',
        allergies: [],
      }),
    ).toBe(1);
  });
});
