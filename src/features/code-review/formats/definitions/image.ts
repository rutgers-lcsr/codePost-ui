// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { FileTypeDefinition } from '../types';
import { focusRichBlock, blurRichBlock } from '../blockHighlight';

export const imageFileType: FileTypeDefinition = {
  id: 'image',
  extensions: ['png', 'jpeg', 'jpg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
  // Images are rendered by the Markdown component which handles them as a special case.
  renderer: () => import('../../code-panel/Markdown') as Promise<{ default: React.ComponentType<unknown> }>,
  capabilities: {
    edit: false,
    comments: 'block', // single-block comment on the whole image
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
  renderStrategy: 'rich',
  editMode: 'none',
  commentLabel: (startLine: number) => `Cell ${startLine + 1}`,
  panelClassName: 'code--markdown',
  resolveCommentKind: () => 'image',
  executableExtensions: [],
  blockSelector: (startLine: number) => `[index-number="${startLine}"]`,
  focusBlock: focusRichBlock,
  blurBlock: blurRichBlock,
  prefetch: () => {
    import('../../code-panel/Markdown');
  },
  priority: 10,
};
