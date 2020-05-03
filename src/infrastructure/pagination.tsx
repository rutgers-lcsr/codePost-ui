import * as t from 'io-ts';

function convertToPaginatedFunction<T>(
  func: (
    arg0: number,
    urlArgs?: {
      [arg: string]: string;
    },
  ) => Promise<any>,
): (id: number, callback: (result: T[]) => void) => Promise<void> {
  const readPaginated = async (id: number, callback: (newSubmissions: any) => void) => {
    let next: string | null = '1';

    while (next !== null) {
      if (next) {
        const pageNumber: string[] = next.split('page=');
        if (pageNumber.length > 1) {
          next = pageNumber[1];
        }
        const result: any = await func(id, { ['compact']: '1', page: next });
        callback(result.results);
        next = result.next;
      }
    }
    return Promise.resolve();
  };

  return readPaginated;
}

const paginatedType = <C extends t.Mixed>(origType: C) =>
  t.type({
    count: t.number,
    next: t.union([t.string, t.null]),
    previous: t.union([t.string, t.null]),
    results: t.array(origType),
  });

export { convertToPaginatedFunction, paginatedType };
