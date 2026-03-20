// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { vi } from 'vitest';

/**
 * Creates a localStorage mock backed by a real in-memory store.
 * All methods are vi.fn() spies wrapping a real implementation,
 * so tests can both assert on calls and rely on data persistence.
 *
 * Usage in setupTests.ts (global, non-persistent stubs):
 *   installLocalStorageMock();
 *
 * Usage in individual test files that need data persistence:
 *   const { mock, store } = createLocalStorageMock();
 *   beforeEach(() => installLocalStorageMock(mock));
 *   afterEach(() => restoreLocalStorage());
 */
export function createLocalStorageMock() {
  const store: Record<string, string> = {};

  const mock: Storage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      store[key] = String(val);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };

  return { mock, store };
}

let _savedLocalStorage: Storage | undefined;

/**
 * Installs a localStorage mock on globalThis. Pass a custom mock (from createLocalStorageMock)
 * or omit to get a default non-persistent stub set (vi.fn() only, no backing store).
 */
export function installLocalStorageMock(mock?: Storage): void {
  _savedLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock ?? {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    },
    configurable: true,
    writable: true,
  });
}

/**
 * Restores the original localStorage that was saved by installLocalStorageMock.
 */
export function restoreLocalStorage(): void {
  if (_savedLocalStorage !== undefined) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: _savedLocalStorage,
      configurable: true,
      writable: true,
    });
    _savedLocalStorage = undefined;
  }
}
