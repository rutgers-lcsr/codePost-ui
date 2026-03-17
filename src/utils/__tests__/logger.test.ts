// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API client and colors before importing Logger
vi.mock('../../api-client/clients', () => ({
  logsApi: {
    logErrorCreate: vi.fn().mockResolvedValue({}),
    logCreate: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('../../theme/colors', () => ({
  colors: { brandPrimary: '#4a90d9' },
}));

// Provide a full localStorage mock shared between test and module code
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  }),
});

import { Logger, setDiagnosticConsent, getDiagnosticConsent } from '../logger';
import { logsApi } from '../../api-client/clients';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset storage and queue between tests
    Object.keys(storage).forEach((k) => delete storage[k]);
    Logger.clearQueue();
  });

  describe('getDiagnosticConsent / setDiagnosticConsent', () => {
    it('returns unknown by default', () => {
      // Clear any prior consent
      localStorage.removeItem('cp_diagnostic_consent');
      expect(getDiagnosticConsent()).toBe('unknown');
    });

    it('returns accepted after setDiagnosticConsent("accepted")', () => {
      setDiagnosticConsent('accepted');
      expect(getDiagnosticConsent()).toBe('accepted');
    });

    it('returns declined after setDiagnosticConsent("declined")', () => {
      setDiagnosticConsent('declined');
      expect(getDiagnosticConsent()).toBe('declined');
    });

    it('flushes queue when accepted', () => {
      // Reset to unknown so errors queue
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.error('queued error');
      expect(Logger.hasPendingPayloads).toBe(true);

      setDiagnosticConsent('accepted');
      expect(Logger.hasPendingPayloads).toBe(false);
    });

    it('clears queue when declined', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.error('queued error');
      expect(Logger.hasPendingPayloads).toBe(true);

      setDiagnosticConsent('declined');
      expect(Logger.hasPendingPayloads).toBe(false);
    });
  });

  describe('errorMinimal', () => {
    it('sends error immediately without checking consent', () => {
      Logger.errorMinimal('test error');
      expect(logsApi.logErrorCreate).toHaveBeenCalledWith({
        logErrorRequest: { error: 'test error' },
      });
    });
  });

  describe('error', () => {
    it('queues error when consent is unknown', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.error('test error', 'details');
      expect(logsApi.logErrorCreate).not.toHaveBeenCalled();
      expect(Logger.hasPendingPayloads).toBe(true);
    });

    it('sends error immediately when consent is accepted', () => {
      setDiagnosticConsent('accepted');
      Logger.error('test error', 'details');
      expect(logsApi.logErrorCreate).toHaveBeenCalled();
    });

    it('serializes non-string detail as JSON', () => {
      setDiagnosticConsent('accepted');
      Logger.error('test error', { key: 'value' });
      // logErrorCreate is called twice: once by flushQueue from setDiagnosticConsent (no pending), once by error
      const calls = vi.mocked(logsApi.logErrorCreate).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.logErrorRequest.errorDetail).toBe(JSON.stringify({ key: 'value' }, null, 2));
    });
  });

  describe('errorFull', () => {
    it('queues payload when consent is unknown', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.errorFull({
        error: 'test',
        errorDetail: 'detail',
        url: 'http://localhost',
      });
      expect(logsApi.logErrorCreate).not.toHaveBeenCalled();
      expect(Logger.hasPendingPayloads).toBe(true);
    });

    it('sends payload immediately when consent is accepted', () => {
      setDiagnosticConsent('accepted');
      Logger.errorFull({
        error: 'test',
        errorDetail: 'detail',
        url: 'http://localhost',
        category: 'test-cat',
      });
      expect(logsApi.logErrorCreate).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('queues payload when consent is unknown', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.info('test info');
      expect(logsApi.logCreate).not.toHaveBeenCalled();
      expect(Logger.hasPendingPayloads).toBe(true);
    });

    it('sends payload immediately when consent is accepted', () => {
      setDiagnosticConsent('accepted');
      Logger.info('test info', { text: 'extra', courseID: 5 });
      expect(logsApi.logCreate).toHaveBeenCalled();
      const calls = vi.mocked(logsApi.logCreate).mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.logDumpRequest.courseID).toBe(5);
      expect(lastCall.logDumpRequest.attachments[0].title).toBe('test info');
    });
  });

  describe('queue management', () => {
    it('hasPendingPayloads returns false when queue is empty', () => {
      expect(Logger.hasPendingPayloads).toBe(false);
    });

    it('clearQueue removes all pending items', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.error('e1');
      Logger.info('i1');
      expect(Logger.hasPendingPayloads).toBe(true);
      Logger.clearQueue();
      expect(Logger.hasPendingPayloads).toBe(false);
    });

    it('flushQueue sends all pending items', () => {
      localStorage.removeItem('cp_diagnostic_consent');
      Logger.error('e1');
      Logger.info('i1');
      Logger.flushQueue();
      expect(logsApi.logErrorCreate).toHaveBeenCalled();
      expect(logsApi.logCreate).toHaveBeenCalled();
      expect(Logger.hasPendingPayloads).toBe(false);
    });
  });
});
