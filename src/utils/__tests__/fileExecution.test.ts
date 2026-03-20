// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { normalizeExecutionResult } from '../fileExecution';

describe('normalizeExecutionResult', () => {
  it('returns error for null payload', () => {
    const result = normalizeExecutionResult(null);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid response from server.');
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('returns error for undefined payload', () => {
    const result = normalizeExecutionResult(undefined);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid response from server.');
  });

  it('handles empty object payload', () => {
    const result = normalizeExecutionResult({});
    expect(result.success).toBe(false);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  it('extracts top-level fields', () => {
    const result = normalizeExecutionResult({
      success: true,
      stdout: 'hello',
      stderr: 'warn',
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('hello');
    expect(result.stderr).toBe('warn');
  });

  it('unwraps nested result key', () => {
    const result = normalizeExecutionResult({
      result: { success: true, stdout: 'nested out' },
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toBe('nested out');
  });

  it('reads execution_time (snake_case)', () => {
    const result = normalizeExecutionResult({ execution_time: 1.5 });
    expect(result.execution_time).toBe(1.5);
  });

  it('reads executionTime (camelCase)', () => {
    const result = normalizeExecutionResult({ executionTime: 2.3 });
    expect(result.execution_time).toBe(2.3);
  });

  it('prefers execution_time over executionTime', () => {
    const result = normalizeExecutionResult({ execution_time: 1.0, executionTime: 2.0 });
    expect(result.execution_time).toBe(1.0);
  });

  it('handles system_logs as array', () => {
    const result = normalizeExecutionResult({ system_logs: ['log1', 'log2'] });
    expect(result.system_logs).toEqual(['log1', 'log2']);
  });

  it('handles system_logs as single value', () => {
    const result = normalizeExecutionResult({ system_logs: 'single' });
    expect(result.system_logs).toEqual(['single']);
  });

  it('handles systemLogs (camelCase)', () => {
    const result = normalizeExecutionResult({ systemLogs: ['camel'] });
    expect(result.system_logs).toEqual(['camel']);
  });

  it('handles absent system_logs', () => {
    const result = normalizeExecutionResult({ success: true });
    expect(result.system_logs).toBeUndefined();
  });

  it('reads error field', () => {
    const result = normalizeExecutionResult({ error: 'boom' });
    expect(result.error).toBe('boom');
  });

  it('falls back to runtime_error', () => {
    const result = normalizeExecutionResult({ runtime_error: 'runtime' });
    expect(result.error).toBe('runtime');
  });

  it('prefers error over runtime_error', () => {
    const result = normalizeExecutionResult({ error: 'err', runtime_error: 'rt' });
    expect(result.error).toBe('err');
  });

  it('error is null when absent', () => {
    const result = normalizeExecutionResult({ success: true });
    expect(result.error).toBeNull();
  });

  it('reads output_data', () => {
    const result = normalizeExecutionResult({ output_data: { key: 'val' } });
    expect(result.output_data).toEqual({ key: 'val' });
  });

  it('falls back to output for output_data', () => {
    const result = normalizeExecutionResult({ output: { x: 1 } });
    expect(result.output_data).toEqual({ x: 1 });
  });

  it('reads cached flag truthy', () => {
    const result = normalizeExecutionResult({ cached: true });
    expect(result.cached).toBe(true);
  });

  it('reads cached flag falsy', () => {
    const result = normalizeExecutionResult({ cached: false });
    expect(result.cached).toBe(false);
  });

  it('reads executed_at', () => {
    const result = normalizeExecutionResult({ executed_at: '2025-01-01' });
    expect(result.executed_at).toBe('2025-01-01');
  });

  it('timestamp defaults to executed_at', () => {
    const result = normalizeExecutionResult({ executed_at: '2025-01-01' });
    expect(result.timestamp).toBe('2025-01-01');
  });

  it('timestamp overrides executed_at when present', () => {
    const result = normalizeExecutionResult({ executed_at: '2025-01-01', timestamp: '2025-06-01' });
    expect(result.timestamp).toBe('2025-06-01');
  });

  it('reads executed_by', () => {
    const result = normalizeExecutionResult({ executed_by: 'user1' });
    expect(result.executed_by).toBe('user1');
  });

  it('reads file_id from result record', () => {
    const result = normalizeExecutionResult({ result: { file_id: 42 } });
    expect(result.file_id).toBe(42);
  });

  it('reads file_id from base record when not in result', () => {
    const result = normalizeExecutionResult({ file_id: 99, result: { success: true } });
    expect(result.file_id).toBe(99);
  });

  it('handles numeric string for execution_time', () => {
    const result = normalizeExecutionResult({ execution_time: '3.14' });
    expect(result.execution_time).toBe(3.14);
  });

  it('returns undefined for non-numeric execution_time string', () => {
    const result = normalizeExecutionResult({ execution_time: 'abc' });
    expect(result.execution_time).toBeUndefined();
  });

  it('returns undefined for empty string execution_time', () => {
    const result = normalizeExecutionResult({ execution_time: '' });
    expect(result.execution_time).toBeUndefined();
  });

  it('handles numeric string file_id', () => {
    const result = normalizeExecutionResult({ file_id: '10' });
    expect(result.file_id).toBe(10);
  });

  it('handles number stdout conversion', () => {
    const result = normalizeExecutionResult({ stdout: 42 });
    expect(result.stdout).toBe('42');
  });

  it('handles null stdout', () => {
    const result = normalizeExecutionResult({ stdout: null });
    expect(result.stdout).toBe('');
  });

  it('handles system_logs with numeric entries', () => {
    const result = normalizeExecutionResult({ system_logs: [1, 2, 3] });
    expect(result.system_logs).toEqual(['1', '2', '3']);
  });

  it('complete payload with all fields', () => {
    const result = normalizeExecutionResult({
      success: true,
      stdout: 'out',
      stderr: 'err',
      error: null,
      output_data: { plot: 'data' },
      system_logs: ['init', 'done'],
      cached: false,
      executed_at: '2025-01-01',
      executed_by: 'grader',
      execution_time: 1.23,
      timestamp: '2025-01-02',
      file_id: 5,
    });
    expect(result).toEqual({
      success: true,
      stdout: 'out',
      stderr: 'err',
      error: null,
      output_data: { plot: 'data' },
      system_logs: ['init', 'done'],
      cached: false,
      executed_at: '2025-01-01',
      executed_by: 'grader',
      execution_time: 1.23,
      timestamp: '2025-01-02',
      file_id: 5,
    });
  });
});
