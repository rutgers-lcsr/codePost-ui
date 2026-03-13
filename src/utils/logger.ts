// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { colors } from '../theme/colors';
import { logsApi } from '../api-client/clients';

export interface LogContext {
  text?: string;
  color?: string;
  channel?: string;
  courseID?: number;
}

// ── Diagnostic consent ─────────────────────────────────────────────────────────
// No identifying information (URL, browser context, screenshots, detailed error
// payloads, etc.) is sent unless the user has explicitly consented. Until then,
// only the bare error string is transmitted.
const CONSENT_KEY = 'cp_diagnostic_consent';

export type DiagnosticConsentStatus = 'unknown' | 'accepted' | 'declined';

function getConsentStatus(): DiagnosticConsentStatus {
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    if (val === 'accepted' || val === 'declined') return val;
  } catch {
    /* ignore */
  }
  return 'unknown';
}

export function setDiagnosticConsent(status: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_KEY, status);
  } catch {
    /* ignore */
  }
  // Flush queued payloads if accepted
  if (status === 'accepted') {
    Logger.flushQueue();
  } else if (status === 'declined') {
    Logger.clearQueue();
  }
}

export function getDiagnosticConsent(): DiagnosticConsentStatus {
  return getConsentStatus();
}

export class Logger {
  // Queue of detailed payloads waiting for consent
  private static _pendingErrors: Array<{
    error?: string;
    errorDetail?: string;
    url?: string;
    screenshot?: string;
    category?: string;
  }> = [];
  private static _pendingDumps: Array<{ attachments?: Array<Record<string, unknown>>; courseID?: number }> = [];

  private static async postError(payload: {
    error?: string;
    errorDetail?: string;
    url?: string;
    screenshot?: string;
    category?: string;
  }) {
    try {
      await logsApi.logErrorCreate({ logErrorRequest: payload });
    } catch {
      // Swallow logging errors
    }
  }

  private static async postDump(payload: { attachments?: Array<Record<string, unknown>>; courseID?: number }) {
    try {
      await logsApi.logCreate({ logDumpRequest: payload });
    } catch {
      // Swallow logging errors
    }
  }

  /**
   * Send only the bare error string. No identifying details.
   */
  public static errorMinimal(message: string) {
    void Logger.postError({ error: message });
  }

  /**
   * Log an error with optional detail. If the user has consented to diagnostics,
   * sends the full payload immediately. Otherwise queues it until consent is given.
   */
  public static error(message: string, detail?: unknown) {
    const payload = {
      error: message,
      errorDetail: typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2),
      url: window.location.href,
    };

    if (getConsentStatus() === 'accepted') {
      void Logger.postError(payload);
    } else {
      Logger._pendingErrors.push(payload);
    }
  }

  /**
   * Like Logger.error but accepts a richer payload including an optional screenshot
   * (base64-encoded JPEG data URL).
   * Only sends if user has consented; otherwise queues.
   */
  public static errorFull(payload: {
    error: string;
    errorDetail: string;
    url: string;
    screenshot?: string;
    category?: string;
  }) {
    if (getConsentStatus() === 'accepted') {
      void Logger.postError(payload);
    } else {
      Logger._pendingErrors.push(payload);
    }
  }

  public static info(message: string, context?: LogContext) {
    const { text = '', color = colors.brandPrimary, courseID = 0 } = context || {};

    const attachments = [
      {
        title: message,
        color,
        text,
        footer: window.location.href,
      },
    ];

    const payload = { attachments, courseID };

    if (getConsentStatus() === 'accepted') {
      void Logger.postDump(payload);
    } else {
      Logger._pendingDumps.push(payload);
    }
  }

  /** Flush all queued payloads (called when user accepts consent). */
  public static flushQueue(): void {
    const errors = Logger._pendingErrors.splice(0);
    const dumps = Logger._pendingDumps.splice(0);
    for (const p of errors) void Logger.postError(p);
    for (const p of dumps) void Logger.postDump(p);
  }

  /** Discard all queued payloads (called when user declines consent). */
  public static clearQueue(): void {
    Logger._pendingErrors.length = 0;
    Logger._pendingDumps.length = 0;
  }

  /** Check if there are queued payloads waiting for consent. */
  public static get hasPendingPayloads(): boolean {
    return Logger._pendingErrors.length > 0 || Logger._pendingDumps.length > 0;
  }
}
