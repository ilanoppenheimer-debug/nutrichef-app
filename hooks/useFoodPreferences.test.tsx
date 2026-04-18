/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFoodPreferences } from './useFoodPreferences.js';

describe('useFoodPreferences', () => {
  it('lanza si no hay FoodPreferencesProvider', () => {
    expect(() => renderHook(() => useFoodPreferences())).toThrow(
      'useFoodPreferences must be used within FoodPreferencesProvider.',
    );
  });
});
