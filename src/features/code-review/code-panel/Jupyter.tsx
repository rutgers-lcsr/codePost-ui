// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';

// =============================================================================
// nbformat v4 Type Definitions
// Jupyter Notebook Format Specification v4.5
// https://nbformat.readthedocs.io/en/latest/format_description.html
// =============================================================================

/**
 * Output from a code cell (nbformat v4).
 * Different output types use different fields:
 * - stream: output_type, name, text
 * - execute_result: output_type, data, metadata, execution_count
 * - display_data: output_type, data, metadata
 * - error: output_type, ename, evalue, traceback
 */
export interface NotebookCellOutput {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error';
  // For stream output
  name?: 'stdout' | 'stderr';
  text?: string | string[];
  // For execute_result/display_data (MIME-type keyed)
  data?: Record<string, string | string[]>;
  metadata?: Record<string, unknown>;
  execution_count?: number | null;
  // For error output
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

/**
 * A cell in a Jupyter notebook (nbformat v4).
 */
export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  source: string | string[];
  metadata?: Record<string, unknown>;
  id?: string;
  // Code cells only
  outputs?: NotebookCellOutput[];
  execution_count?: number | null;
}

/**
 * Notebook-level metadata (nbformat v4).
 */
export interface NotebookMetadata {
  kernelspec?: {
    name: string;
    display_name?: string;
    language?: string;
  };
  language_info?: {
    name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * A complete Jupyter notebook (nbformat v4).
 */
export interface Notebook {
  cells: NotebookCell[];
  metadata?: NotebookMetadata;
  nbformat?: number;
  nbformat_minor?: number;
  // Allow index access for dynamic property lookup during normalization
  [key: string]: unknown;
}

// Extend window interface for jupyter images
declare global {
  interface Window {
    jupyterImages?: Map<string, { data: string; format: string; objectUrl?: string }>;
  }
}

const turndown = new TurndownService();
turndown.use((turndownPluginGfm as { tables: unknown }).tables as Parameters<typeof turndown.use>[0]);

export const normalizeNotebookJson = (content: unknown, visited: Set<unknown> = new Set()): Notebook | null => {
  if (content === null || content === undefined) {
    return null;
  }

  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (!trimmed) {
      return null;
    }

    const firstChar = trimmed[0];
    if (firstChar !== '{' && firstChar !== '[' && firstChar !== '"') {
      return null;
    }

    try {
      return normalizeNotebookJson(JSON.parse(trimmed), visited);
    } catch (error) {
      console.debug('[Jupyter] Failed to parse notebook JSON string:', error);
      return null;
    }
  }

  if (typeof content !== 'object') {
    return null;
  }

  if (visited.has(content)) {
    return null;
  }
  visited.add(content);

  if (Array.isArray(content)) {
    return null;
  }

  const candidate = content as Notebook;
  if (Array.isArray(candidate.cells)) {
    return candidate;
  }

  const prioritizedKeys = [
    'notebook',
    'notebook_json',
    'notebookContent',
    'notebook_content',
    'ipynb',
    'output_data',
    'data',
    'result',
    'payload',
    'body',
  ];

  for (const key of prioritizedKeys) {
    if (Object.prototype.hasOwnProperty.call(candidate, key)) {
      const normalized = normalizeNotebookJson((candidate as Record<string, unknown>)[key], visited);
      if (normalized && Array.isArray(normalized.cells)) {
        return normalized;
      }
    }
  }

  for (const value of Object.values(candidate)) {
    const normalized = normalizeNotebookJson(value, visited);
    if (normalized && Array.isArray(normalized.cells)) {
      return normalized;
    }
  }

  return null;
};

const cellMarkdownCache = new WeakMap<
  NotebookCell,
  { index: number; markdown: string; images: Array<{ id: string; data: string; format: string }> }
>();

export const jupyterToMarkdown = (content: unknown): string | null => {
  let markdown = '';
  const jupyterJson = normalizeNotebookJson(content);

  // Validate that cells array exists
  if (!jupyterJson || !jupyterJson.cells || !Array.isArray(jupyterJson.cells)) {
    console.debug('[Jupyter] Invalid notebook format: cells property is missing or not an array', content);
    return null;
  }

  // Extract language from notebook metadata, fallback to python
  let language = 'python';
  if (jupyterJson.metadata?.language_info?.name && typeof jupyterJson.metadata.language_info.name === 'string') {
    language = jupyterJson.metadata.language_info.name.toLowerCase();
  } else if (
    jupyterJson.metadata?.kernelspec?.language &&
    typeof jupyterJson.metadata.kernelspec.language === 'string'
  ) {
    language = jupyterJson.metadata.kernelspec.language.toLowerCase();
  }

  jupyterJson.cells.forEach((cell: NotebookCell, cellIndex: number) => {
    // Check cache first
    const cached = cellMarkdownCache.get(cell);
    if (cached && cached.index === cellIndex) {
      markdown += cached.markdown;
      if (cached.images.length > 0) {
        if (!window.jupyterImages) {
          window.jupyterImages = new Map();
        }
        cached.images.forEach((img) => {
          window.jupyterImages!.set(img.id, { data: img.data, format: img.format });
        });
      }
      return;
    }

    let cellMarkdown = '';
    const cellImages: Array<{ id: string; data: string; format: string }> = [];

    // Extract ID from root (nbformat 4.5+) or metadata (older/codepost injected)
    const cellId = cell.id || (cell.metadata && typeof cell.metadata.id === 'string' ? cell.metadata.id : '');
    const idAttr = cellId ? ` data-cell-uuid="${cellId}"` : '';

    if (cell.cell_type === 'markdown') {
      // For markdown cells, add cell index as HTML comment before content
      cellMarkdown += `<div data-cell-index="${cellIndex}" data-cell-type="${cell.cell_type}"${idAttr}>\n\n`;
      if (Array.isArray(cell.source)) {
        cellMarkdown += cell.source.join('');
      } else {
        cellMarkdown += cell.source;
      }
      cellMarkdown += '\n\n</div>\n\n';
    }

    if (cell.cell_type === 'code') {
      // For code cells, wrap in a div with cell index
      cellMarkdown += `<div data-cell-index="${cellIndex}" data-cell-type="${cell.cell_type}"${idAttr}>\n\n`;
      cellMarkdown += '```' + language + '\n';
      if (Array.isArray(cell.source)) {
        cellMarkdown += cell.source.join('');
      } else {
        cellMarkdown += cell.source;
      }
      cellMarkdown += '\n```';

      // Only process outputs if they exist
      if (cell.outputs && Array.isArray(cell.outputs)) {
        cell.outputs.forEach((output: NotebookCellOutput, outputIndex: number) => {
          if (output.data) {
            const data = output.data;
            Object.keys(data).forEach((key) => {
              const value = data[key];
              if (!value) return;

              switch (key) {
                case 'text/plain':
                  cellMarkdown += '\n```output\n';
                  if (Array.isArray(value)) {
                    cellMarkdown += value.join('');
                  } else {
                    cellMarkdown += value;
                  }
                  cellMarkdown += '\n```\n';
                  break;
                case 'text/html':
                  cellMarkdown += '\n';
                  // Convert HTML to markdown
                  if (Array.isArray(value)) {
                    cellMarkdown += turndown.turndown(value.join(''));
                  } else {
                    cellMarkdown += turndown.turndown(value);
                  }
                  cellMarkdown += '\n';
                  break;
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg':
                case 'image/svg+xml': {
                  // We need to trim the spaces on the end of the tags, or the data won't be recognized
                  const imgData = Array.isArray(value) ? value.join('').trim() : value.trim();

                  // Use a STABLE image ID based on cell and output index to prevent flickering
                  // This ensures the same image always gets the same ID across re-renders
                  const imageId = `jupyter-img-cell${cellIndex}-output${outputIndex}`;

                  cellImages.push({ id: imageId, data: imgData, format: key });

                  // Use a placeholder that we'll replace with a component
                  const markerHtml = `<div data-jupyter-image="${imageId}"></div>`;
                  cellMarkdown += `\n${markerHtml}\n`;
                  break;
                }
              }
            });
          }
          if (output.name === 'stdout') {
            if (output.text) {
              cellMarkdown += '\n```output\n';
              if (Array.isArray(output.text)) {
                cellMarkdown += output.text
                  .map((line: string) => {
                    return line.replace(']', ']\n').trim();
                  })
                  .join('\n');
              } else {
                cellMarkdown += output.text;
              }

              cellMarkdown += '\n```\n';
            }
          }
          // For errors, prefer the structured error output over stderr
          if (output.output_type === 'error') {
            cellMarkdown += '\n```error\n❌ ERROR';
            if (output.ename) {
              cellMarkdown += ': ' + output.ename;
            }
            if (output.evalue) {
              cellMarkdown += '\n' + output.evalue;
            }
            if (output.traceback) {
              cellMarkdown += '\n\n';
              if (Array.isArray(output.traceback)) {
                cellMarkdown += output.traceback.join('\n');
              } else {
                cellMarkdown += output.traceback;
              }
            }
            cellMarkdown += '\n```\n';
          }
          // Only show stderr if there's no structured error output
          else if (
            output.name === 'stderr' &&
            !cell.outputs?.some((o: NotebookCellOutput) => o.output_type === 'error')
          ) {
            if (output.text) {
              cellMarkdown += '\n```error\n  STDERR:\n';
              if (Array.isArray(output.text)) {
                cellMarkdown += output.text.join('');
              } else {
                cellMarkdown += output.text;
              }
              cellMarkdown += '\n```\n';
            }
          }
        });
      }

      // Close the div wrapper for code cells
      cellMarkdown += '\n\n</div>\n\n';
    }

    // Cache the result
    cellMarkdownCache.set(cell, { index: cellIndex, markdown: cellMarkdown, images: cellImages });

    // Append to total markdown and update global images
    markdown += cellMarkdown;
    if (cellImages.length > 0) {
      if (!window.jupyterImages) {
        window.jupyterImages = new Map();
      }
      cellImages.forEach((img) => {
        window.jupyterImages!.set(img.id, { data: img.data, format: img.format });
      });
    }
  });

  return markdown;
};
