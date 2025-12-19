import { message } from 'antd';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';

import { slack } from '../components/core/slack';

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
        const payload = {
          error: `io-ts validation error: ${errorMessage}`,
          errorDetail: JSON.stringify(input, null, 2),
          url: window.location.href,
          timestamp: new Date().toISOString(),
        };

        // Fire and forget - don't wait for Slack logging
        void slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);

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
 * Gets the authorization token from localStorage
 */
function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

/**
 * Gets Decoded Token Payload
 */
function getDecodedTokenPayload(): any | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const tokenPayloadBase64 = token.split('.')[1];
    const tokenPayloadJson = atob(tokenPayloadBase64);
    return JSON.parse(tokenPayloadJson);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin(): void {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

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
  const data: any = await res.json();
  const errorMessage = typeof data === 'string' ? data : JSON.stringify(data);
  message.error(errorMessage);

  if (res.status === 401) {
    // Unauthorized

    // Before redirecting to login, we need to make sure that the token was expired and not some other issue

    try {
      const tokenPayload = getDecodedTokenPayload();
      if (!tokenPayload) throw new Error('Invalid token');

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
 * Creates a new object via POST request
 *
 * @param output - io-ts validator for the response
 * @param _input - io-ts validator for the input (unused but kept for consistency)
 * @param url - API endpoint path
 * @returns Function that accepts an object and returns a promise with the created object
 */
function createObject<T, TO, TI, Q, QO, QI>(
  output: t.Type<T, TO, TI>,
  _input: t.Type<Q, QO, QI>,
  url: string,
): (object: Q) => Promise<T> {
  return async (object: Q) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify(object),
    });

    if (res.status === 201) {
      const data: any = await res.json();
      return decodeToPromise(output, data);
    }

    return handleErrorResponse(res);
  };
}

/**
 * Reads a single object by ID via GET request
 *
 * @param arg - io-ts validator for the response
 * @param url - API endpoint path
 * @returns Function that accepts an ID and returns a promise with the object
 */
function readObject<T, O, I>(arg: t.Type<T, O, I>, url: string): (id: number) => Promise<T> {
  return async (id: number) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      const data: any = await res.json();
      return decodeToPromise(arg, data);
    }

    return handleErrorResponse(res);
  };
}

/**
 * Gets a single page of objects via GET request with pagination info
 *
 * @param _arg - io-ts validator for the response items (unused but kept for signature consistency)
 * @param obj - API endpoint path
 * @returns Function that accepts page and pageSize and returns a promise with paginated response
 */
function listObjectPaginated<T, O, I>(
  _arg: t.Type<T, O, I>,
  obj: string,
): (
  page?: number,
  pageSize?: number,
) => Promise<{ results: T[]; count: number; next: string | null; previous: string | null }> {
  return async (page: number = 1, pageSize: number = 100) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${obj}/?page=${page}&page_size=${pageSize}`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      const data: any = await res.json();
      // Return the full paginated response with results, count, next, previous
      return {
        results: data['results'] || [],
        count: data['count'] || 0,
        next: data['next'] || null,
        previous: data['previous'] || null,
      };
    }

    return handleErrorResponse(res);
  };
}

/**
 * Lists all objects by following pagination automatically via GET requests
 *
 * @param _arg - io-ts validator (unused but kept for signature consistency)
 * @param obj - API endpoint path
 * @returns Function that returns a promise with all objects (unpaginated)
 */
function listObject<T, O, I>(_arg: t.Type<T, O, I>, obj: string): () => Promise<T[]> {
  return async () => {
    let objects: T[] = [];
    let url: string | null = `${process.env.REACT_APP_API_URL}/${obj}/`;

    while (url !== null) {
      const res: Response = await fetch(url, {
        headers: getHeaders(),
        method: 'GET',
      });

      if (res.status === 200) {
        const data: any = await res.json();

        // Is this list paginated?
        if (Object.prototype.hasOwnProperty.call(data, 'results')) {
          objects = objects.concat(data['results']);
        } else {
          objects = data;
          url = null;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'next')) {
          url = data['next'];
        } else {
          url = null;
        }
      } else {
        await handleErrorResponse(res);
        url = null;
      }
    }
    return objects;
  };
}

/**
 * Updates an object via PATCH request
 *
 * @param output - io-ts validator for the response
 * @param _input - io-ts validator for the input (unused but kept for signature consistency)
 * @param url - API endpoint path
 * @returns Function that accepts an object and returns a promise with the updated object
 */
function updateObject<T, O, I, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  _input: t.Type<Q, O, I>,
  url: string,
): (object: Q) => Promise<T> {
  return async (object: Q) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/`, {
      headers: getHeaders(),
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if (res.status === 200) {
      const data: any = await res.json();
      return decodeToPromise(output, data);
    }

    return handleErrorResponse(res);
  };
}

