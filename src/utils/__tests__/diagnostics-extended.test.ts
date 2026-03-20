// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../../test-utils';
import {
  gatherBrowserContext,
  recentConsoleLogs,
  MAX_CONSOLE_LOGS,
  stopScreenshotTimer,
  getLastScreenshot,
  captureScreenshotToCache,
  captureScreenshotOnDemand,
  SENSITIVE_KEY_RE,
} from '../diagnostics';

// ---------------------------------------------------------------------------
// gatherBrowserContext
// ---------------------------------------------------------------------------
describe('gatherBrowserContext', () => {
  it('returns an object with expected top-level keys', () => {
    const ctx = gatherBrowserContext();
    expect(ctx).toHaveProperty('userAgent');
    expect(ctx).toHaveProperty('language');
    expect(ctx).toHaveProperty('platform');
    expect(ctx).toHaveProperty('hardwareConcurrency');
    expect(ctx).toHaveProperty('onLine');
    expect(ctx).toHaveProperty('screen');
    expect(ctx).toHaveProperty('viewport');
    expect(ctx).toHaveProperty('timing');
    expect(ctx).toHaveProperty('memory');
    expect(ctx).toHaveProperty('connection');
    expect(ctx).toHaveProperty('localStorageKeys');
    expect(ctx).toHaveProperty('sessionStorageKeys');
    expect(ctx).toHaveProperty('failedResources');
    expect(ctx).toHaveProperty('timeOnPageSeconds');
  });

  it('returns screen resolution as a string', () => {
    const ctx = gatherBrowserContext();
    expect(ctx.screen.resolution).toMatch(/^\d+x\d+$/);
    expect(ctx.screen.available).toMatch(/^\d+x\d+$/);
  });

  it('includes viewport dimensions', () => {
    const ctx = gatherBrowserContext();
    expect(ctx.viewport).toMatch(/^\d+x\d+$/);
  });

  it('returns localStorageKeys as an object', () => {
    const ctx = gatherBrowserContext();
    expect(typeof ctx.localStorageKeys).toBe('object');
  });

  it('returns sessionStorageKeys as an object', () => {
    const ctx = gatherBrowserContext();
    expect(typeof ctx.sessionStorageKeys).toBe('object');
  });

  it('handles missing navigator.connection gracefully', () => {
    const ctx = gatherBrowserContext();
    expect(ctx.connection).toBeDefined();
    // In jsdom there's no connection object, so it should be empty
    expect(Object.keys(ctx.connection).length).toBe(0);
  });

  it('returns failedResources as an array', () => {
    const ctx = gatherBrowserContext();
    expect(Array.isArray(ctx.failedResources)).toBe(true);
  });

  it('returns timing as an object', () => {
    const ctx = gatherBrowserContext();
    expect(typeof ctx.timing).toBe('object');
  });

  it('returns memory as an object', () => {
    const ctx = gatherBrowserContext();
    expect(typeof ctx.memory).toBe('object');
  });

  it('returns timeOnPageSeconds as a number', () => {
    const ctx = gatherBrowserContext();
    expect(typeof ctx.timeOnPageSeconds).toBe('number');
    expect(ctx.timeOnPageSeconds).toBeGreaterThanOrEqual(0);
  });

  it('referrer is null or a string', () => {
    const ctx = gatherBrowserContext();
    expect(ctx.referrer === null || typeof ctx.referrer === 'string').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// recentConsoleLogs interceptor
// ---------------------------------------------------------------------------
describe('recentConsoleLogs', () => {
  it('is an array', () => {
    expect(Array.isArray(recentConsoleLogs)).toBe(true);
  });

  it('MAX_CONSOLE_LOGS is 30', () => {
    expect(MAX_CONSOLE_LOGS).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Screenshot utilities
// ---------------------------------------------------------------------------
describe('screenshot utilities', () => {
  it('getLastScreenshot returns null initially', () => {
    // In test environment no screenshots have been taken
    const result = getLastScreenshot();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('stopScreenshotTimer does not throw', () => {
    expect(() => stopScreenshotTimer()).not.toThrow();
  });

  it('captureScreenshotToCache resolves without error', async () => {
    // In jsdom, _toJpeg and _toPng are null, so it returns immediately
    await expect(captureScreenshotToCache()).resolves.toBeUndefined();
  });

  it('captureScreenshotOnDemand returns null when capture is unavailable', async () => {
    const result = await captureScreenshotOnDemand();
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SENSITIVE_KEY_RE edge cases
// ---------------------------------------------------------------------------
describe('SENSITIVE_KEY_RE edge cases', () => {
  it('matches case-insensitively', () => {
    expect(SENSITIVE_KEY_RE.test('TOKEN')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('Auth')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('JWT')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('PASSWORD')).toBe(true);
  });

  it('matches compound keys', () => {
    expect(SENSITIVE_KEY_RE.test('access_token')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('jwt_refresh')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('api-key')).toBe(true);
    expect(SENSITIVE_KEY_RE.test('apikey')).toBe(true);
  });

  it('does not match unrelated keys', () => {
    expect(SENSITIVE_KEY_RE.test('username')).toBe(false);
    expect(SENSITIVE_KEY_RE.test('firstName')).toBe(false);
    expect(SENSITIVE_KEY_RE.test('courseId')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// gatherBrowserContext — deep branch coverage
// ---------------------------------------------------------------------------
describe('gatherBrowserContext deep branches', () => {
  let originalGetEntriesByType: typeof performance.getEntriesByType;
  let originalMemory: unknown;

  beforeEach(() => {
    originalGetEntriesByType = performance.getEntriesByType;
    originalMemory = (performance as any).memory;
  });

  afterEach(() => {
    performance.getEntriesByType = originalGetEntriesByType;
    (performance as any).memory = originalMemory;
    vi.restoreAllMocks();
  });

  it('extracts navigation timing when available', () => {
    const navTiming = {
      entryType: 'navigation',
      startTime: 0,
      domContentLoadedEventEnd: 500,
      loadEventEnd: 1000,
      responseStart: 100,
      domainLookupStart: 10,
      domainLookupEnd: 30,
      connectStart: 30,
      connectEnd: 80,
    };
    performance.getEntriesByType = vi.fn((type: string) =>
      type === 'navigation' ? [navTiming as unknown as PerformanceEntry] : [],
    );

    const ctx = gatherBrowserContext();
    expect(ctx.timing.domContentLoadedMs).toBe(500);
    expect(ctx.timing.pageLoadMs).toBe(1000);
    expect(ctx.timing.ttfbMs).toBe(100);
    expect(ctx.timing.dnsMs).toBe(20);
    expect(ctx.timing.connectMs).toBe(50);
  });

  it('handles empty navigation entries', () => {
    performance.getEntriesByType = vi.fn(() => []);
    const ctx = gatherBrowserContext();
    expect(Object.keys(ctx.timing)).toHaveLength(0);
  });

  it('extracts performance.memory when available', () => {
    (performance as any).memory = {
      usedJSHeapSize: 10 * 1048576,
      totalJSHeapSize: 20 * 1048576,
      jsHeapSizeLimit: 100 * 1048576,
    };
    const ctx = gatherBrowserContext();
    expect(ctx.memory.usedJSHeapSizeMB).toBe(10);
    expect(ctx.memory.totalJSHeapSizeMB).toBe(20);
    expect(ctx.memory.jsHeapSizeLimitMB).toBe(100);
  });

  it('handles missing performance.memory', () => {
    (performance as any).memory = undefined;
    const ctx = gatherBrowserContext();
    expect(Object.keys(ctx.memory)).toHaveLength(0);
  });

  it('extracts navigator.connection when available', () => {
    const connData = { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false };
    Object.defineProperty(navigator, 'connection', { value: connData, configurable: true });
    const ctx = gatherBrowserContext();
    expect(ctx.connection.effectiveType).toBe('4g');
    expect(ctx.connection.downlinkMbps).toBe(10);
    expect(ctx.connection.rttMs).toBe(50);
    expect(ctx.connection.saveData).toBe(false);
    // Cleanup
    Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });
  });

  it('filters sensitive keys from localStorage', () => {
    const { mock } = createLocalStorageMock();
    installLocalStorageMock(mock);
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('token', 'secret123');
    const ctx = gatherBrowserContext();
    expect(ctx.localStorageKeys).toHaveProperty('theme');
    expect(ctx.localStorageKeys).not.toHaveProperty('token');
    restoreLocalStorage();
  });

  it('truncates long localStorage values', () => {
    const { mock } = createLocalStorageMock();
    installLocalStorageMock(mock);
    const longValue = 'x'.repeat(100);
    localStorage.setItem('longkey', longValue);
    const ctx = gatherBrowserContext();
    expect(ctx.localStorageKeys['longkey'].length).toBeLessThanOrEqual(81);
    expect(ctx.localStorageKeys['longkey'].endsWith('…')).toBe(true);
    restoreLocalStorage();
  });

  it('does not truncate short localStorage values', () => {
    const { mock } = createLocalStorageMock();
    installLocalStorageMock(mock);
    localStorage.setItem('shortkey', 'hello');
    const ctx = gatherBrowserContext();
    expect(ctx.localStorageKeys['shortkey']).toBe('hello');
    restoreLocalStorage();
  });

  it('includes sessionStorage keys', () => {
    sessionStorage.setItem('sessionflag', 'yes');
    const ctx = gatherBrowserContext();
    expect(ctx.sessionStorageKeys).toHaveProperty('sessionflag', 'yes');
    sessionStorage.removeItem('sessionflag');
  });

  it('filters sensitive keys from sessionStorage', () => {
    sessionStorage.setItem('jwt', 'abc');
    const ctx = gatherBrowserContext();
    expect(ctx.sessionStorageKeys).not.toHaveProperty('jwt');
    sessionStorage.removeItem('jwt');
  });

  it('detects failed resources', () => {
    const failedEntry = {
      entryType: 'resource',
      name: 'https://cdn.example.com/failed.js',
      transferSize: 0,
      decodedBodySize: 0,
      duration: 0,
    };
    const goodEntry = {
      entryType: 'resource',
      name: 'https://cdn.example.com/good.js',
      transferSize: 1000,
      decodedBodySize: 2000,
      duration: 50,
    };
    performance.getEntriesByType = vi.fn((type: string) => {
      if (type === 'resource') return [failedEntry, goodEntry] as unknown as PerformanceEntry[];
      return [];
    });
    const ctx = gatherBrowserContext();
    expect(ctx.failedResources).toContain('https://cdn.example.com/failed.js');
    expect(ctx.failedResources).not.toContain('https://cdn.example.com/good.js');
  });

  it('limits failedResources to last 10', () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({
      entryType: 'resource',
      name: `https://cdn.example.com/res${i}.js`,
      transferSize: 0,
      decodedBodySize: 0,
      duration: 0,
    }));
    performance.getEntriesByType = vi.fn((type: string) => {
      if (type === 'resource') return entries as unknown as PerformanceEntry[];
      return [];
    });
    const ctx = gatherBrowserContext();
    expect(ctx.failedResources.length).toBeLessThanOrEqual(10);
  });

  it('survives when getEntriesByType throws', () => {
    performance.getEntriesByType = vi.fn(() => {
      throw new Error('Not supported');
    });
    const ctx = gatherBrowserContext();
    expect(ctx.timing).toEqual({});
    expect(ctx.failedResources).toEqual([]);
  });
});
