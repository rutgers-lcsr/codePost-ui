// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { redactSensitiveData, SENSITIVE_KEY_RE } from '../diagnostics';

describe('redactSensitiveData', () => {
  it('redacts Bearer tokens', () => {
    expect(redactSensitiveData('Header Bearer abc123.xyz end')).toBe('Header Bearer [REDACTED] end');
  });

  it('redacts Bearer tokens with Authorization prefix', () => {
    // Both Bearer and auth key-value patterns fire, double-redacting
    const result = redactSensitiveData('Authorization: Bearer abc123.xyz');
    expect(result).not.toContain('abc123');
    expect(result).toContain('[REDACTED]');
  });

  it('redacts JWTs in the middle of a string', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
    expect(redactSensitiveData(`Token is ${jwt} here`)).toBe('Token is [REDACTED_JWT] here');
  });

  it('redacts token= key-value pairs', () => {
    expect(redactSensitiveData('token=abc123def')).toBe('token=[REDACTED]');
  });

  it('redacts api_key= key-value pairs', () => {
    expect(redactSensitiveData('api_key=secret123')).toBe('api_key=[REDACTED]');
  });

  it('redacts authorization header values', () => {
    expect(redactSensitiveData('authorization: mysecret')).toBe('authorization: [REDACTED]');
  });

  it('leaves non-sensitive data unchanged', () => {
    expect(redactSensitiveData('Hello world, this is a normal message')).toBe('Hello world, this is a normal message');
  });

  it('handles multiple sensitive values in one string', () => {
    const input = 'Bearer abc123.xyz, token=secret';
    const result = redactSensitiveData(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('abc123');
    expect(result).not.toContain('secret');
  });
});

describe('SENSITIVE_KEY_RE', () => {
  it.each(['token', 'auth', 'jwt', 'secret', 'password', 'credential', 'bearer', 'apikey', 'api_key', 'api-key'])(
    'matches sensitive key: %s',
    (key) => {
      expect(SENSITIVE_KEY_RE.test(key)).toBe(true);
    },
  );

  it('does not match non-sensitive keys', () => {
    expect(SENSITIVE_KEY_RE.test('username')).toBe(false);
    expect(SENSITIVE_KEY_RE.test('email')).toBe(false);
    expect(SENSITIVE_KEY_RE.test('name')).toBe(false);
  });
});
