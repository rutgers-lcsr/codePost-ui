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

/**
 * Creates a mock factory for `api-client/clients` that stubs **every** exported
 * API singleton as a Proxy returning `vi.fn()` for any accessed method.
 *
 * This avoids the `isolate: false` problem where multiple test files each mock
 * `api-client/clients` with only the subset of keys they need — if two such files
 * land in the same thread, the second factory wins and the first loses its stubs.
 *
 * Usage:
 * ```ts
 * vi.mock('../../api-client/clients', () => createApiClientsMock());
 * ```
 *
 * To pre-configure specific methods, spread overrides:
 * ```ts
 * vi.mock('../../api-client/clients', () =>
 *   createApiClientsMock({
 *     autograderApi: { tasksRetrieve: vi.fn() },
 *   }),
 * );
 * ```
 */
export function createApiClientsMock(overrides: Record<string, Record<string, unknown>> = {}): Record<string, unknown> {
  // All exported API singletons from src/api-client/clients.ts
  const apiNames = [
    'aiFeaturesApi',
    'assignmentDataSetsApi',
    'assignmentFilesApi',
    'assignmentsApi',
    'authApi',
    'autograderApi',
    'capabilitiesApi',
    'commentsApi',
    'commentTemplatesApi',
    'courseFilesApi',
    'coursesApi',
    'dashboardApi',
    'filesApi',
    'impersonateApi',
    'logsApi',
    'organizationsApi',
    'ottApi',
    'promptExperimentsApi',
    'promptFeedbackApi',
    'promptTypesApi',
    'promptVariantsApi',
    'registrationApi',
    'rubricCategoriesApi',
    'rubricCommentsApi',
    'sectionsApi',
    'submissionFilesApi',
    'submissionsApi',
    'submissionTestsApi',
    'subscribeApi',
    'suggestedCommentsApi',
    'systemApi',
    'testCasesApi',
    'testCategoriesApi',
    'testCategoryResourcesApi',
    'tmpScriptApi',
    'tokenAuthApi',
    'tokenRefreshApi',
    'tokenVerifyApi',
    'usersApi',
    'webhooksApi',
  ];

  const mock: Record<string, unknown> = { apiClientConfig: {} };

  for (const name of apiNames) {
    const explicit = overrides[name];
    // Proxy returns vi.fn() for any property access not explicitly provided
    mock[name] = new Proxy(explicit ?? {}, {
      get(target, prop) {
        if (prop in (target as Record<string | symbol, unknown>)) {
          return (target as Record<string | symbol, unknown>)[prop];
        }
        // Lazily create a vi.fn() stub and cache it so the same ref is returned
        const stub = vi.fn();
        (target as Record<string | symbol, unknown>)[prop] = stub;
        return stub;
      },
    });
  }

  return mock;
}
