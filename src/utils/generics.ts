// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { message } from 'antd';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';

import { getAuthToken, getDecodedTokenPayload, redirectToLogin } from './auth';

import { Logger } from './logger';

/**
 * Validates and decodes input data using io-ts validators.
 * Logs validation errors to Slack and returns a rejected promise on failure.
 *
 * @param validator - The io-ts type validator
 * @param input - The input data to validate
 * @returns Promise resolving to validated data or rejecting with error
 *
 * Source: https://www.olioapps.com/blog/checking-types-real-world-typescript/
 */
function decodeToPromise<T, O, I>(validator: t.Type<T, O, I>, input: I): Promise<T> {
  const result = validator.decode(input);
  return pipe(
    result,
    E.fold(
      (_errors: t.Errors) => {
        const messages = reporter(result);
        const errorMessage = messages.join('; ');

        // Log validation error to Slack
        Logger.error(`io-ts validation error: ${errorMessage}`, input);

        return Promise.reject(new Error(messages.join('\n')));
      },
      (value: T) => Promise.resolve(value),
    ),
  );
}

const GenericObject = t.type({
  id: t.number,
});

export type GenericObjectType = t.TypeOf<typeof GenericObject>;

/**
 * Creates standard HTTP headers for API requests
 */
function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Handles HTTP response errors with user-friendly messages
 */
async function handleErrorResponse(res: Response): Promise<never> {
  const data: unknown = await res.json();
  let errorMessage: string;

  if (typeof data === 'string') {
    errorMessage = data;
  } else if (Array.isArray(data)) {
    // e.g. ["Late submissions are not allowed"]
    errorMessage = data.join(' ');
  } else if (typeof data === 'object' && data !== null) {
    if ('detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
      // e.g. { "detail": "Authentication credentials were not provided." }
      errorMessage = (data as { detail: string }).detail;
    } else {
      // e.g. { "field": ["Error description"] }
      errorMessage = Object.keys(data as Record<string, unknown>)
        .map((key) => {
          const val = (data as Record<string, unknown>)[key];
          const valStr = Array.isArray(val) ? val.join(' ') : String(val);
          return `${key}: ${valStr}`;
        })
        .join('; ');
    }
  } else {
    errorMessage = JSON.stringify(data);
  }
  message.error(errorMessage);

  if (res.status === 401) {
    // Unauthorized

    // Before redirecting to login, we need to make sure that the token was expired and not some other issue

    try {
      const tokenPayload = getDecodedTokenPayload();
      if (!tokenPayload) throw new Error('Invalid token');
      if (typeof tokenPayload.exp !== 'number') throw new Error('Invalid token expiration');

      const tokenExpiration = tokenPayload.exp * 1000; // Convert to milliseconds
      const isTokenExpired = tokenExpiration < Date.now();

      if (isTokenExpired) {
        message.error('Your session has expired. Please log in again.');
        redirectToLogin();
      } else {
        message.error('You are not authorized to access this resource.');
      }
    } catch (error) {
      // if we fail to decode the token, that means we dont have a valid token
      redirectToLogin();

      console.error('Error decoding token:', error);
    }
  }

  return Promise.reject(data);
}

/**
 * Loads a list of objects by their IDs, filtering out any failed requests
 *
 * @param ids - Array of object IDs to load
 * @param klass - Object with methods for loading data (e.g., { read: (id) => Promise<T> })
 * @param method - Method name to call on the klass object (default: 'read')
 * @param urlArgs - Optional URL arguments to pass to the method
 * @returns Promise with array of successfully loaded objects
 */

type LoaderFn<T> = (id: number, urlArgs?: { [arg: string]: string }) => Promise<T>;

async function loadIDList<T>(
  ids: number[],
  klass: { read: LoaderFn<T> },
  urlArgs?: { [arg: string]: string },
): Promise<T[]> {
  function ignoreRejects<U>(p: Promise<U>): Promise<U | undefined> {
    return p.catch(() => undefined);
  }

  const promises = ids.map((id: number) => klass.read(id, urlArgs));

  const data = await Promise.all(promises.map(ignoreRejects));

  return data.filter((item): item is Awaited<T> => item !== undefined) as T[];
}

export { GenericObject, getHeaders, loadIDList, handleErrorResponse, decodeToPromise };
