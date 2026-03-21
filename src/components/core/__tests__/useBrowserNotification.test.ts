// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock antd notification before importing the hook
vi.mock('antd', () => ({
  notification: {
    warning: vi.fn(),
  },
}));

import { notification } from 'antd';
import useBrowserNotification from '../useBrowserNotification';

describe('useBrowserNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show notification on Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      writable: true,
      configurable: true,
    });

    renderHook(() => useBrowserNotification());
    expect(notification.warning).not.toHaveBeenCalled();
  });

  it('shows warning notification on non-Chrome browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
      writable: true,
      configurable: true,
    });

    renderHook(() => useBrowserNotification());
    expect(notification.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Browser Warning',
      }),
    );
  });
});
