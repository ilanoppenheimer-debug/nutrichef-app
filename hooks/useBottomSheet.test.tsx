/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBottomSheet } from './useBottomSheet.js';

const rafQueue: FrameRequestCallback[] = [];

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
});

afterEach(() => {
  rafQueue.length = 0;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function flushRaf() {
  let guard = 0;
  while (rafQueue.length && guard++ < 20) {
    const batch = rafQueue.splice(0);
    batch.forEach((fn) => {
      fn(0);
    });
  }
}

describe('useBottomSheet', () => {
  it('open monta y hace visible tras los requestAnimationFrame', () => {
    const { result } = renderHook(() => useBottomSheet());

    expect(result.current.mounted).toBe(false);
    expect(result.current.visible).toBe(false);

    act(() => {
      result.current.open();
      flushRaf();
    });

    expect(result.current.mounted).toBe(true);
    expect(result.current.visible).toBe(true);
    expect(result.current.sheetStyle.transform).toContain('translateY(0px)');
  });

  it('close desmonta tras ANIM_DURATION y llama onClosed', () => {
    vi.useFakeTimers();
    const onClosed = vi.fn();
    const { result } = renderHook(() => useBottomSheet({ onClosed }));

    act(() => {
      result.current.open();
      flushRaf();
    });

    act(() => {
      result.current.close();
    });

    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(result.current.mounted).toBe(false);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