/**
 * Deletes an object via DELETE request
 *
 * @param _arg - io-ts validator (unused but kept for signature consistency)
 * @param url - API endpoint path
 * @returns Function that accepts an object with an id and returns a promise
 */
function deleteObject<T extends GenericObjectType, O, I>(
  _arg: t.Type<T, O, I>,
  url: string,
): (object: Partial<T> & GenericObjectType) => Promise<void> {
  return async (object: Partial<T> & GenericObjectType) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/`, {
      headers: getHeaders(),
      method: 'DELETE',
    });

    if (res.status === 204) {
      return Promise.resolve();
    }

    return handleErrorResponse(res);
  };
}

function getURLString(urlArgs?: { [arg: string]: string }) {
  let urlString = '';
  if (urlArgs) {
    Object.keys(urlArgs).forEach((key, i) => {
      if (i === 0) {
        urlString = `?${key}=${urlArgs[key]}`;
      } else {
        urlString = `${urlString}&${key}=${urlArgs[key]}`;
      }
    });
  }
  urlString = urlString.replace(/\+/g, '%2B');
  return urlString;
}

/**
 * Reads a detail endpoint for an object via GET request
 *
 * @param arg - io-ts validator for the response
 * @param url - Base API endpoint path
 * @param detail - Detail endpoint name
 * @returns Function that accepts an ID and optional URL args and returns a promise
 */
function readObjectDetail<T, O, I>(
  arg: t.Type<T, O, I>,
  url: string,
  detail: string,
): (id: number, urlArgs?: { [arg: string]: string }) => Promise<T> {
  return async (id: number, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/${detail}/${urlString}`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      const data: any = await res.json();
      return decodeToPromise(arg, data);
    }

    return handleErrorResponse(res);
  };
}

/**
 * Updates an object's detail endpoint via PATCH request
 *
 * @param output - io-ts validator for the response
 * @param _input - io-ts validator for the input (unused but kept for signature consistency)
 * @param url - Base API endpoint path
 * @param detail - Detail endpoint name
 * @returns Function that accepts an object and optional URL args and returns a promise
 */
function updateObjectDetail<T, O, I, J, K, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  _input: t.Type<Q, K, J>,
  url: string,
  detail: string,
): (object: Q, urlArgs?: { [arg: string]: string }) => Promise<T> {
  return async (object: Q, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/${detail}/${urlString}`, {
      headers: getHeaders(),
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if (res.status === 200) {
      const data: any = await res.json();
      return decodeToPromise(output, data);
    }

    return handleErrorResponse(res);
  };
}

/**
 * Creates a detail object via POST request
 *
 * @param output - io-ts validator for the response
 * @param _input - io-ts validator for the input (unused but kept for signature consistency)
 * @param url - Base API endpoint path
 * @param detail - Detail endpoint name
 * @returns Function that accepts an object and optional URL args and returns a promise
 */
function createObjectDetail<T, O, I, J, K, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  _input: t.Type<Q, K, J>,
  url: string,
  detail: string,
): (object: Q, urlArgs?: { [arg: string]: string }) => Promise<T> {
  return async (object: Q, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/${detail}/${urlString}`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify(object),
    });

    if (res.status === 200) {
      const data = await res.json();
      return decodeToPromise(output, data);
    }

    return handleErrorResponse(res);
  };
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

export {
  createObject,
  createObjectDetail,
  deleteObject,
  GenericObject,
  getHeaders,
  listObject,
  listObjectPaginated,
  loadIDList,
  readObject,
  readObjectDetail,
  updateObject,
  updateObjectDetail,
  handleErrorResponse,
  decodeToPromise,
};
