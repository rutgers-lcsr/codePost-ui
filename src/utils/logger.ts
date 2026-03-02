// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { colors } from '../theme/colors';
import { logsApi } from '../api-client/clients';

export interface LogContext {
  text?: string;
  color?: string;
  channel?: string;
  courseID?: number;
}

export class Logger {
  private static async postError(payload: { error?: string; errorDetail?: string; url?: string; screenshot?: string }) {
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

  public static error(message: string, detail?: unknown) {
    const payload = {
      error: message,
      errorDetail: typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2),
      url: window.location.href,
    };

    // Fire and forget
    void Logger.postError(payload);
  }

  /**
   * Like Logger.error but accepts a richer payload including an optional screenshot
   * (base64-encoded JPEG data URL).
   */
  public static errorFull(payload: { error: string; errorDetail: string; url: string; screenshot?: string }) {
    void Logger.postError(payload);
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

    void Logger.postDump(payload);
  }
}
