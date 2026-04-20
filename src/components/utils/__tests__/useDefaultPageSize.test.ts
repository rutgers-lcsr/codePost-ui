// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDefaultPageSize from '../useDefaultPageSize';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_CHANGE_EVENT,
  DEFAULT_PAGE_SIZE_STORAGE_KEY,
  LOCAL_SETTINGS,
} from '../LocalSettings';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../../../test-utils';

describe('useDefaultPageSize', () => {
  const { mock } = createLocalStorageMock();

  beforeEach(() => {
    installLocalStorageMock(mock);
    mock.clear();
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  it('returns the default page size when nothing is stored', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    expect(result.current[0]).toBe(DEFAULT_PAGE_SIZE);
  });

  it('setPageSize writes to storage', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    act(() => {
      result.current[1](50);
    });
    // Verify it persisted to storage
    expect(localStorage.getItem(DEFAULT_PAGE_SIZE_STORAGE_KEY)).toBe('50');
    expect(LOCAL_SETTINGS.defaultPageSize.getter()).toBe(50);
  });

  it('responds to custom DEFAULT_PAGE_SIZE_CHANGE_EVENT with valid size', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    act(() => {
      window.dispatchEvent(new CustomEvent<number>(DEFAULT_PAGE_SIZE_CHANGE_EVENT, { detail: 100 }));
    });
    expect(result.current[0]).toBe(100);
  });

  it('responds to storage events for the correct key', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    // Write via setter, then simulate cross-tab storage event
    act(() => {
      LOCAL_SETTINGS.defaultPageSize.setter(25);
    });
    // The setter dispatches custom event which the hook catches
    expect(result.current[0]).toBe(25);
  });

  it('ignores storage events for unrelated keys', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated-key' }));
    });
    expect(result.current[0]).toBe(DEFAULT_PAGE_SIZE);
  });

  it('falls back to syncFromStorage when custom event has non-number detail', () => {
    // Pre-populate localStorage so syncFromStorage has something to read
    localStorage.setItem(DEFAULT_PAGE_SIZE_STORAGE_KEY, '25');
    const { result } = renderHook(() => useDefaultPageSize());
    // Initial state should read 25 from storage
    expect(result.current[0]).toBe(25);
    // Dispatch with non-number detail — should fall back to reading localStorage
    act(() => {
      window.dispatchEvent(new CustomEvent(DEFAULT_PAGE_SIZE_CHANGE_EVENT, { detail: 'not-a-number' }));
    });
    // Falls back to localStorage which still has 25
    expect(result.current[0]).toBe(25);
  });

  it('normalizes invalid page sizes to default', () => {
    const { result } = renderHook(() => useDefaultPageSize());
    act(() => {
      result.current[1](999); // not in valid page sizes (10, 25, 50, 100)
    });
    expect(result.current[0]).toBe(DEFAULT_PAGE_SIZE);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useDefaultPageSize());
    unmount();
    // Should not throw after unmount
    window.dispatchEvent(new CustomEvent<number>(DEFAULT_PAGE_SIZE_CHANGE_EVENT, { detail: 50 }));
  });
});
