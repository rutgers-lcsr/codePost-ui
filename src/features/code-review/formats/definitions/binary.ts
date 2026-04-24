// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { FileTypeDefinition } from '../types';

/**
 * Binary file type for non-displayable files (compiled classes, archives, etc.).
 * These cannot be rendered as text, edited, or commented on in the code console.
 */
export const binaryFileType: FileTypeDefinition = {
  id: 'binary',
  extensions: ['class', 'jar', 'gar', 'dds', 'eot', 'swf', 'tga', 'ttf', 'docx', 'exe', 'xlsx', 'db'],
  renderer: null,
  capabilities: {
    edit: false,
    comments: false,
    syntaxHighlight: false,
    executable: false,
    binary: true,
    wordWrap: false,
    deepLinking: false,
    blockFocus: false,
    expectsLargePayload: false,
    clearableOutputs: false,
    forceReExecution: false,
  },
  renderStrategy: 'code',
  editMode: 'none',
  commentLabel: () => '',
  panelClassName: '',
  resolveCommentKind: () => 'code',
  executableExtensions: [],
  priority: 5,
};
