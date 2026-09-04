// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { FetchError, ResponseError } from '../../api-client/runtime';
import { API_UNAVAILABLE_MESSAGE, apiErrorMessage, isApiUnavailableError, UNAVAILABLE_STATUSES } from '../apiError';

const responseError = (status: number) => new ResponseError({ status } as Response);

describe('isApiUnavailableError', () => {
  it('covers the gateway statuses', () => {
    expect([...UNAVAILABLE_STATUSES]).toEqual([502, 503, 504]);
  });

  it('is true for a 503 ResponseError', () => {
    expect(isApiUnavailableError(responseError(503))).toBe(true);
  });

  it('is true for a FetchError (host unreachable)', () => {
    expect(isApiUnavailableError(new FetchError(new Error('down')))).toBe(true);
  });

  it('is false for a 400 ResponseError and for plain errors', () => {
    expect(isApiUnavailableError(responseError(400))).toBe(false);
    expect(isApiUnavailableError(new Error('x'))).toBe(false);
  });
});

describe('apiErrorMessage', () => {
  it('returns the outage message for a 503 ResponseError', () => {
    expect(apiErrorMessage(responseError(503))).toBe(API_UNAVAILABLE_MESSAGE);
  });

  it('returns the outage message for a FetchError', () => {
    expect(apiErrorMessage(new FetchError(new Error('down')))).toBe(API_UNAVAILABLE_MESSAGE);
  });

  it('returns undefined for a 400 ResponseError without a body', () => {
    expect(apiErrorMessage(responseError(400))).toBeUndefined();
  });

  it('still reads detail off an error body', () => {
    expect(apiErrorMessage({ body: { detail: 'x' } })).toBe('x');
  });
});
