import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';

import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';

import { slack } from '../components/core/slack';

import { message } from 'antd';

// Apply a validator and get the result in a Promise
// Source: https://www.olioapps.com/blog/checking-types-real-world-typescript/
function decodeToPromise<T, O, I>(validator: t.Type<T, O, I>, input: I): Promise<T> {
  const result = validator.decode(input);
  return pipe(
    result,
    E.fold(
      (errors: any) => {
        const messages = reporter(result);

        const payload = {
          error: `io-ts error -> ${messages.join('; ').toString()}`,
          errorDetail: JSON.stringify(input),
          url: window.location.href,
        };

        slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);

        return Promise.reject(new Error(messages.join('\n')));
      },
      (value: any) => {
        return Promise.resolve(value);
      },
    ),
  );
}

const GenericObject = t.type({
  id: t.number,
});

export type GenericObjectType = t.TypeOf<typeof GenericObject>;

function createObject<T, Q, O, I>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, O, I>,
  url: string,
): (object: Q) => Promise<T> {
  const foo = async (object: Q) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 201) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

function readObject<T, O, I>(arg: t.Type<T, O, I>, url: string): (arg0: number) => Promise<T> {
  const foo = async (id: number) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(arg, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

function listObject<T, O, I>(arg: t.Type<T, O, I>, obj: string): () => Promise<T[]> {
  const foo = async () => {
    let objects: T[] = [];
    let url: string | null = `${process.env.REACT_APP_API_URL}/${obj}/`;
    while (url !== null) {
      const res: any = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      if ((await res.status) === 200) {
        const data = await res.json();

        // Is this list paginated?
        if (data.hasOwnProperty('results')) {
          objects = objects.concat(data['results']);
        } else {
          objects = data;
          url = null;
        }

        if (data.hasOwnProperty('next')) {
          url = data['next'];
        } else {
          url = null;
        }
      } else {
        const data = await res.json();
        message.error(JSON.stringify(data));
        url = null;
      }
    }
    return objects;
  };

  return foo;
}

function updateObject<T, O, I, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, O, I>,
  url: string,
): (object: Q) => Promise<T> {
  const foo = async (object: Q) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

// Should change the return value to accept an object of type T (mandated to have an id field) instead of an id
function deleteObject<T, O, I>(arg: t.Type<T, O, I>, url: string): (id: number) => Promise<void> {
  const foo = async (id: number) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });

    if ((await res.status) === 204) {
      return Promise.resolve(); // no body on delete
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
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

function readObjectDetail<T, O, I>(
  arg: t.Type<T, O, I>,
  url: string,
  detail: string,
): (arg0: number, urlArgs?: { [arg: string]: string }) => Promise<T> {
  const foo = async (id: number, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/${detail}/${urlString}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(arg, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

function updateObjectDetail<T, O, I, J, K, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, K, J>,
  url: string,
  detail: string,
): (object: Q, urlArgs?: { [arg: string]: string }) => Promise<T> {
  const foo = async (object: Q, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/${detail}/${urlString}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

function createObjectDetail<T, O, I, J, K, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, K, J>,
  url: string,
  detail: string,
): (object: Q, urlArgs?: { [arg: string]: string }) => Promise<T> {
  const foo = async (object: Q, urlArgs?: { [arg: string]: string }) => {
    const urlString = getURLString(urlArgs);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/${detail}/${urlString}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  return foo;
}

async function loadIDList(ids: number[], klass: any, method: string = 'read', urlArgs?: { [arg: string]: string }) {
  const ignoreRejects = (p: Promise<any>) => {
    return p.catch((e: any) => {
      return undefined;
    });
  };

  const promises = ids.map(async (id: number) => {
    return await klass[method](id, urlArgs);
  });

  const data = await Promise.all(promises.map(ignoreRejects));
  const filteredData = data.filter((a: any) => {
    return a !== undefined;
  });

  return filteredData;
}

export {
  createObject,
  createObjectDetail,
  readObject,
  listObject,
  updateObject,
  deleteObject,
  GenericObject,
  readObjectDetail,
  updateObjectDetail,
  loadIDList,
};
