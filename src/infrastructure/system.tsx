import * as t from 'io-ts';
import { GenericObject } from './generics';
import { getHeaders, handleErrorResponse, decodeToPromise } from './generics';

export const LogLevelV = t.union([
  t.literal('DEBUG'),
  t.literal('INFO'),
  t.literal('WARNING'),
  t.literal('ERROR'),
  t.literal('CRITICAL'),
]);

export const EventLogV = t.intersection(
  [
    GenericObject,
    t.type({
      category: t.string,
      description: t.string,
      meta: t.string, // JSON string
      courseID: t.union([t.number, t.null]),
      user: t.union([t.string, t.null]),
    }),
  ],
  'EventLog',
);

export type EventLogType = t.TypeOf<typeof EventLogV>;

export const SystemHealthV = t.type({
  database: t.string,
  celery: t.string,
});

export type SystemHealthType = t.TypeOf<typeof SystemHealthV>;

export class SystemIO {
  public static getHealth = async () => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/system/health/`, {
      headers: getHeaders(),
      method: 'GET',
    });
    if (res.status === 200) {
      const data = await res.json();
      return decodeToPromise(SystemHealthV, data);
    }
    return handleErrorResponse(res);
  };

  // Custom list with pagination support could go here, but fitting into 'listObject' might be hard if endpoint differs.
  // We'll write a custom fetcher for Activity to support the specific view output (results, total, page).
  public static getActivity = async (page: number = 1, pageSize: number = 20) => {
    const res: Response = await fetch(
      `${process.env.REACT_APP_API_URL}/system/activity/?page=${page}&pageSize=${pageSize}`,
      {
        headers: getHeaders(),
        method: 'GET',
      },
    );

    // Define ephemeral type for paginated response
    const PaginatedActivityV = t.type({
      results: t.array(EventLogV),
      total: t.number,
      page: t.number,
      pages: t.number,
    });

    if (res.status === 200) {
      const data = await res.json();
      return decodeToPromise(PaginatedActivityV, data);
    }
    return handleErrorResponse(res);
  };
}
