import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Extend window interface for jupyter images
declare global {
  interface Window {
    jupyterImages?: Map<string, { data: string; format: string; objectUrl?: string }>;
  }
}

const turndown = new TurndownService();
turndown.use(turndownPluginGfm.tables);

type NotebookJson = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cells?: any[];
  [key: string]: unknown;
};

const normalizeNotebookJson = (content: unknown, visited: Set<unknown> = new Set()): NotebookJson | null => {
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

  const candidate = content as NotebookJson;
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

export const jupyterToMarkdown = (content: unknown): string | null => {
  let markdown = '';
  const jupyterJson = normalizeNotebookJson(content);

  // Validate that cells array exists
  if (!jupyterJson || !jupyterJson.cells || !Array.isArray(jupyterJson.cells)) {
    console.debug('[Jupyter] Invalid notebook format: cells property is missing or not an array', content);
    return null;
  }

  jupyterJson.cells.forEach((cell: any, cellIndex: number) => {
    if (cell.cell_type === 'markdown') {
      // For markdown cells, add cell index as HTML comment before content
      markdown += `<div data-cell-index="${cellIndex}">\n\n`;
      if (Array.isArray(cell.source)) {
        markdown += cell.source.join('');
      } else {
        markdown += cell.source;
      }
      markdown += '\n\n</div>\n\n';
    }

    if (cell.cell_type === 'code') {
      // For code cells, wrap in a div with cell index
      markdown += `<div data-cell-index="${cellIndex}">\n\n`;
      markdown += '```python\n';
      if (Array.isArray(cell.source)) {
        markdown += cell.source.join('');
      } else {
        markdown += cell.source;
      }
      markdown += '\n```';

      // Only process outputs if they exist
      if (cell.outputs && Array.isArray(cell.outputs)) {
        cell.outputs.forEach((output: any, outputIndex: number) => {
          if (output.data) {
            Object.keys(output.data).forEach((key) => {
              switch (key) {
                case 'text/plain':
                  markdown += '\n```output\n';
                  if (Array.isArray(output.data['text/plain'])) {
                    markdown += output.data['text/plain'].join('');
                  } else {
                    markdown += output.data['text/plain'];
                  }
                  markdown += '\n```\n';
                  break;
                case 'text/html':
                  markdown += '\n';
                  // Convert HTML to markdown
                  if (Array.isArray(output.data['text/html'])) {
                    markdown += turndown.turndown(output.data['text/html'].join(''));
                  } else {
                    markdown += turndown.turndown(output.data['text/html']);
                  }
                  markdown += '\n';
                  break;
                case 'image/png':
                case 'image/jpeg':
                case 'image/jpg':
                case 'image/svg+xml': {
                  // We need to trim the spaces on the end of the tags, or the data won't be recognized
                  const imgData = output.data[key].trim();

                  // Use a STABLE image ID based on cell and output index to prevent flickering
                  // This ensures the same image always gets the same ID across re-renders
                  const imageId = `jupyter-img-cell${cellIndex}-output${outputIndex}`;

                  // Store the image data and format globally so the component can access it
                  if (!window.jupyterImages) {
                    window.jupyterImages = new Map();
                  }
                  window.jupyterImages.set(imageId, { data: imgData, format: key });

                  // Use a placeholder that we'll replace with a component
                  const markerHtml = `<div data-jupyter-image="${imageId}"></div>`;
                  markdown += `\n${markerHtml}\n`;
                  break;
                }
              }
            });
          }
          if (output.name === 'stdout') {
            if (output.text) {
              markdown += '\n```output\n';
              if (Array.isArray(output.text)) {
                markdown += output.text
                  .map((line: string) => {
                    return line.replace(']', ']\n').trim();
                  })
                  .join('\n');
              } else {
                markdown += output.text;
              }

              markdown += '\n```\n';
            }
          }
          // For errors, prefer the structured error output over stderr
          if (output.output_type === 'error') {
            markdown += '\n```error\n❌ ERROR';
            if (output.ename) {
              markdown += ': ' + output.ename;
            }
            if (output.evalue) {
              markdown += '\n' + output.evalue;
            }
            if (output.traceback) {
              markdown += '\n\n';
              if (Array.isArray(output.traceback)) {
                markdown += output.traceback.join('\n');
              } else {
                markdown += output.traceback;
              }
            }
            markdown += '\n```\n';
          }
          // Only show stderr if there's no structured error output
          else if (output.name === 'stderr' && !cell.outputs.some((o: any) => o.output_type === 'error')) {
            if (output.text) {
              markdown += '\n```error\n⚠️  STDERR:\n';
              if (Array.isArray(output.text)) {
                markdown += output.text.join('');
              } else {
                markdown += output.text;
              }
              markdown += '\n```\n';
            }
          }
        });
      }

      // Close the div wrapper for code cells
      markdown += '\n\n</div>\n\n';
    }
  });

  return markdown;
};
