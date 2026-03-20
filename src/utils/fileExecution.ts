// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Structured output data from code execution.
 * Contains notebook cells, images, and fallback stdout/stderr/error
 * when the top-level fields are absent.
 */
export interface OutputData {
  /** Notebook cells (Jupyter execution) */
  cells?: unknown[];
  /** Fallback stdout (when top-level stdout is absent) */
  stdout?: string;
  /** Fallback stderr */
  stderr?: string;
  /** Fallback error message */
  error?: string;
  /** Single base64-encoded PNG image (e.g. matplotlib plot) */
  'image/png'?: string;
  /** Multiple base64-encoded PNG images */
  images?: string[];
  /** System logs (sometimes nested here instead of top-level) */
  system_logs?: string[];
  /** Any other dynamic keys from the execution backend */
  [key: string]: unknown;
}

export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  output_data?: OutputData | null;
  system_logs?: string[];
  cached?: boolean;
  executed_at?: string;
  executed_by?: string;
  execution_time?: number;
  timestamp?: string;
  file_id?: number;
}

type ExecutionPayload = Record<string, unknown> | null | undefined;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const getValue = (record: Record<string, unknown> | null, key: string) => (record ? record[key] : undefined);

const toStringValue = (value: unknown): string | undefined =>
  value === undefined || value === null ? undefined : String(value);

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const normalizeExecutionResult = (payload: ExecutionPayload): ExecutionResult => {
  const baseRecord = asRecord(payload);
  const resultRecord = asRecord(getValue(baseRecord, 'result')) ?? baseRecord;

  if (!resultRecord) {
    return {
      success: false,
      stdout: '',
      stderr: '',
      error: 'Invalid response from server.',
    };
  }

  const executionTime =
    toNumberValue(getValue(resultRecord, 'execution_time')) ?? toNumberValue(getValue(resultRecord, 'executionTime'));

  const systemLogsRaw = getValue(resultRecord, 'system_logs') ?? getValue(resultRecord, 'systemLogs');
  const systemLogs = Array.isArray(systemLogsRaw)
    ? systemLogsRaw.map((log: unknown) => String(log))
    : systemLogsRaw
      ? [String(systemLogsRaw)]
      : undefined;

  const stdout = toStringValue(getValue(resultRecord, 'stdout')) ?? '';
  const stderr = toStringValue(getValue(resultRecord, 'stderr')) ?? '';
  const error =
    toStringValue(getValue(resultRecord, 'error')) ?? toStringValue(getValue(resultRecord, 'runtime_error')) ?? null;

  const executedAt = toStringValue(getValue(resultRecord, 'executed_at'));
  const timestamp = toStringValue(getValue(resultRecord, 'timestamp')) ?? executedAt;

  return {
    success: Boolean(getValue(resultRecord, 'success')),
    stdout,
    stderr,
    error,
    output_data: (getValue(resultRecord, 'output_data') ?? getValue(resultRecord, 'output')) as Record<
      string,
      unknown
    > | null,
    system_logs: systemLogs,
    cached: Boolean(getValue(resultRecord, 'cached')),
    executed_at: executedAt,
    executed_by: toStringValue(getValue(resultRecord, 'executed_by')),
    execution_time: executionTime,
    timestamp,
    file_id: toNumberValue(getValue(resultRecord, 'file_id')) ?? toNumberValue(getValue(baseRecord, 'file_id')),
  };
};
