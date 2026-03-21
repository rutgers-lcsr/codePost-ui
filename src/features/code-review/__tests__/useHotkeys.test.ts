// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useHotkeys, {
  PLUS_KEY,
  MINUS_KEY,
  RIGHT_ARROW,
  LEFT_ARROW,
  O_KEY,
  L_KEY,
  E_KEY,
  F_KEY,
  S_KEY,
  P_KEY,
  V_KEY,
  K_KEY,
  U_KEY,
  M_KEY,
} from '../useHotkeys';

// Mock operatingSystem so metaKey is the trigger
vi.mock('../../../components/core/operatingSystem', () => ({
  getOsTriggerKeyFromEvent: (e: KeyboardEvent) => e.metaKey,
}));

describe('useHotkeys key constants', () => {
  it('exports the correct key values', () => {
    expect(PLUS_KEY).toBe('=');
    expect(MINUS_KEY).toBe('-');
    expect(RIGHT_ARROW).toBe('ArrowRight');
    expect(LEFT_ARROW).toBe('ArrowLeft');
    expect(O_KEY).toBe('o');
    expect(L_KEY).toBe('l');
    expect(E_KEY).toBe('e');
    expect(F_KEY).toBe('f');
    expect(S_KEY).toBe('s');
    expect(P_KEY).toBe('p');
    expect(V_KEY).toBe('v');
    expect(K_KEY).toBe('k');
    expect(U_KEY).toBe('u');
    expect(M_KEY).toBe('m');
  });
});

describe('useHotkeys hook', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires callback when the correct key + trigger key are pressed', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('s', callback));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not fire callback without trigger key', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('s', callback));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: false }));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('does not fire callback for a different key', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('s', callback));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('requires shiftKey when shift param is true', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('y', callback, true));

    // Without shift — should NOT fire
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', metaKey: true, shiftKey: false }));
    });
    expect(callback).not.toHaveBeenCalled();

    // With shift — should fire
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', metaKey: true, shiftKey: true }));
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not fire callback when override is true', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('s', callback, undefined, true));

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls preventDefault and stopPropagation when triggered', () => {
    const callback = vi.fn();
    renderHook(() => useHotkeys('s', callback));

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const callback = vi.fn();
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useHotkeys('s', callback));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
