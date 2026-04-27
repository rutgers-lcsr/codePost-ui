/**
 * Sample TypeScript file — generic Result type and utility functions.
 */

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function tryFn<T>(fn: () => T): Result<T> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Pipeline combinator
function pipe<T, E>(result: Result<T, E>) {
  return {
    map<U>(fn: (v: T) => U): ReturnType<typeof pipe<U, E>> {
      return pipe(result.ok ? ok(fn(result.value)) : result);
    },
    flatMap<U>(fn: (v: T) => Result<U, E>): ReturnType<typeof pipe<U, E>> {
      return pipe(result.ok ? fn(result.value) : result);
    },
    unwrapOr(fallback: T): T {
      return result.ok ? result.value : fallback;
    },
    unwrap(): T {
      if (!result.ok) throw result.error;
      return result.value;
    },
    result,
  };
}

// Example usage
const parsed = pipe(tryFn(() => JSON.parse('{"x": 42}')))
  .map((data: Record<string, unknown>) => data.x as number)
  .map((x) => x * 2)
  .unwrapOr(0);

console.log('Parsed and doubled:', parsed);

export { ok, err, tryFn, tryAsync, pipe };
export type { Result };
