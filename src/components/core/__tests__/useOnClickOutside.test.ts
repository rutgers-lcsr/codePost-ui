// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useOnClickOutside from '../useOnClickOutside';

describe('useOnClickOutside', () => {
  it('calls handler when clicking outside the ref element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    renderHook(() => {
      const ref = React.useRef<HTMLElement>(div);
      useOnClickOutside(ref, handler);
    });

    // Click outside (on body, not on div)
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });

  it('does not call handler when clicking inside the ref element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    renderHook(() => {
      const ref = React.useRef<HTMLElement>(div);
      useOnClickOutside(ref, handler);
    });

    act(() => {
      div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('does not call handler when ref is null', () => {
    const handler = vi.fn();
    renderHook(() => {
      const ref = React.useRef<HTMLElement>(null);
      useOnClickOutside(ref, handler);
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('responds to touchstart events', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    renderHook(() => {
      const ref = React.useRef<HTMLElement>(div);
      useOnClickOutside(ref, handler);
    });

    act(() => {
      document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });
});
