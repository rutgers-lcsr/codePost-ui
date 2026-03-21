// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shutdownFS, trackFeature, identifyUserForFS } from '../Fullstory';

describe('Fullstory', () => {
  beforeEach(() => {
    (globalThis as any).FS = {
      identify: vi.fn(),
      shutdown: vi.fn(),
      event: vi.fn(),
    };
  });

  afterEach(() => {
    delete (globalThis as any).FS;
  });

  describe('shutdownFS', () => {
    it('calls FS.shutdown when defined', () => {
      shutdownFS();
      expect((globalThis as any).FS.shutdown).toHaveBeenCalled();
    });

    it('does not throw when FS.shutdown is undefined', () => {
      (globalThis as any).FS.shutdown = undefined;
      expect(() => shutdownFS()).not.toThrow();
    });
  });

  describe('trackFeature', () => {
    it('calls FS.event with feature and params', () => {
      trackFeature('click_button', { page: 'home' });
      expect((globalThis as any).FS.event).toHaveBeenCalledWith('click_button', { page: 'home' });
    });

    it('does not throw when FS is undefined', () => {
      delete (globalThis as any).FS;
      expect(() => trackFeature('test', {})).not.toThrow();
    });
  });

  describe('identifyUserForFS', () => {
    it('calls FS.identify with user email', () => {
      identifyUserForFS('user@test.com');
      expect((globalThis as any).FS.identify).toHaveBeenCalledWith('user@test.com', {
        displayName: 'user@test.com',
        email: 'user@test.com',
      });
    });
  });
});
