// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('serviceWorker', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    vi.resetModules();
  });

  it('returns localhost URL when hostname is localhost', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
    });
    const { hostname } = await import('../serviceWorker');
    expect(hostname()).toBe('http://localhost:3000');
  });

  it('returns production URL when hostname is not localhost', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'codepost.cs.rutgers.edu', origin: 'https://codepost.cs.rutgers.edu' },
      writable: true,
    });
    const { hostname } = await import('../serviceWorker');
    expect(hostname()).toBe('https://codepost.cs.rutgers.edu');
  });
});
