// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { vi, expect, afterEach } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import 'vitest-axe/extend-expect';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { installLocalStorageMock } from './test-utils';
import { mockOrganization, mockCourse, mockUser } from './test-utils/factories';

expect.extend(matchers);

// Unmount anything React Testing Library rendered after every test.
//
// RTL registers its own afterEach(cleanup) at module top level, but this config runs with
// `isolate: false`, so test files in a worker share one module registry AND one jsdom
// document. @testing-library/react is therefore imported only once — its auto-cleanup hook
// binds to whichever file loaded it first, and every later file in that worker gets none.
// Leftover DOM then accumulates across files and queries fail with "Found multiple
// elements". Setup files re-run per test file, so registering here covers all of them.
afterEach(() => {
  cleanup();
});

//----------- Configure Enzyme (best-effort only)

// Enzyme setup removed as it causes build errors and is not used.

// ----------- Enable localStorage usage
// Uses the centralized mock from src/test-utils/mocks.ts.
// For tests that need data persistence, use createLocalStorageMock() instead.
installLocalStorageMock();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock react-pdf to avoid Node.js legacy build warnings and heavy rendering in tests.
// Mock the self-hosted Monaco wrapper: importing it executes real monaco-editor,
// which needs browser APIs (clipboard, layout) that jsdom doesn't provide.
vi.mock('./lib/monaco', () => {
  const Editor = () => React.createElement('div', { 'data-testid': 'monaco-editor-mock' });
  return {
    default: Editor,
    Editor,
    DiffEditor: () => React.createElement('div', { 'data-testid': 'monaco-diff-mock' }),
    useMonaco: () => null,
    loader: { config: () => undefined, init: () => Promise.resolve(null) },
  };
});

vi.mock('react-pdf', () => {
  return {
    Document: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    Page: () => React.createElement('div'),
    pdfjs: { GlobalWorkerOptions: {} },
  };
});

// Mock Wistia player to avoid media-related side effects in tests.
vi.mock('@wistia/wistia-player-react', () => {
  return {
    WistiaPlayer: () => React.createElement('div'),
    WistiaProvider: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
  };
});

// jsdom doesn't implement IntersectionObserver; provide a no-op mock.
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  writable: true,
  value: MockIntersectionObserver,
});

(globalThis as Record<string, unknown>).DOMMatrix = class DOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  toString() {
    return '';
  }
};

// ----------- Test environment polyfills / mocks

// Prevent real network calls from components rendered in tests.
// Individual tests can still override this via vi.spyOn(globalThis, 'fetch').
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
    const method = (
      init?.method ||
      (typeof input !== 'string' && !(input instanceof URL) ? input?.method : undefined) ||
      'GET'
    ).toUpperCase();

    let payload: unknown = {};

    if (url?.includes('/registration/current_user/')) {
      payload = mockUser;
    } else if (url?.includes('/organizations/') && method === 'GET') {
      if (url.match(/\/organizations\/?$/) || url.match(/\/organizations\/?\?/)) {
        payload = [mockOrganization];
      } else if (url.match(/\/organizations\/[0-9]+\/?(\?.*)?$/)) {
        payload = mockOrganization;
      } else if (url.includes('/organizationsUsers/') || url.includes('/users/')) {
        payload = [];
      } else {
        payload = mockOrganization;
      }
    } else if (url?.includes('/courses/') && method === 'GET') {
      if (url.match(/\/courses\/?$/) || url.match(/\/courses\/?\?/)) {
        payload = [mockCourse];
      } else if (url.match(/\/courses\/[0-9]+\/?(\?.*)?$/)) {
        payload = mockCourse;
      } else if (url.includes('/roster')) {
        payload = { courseAdmins: [], students: [], graders: [] };
      } else if (url.includes('/apiKeys')) {
        payload = [];
      } else {
        payload = mockCourse;
      }
    } else if (url?.includes('/users/me/') && (method === 'GET' || method === 'PATCH')) {
      payload = { ...mockUser, api_token: 'api-token-123' };
    } else if (url?.includes('/users/requestAPIToken/') && method === 'POST') {
      payload = { ...mockUser, api_token: 'api-token-123' };
    } else if (url?.includes('/registration/emailPasswordReset/') && method === 'POST') {
      payload = { success: true };
    } else if (
      (url?.includes('/quizAttempts/availableQuizzes/') || url?.includes('/quizAttempts/myAttempts/')) &&
      method === 'GET'
    ) {
      // List endpoints — components iterate the response, so the default `{}` payload
      // throws "not iterable" inside useStudentQuizzes.
      payload = [];
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

// jsdom doesn't implement these fully; stub them to avoid noisy failures.
Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

// jsdom throws for pseudo-element queries; provide a safe wrapper.
const originalGetComputedStyle = window.getComputedStyle?.bind(window);
Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  writable: true,
  value: (elt: Element, pseudoElt?: string | null) => {
    if (pseudoElt) {
      return {
        getPropertyValue: () => '',
      };
    }
    try {
      if (originalGetComputedStyle) {
        return originalGetComputedStyle(elt, pseudoElt ?? undefined);
      }
    } catch {
      // fall through to stub
    }
    return {
      getPropertyValue: () => '',
    };
  },
});

if (globalThis.HTMLCanvasElement) {
  globalThis.HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    // minimal stub; enough for libraries that just check for a truthy context
    return {
      canvas: {},
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// ResizeObserver stub for components relying on layout observers (e.g., Wistia, charts)
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
