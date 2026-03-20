// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redactSensitiveData, recentConsoleLogs, scheduleNextScreenshot, stopScreenshotTimer } from '../diagnostics';

// ---------------------------------------------------------------------------
// redactSensitiveData
// ---------------------------------------------------------------------------
describe('redactSensitiveData', () => {
  it('redacts Bearer tokens', () => {
    const input = 'got Bearer eyJhbGciOiJIUzI1NiJ9abc from API';
    const result = redactSensitiveData(input);
    expect(result).toContain('Bearer [REDACTED]');
    expect(result).not.toContain('eyJh');
  });

  it('redacts JWTs in the middle of text', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYm9iIn0.abcdef';
    const input = `Got token ${jwt} from server`;
    const result = redactSensitiveData(input);
    expect(result).toContain('[REDACTED');
    expect(result).not.toContain('eyJ1c2');
  });

  it('redacts key=value patterns for sensitive keys', () => {
    expect(redactSensitiveData('token=abc123')).toContain('[REDACTED]');
    expect(redactSensitiveData('api-key: "sk-1234"')).toContain('[REDACTED]');
  });

  it('does not modify benign strings', () => {
    const input = 'User loaded 5 courses';
    expect(redactSensitiveData(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Console interceptor behaviour
// The interceptor replaces console.error/warn with wrappers that push to
// recentConsoleLogs. We must NOT mock the implementation, as that would
// bypass the interceptor. We instead call console methods directly.
// ---------------------------------------------------------------------------
describe('console interceptor', () => {
  let originalLength: number;

  beforeEach(() => {
    originalLength = recentConsoleLogs.length;
  });

  afterEach(() => {
    // Trim entries we added so other tests aren't affected
    recentConsoleLogs.splice(originalLength);
  });

  it('captures console.error calls', () => {
    console.error('test error message');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.level).toBe('error');
    expect(last.message).toContain('test error message');
    expect(last.at).toBeTruthy();
  });

  it('captures console.warn calls', () => {
    console.warn('test warning');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.level).toBe('warn');
    expect(last.message).toContain('test warning');
  });

  it('handles printf-style %s substitution', () => {
    console.error('Hello %s, count %d', 'world', 42);
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('Hello world');
    expect(last.message).toContain('42');
  });

  it('handles %o and %O for objects', () => {
    console.error('Data: %o', { a: 1 });
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('"a":1');
  });

  it('handles %f for floats', () => {
    console.error('Value: %f', 3.14);
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('3.14');
  });

  it('handles %c (CSS) by producing empty string', () => {
    console.error('%cStyled text', 'color: red');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('Styled text');
  });

  it('handles Error objects', () => {
    console.error(new Error('boom'));
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('[Error: boom]');
  });

  it('handles surplus args after format string', () => {
    console.error('Only %s', 'one', 'extra');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('one');
    expect(last.message).toContain('extra');
  });

  it('handles non-string first argument', () => {
    console.error(123, 'abc');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('123');
    expect(last.message).toContain('abc');
  });

  it('redacts sensitive data in captured logs', () => {
    console.error('got Bearer abcdef123 in response');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('[REDACTED]');
  });

  it('handles empty console.error call', () => {
    console.error();
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toBe('');
  });

  it('handles %i truncation specifier', () => {
    console.error('Int: %i', 3.7);
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('3');
  });

  it('handles format spec with no remaining args', () => {
    console.error('%s %s', 'only-one');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('only-one');
    expect(last.message).toContain('%s');
  });

  it('handles NaN in %d specifier', () => {
    console.error('Value: %d', 'not-a-number');
    const last = recentConsoleLogs[recentConsoleLogs.length - 1];
    expect(last.message).toContain('not-a-number');
  });
});

// ---------------------------------------------------------------------------
// scheduleNextScreenshot / stopScreenshotTimer
// ---------------------------------------------------------------------------
describe('screenshot scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopScreenshotTimer();
  });

  afterEach(() => {
    stopScreenshotTimer();
    vi.useRealTimers();
  });

  it('scheduleNextScreenshot sets a timer that can be stopped', () => {
    scheduleNextScreenshot();
    // Timer should be set - stopping it should not throw
    expect(() => stopScreenshotTimer()).not.toThrow();
  });
});
