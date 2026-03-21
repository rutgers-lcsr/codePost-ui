// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, beforeEach } from 'vitest';
import { OS, getOperatingSystem, osControlKey, getOsTriggerKeyFromEvent } from '../operatingSystem';

describe('operatingSystem', () => {
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Reset userAgent after each test
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
  });

  describe('getOperatingSystem', () => {
    it('returns LINUX for Linux user agent', () => {
      Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
      expect(getOperatingSystem()).toBe(OS.LINUX);
    });

    it('returns WINDOWS for Windows user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      expect(getOperatingSystem()).toBe(OS.WINDOWS);
    });

    it('returns MAC for Mac user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      expect(getOperatingSystem()).toBe(OS.MAC);
    });
  });

  describe('osControlKey', () => {
    it('returns Ctrl for Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0)',
        configurable: true,
      });
      expect(osControlKey()).toBe('Ctrl');
    });

    it('returns Ctrl for Linux', () => {
      Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
      expect(osControlKey()).toBe('Ctrl');
    });

    it('returns ⌘ for Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        configurable: true,
      });
      expect(osControlKey()).toBe('⌘');
    });
  });

  describe('getOsTriggerKeyFromEvent', () => {
    it('returns metaKey for Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        configurable: true,
      });
      const event = { metaKey: true, ctrlKey: false } as KeyboardEvent;
      expect(getOsTriggerKeyFromEvent(event)).toBe(true);
    });

    it('returns ctrlKey for Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0)',
        configurable: true,
      });
      const event = { metaKey: false, ctrlKey: true } as KeyboardEvent;
      expect(getOsTriggerKeyFromEvent(event)).toBe(true);
    });

    it('returns ctrlKey for Linux', () => {
      Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
      const event = { metaKey: false, ctrlKey: true } as KeyboardEvent;
      expect(getOsTriggerKeyFromEvent(event)).toBe(true);
    });
  });
});
