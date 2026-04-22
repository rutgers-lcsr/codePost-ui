// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect } from 'react';
import { File, type FileType } from '../../../utils/file';
import { pdfWorkerUrl } from '../code-panel/pdfWorkerUrl';

/**
 * Scans the submission's file list and eagerly fetches the vendor chunks for
 * any specialised renderers that will be needed (PDF, Markdown/Jupyter).
 *
 * For PDFs, also warms the browser's HTTP cache with the pdfjs web-worker
 * script so that when pdfjs creates a Worker, it resolves from cache.
 *
 * This hook is intentionally fire-and-forget — the dynamic imports warm the
 * module cache so that `React.lazy()` in CodeContent resolves instantly.
 */
export const usePrefetchFileRenderers = (files: readonly FileType[]) => {
  useEffect(() => {
    if (!files || files.length === 0) return;

    const types = new Set(files.map((f) => File.codeType(f)));

    if (types.has('pdf')) {
      import('../code-panel/Pdf');

      // Warm the HTTP cache for the pdfjs worker script.
      // pdfjs loads this via `new Worker(url)` at runtime — using fetch() ensures the
      // response is in the browser's HTTP cache so the Worker request is a cache hit.
      fetch(pdfWorkerUrl).catch(() => {});
    }

    if (types.has('markdown') || types.has('jupyter')) {
      import('../code-panel/Markdown');
    }
  }, [files]);
};
