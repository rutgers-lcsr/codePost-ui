// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { FileTypeDefinition } from '../types';

/**
 * Binary file type for non-text files (compiled classes, archives, executables, etc.).
 * Renders a download card with file metadata and an optional hex viewer.
 */
export const binaryFileType: FileTypeDefinition = {
  id: 'binary',
  extensions: ['class', 'jar', 'gar', 'dds', 'eot', 'swf', 'tga', 'ttf', 'docx', 'exe', 'xlsx', 'db'],
  renderer: () =>
    import('../../code-panel/BinaryPreview').then((m) => ({
      default: m.BinaryPreview as React.ComponentType<unknown>,
    })),
  capabilities: {
    edit: false,
    comments: 'block',
    syntaxHighlight: false,
    executable: false,
    binary: true,
    wordWrap: false,
    deepLinking: false,
    blockFocus: false,
    expectsLargePayload: true,
    clearableOutputs: false,
    forceReExecution: false,
  },
  renderStrategy: 'binary',
  editMode: 'none',
  commentLabel: () => 'File',
  panelClassName: '',
  resolveCommentKind: () => 'binary',
  executableExtensions: [],
  priority: 5,
};
