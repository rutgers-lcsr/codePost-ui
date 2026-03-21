// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFixedWindow from '../useFixedWindow';

describe('useFixedWindow', () => {
  it('sets overflow to hidden on mount', () => {
    document.documentElement.style.overflow = 'auto';
    renderHook(() => useFixedWindow());
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('restores overflow to auto on unmount', () => {
    const { unmount } = renderHook(() => useFixedWindow());
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmount();
    expect(document.documentElement.style.overflow).toBe('auto');
  });
});
