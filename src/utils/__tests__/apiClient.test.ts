// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { withQueryParams } from '../apiClient';
import type { BaseAPI } from '../../api-client/runtime';

function createMockApi(): BaseAPI {
  const middlewares: Array<
    (context: { url: string; init: RequestInit }) => Promise<{ url: string; init: RequestInit }>
  > = [];

  return {
    withPreMiddleware(middleware: any) {
      const newApi = createMockApi();
      (newApi as any)._middlewares = [...middlewares, middleware];
      return newApi;
    },
    _middlewares: middlewares,
    // Helper to run all middlewares for testing
    async _applyMiddlewares(url: string): Promise<string> {
      let result = { url, init: {} as RequestInit };
      for (const mw of (this as any)._middlewares) {
        result = await mw(result);
      }
      return result.url;
    },
  } as any;
}

describe('withQueryParams', () => {
  it('returns the same api when all params are null/undefined', () => {
    const api = createMockApi();
    const result = withQueryParams(api, { a: null, b: undefined });
    expect(result).toBe(api);
  });

  it('adds pre-middleware when params have values', () => {
    const api = createMockApi();
    const result = withQueryParams(api, { page: 1, search: 'test' });
    expect(result).not.toBe(api);
    expect((result as any)._middlewares).toHaveLength(1);
  });

  it('appends query string with ? for URLs without existing params', async () => {
    const api = createMockApi();
    const result = withQueryParams(api, { page: 1 });
    const url = await (result as any)._applyMiddlewares('http://api.example.com/items');
    expect(url).toBe('http://api.example.com/items?page=1');
  });

  it('appends query string with & for URLs already having params', async () => {
    const api = createMockApi();
    const result = withQueryParams(api, { page: 2 });
    const url = await (result as any)._applyMiddlewares('http://api.example.com/items?search=foo');
    expect(url).toBe('http://api.example.com/items?search=foo&page=2');
  });

  it('skips null and undefined values', async () => {
    const api = createMockApi();
    const result = withQueryParams(api, { a: 'yes', b: null, c: undefined, d: 'no' });
    const url = await (result as any)._applyMiddlewares('http://api.example.com/items');
    expect(url).toContain('a=yes');
    expect(url).toContain('d=no');
    expect(url).not.toContain('b=');
    expect(url).not.toContain('c=');
  });

  it('handles boolean values', async () => {
    const api = createMockApi();
    const result = withQueryParams(api, { active: true });
    const url = await (result as any)._applyMiddlewares('http://api.example.com/items');
    expect(url).toBe('http://api.example.com/items?active=true');
  });

  it('handles numeric values', async () => {
    const api = createMockApi();
    const result = withQueryParams(api, { limit: 50, offset: 0 });
    const url = await (result as any)._applyMiddlewares('http://api.example.com/items');
    expect(url).toContain('limit=50');
    expect(url).toContain('offset=0');
  });
});
