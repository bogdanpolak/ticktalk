import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

const FIXED_DATE = new Date('2026-03-01T00:00:00.000Z');

const createLocalStorageMock = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
  vi.clearAllMocks();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createLocalStorageMock(),
  });

  vi.spyOn(HTMLAudioElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLAudioElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(HTMLAudioElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
