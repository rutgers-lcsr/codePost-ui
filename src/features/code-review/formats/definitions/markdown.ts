// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { FileTypeDefinition } from '../types';
import { focusRichBlock, blurRichBlock } from '../blockHighlight';

export const markdownFileType: FileTypeDefinition = {
  id: 'markdown',
  extensions: ['md'],
  renderer: () => import('../../code-panel/Markdown') as Promise<{ default: React.ComponentType<unknown> }>,
  capabilities: {
    edit: false,
    comments: 'block',
    syntaxHighlight: false,
    executable: false,
    binary: false,
    wordWrap: false,
    deepLinking: false,
    blockFocus: true,
    expectsLargePayload: false,
    clearableOutputs: false,
    forceReExecution: false,
  },
  renderStrategy: 'rich',
  editMode: 'none',
  commentLabel: (startLine: number) => `Cell ${startLine + 1}`,
  panelClassName: 'code--markdown',
  resolveCommentKind: () => 'markdown',
  executableExtensions: [],
  blockSelector: (startLine: number) => `[index-number="${startLine}"]`,
  focusBlock: focusRichBlock,
  blurBlock: blurRichBlock,
  prefetch: () => {
    import('../../code-panel/Markdown');
  },
  priority: 10,
};
