// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';

export interface RequestEntry {
  id: number;
  method: string;
  url: string;
  path: string;
  status: number | null;
  duration: number | null;
  timestamp: number;
  error?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

const MAX_ENTRIES = 100;

interface RequestLogState {
  entries: RequestEntry[];
  isIntercepting: boolean;
  addEntry: (entry: RequestEntry) => void;
  clear: () => void;
  startIntercepting: () => void;
}

let nextId = 1;
let originalFetch: typeof fetch | null = null;

/** Try to parse a fetch body into a plain object for display */
function parseBody(body: BodyInit | null | undefined): unknown {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
  if (body instanceof FormData) {
    const obj: Record<string, unknown> = {};
    body.forEach((v, k) => {
      obj[k] = v instanceof File ? `[File: ${v.name} (${v.size}B)]` : v;
    });
    return obj;
  }
  return '[Binary body]';
}

/** Extract headers into a plain Record */
function extractHeaders(headers: HeadersInit | Headers | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((v, k) => {
      // Never log auth tokens
      out[k] = k.toLowerCase() === 'authorization' ? '[redacted]' : v;
    });
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) {
      out[k] = k.toLowerCase() === 'authorization' ? '[redacted]' : v;
    }
  } else {
    for (const [k, v] of Object.entries(headers)) {
      out[k] = k.toLowerCase() === 'authorization' ? '[redacted]' : v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Read response body as JSON or text, with a size cap */
async function readResponseBody(response: Response): Promise<unknown> {
  try {
    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      return await response.json();
    }
    // For non-JSON, grab a text preview (capped at 2KB)
    const text = await response.text();
    if (text.length > 2048) return text.slice(0, 2048) + '…';
    return text || undefined;
  } catch {
    return undefined;
  }
}

export const useDevRequestLog = create<RequestLogState>()((set, get) => ({
  entries: [],
  isIntercepting: false,

  addEntry: (entry) =>
    set((s) => ({
      entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
    })),

  clear: () => set({ entries: [] }),

  startIntercepting: () => {
    if (get().isIntercepting) return;
    set({ isIntercepting: true });

    originalFetch = window.fetch;
    // Re-bind addEntry to always use the latest reference
    const addEntry = (entry: RequestEntry) => useDevRequestLog.getState().addEntry(entry);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method?.toUpperCase() ?? 'GET';

      // Only log API calls
      const apiBase = process.env.REACT_APP_API_URL ?? '';
      if (apiBase && !url.startsWith(apiBase)) {
        return originalFetch!(input, init);
      }

      const id = nextId++;
      const timestamp = Date.now();
      let parsedPath: string;
      try {
        parsedPath = new URL(url).pathname;
      } catch {
        parsedPath = url.replace(apiBase, '');
      }

      const entry: RequestEntry = {
        id,
        method,
        url,
        path: parsedPath,
        status: null,
        duration: null,
        timestamp,
        requestBody: parseBody(init?.body),
        requestHeaders: extractHeaders(init?.headers),
      };

      // Add pending entry
      addEntry(entry);

      try {
        const response = await originalFetch!(input, init);
        const duration = Date.now() - timestamp;

        // Clone the response so we can read the body without consuming it
        const clone = response.clone();
        const resHeaders = extractHeaders(response.headers);

        // Read response body asynchronously
        readResponseBody(clone).then((responseBody) => {
          useDevRequestLog.setState((s) => ({
            entries: s.entries.map((e) =>
              e.id === id ? { ...e, status: response.status, duration, responseBody, responseHeaders: resHeaders } : e,
            ),
          }));
        });

        return response;
      } catch (err) {
        const duration = Date.now() - timestamp;
        useDevRequestLog.setState((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, status: 0, duration, error: String(err) } : e)),
        }));
        throw err;
      }
    };
  },
}));
