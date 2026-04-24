// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import LangMap from 'lang-map';
import { normalizedExtension, fileExtension } from '../../../../utils/fileExtensions';
import type { FileType } from '../../../../utils/file';
import type { FileTypeDefinition } from '../types';

/** Extensions that should be rendered as plain text (no syntax highlighting). */
const plainTextExtensions = new Set(['dat', 'log', 'txt', 'text', 'raw', 'out', 'ans', 'expected', 'actual']);

/**
 * Default/fallback file type for source code and text files.
 * Uses react-syntax-highlighter (read-only) and Monaco (edit mode).
 * Any file extension not claimed by a more specific file type lands here.
 */
export const codeFileType: FileTypeDefinition = {
  id: 'code',
  extensions: [], // Fallback — no explicit extensions needed; catches everything else
  renderer: null, // Uses the built-in syntax highlighter stack in CodeContent
  capabilities: {
    edit: true,
    comments: 'line',
    syntaxHighlight: true,
    executable: false,
    binary: false,
    wordWrap: true,
    deepLinking: true,
    blockFocus: false,
    expectsLargePayload: false,
    clearableOutputs: false,
    forceReExecution: false,
  },
  renderStrategy: 'code',
  editMode: 'monaco',
  commentLabel: (startLine: number, endLine?: number) => {
    if (endLine !== undefined && endLine !== startLine) {
      return `Lines ${startLine + 1}\u2013${endLine + 1}`;
    }
    return `Line ${startLine + 1}`;
  },
  panelClassName: '',
  resolveCommentKind: () => 'code',
  executableExtensions: ['py', 'js', 'java', 'cpp', 'c', 'rb', 'go', 'rs', 'sh', 'r'],
  language: (file: FileType) => {
    const ext = normalizedExtension(file);
    const lang = LangMap.languages(fileExtension(file.name))[0] || ext;

    // Data formats with custom hljs grammars
    if (ext === 'csv' || lang === 'csv') return 'csv';
    if (ext === 'tsv' || lang === 'tsv') return 'tsv';

    // Truly plain text — no highlighting
    if (plainTextExtensions.has(ext) || plainTextExtensions.has(lang)) return 'text';

    return lang;
  },
  priority: 0, // Lowest — checked last
};
