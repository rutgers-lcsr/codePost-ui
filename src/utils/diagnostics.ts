// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Shared diagnostic utilities used by ErrorBoundary and ReportIssueButton.
 *
 * Provides:
 *  - Sensitive-data redaction
 *  - Console error/warn capture (last 30 entries)
 *  - On-demand screenshot capture via html-to-image
 *  - Browser context gathering (timing, memory, connection, storage)
 */

// ── Sensitive data helpers ────────────────────────────────────────────────────
export const SENSITIVE_KEY_RE = /token|auth|jwt|secret|password|credential|bearer|api[_-]?key/i;

export function redactSensitiveData(str: string): string {
  return str
    .replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/]*/g, '[REDACTED_JWT]')
    .replace(/\b(token|api[_-]?key|auth|authorization)(\s*[:=]\s*["']?)([^\s"',}\]]+)/gi, '$1$2[REDACTED]');
}

// ── Console interceptor ────────────────────────────────────────────────────────
export const MAX_CONSOLE_LOGS = 30;
export const recentConsoleLogs: Array<{ level: string; message: string; at: string }> = [];

function safeToString(value: unknown): string {
  if (typeof value === 'string') return value;

  try {
    return String(value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return '[Unserializable value]';
    }
  }
}

function safeNumberString(value: unknown, formatter?: (num: number) => number | string): string {
  try {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return safeToString(value);
    }

    return safeToString(formatter ? formatter(numericValue) : numericValue);
  } catch {
    return safeToString(value);
  }
}

function serializeArg(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return `[Error: ${a.message}]`;
  try {
    const s = JSON.stringify(a);
    return s !== undefined ? s : safeToString(a);
  } catch {
    return safeToString(a);
  }
}

function formatConsoleArgs(args: unknown[]): string {
  if (args.length === 0) return '';

  if (typeof args[0] === 'string' && /%[oOsdifc]/.test(args[0])) {
    let i = 1;
    const formatted = args[0].replace(/%([oOsdifc])/g, (_match, spec: string): string => {
      if (i >= args.length) return `%${spec}`;
      const val = args[i++];
      switch (spec) {
        case 'o':
        case 'O':
          return serializeArg(val);
        case 's':
          return safeToString(val);
        case 'd':
        case 'i':
          return safeNumberString(val, Math.trunc);
        case 'f':
          return safeNumberString(val);
        case 'c':
          return '';
        default:
          return `%${spec}`;
      }
    });
    const surplus = args.slice(i).map(serializeArg);
    return surplus.length ? `${formatted} ${surplus.join(' ')}` : formatted;
  }

  return args.map(serializeArg).join(' ');
}

if (typeof window !== 'undefined') {
  (['error', 'warn'] as const).forEach((level) => {
    const original = console[level].bind(console) as (...args: unknown[]) => void;
    console[level] = (...args: unknown[]) => {
      const raw = formatConsoleArgs(args);
      recentConsoleLogs.push({
        level,
        message: redactSensitiveData(raw),
        at: new Date().toISOString(),
      });
      if (recentConsoleLogs.length > MAX_CONSOLE_LOGS) recentConsoleLogs.shift();
      original(...args);
    };
  });
}

// ── On-demand visual screenshot ──────────────────────────────────────────────
// Captured only when explicitly requested (Report Issue dialog). A periodic
// capture loop used to live here — it cloned the whole DOM every 30s and, via
// cacheBust, re-downloaded every page image each tick. Don't reintroduce it.
let _lastScreenshot: string | null = null;

const CAPTURE_OPTS: Record<string, unknown> = {
  quality: 0.4,
  skipFonts: true,
  fontEmbedCSS: '',
  filter: (node: HTMLElement) => {
    if (!(node instanceof Element)) return true;
    const tag = node.tagName?.toLowerCase();
    return tag !== 'iframe' && tag !== 'video' && tag !== 'canvas';
  },
};

export function getLastScreenshot(): string | null {
  return _lastScreenshot;
}

/**
 * Capture a fresh screenshot immediately and return it (loading html-to-image
 * on first use). Also updates the cache read by getLastScreenshot().
 * Returns null if capture fails or is unavailable.
 */
export async function captureScreenshotOnDemand(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  let toJpeg: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>;
  let toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>;
  try {
    ({ toJpeg, toPng } = await import('html-to-image'));
  } catch (err) {
    console.warn('[diagnostics] Failed to load html-to-image:', err);
    return null;
  }
  const withTimeout = (p: Promise<string>) =>
    Promise.race<string>([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('screenshot timeout')), 5000)),
    ]);
  try {
    _lastScreenshot = await withTimeout(toJpeg(document.body, CAPTURE_OPTS));
  } catch {
    try {
      _lastScreenshot = await withTimeout(toPng(document.body, CAPTURE_OPTS));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[diagnostics] Screenshot capture failed:', err);
      }
    }
  }
  return _lastScreenshot;
}

