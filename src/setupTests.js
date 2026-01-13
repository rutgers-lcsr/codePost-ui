import { vi } from 'vitest';

//----------- Configure Enzyme (best-effort only)

// Enzyme setup removed as it causes build errors and is not used.

// ----------- Enable localStorage usage

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});
