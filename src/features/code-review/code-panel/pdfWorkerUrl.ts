// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

// Vite's ?url suffix emits the worker as a hashed static asset and returns
// its URL. This avoids a dev-server round-trip to node_modules/ on every
// PDF file switch and gives proper cache headers in production.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const pdfWorkerUrl: string = workerUrl;
