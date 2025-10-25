import { vi } from 'vitest';

//----------- Configure Enzyme (best-effort only)

void (async () => {
  try {
    const enzymeModule = await import('enzyme');
    const { configure } = enzymeModule;
    const adapterModule = await import('enzyme-adapter-react-16');
    const Adapter = adapterModule.default ?? adapterModule;

    if (configure && Adapter) {
      configure({ adapter: new Adapter() });
    }
  } catch (error) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[setupTests] Enzyme setup skipped', error);
    }
  }
})();

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
