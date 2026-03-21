// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWindowSize from '../useWindowSize';

describe('useWindowSize', () => {
  it('returns the current window dimensions', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  it('updates when the window is resized', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 400 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toEqual({ width: 500, height: 400 });
  });

  it('cleans up listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
