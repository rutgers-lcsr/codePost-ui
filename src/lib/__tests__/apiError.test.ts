// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { FetchError, ResponseError } from '../../api-client/runtime';
import {
  API_UNAVAILABLE_MESSAGE,
  apiErrorMessage,
  apiErrorMessageAsync,
  isApiUnavailableError,
  responseErrorMessage,
  UNAVAILABLE_STATUSES,
  UPLOAD_TOO_LARGE_MESSAGE,
} from '../apiError';

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

const jsonResponse = (status: number, body: unknown, statusText = 'Bad Request') =>
  ({
    status,
    statusText,
    json: async () => body,
  }) as unknown as Response;

const htmlResponse = (status: number, statusText: string) =>
  ({
    status,
    statusText,
    json: async () => {
      throw new Error('html body');
    },
  }) as unknown as Response;

describe('responseErrorMessage', () => {
  it('prefers the named field error, then detail', async () => {
    expect(
      await responseErrorMessage(jsonResponse(400, { data: ["File 'a.pdf' exceeds the 10MB size limit."] }), {
        fieldNames: ['data'],
      }),
    ).toBe("File 'a.pdf' exceeds the 10MB size limit.");
    expect(
      await responseErrorMessage(
        jsonResponse(413, { detail: 'Upload too large: a single request may not exceed 50 MB.' }),
      ),
    ).toBe('Upload too large: a single request may not exceed 50 MB.');
  });

  it('joins unknown keys as a last resort', async () => {
    expect(await responseErrorMessage(jsonResponse(400, { file: ['bad'], name: 'taken' }))).toBe(
      'file: bad; name: taken',
    );
  });

  it('falls back to the upload-too-large text for a 413 without a JSON body', async () => {
    expect(await responseErrorMessage(htmlResponse(413, 'Request Entity Too Large'))).toBe(UPLOAD_TOO_LARGE_MESSAGE);
    expect(await responseErrorMessage(htmlResponse(413, 'Request Entity Too Large'), { tooLarge: 'limit 1 GB' })).toBe(
      'limit 1 GB',
    );
  });

  it('falls back to the status text otherwise', async () => {
    expect(await responseErrorMessage(htmlResponse(500, 'Internal Server Error'))).toBe('Internal Server Error');
  });
});

describe('apiErrorMessageAsync', () => {
  it('reads the body off a generated-client ResponseError', async () => {
    const e = new ResponseError(jsonResponse(400, { data: ['too big'] }));
    expect(await apiErrorMessageAsync(e, 'data')).toBe('too big');
  });

  it('returns the outage message without touching the body', async () => {
    expect(await apiErrorMessageAsync(new ResponseError(htmlResponse(503, 'x')))).toBe(API_UNAVAILABLE_MESSAGE);
  });

  it('is undefined when only the status text is available, or for non-API errors', async () => {
    expect(await apiErrorMessageAsync(new ResponseError(htmlResponse(400, 'Bad Request')))).toBeUndefined();
    expect(await apiErrorMessageAsync(new Error('form invalid'))).toBeUndefined();
  });

  it('can be called more than once on the same error (reads a clone of the body)', async () => {
    const e = new ResponseError(
      new Response(JSON.stringify({ systemPrompt: ['Unknown {var}'], detail: 'Invalid.' }), { status: 400 }),
    );
    expect(await apiErrorMessageAsync(e, 'systemPrompt')).toBe('Unknown {var}');
    expect(await apiErrorMessageAsync(e)).toBe('Invalid.');
  });

  it('is undefined once the body was consumed elsewhere', async () => {
    const response = new Response(JSON.stringify({ detail: 'Nope.' }), { status: 403, statusText: 'Forbidden' });
    await response.json();
    expect(await apiErrorMessageAsync(new ResponseError(response))).toBeUndefined();
  });
});
