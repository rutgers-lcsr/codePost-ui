// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { BaseAPI } from '../api-client/runtime';

type QueryParamValue = string | number | boolean | null | undefined;

const buildQueryString = (params: Record<string, QueryParamValue>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

export const withQueryParams = <T extends BaseAPI>(api: T, params: Record<string, QueryParamValue>): T => {
  const queryString = buildQueryString(params);

  if (!queryString) {
    return api;
  }

  return api.withPreMiddleware(async ({ url, init }) => {
    const separator = url.includes('?') ? '&' : '?';
    return {
      url: `${url}${separator}${queryString}`,
      init,
    };
  });
};
