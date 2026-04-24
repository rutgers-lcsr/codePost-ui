// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect } from 'react';
import type { FileType } from '../../../utils/file';
import { fileTypeRegistry } from '../formats';

/**
 * Scans the submission's file list and eagerly fetches the vendor chunks for
 * any specialised renderers that will be needed (PDF, Markdown/Jupyter, etc.).
 *
 * Delegates to each file type definition's `prefetch()` hook via the file type
 * registry, so adding a new file type with prefetch needs is automatic.
 */
export const usePrefetchFileRenderers = (files: readonly FileType[]) => {
  useEffect(() => {
    if (!files || files.length === 0) return;
    fileTypeRegistry.prefetchAll(files);
  }, [files]);
};
