/** @vitest-environment jsdom */
import type { KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRestrictionInput } from './useRestrictionInput';

describe('useRestrictionInput', () => {
  it('no llama addRestriction si el input está vacío', () => {
    const addRestriction = vi.fn();
    const { result } = renderHook(() => useRestrictionInput(addRestriction));

    act(() => {
      result.current.setRestrictionInput('   ');
    });
    act(() => {
      result.current.handleAddRestriction();
    });

    expect(addRestriction).not.toHaveBeenCalled();
  });

  it('añade restricción, limpia input y Enter dispara el mismo flujo', () => {
    const addRestriction = vi.fn();
    const { result } = renderHook(() => useRestrictionInput(addRestriction));

    act(() => {
      result.current.setRestrictionInput(' Sin soya ');
    });
    act(() => {
      result.current.handleAddRestriction();
    });

    expect(addRestriction).toHaveBeenCalledWith(' Sin soya ');
    expect(result.current.restrictionInput).toBe('');

    act(() => {
      result.current.setRestrictionInput('nueces');
    });
    const preventDefault = vi.fn();
    act(() => {
      result.current.onRestrictionKeyDown({
        key: 'Enter',
        preventDefault,
      } as unknown as KeyboardEvent<HTMLInputElement>);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(addRestriction).toHaveBeenLastCalledWith('nueces');
    expect(result.current.restrictionInput).toBe('');
  });
});
