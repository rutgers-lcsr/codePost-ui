// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { normalizedExtension } from '../../../../utils/fileExtensions';
import { getFileContent, type FileType } from '../../../../utils/file';
import type { FileTypeDefinition } from '../types';
import { focusRichBlock, blurRichBlock } from '../blockHighlight';

export const jupyterFileType: FileTypeDefinition = {
  id: 'jupyter',
  extensions: ['ipynb'],

  // Content-based detection: verify the file looks like a Jupyter notebook.
  // This ensures .ipynb files are always claimed by this file type even though
  // the extension is also valid JSON — priority + detect() wins over 'code'.
  detect: (file: FileType) => {
    return normalizedExtension(file) === 'ipynb';
  },

  // Jupyter notebooks are rendered by the Markdown component which converts
  // notebook cells to a rich markdown representation internally.
  renderer: () => import('../../code-panel/Markdown') as Promise<{ default: React.ComponentType<unknown> }>,
  capabilities: {
    edit: true, // cell-by-cell editing via inline Monaco
    comments: 'block',
    syntaxHighlight: false,
    executable: true,
    binary: false,
    wordWrap: false,
    deepLinking: false,
    blockFocus: true,
    expectsLargePayload: true,
    clearableOutputs: true,
    forceReExecution: true,
  },
  renderStrategy: 'rich',
  editMode: 'inline',
  commentLabel: (startLine: number) => `Cell ${startLine + 1}`,
  panelClassName: 'code--markdown code--jupyter',
  resolveCommentKind: () => 'jupyter',
  executableExtensions: ['ipynb'],
  blockSelector: (startLine: number) => `[index-number="${startLine}"]`,
  focusBlock: focusRichBlock,
  blurBlock: blurRichBlock,
  language: (file: FileType) => {
    const content = getFileContent(file);
    if (content) {
      try {
        const json = JSON.parse(content);
        if (json?.metadata?.language_info?.name) {
          return String(json.metadata.language_info.name).toLowerCase();
        }
        if (json?.metadata?.kernelspec?.language) {
          return String(json.metadata.kernelspec.language).toLowerCase();
        }
      } catch {
        // Fall through to default
      }
    }
    return 'python';
  },
  prefetch: () => {
    import('../../code-panel/Markdown');
  },
  priority: 20, // Higher than 'code' so .ipynb is not treated as generic JSON
};