// ── Browser context helper ────────────────────────────────────────────────────
export function gatherBrowserContext() {
  const timing: Record<string, number> = {};
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      timing.domContentLoadedMs = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      timing.pageLoadMs = Math.round(nav.loadEventEnd - nav.startTime);
      timing.ttfbMs = Math.round(nav.responseStart - nav.startTime);
      timing.dnsMs = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
      timing.connectMs = Math.round(nav.connectEnd - nav.connectStart);
    }
  } catch {
    /* ignore */
  }

  const memory: Record<string, unknown> = {};
  try {
    const mem = (
      performance as unknown as {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    if (mem) {
      memory.usedJSHeapSizeMB = Math.round(mem.usedJSHeapSize / 1048576);
      memory.totalJSHeapSizeMB = Math.round(mem.totalJSHeapSize / 1048576);
      memory.jsHeapSizeLimitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
    }
  } catch {
    /* ignore */
  }

  const connection: Record<string, unknown> = {};
  try {
    const nav = navigator as unknown as Record<string, unknown>;
    const conn = (nav.connection ?? nav.mozConnection ?? nav.webkitConnection) as
      | { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
      | undefined;
    if (conn) {
      connection.effectiveType = conn.effectiveType;
      connection.downlinkMbps = conn.downlink;
      connection.rttMs = conn.rtt;
      connection.saveData = conn.saveData;
    }
  } catch {
    /* ignore */
  }

  const localStorageKeys: Record<string, string> = {};
  const sessionStorageKeys: Record<string, string> = {};
  const storageVal = (store: Storage, key: string): string => {
    const v = store.getItem(key) ?? '';
    return v.length > 80 ? `${v.slice(0, 80)}…` : v;
  };
  const storageKeys = (store: Storage): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k != null) keys.push(k);
    }
    return keys;
  };
  try {
    storageKeys(localStorage)
      .filter((k) => !SENSITIVE_KEY_RE.test(k))
      .forEach((k) => {
        localStorageKeys[k] = storageVal(localStorage, k);
      });
  } catch {
    /* ignore */
  }
  try {
    storageKeys(sessionStorage)
      .filter((k) => !SENSITIVE_KEY_RE.test(k))
      .forEach((k) => {
        sessionStorageKeys[k] = storageVal(sessionStorage, k);
      });
  } catch {
    /* ignore */
  }

  const failedResources: string[] = [];
  try {
    performance.getEntriesByType('resource').forEach((entry) => {
      const r = entry as PerformanceResourceTiming;
      if (r.transferSize === 0 && r.decodedBodySize === 0 && r.duration === 0) {
        failedResources.push(r.name);
      }
    });
  } catch {
    /* ignore */
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: {
      resolution: `${screen.width}x${screen.height}`,
      available: `${screen.availWidth}x${screen.availHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth,
    },
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || null,
    timeOnPageSeconds: Math.round(performance.now() / 1000),
    localStorageKeys,
    sessionStorageKeys,
    timing,
    memory,
    connection,
    failedResources: failedResources.slice(-10),
  };
}
