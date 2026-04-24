// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { pdfWorkerUrl } from '../../code-panel/pdfWorkerUrl';
import { isRegionComment } from '../../code-panel/pdfRegionComment';
import type { FileTypeDefinition, CommentLike } from '../types';
import { pdfCommentSortKey } from '../pdfSorting';

export const pdfFileType: FileTypeDefinition = {
  id: 'pdf',
  extensions: ['pdf'],
  renderer: () => import('../../code-panel/Pdf').then((m) => ({ default: m.Pdf as React.ComponentType<unknown> })),
  capabilities: {
    edit: false,
    comments: 'region',
    syntaxHighlight: false,
    executable: false,
    binary: false,
    wordWrap: false,
    deepLinking: false,
    blockFocus: false,
    expectsLargePayload: true,
    clearableOutputs: false,
    forceReExecution: false,
  },
  renderStrategy: 'pdf',
  editMode: 'none',
  commentKinds: ['pdf-page', 'pdf-text', 'pdf-region'],
  commentLabel: (startLine: number) => `Page ${startLine}`,
  panelClassName: 'code--markdown',
  resolveCommentKind: (comment: CommentLike) => {
    if (isRegionComment(comment)) return 'pdf-region';
    if (
      (comment.startChar === 0 || comment.startChar == null) &&
      (comment.endChar === 0 || comment.endChar == null) &&
      comment.startLine === comment.endLine
    ) {
      return 'pdf-page';
    }
    return 'pdf-text';
  },
  executableExtensions: [],
  blockSelector: (startLine: number) => `[data-page-number="${startLine}"]`,
  // PDF hover styling is managed by PdfHighlightLayer — no DOM class manipulation needed.
  focusBlock: () => {},
  blurBlock: () => {},
  commentSortKey: pdfCommentSortKey,
  prefetch: () => {
    import('../../code-panel/Pdf');
    // Warm the HTTP cache for the pdfjs worker script.
    // pdfjs loads this via `new Worker(url)` at runtime — using fetch() ensures the
    // response is in the browser's HTTP cache so the Worker request is a cache hit.
    fetch(pdfWorkerUrl).catch(() => {});
  },
  priority: 10,
};
