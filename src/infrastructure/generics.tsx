import * as t from 'io-ts';
import { reporter } from 'io-ts-reporters';

// Apply a validator and get the result in a Promise
// Source: https://www.olioapps.com/blog/checking-types-real-world-typescript/
function decodeToPromise<T, O, I>(validator: t.Type<T, O, I>, input: I): Promise<T> {
  const result = validator.decode(input);
  return result.fold(
    (errors) => {
      const messages = reporter(result);
      return Promise.reject(new Error(messages.join('\n')));
    },
    (value) => {
      return Promise.resolve(value);
    },
  );
}

const GenericObject = t.type({
  id: t.number,
});

type GenericObjectType = t.TypeOf<typeof GenericObject>;

function createObject<T, Q, O, I>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, O, I>,
  url: string,
): ((object: Q) => Promise<T>) {
  const foo = async (object: Q) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 201) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    }

    return Promise.reject(await res.json());
  };

  return foo;
}

function readObject<T, O, I>(arg: t.Type<T, O, I>, url: string): ((arg0: number) => Promise<T>) {
  const foo = async (id: number) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(arg, data);
    }

    return Promise.reject(await res.json());
  };

  return foo;
}

function updateObject<T, O, I, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, O, I>,
  url: string,
): ((object: Q) => Promise<T>) {
  const foo = async (object: Q) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    }
    return Promise.reject(await res.json());
  };

  return foo;
}

// Should change the return value to accept an object of type T (mandated to have an id field) instead of an id
function deleteObject<T, O, I>(arg: t.Type<T, O, I>, url: string): ((id: number) => Promise<void>) {
  const foo = async (id: number) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });

    if ((await res.status) === 204) {
      return Promise.resolve(); // no body on delete
    }

    return Promise.reject(new Error(await res.json()));
  };

  return foo;
}

function readObjectDetail<T, O, I>(
  arg: t.Type<T, O, I>,
  url: string,
  detail: string,
): ((arg0: number, urlArgs: { [arg: string]: string }) => Promise<T>) {
  const foo = async (id: number, urlArgs: { [arg: string]: string }) => {
    let urlString = '';
    Object.keys(urlArgs).forEach((key, i) => {
      if (i === 0) {
        urlString = `?${key}=${urlArgs[key]}`;
      } else {
        urlString = `${urlString}&${key}=${urlArgs[key]}`;
      }
    });

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${id}/${detail}/${urlString}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(arg, data);
    }

    return Promise.reject(await res.json());
  };

  return foo;
}

function updateObjectDetail<T, O, I, Q extends GenericObjectType>(
  output: t.Type<T, O, I>,
  input: t.Type<Q, O, I>,
  url: string,
  detail: string,
): ((object: Q, urlArgs: { [arg: string]: string }) => Promise<T>) {
  const foo = async (object: Q, urlArgs: { [arg: string]: string }) => {
    let urlString = '';
    Object.keys(urlArgs).forEach((key, i) => {
      if (i === 0) {
        urlString = `?${key}=${urlArgs[key]}`;
      } else {
        urlString = `${urlString}&${key}=${urlArgs[key]}`;
      }
    });

    const res = await fetch(`${process.env.REACT_APP_API_URL}/${url}/${object.id}/${detail}/${urlString}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return await decodeToPromise(output, data);
    }

    return Promise.reject(await res.json());
  };

  return foo;
}

export { createObject, readObject, updateObject, deleteObject, GenericObject, readObjectDetail, updateObjectDetail };
