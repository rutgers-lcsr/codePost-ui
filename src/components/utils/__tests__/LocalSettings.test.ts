// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLocalStorageMock, installLocalStorageMock, restoreLocalStorage } from '../../../test-utils';
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, LOCAL_SETTINGS, clearLocalSettings } from '../LocalSettings';

describe('LocalSettings constants', () => {
  it('PAGE_SIZE_OPTIONS contains expected values', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual(['10', '25', '50', '100']);
  });

  it('DEFAULT_PAGE_SIZE is 10', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });
});

describe('LOCAL_SETTINGS', () => {
  // Use the centralized localStorage mock with data persistence.
  const { mock, store } = createLocalStorageMock();

  beforeEach(() => {
    installLocalStorageMock(mock);
  });

  afterEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
    restoreLocalStorage();
  });

  describe('boolean settings (darkMode)', () => {
    it('getter returns default false when not set', () => {
      expect(LOCAL_SETTINGS.darkMode.getter()).toBe(false);
    });

    it('setter persists and getter retrieves true', () => {
      LOCAL_SETTINGS.darkMode.setter(true);
      expect(LOCAL_SETTINGS.darkMode.getter()).toBe(true);
    });

    it('setter persists and getter retrieves false', () => {
      LOCAL_SETTINGS.darkMode.setter(true);
      LOCAL_SETTINGS.darkMode.setter(false);
      expect(LOCAL_SETTINGS.darkMode.getter()).toBe(false);
    });
  });

  describe('float settings (codeZoom)', () => {
    it('getter returns default 1.0 when not set', () => {
      expect(LOCAL_SETTINGS.codeZoom.getter()).toBe(1.0);
    });

    it('setter persists float value', () => {
      LOCAL_SETTINGS.codeZoom.setter(1.5);
      expect(LOCAL_SETTINGS.codeZoom.getter()).toBe(1.5);
    });
  });

  describe('int settings (defaultCourse)', () => {
    it('getter returns default 0 when not set', () => {
      expect(LOCAL_SETTINGS.defaultCourse.getter()).toBe(0);
    });

    it('setter persists int value', () => {
      LOCAL_SETTINGS.defaultCourse.setter(42);
      expect(LOCAL_SETTINGS.defaultCourse.getter()).toBe(42);
    });
  });

  describe('defaultPageSize (custom setter/getter)', () => {
    it('getter returns default when not set', () => {
      expect(LOCAL_SETTINGS.defaultPageSize.getter()).toBe(DEFAULT_PAGE_SIZE);
    });

    it('setter persists valid page size', () => {
      LOCAL_SETTINGS.defaultPageSize.setter(25);
      expect(LOCAL_SETTINGS.defaultPageSize.getter()).toBe(25);
    });

    it('setter normalizes invalid page size to default', () => {
      LOCAL_SETTINGS.defaultPageSize.setter(7);
      expect(LOCAL_SETTINGS.defaultPageSize.getter()).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe('clearLocalSettings', () => {
    it('removes all setting keys from localStorage', () => {
      LOCAL_SETTINGS.darkMode.setter(true);
      LOCAL_SETTINGS.codeZoom.setter(2.0);
      clearLocalSettings();
      expect(LOCAL_SETTINGS.darkMode.getter()).toBe(false);
      expect(LOCAL_SETTINGS.codeZoom.getter()).toBe(1.0);
    });
  });
});
